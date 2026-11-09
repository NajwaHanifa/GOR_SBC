import { BookingStatus, PaymentStatus } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const INDO_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const dayName = INDO_DAYS[d.getDay()];
    const monthName = INDO_MONTHS[month];
    return `${dayName}, ${day} ${monthName} ${year}`;
  }
  return dateStr;
}

export function formatDateTimeIndo(isoStr: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;

  const day = d.getDate();
  const month = INDO_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
}

export function getBookingStatusLabel(status: BookingStatus): {
  label: string;
  className: string;
  description: string;
} {
  switch (status) {
    case 'awaiting_payment':
      return {
        label: 'Menunggu Pembayaran',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
        description: 'Selesaikan transfer dan upload bukti bayar sebelum batas waktu.',
      };
    case 'awaiting_verification':
      return {
        label: 'Menunggu Verifikasi',
        className: 'bg-blue-50 text-blue-700 border border-blue-200',
        description: 'Bukti transfer sedang diperiksa oleh administrator GOR SBC.',
      };
    case 'confirmed':
      return {
        label: 'Dikonfirmasi',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        description: 'Pemesanan telah terkonfirmasi dan siap digunakan sesuai jadwal.',
      };
    case 'rejected':
      return {
        label: 'Ditolak',
        className: 'bg-rose-50 text-rose-700 border border-rose-200',
        description: 'Pemesanan ditolak oleh administrator.',
      };
    case 'expired':
      return {
        label: 'Kedaluwarsa',
        className: 'bg-slate-100 text-slate-600 border border-slate-200',
        description: 'Batas waktu 30 menit terlewati tanpa konfirmasi pembayaran.',
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        className: 'bg-slate-100 text-slate-600 border border-slate-200',
        description: 'Pemesanan dibatalkan oleh pengguna atau admin.',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-600 border border-slate-200',
        description: '',
      };
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'unpaid':
      return {
        label: 'Belum Bayar',
        className: 'text-amber-700 bg-amber-50 border border-amber-200',
      };
    case 'proof_submitted':
      return {
        label: 'Bukti Diunggah',
        className: 'text-blue-700 bg-blue-50 border border-blue-200',
      };
    case 'paid':
      return {
        label: 'Lunas',
        className: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
      };
    case 'rejected':
      return {
        label: 'Ditolak',
        className: 'text-rose-700 bg-rose-50 border border-rose-200',
      };
    default:
      return {
        label: status,
        className: 'text-slate-600 bg-slate-100 border border-slate-200',
      };
  }
}
