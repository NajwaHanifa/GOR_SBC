import { Booking, GalleryPhoto, PingpongTable, UserProfile } from '../types';
import { DEFAULT_GOR_SETTINGS } from '../utils/scheduleValidator';

export const INITIAL_TABLES: PingpongTable[] = [
  {
    id: 'tbl-1',
    table_number: 1,
    table_name: 'Meja Pingpong 1 (Standar Turnamen)',
    is_active: true,
  },
  {
    id: 'tbl-2',
    table_number: 2,
    table_name: 'Meja Pingpong 2 (Standar Turnamen)',
    is_active: true,
  },
];

export const INITIAL_GALLERY: GalleryPhoto[] = [
  {
    id: 'gal-banner',
    image_url: '/assets/aistudio/Banner_GOR_06089c23.jpeg',
    caption: 'Banner Resmi PTM SBC Ping Pong Club Cipedak Jagakarsa',
    display_order: 1,
    is_featured: true,
    is_template: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'gal-meja-1',
    image_url: '/assets/aistudio/Meja_1_9208dd16.jpeg',
    caption: 'Area Meja 1 Standar Turnamen dengan Papan Skor & Banner Olahraga',
    display_order: 2,
    is_featured: true,
    is_template: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'gal-meja-2',
    image_url: '/assets/aistudio/Meja_2_aa5e9b05.jpeg',
    caption: 'Pertandingan Tenis Meja Meja 2 GOR SBC suasana turnamen',
    display_order: 3,
    is_featured: false,
    is_template: false,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_USERS: (UserProfile & { password_hash: string })[] = [
  {
    id: 'usr-admin-1',
    phone: '+6281234567890',
    full_name: 'Administrator GOR SBC',
    role: 'admin',
    password_hash: 'adminSBC2026!',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-demo-1',
    phone: '+6281299887766',
    full_name: 'Budi Prasetyo',
    role: 'user',
    password_hash: 'userSBC2026!',
    created_at: '2026-01-15T10:00:00Z',
  },
];

export function getInitialBookings(): Booking[] {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomYyyy = tomorrow.getFullYear();
  const tomMm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomDd = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tomYyyy}-${tomMm}-${tomDd}`;

  return [
    {
      id: 'book-001',
      booking_code: `SBC-${yyyy}${mm}${dd}-A101`,
      user_id: 'usr-demo-1',
      user_name: 'Budi Prasetyo',
      user_phone: '+6281299887766',
      booking_type: 'regular',
      booking_date: todayStr,
      start_time: '13:00',
      end_time: '15:00',
      duration_hours: 2,
      tables: [1],
      total_price: 100000,
      booking_status: 'confirmed',
      payment_status: 'paid',
      payment_deadline: new Date(Date.now() - 3600000).toISOString(),
      payment_proof_url: '/assets/aistudio/Banner_GOR_06089c23.jpeg',
      payment_verified_at: new Date(Date.now() - 3000000).toISOString(),
      payment_verified_by: 'usr-admin-1',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      notes: 'Latihan rutin sore',
    },
    {
      id: 'book-002',
      booking_code: `SBC-${tomYyyy}${tomMm}${tomDd}-B202`,
      user_id: 'usr-demo-1',
      user_name: 'Budi Prasetyo',
      user_phone: '+6281299887766',
      booking_type: 'regular',
      booking_date: tomorrowStr,
      start_time: '14:00',
      end_time: '16:00',
      duration_hours: 2,
      tables: [2],
      total_price: 100000,
      booking_status: 'awaiting_verification',
      payment_status: 'proof_submitted',
      payment_deadline: new Date(Date.now() + 15 * 60000).toISOString(),
      payment_proof_url: '/assets/aistudio/Banner_GOR_06089c23.jpeg',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      notes: 'Main ganda putra',
    },
  ];
}
