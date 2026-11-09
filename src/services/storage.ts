import {
  Booking,
  BookingStatus,
  BookingType,
  GalleryPhoto,
  GorSettings,
  PaymentStatus,
  PingpongTable,
  UserProfile,
} from '../types';
import {
  calculateEndTime,
  calculateTotalPrice,
  checkBookingConflict,
  DEFAULT_GOR_SETTINGS,
  validateBookingTime,
} from '../utils/scheduleValidator';
import { normalizeIndonesianPhone } from '../utils/phoneNormalizer';
import {
  getInitialBookings,
  INITIAL_GALLERY,
  INITIAL_TABLES,
  INITIAL_USERS,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'sbc_users_v1',
  SESSION: 'sbc_active_session_v1',
  BOOKINGS: 'sbc_bookings_v1',
  TABLES: 'sbc_tables_v1',
  GALLERY: 'sbc_gallery_v1',
  SETTINGS: 'sbc_settings_v1',
  SUPABASE_CONFIG: 'sbc_supabase_config_v1',
};

// Event emitter to notify components when data changes
type Listener = () => void;
const listeners: Set<Listener> = new Set();
export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function notifyStoreUpdate() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error('Error in store listener:', err);
    }
  });
}

// -------------------------------------------------------------
// Database In-Memory / LocalStorage Helper
// -------------------------------------------------------------
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStoreUpdate();
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
  }
}

// Ensure database tables are initialized
export function initDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TABLES)) {
    setItem(STORAGE_KEYS.TABLES, INITIAL_TABLES);
  } else {
    // Sanitize any previous Nextsist mentions in table names
    const existingTables = getItem<PingpongTable[]>(STORAGE_KEYS.TABLES, []);
    const sanitizedTables = existingTables.map(t => ({
      ...t,
      table_name: t.table_name.replace(/Nextsist\s*25\s*/gi, '')
    }));
    setItem(STORAGE_KEYS.TABLES, sanitizedTables);
  }

  if (!localStorage.getItem(STORAGE_KEYS.GALLERY)) {
    setItem(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
  } else {
    // Sanitize any previous Nextsist mentions in captions
    const existingGallery = getItem<GalleryPhoto[]>(STORAGE_KEYS.GALLERY, []);
    const sanitizedGallery = existingGallery.map(g => ({
      ...g,
      caption: g.caption.replace(/Nextsist\s*25\s*/gi, '')
    }));
    setItem(STORAGE_KEYS.GALLERY, sanitizedGallery);
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setItem(STORAGE_KEYS.SETTINGS, DEFAULT_GOR_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    setItem(STORAGE_KEYS.BOOKINGS, getInitialBookings());
  }

  // Run expiry sweep immediately
  checkAndExpireOverdueBookings();
}

// Sweep overdue bookings
export function checkAndExpireOverdueBookings(): void {
  const bookings = getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  let hasChanges = false;
  const now = new Date().getTime();

  const updated = bookings.map((b) => {
    // If still awaiting_payment and deadline passed, auto expire!
    if (
      b.booking_status === 'awaiting_payment' &&
      b.payment_status === 'unpaid' &&
      b.payment_deadline
    ) {
      const deadline = new Date(b.payment_deadline).getTime();
      if (now > deadline) {
        hasChanges = true;
        return {
          ...b,
          booking_status: 'expired' as BookingStatus,
          notes: (b.notes ? b.notes + ' | ' : '') + 'Kedaluwarsa otomatis (30 menit lewat)',
        };
      }
    }
    return b;
  });

  if (hasChanges) {
    setItem(STORAGE_KEYS.BOOKINGS, updated);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION SERVICE
// -------------------------------------------------------------
export interface AuthSession {
  user: UserProfile;
  token: string;
}

export function getCurrentSession(): AuthSession | null {
  return getItem<AuthSession | null>(STORAGE_KEYS.SESSION, null);
}

export function registerUser(payload: {
  phone: string;
  full_name: string;
  password: string;
}): { success: boolean; error?: string; user?: UserProfile } {
  const normalizedPhone = normalizeIndonesianPhone(payload.phone);
  const users = getItem<(UserProfile & { password_hash: string })[]>(STORAGE_KEYS.USERS, []);

  // Check unique phone number
  const existing = users.find((u) => u.phone === normalizedPhone);
  if (existing) {
    return {
      success: false,
      error: 'Nomor telepon sudah terdaftar. Silakan gunakan nomor lain atau login.',
    };
  }

  const newUser: UserProfile & { password_hash: string } = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    phone: normalizedPhone,
    full_name: payload.full_name.trim(),
    role: 'user',
    password_hash: payload.password, // In real Supabase Auth this is bcrypt/argon2
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  setItem(STORAGE_KEYS.USERS, users);

  // Auto login upon register
  const sessionUser: UserProfile = {
    id: newUser.id,
    phone: newUser.phone,
    full_name: newUser.full_name,
    role: newUser.role,
    created_at: newUser.created_at,
  };
  const session: AuthSession = {
    user: sessionUser,
    token: `token-${Date.now()}`,
  };
  setItem(STORAGE_KEYS.SESSION, session);

  return { success: true, user: sessionUser };
}

export function loginUser(payload: {
  phone: string;
  password: string;
}): { success: boolean; error?: string; user?: UserProfile } {
  const normalizedPhone = normalizeIndonesianPhone(payload.phone);
  const users = getItem<(UserProfile & { password_hash: string })[]>(STORAGE_KEYS.USERS, []);

  const found = users.find((u) => u.phone === normalizedPhone);
  if (!found) {
    return {
      success: false,
      error: 'Nomor telepon tidak ditemukan. Periksa kembali atau daftar akun baru.',
    };
  }

  if (found.password_hash !== payload.password) {
    return {
      success: false,
      error: 'Kata sandi salah. Silakan coba lagi.',
    };
  }

  const sessionUser: UserProfile = {
    id: found.id,
    phone: found.phone,
    full_name: found.full_name,
    role: found.role,
    created_at: found.created_at,
  };

  const session: AuthSession = {
    user: sessionUser,
    token: `token-${Date.now()}`,
  };
  setItem(STORAGE_KEYS.SESSION, session);

  return { success: true, user: sessionUser };
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  notifyStoreUpdate();
}

export function updateUserProfile(
  userId: string,
  payload: { full_name?: string; phone?: string; new_password?: string }
): { success: boolean; error?: string; user?: UserProfile } {
  const users = getItem<(UserProfile & { password_hash: string })[]>(STORAGE_KEYS.USERS, []);
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'User tidak ditemukan.' };
  }

  const current = users[index];
  if (payload.phone) {
    const norm = normalizeIndonesianPhone(payload.phone);
    if (norm !== current.phone) {
      // Check collision
      const exists = users.some((u) => u.id !== userId && u.phone === norm);
      if (exists) {
        return { success: false, error: 'Nomor telepon ini sudah digunakan akun lain.' };
      }
      current.phone = norm;
    }
  }

  if (payload.full_name) {
    current.full_name = payload.full_name.trim();
  }

  if (payload.new_password) {
    current.password_hash = payload.new_password;
  }

  current.updated_at = new Date().toISOString();
  users[index] = current;
  setItem(STORAGE_KEYS.USERS, users);

  // Update session
  const currentSession = getCurrentSession();
  if (currentSession && currentSession.user.id === userId) {
    currentSession.user = {
      id: current.id,
      phone: current.phone,
      full_name: current.full_name,
      role: current.role,
      created_at: current.created_at,
      updated_at: current.updated_at,
    };
    setItem(STORAGE_KEYS.SESSION, currentSession);
  }

  return {
    success: true,
    user: {
      id: current.id,
      phone: current.phone,
      full_name: current.full_name,
      role: current.role,
      created_at: current.created_at,
      updated_at: current.updated_at,
    },
  };
}

// -------------------------------------------------------------
// SETTINGS SERVICE
// -------------------------------------------------------------
export function getSettings(): GorSettings {
  return getItem<GorSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_GOR_SETTINGS);
}

export function updateSettings(newSettings: GorSettings): { success: boolean } {
  setItem(STORAGE_KEYS.SETTINGS, newSettings);
  return { success: true };
}

// -------------------------------------------------------------
// TABLES SERVICE
// -------------------------------------------------------------
export function getTables(): PingpongTable[] {
  return getItem<PingpongTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES);
}

export function toggleTableActive(
  tableNumber: 1 | 2,
  isActive: boolean,
  note?: string
): { success: boolean } {
  const tables = getTables();
  const updated = tables.map((t) => {
    if (t.table_number === tableNumber) {
      return {
        ...t,
        is_active: isActive,
        maintenance_note: note || t.maintenance_note,
      };
    }
    return t;
  });
  setItem(STORAGE_KEYS.TABLES, updated);
  return { success: true };
}

// -------------------------------------------------------------
// BOOKING SERVICE (ATOMIC DOUBLE-BOOKING PREVENTION)
// -------------------------------------------------------------
export function getAllBookings(): Booking[] {
  checkAndExpireOverdueBookings();
  return getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
}

export function getUserBookings(userId: string): Booking[] {
  checkAndExpireOverdueBookings();
  const all = getAllBookings();
  return all
    .filter((b) => b.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getBookingById(bookingId: string): Booking | null {
  checkAndExpireOverdueBookings();
  const all = getAllBookings();
  return all.find((b) => b.id === bookingId || b.booking_code === bookingId) || null;
}

export function createBooking(payload: {
  userId: string;
  userName: string;
  userPhone: string;
  bookingType: BookingType;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationHours: number;
  tables: number[]; // [1], [2], or [1, 2]
  notes?: string;
}): { success: boolean; booking?: Booking; error?: string } {
  checkAndExpireOverdueBookings();

  const settings = getSettings();
  const endTime = calculateEndTime(payload.startTime, payload.durationHours);

  // 1. Table selection validation
  let targetTables = payload.tables;
  if (payload.bookingType === 'tournament') {
    // Master prompt rule: Tournament ALWAYS uses both tables
    targetTables = [1, 2];
  } else if (!targetTables || targetTables.length === 0) {
    return { success: false, error: 'Silakan pilih minimal 1 meja.' };
  }

  // 2. Validate operating hours & past dates
  const validation = validateBookingTime(
    payload.bookingType,
    payload.bookingDate,
    payload.startTime,
    endTime,
    settings
  );
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  // 3. ATOMIC CHECK: Check conflict with all active bookings
  const existingBookings = getAllBookings();
  const conflict = checkBookingConflict(existingBookings, {
    booking_date: payload.bookingDate,
    start_time: payload.startTime,
    end_time: endTime,
    tables: targetTables,
  });

  if (conflict.hasConflict) {
    return {
      success: false,
      error: conflict.reason || 'Jadwal bertabrakan dengan pemesanan lain.',
    };
  }

  // 4. Calculate price securely (never trust client total)
  const totalPrice = calculateTotalPrice(
    payload.bookingType,
    payload.durationHours,
    targetTables.length,
    settings
  );

  // 5. Build Booking object with 30-minute payment countdown
  const now = new Date();
  const deadline = new Date(now.getTime() + (settings.payment_timeout_minutes || 30) * 60 * 1000);

  const cleanDateCode = payload.bookingDate.replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingCode = `SBC-${cleanDateCode}-${randomSuffix}`;

  const newBooking: Booking = {
    id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    booking_code: bookingCode,
    user_id: payload.userId,
    user_name: payload.userName,
    user_phone: normalizeIndonesianPhone(payload.userPhone),
    booking_type: payload.bookingType,
    booking_date: payload.bookingDate,
    start_time: payload.startTime,
    end_time: endTime,
    duration_hours: payload.durationHours,
    tables: targetTables,
    total_price: totalPrice,
    booking_status: 'awaiting_payment',
    payment_status: 'unpaid',
    payment_deadline: deadline.toISOString(),
    created_at: now.toISOString(),
    notes: payload.notes || '',
  };

  existingBookings.unshift(newBooking);
  setItem(STORAGE_KEYS.BOOKINGS, existingBookings);

  return { success: true, booking: newBooking };
}

export function submitPaymentProof(
  bookingId: string,
  proofDataUrl: string
): { success: boolean; error?: string; booking?: Booking } {
  const bookings = getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return { success: false, error: 'Pemesanan tidak ditemukan.' };
  }

  const b = bookings[index];
  if (b.booking_status === 'expired') {
    return {
      success: false,
      error: 'Batas waktu pembayaran telah habis. Jadwal telah dibatalkan.',
    };
  }

  b.payment_proof_url = proofDataUrl;
  b.payment_status = 'proof_submitted';
  b.booking_status = 'awaiting_verification'; // Ready for admin review

  bookings[index] = b;
  setItem(STORAGE_KEYS.BOOKINGS, bookings);

  return { success: true, booking: b };
}

export function verifyPaymentByAdmin(
  bookingId: string,
  adminUserId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): { success: boolean; error?: string; booking?: Booking } {
  const bookings = getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return { success: false, error: 'Pemesanan tidak ditemukan.' };
  }

  const b = bookings[index];
  const now = new Date().toISOString();

  if (action === 'approve') {
    b.payment_status = 'paid';
    b.booking_status = 'confirmed';
    b.payment_verified_at = now;
    b.payment_verified_by = adminUserId;
    b.rejection_reason = undefined;
  } else {
    b.payment_status = 'rejected';
    b.booking_status = 'rejected';
    b.payment_verified_at = now;
    b.payment_verified_by = adminUserId;
    b.rejection_reason = rejectionReason || 'Bukti transfer tidak sesuai atau tidak valid.';
  }

  bookings[index] = b;
  setItem(STORAGE_KEYS.BOOKINGS, bookings);

  return { success: true, booking: b };
}

export function cancelBooking(
  bookingId: string,
  cancelledByUserId: string,
  reason?: string
): { success: boolean; error?: string } {
  const bookings = getAllBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return { success: false, error: 'Pemesanan tidak ditemukan.' };
  }

  const b = bookings[index];
  b.booking_status = 'cancelled';
  b.notes = (b.notes ? b.notes + ' | ' : '') + `Dibatalkan: ${reason || 'Oleh pengguna'}`;

  bookings[index] = b;
  setItem(STORAGE_KEYS.BOOKINGS, bookings);
  return { success: true };
}

// -------------------------------------------------------------
// GALLERY SERVICE
// -------------------------------------------------------------
export function getGalleryPhotos(): GalleryPhoto[] {
  const photos = getItem<GalleryPhoto[]>(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
  return photos.sort((a, b) => a.display_order - b.display_order);
}

export function addGalleryPhoto(payload: {
  imageUrl: string;
  caption: string;
  isFeatured?: boolean;
}): { success: boolean; photo?: GalleryPhoto } {
  const photos = getGalleryPhotos();
  const newPhoto: GalleryPhoto = {
    id: `gal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    image_url: payload.imageUrl,
    caption: payload.caption.trim(),
    display_order: photos.length + 1,
    is_featured: payload.isFeatured ?? false,
    created_at: new Date().toISOString(),
  };

  photos.push(newPhoto);
  setItem(STORAGE_KEYS.GALLERY, photos);
  return { success: true, photo: newPhoto };
}

export function updateGalleryPhoto(
  photoId: string,
  updates: Partial<GalleryPhoto>
): { success: boolean } {
  const photos = getGalleryPhotos();
  const index = photos.findIndex((p) => p.id === photoId);
  if (index === -1) return { success: false };

  photos[index] = { ...photos[index], ...updates };
  setItem(STORAGE_KEYS.GALLERY, photos);
  return { success: true };
}

export function deleteGalleryPhoto(photoId: string): { success: boolean } {
  let photos = getGalleryPhotos();
  photos = photos.filter((p) => p.id !== photoId);
  // Re-index display order
  photos.forEach((p, idx) => {
    p.display_order = idx + 1;
  });
  setItem(STORAGE_KEYS.GALLERY, photos);
  return { success: true };
}

export function reorderGalleryPhotos(photoIds: string[]): { success: boolean } {
  const photos = getGalleryPhotos();
  const photoMap = new Map(photos.map((p) => [p.id, p]));
  const reordered: GalleryPhoto[] = [];

  photoIds.forEach((id, idx) => {
    const p = photoMap.get(id);
    if (p) {
      p.display_order = idx + 1;
      reordered.push(p);
    }
  });

  setItem(STORAGE_KEYS.GALLERY, reordered);
  return { success: true };
}

// -------------------------------------------------------------
// USER MANAGEMENT SERVICE (ADMIN)
// -------------------------------------------------------------
export function getAllUsers(): UserProfile[] {
  const users = getItem<(UserProfile & { password_hash: string })[]>(STORAGE_KEYS.USERS, []);
  return users.map(({ password_hash, ...rest }) => rest);
}
