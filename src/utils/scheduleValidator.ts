import { Booking, BookingType, GorSettings } from '../types';

export const DEFAULT_GOR_SETTINGS: GorSettings = {
  gor_name: 'GOR SBC (Gelanggang Olahraga SBC)',
  address: 'Jl. Brigif No.55, RT.1/RW.1, Cipedak, Kec. Jagakarsa, Kota Jakarta Selatan, DKI Jakarta 12630',
  phone: '0812-9876-5432',
  bca_account_number: '7310293841',
  bca_account_holder: 'PENGELOLA GOR SBC',
  price_regular_per_hour: 50000,
  price_tournament: 1500000,
  payment_timeout_minutes: 30,
  operating_hours: {
    monday: { open: '08:00', close: '16:00', isOpen: true },
    tuesday: { open: '12:00', close: '16:00', isOpen: true },
    wednesday: { open: '12:00', close: '16:00', isOpen: true },
    thursday: { open: '08:00', close: '16:00', isOpen: true },
    friday: { open: '08:00', close: '16:00', isOpen: true },
    saturday: { open: '12:00', close: '16:00', isOpen: true },
    sunday: { open: '12:00', close: '16:00', isOpen: true },
  },
};

/**
 * Get operating hours for a specific date (YYYY-MM-DD)
 */
export function getOperatingHoursForDate(dateStr: string, settings = DEFAULT_GOR_SETTINGS) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const dayKeys: (keyof GorSettings['operating_hours'])[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const key = dayKeys[dayIndex];
  return {
    dayName: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayIndex],
    ...settings.operating_hours[key],
  };
}

/**
 * Parses "HH:mm" to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return h * 60 + (m || 0);
}

/**
 * Formats minutes since midnight to "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check if the date is in the past (based on WIB / local today)
 */
export function isDateInPast(dateStr: string): boolean {
  if (!dateStr) return true;
  const parts = dateStr.split('-');
  const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return targetDate.getTime() < today.getTime();
}

/**
 * Check if two time intervals overlap [start1, end1) and [start2, end2)
 */
export function doIntervalsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Calculate end time given start time and duration in hours
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMin = timeToMinutes(startTime);
  const endMin = startMin + durationHours * 60;
  return minutesToTime(endMin);
}

/**
 * Validate booking time against operating hours and rules
 */
export function validateBookingTime(
  type: BookingType,
  dateStr: string,
  startTime: string,
  endTime: string,
  settings = DEFAULT_GOR_SETTINGS
): { isValid: boolean; error?: string } {
  if (isDateInPast(dateStr)) {
    return { isValid: false, error: 'Tanggal pemesanan tidak boleh tanggal yang sudah lewat.' };
  }

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (endMin <= startMin) {
    return { isValid: false, error: 'Jam selesai harus lebih besar dari jam mulai.' };
  }

  if (type === 'tournament') {
    // Tournament rules: 08:00 - 20:00 every day
    const tourneyOpenMin = timeToMinutes('08:00');
    const tourneyCloseMin = timeToMinutes('20:00');

    if (startMin < tourneyOpenMin) {
      return { isValid: false, error: 'Tournament booking paling awal mulai pukul 08.00 WIB.' };
    }
    if (endMin > tourneyCloseMin) {
      return { isValid: false, error: 'Tournament booking paling lambat selesai pukul 20.00 WIB.' };
    }
    return { isValid: true };
  } else {
    // Regular booking rules: depends on day of week
    const opHours = getOperatingHoursForDate(dateStr, settings);
    if (!opHours || !opHours.isOpen) {
      return { isValid: false, error: 'GOR SBC tutup pada hari yang dipilih untuk booking umum.' };
    }

    const dayOpenMin = timeToMinutes(opHours.open);
    const dayCloseMin = timeToMinutes(opHours.close);

    if (startMin < dayOpenMin) {
      return {
        isValid: false,
        error: `Jam mulai terlalu awal. Operasional hari ${opHours.dayName} baru buka pukul ${opHours.open} WIB.`,
      };
    }

    if (endMin > dayCloseMin) {
      return {
        isValid: false,
        error: `Pemesanan melewati jam tutup (${opHours.close} WIB). Kurangi durasi atau pilih jam mulai lebih awal.`,
      };
    }

    return { isValid: true };
  }
}

/**
 * Check collision with existing active bookings
 * Active bookings: awaiting_payment, awaiting_verification, confirmed
 */
export function checkBookingConflict(
  existingBookings: Booking[],
  newBooking: {
    booking_date: string;
    start_time: string;
    end_time: string;
    tables: number[];
    excludeBookingId?: string;
  }
): { hasConflict: boolean; conflictingBooking?: Booking; reason?: string } {
  const activeBookings = existingBookings.filter((b) => {
    if (newBooking.excludeBookingId && b.id === newBooking.excludeBookingId) return false;
    // Expired, rejected, and cancelled do not block the slot
    return ['awaiting_payment', 'awaiting_verification', 'confirmed'].includes(b.booking_status);
  });

  for (const b of activeBookings) {
    if (b.booking_date !== newBooking.booking_date) continue;

    // Check time overlap
    if (doIntervalsOverlap(newBooking.start_time, newBooking.end_time, b.start_time, b.end_time)) {
      // Check table overlap:
      // If either booking is a tournament, it reserves BOTH tables (tables = [1, 2])
      const bTables = b.booking_type === 'tournament' ? [1, 2] : b.tables;
      const targetTables = newBooking.tables;

      const overlappingTables = targetTables.filter((t) => bTables.includes(t));
      if (overlappingTables.length > 0) {
        return {
          hasConflict: true,
          conflictingBooking: b,
          reason: `Bentrok dengan pemesanan (${b.booking_code}) pada Meja ${overlappingTables.join(
            ' & '
          )} (${b.start_time} - ${b.end_time} WIB).`,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Calculate total price on server/client
 */
export function calculateTotalPrice(
  type: BookingType,
  durationHours: number,
  tablesCount: number,
  settings = DEFAULT_GOR_SETTINGS
): number {
  if (type === 'tournament') {
    return settings.price_tournament;
  }
  return durationHours * tablesCount * settings.price_regular_per_hour;
}
