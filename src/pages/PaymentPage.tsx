import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Copy,
  Check,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Clock,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  getBookingById,
  getCurrentSession,
  getSettings,
  submitPaymentProof,
  subscribeToStore,
} from '../services/storage';
import { PaymentCountdown } from '../components/PaymentCountdown';
import { formatDateIndo, formatDateTimeIndo, formatRupiah, getBookingStatusLabel, getPaymentStatusLabel } from '../utils/formatters';
import { Booking } from '../types';

export const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(() =>
    bookingId ? getBookingById(bookingId) : null
  );
  const [settings, setSettings] = useState(getSettings());
  const [session, setSession] = useState(getCurrentSession());

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // File upload state
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeToStore(() => {
      if (bookingId) {
        const b = getBookingById(bookingId);
        setBooking(b);
      }
      setSettings(getSettings());
      setSession(getCurrentSession());
    });
    return unsub;
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Pemesanan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-600">
            Nomor pemesanan tidak ditemukan dalam sistem kami atau telah dihapus.
          </p>
          <Link
            to="/booking"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#0080FF] text-white font-bold text-xs"
          >
            Kembali ke Halaman Booking
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getBookingStatusLabel(booking.booking_status);
  const paymentInfo = getPaymentStatusLabel(booking.payment_status);

  const handleCopy = (text: string, type: 'account' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 5MB.');
      return;
    }

    setErrorMessage('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePreview) {
      setErrorMessage('Silakan pilih file bukti transfer terlebih dahulu.');
      return;
    }

    setUploading(true);
    setErrorMessage('');

    const res = submitPaymentProof(booking.id, filePreview);
    setUploading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Gagal mengunggah bukti pembayaran.');
      return;
    }

    setUploadSuccess(true);
    if (res.booking) {
      setBooking(res.booking);
    }
  };

  const isExpired = booking.booking_status === 'expired';
  const isConfirmed = booking.booking_status === 'confirmed';
  const isAwaitingVerification = booking.booking_status === 'awaiting_verification';

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* TOP BACK LINK */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Riwayat Pemesanan</span>
          </Link>
          <span className="font-mono text-xs text-slate-500">
            ID: {booking.booking_code}
          </span>
        </div>

        {/* STATUS BANNER */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${paymentInfo.className}`}>
                {paymentInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-600">{statusInfo.description}</p>
          </div>

          {/* COUNTDOWN ONLY IF UNPAID & NOT EXPIRED */}
          {booking.booking_status === 'awaiting_payment' && !isExpired && (
            <PaymentCountdown
              deadline={booking.payment_deadline}
              onExpire={() => {
                const refreshed = getBookingById(booking.id);
                if (refreshed) setBooking(refreshed);
              }}
            />
          )}
        </div>

        {/* REJECTION REASON CALLOUT */}
        {booking.booking_status === 'rejected' && booking.rejection_reason && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Alasan Penolakan Pembayaran:
            </p>
            <p>{booking.rejection_reason}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT: DETAIL PEMESANAN & REKENING BCA */}
          <div className="md:col-span-7 space-y-6">
            {/* REKENING TRANSFER BCA */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CreditCard className="w-5 h-5 text-[#0080FF]" />
                  <span>Rekening Transfer Resmi BCA</span>
                </div>
                <span className="text-xs font-bold text-[#0080FF] bg-blue-50 px-2 py-0.5 rounded">
                  Bank BCA
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Nomor Rekening BCA</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                      {settings.bca_account_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.bca_account_number, 'account')}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedAccount ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Nomor</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Nama Penerima Rekening:</span>
                  <span className="font-bold text-slate-900">{settings.bca_account_holder}</span>
                </div>
              </div>

              {/* TOTAL TRANSFER */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-900 font-medium">Total Nominal Transfer:</span>
                  <p className="font-mono text-2xl font-black text-[#0080FF]">
                    {formatRupiah(booking.total_price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(booking.total_price), 'amount')}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 bg-white text-xs font-semibold text-[#0080FF] flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedAmount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Nominal</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500">
                <p>• Mohon transfer tepat hingga nominal yang tertera.</p>
                <p>• Sertakan kode booking <strong>{booking.booking_code}</strong> pada berita transfer jika memungkinkan.</p>
                <p>• Setelah transfer, simpan struk / bukti mutasi dan unggah pada formulir di samping.</p>
              </div>
            </div>

            {/* RINCIAN PESANAN */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Rincian Pemesanan
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Kode Booking</span>
                  <span className="font-mono font-bold text-slate-900">{booking.booking_code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nama Pemesan</span>
                  <span className="font-semibold text-slate-900">{booking.user_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nomor Telepon</span>
                  <span className="font-mono text-slate-900">{booking.user_phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Jenis Pemesanan</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {booking.booking_type === 'tournament' ? 'Tournament' : 'Reguler'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Bermain</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatDateIndo(booking.booking_date)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Meja</span>
                  <span className="font-bold text-slate-900">
                    {booking.booking_type === 'tournament'
                      ? 'Meja 1 & 2 (Eksklusif Turnamen)'
                      : `Meja ${booking.tables.join(' & ')}`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Waktu Main</span>
                  <span className="font-mono font-bold text-slate-900">
                    {booking.start_time} - {booking.end_time} WIB ({booking.duration_hours} Jam)
                  </span>
                </div>
                {booking.notes && (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span className="text-slate-500">Catatan</span>
                    <span className="italic">{booking.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: FORM UPLOAD BUKTI TRANSFER & STATUS VERIFIKASI */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Unggah Bukti Transfer
              </h4>

              {/* JIKA SUDAH KONFIRMASI */}
              {isConfirmed ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900">
                    Pembayaran Telah Diverifikasi!
                  </h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Pemesanan Anda telah berstatus <strong>Dikonfirmasi</strong>. Meja Anda telah aman dan siap digunakan pada hari pertandingan.
                  </p>
                  {booking.payment_verified_at && (
                    <p className="text-[11px] text-emerald-600 font-mono">
                      Diverifikasi pada: {formatDateTimeIndo(booking.payment_verified_at)}
                    </p>
                  )}
                  <Link
                    to="/profile"
                    className="inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    Lihat di Profil Saya
                  </Link>
                </div>
              ) : isExpired ? (
                <div className="p-6 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-3">
                  <XCircle className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">
                    Pemesanan Telah Kedaluwarsa
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Batas waktu 30 menit telah berakhir tanpa upload bukti transfer. Jadwal meja telah dibuka kembali untuk umum.
                  </p>
                  <Link
                    to="/booking"
                    className="inline-block mt-2 px-4 py-2 rounded-lg bg-[#0080FF] text-white text-xs font-bold hover:bg-blue-600"
                  >
                    Pesan Jadwal Baru
                  </Link>
                </div>
              ) : (
                /* FORM UPLOAD ATAU STATUS MENUNGGU VERIFIKASI */
                <div className="space-y-4">
                  {booking.payment_proof_url ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#0080FF] shrink-0" />
                        <span>
                          Bukti transfer telah diterima dan sedang menunggu verifikasi administrator.
                        </span>
                      </div>

                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                        <img
                          src={booking.payment_proof_url}
                          alt="Bukti Transfer Pembayaran"
                          className="w-full max-h-56 object-contain bg-slate-950"
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 text-center">
                        Ingin mengganti bukti transfer? Unggah ulang file baru di bawah ini.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Silakan upload struk transfer ATM, m-Banking, atau mutasi rekening BCA Anda (format JPG, PNG, atau PDF).
                    </p>
                  )}

                  <form onSubmit={handleSubmitProof} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 hover:border-[#0080FF] rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">
                        {fileName ? fileName : 'Klik atau seret bukti transfer ke sini'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Format JPG, PNG, atau PDF (Maksimal 5MB)
                      </p>
                    </div>

                    {filePreview && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                        <img
                          src={filePreview}
                          alt="Preview Bukti"
                          className="w-full max-h-40 object-contain bg-slate-950"
                        />
                      </div>
                    )}

                    {errorMessage && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                        {errorMessage}
                      </p>
                    )}

                    {uploadSuccess && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium">
                        Bukti berhasil dikirim! Menunggu konfirmasi admin.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={uploading || !filePreview}
                      className={`w-full py-3 rounded-lg text-white font-bold text-xs transition-all shadow-sm ${
                        uploading || !filePreview
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-[#0080FF] hover:bg-blue-600 cursor-pointer hover:shadow-md'
                      }`}
                    >
                      {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* BANTUAN KONTAK */}
            <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">Butuh Bantuan Transfer?</p>
              <p>
                Jika mengalami kendala transfer atau verifikasi terlambat, hubungi pengelola GOR SBC melalui WhatsApp/Telepon di <strong>{settings.phone}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
