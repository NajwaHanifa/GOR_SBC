export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export type TableNumber = 1 | 2;

export interface PingpongTable {
  id: string;
  table_number: TableNumber;
  table_name: string;
  is_active: boolean;
  maintenance_note?: string;
}

export type BookingType = 'regular' | 'tournament';

export type BookingStatus =
  | 'awaiting_payment'
  | 'awaiting_verification'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'proof_submitted'
  | 'paid'
  | 'rejected';

export interface Booking {
  id: string;
  booking_code: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  booking_type: BookingType;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_hours: number;
  tables: number[]; // [1], [2], or [1, 2]
  total_price: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  payment_deadline: string; // ISO string (30 minutes from creation)
  created_at: string;
  notes?: string;
  payment_proof_url?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  rejection_reason?: string;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
  display_order: number;
  is_featured: boolean;
  is_template?: boolean;
  created_at: string;
}

export interface OperationalSchedule {
  day_id: number; // 0 = Sunday, 1 = Monday, ...
  day_name: string;
  is_open: boolean;
  open_time: string; // "08:00" or "12:00"
  close_time: string; // "16:00"
}

export interface GorSettings {
  gor_name: string;
  address: string;
  phone: string;
  bca_account_number: string;
  bca_account_holder: string;
  price_regular_per_hour: number;
  price_tournament: number;
  payment_timeout_minutes: number;
  operating_hours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
}
