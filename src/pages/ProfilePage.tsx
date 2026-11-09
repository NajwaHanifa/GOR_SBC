import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Lock,
  Calendar,
  LogOut,
  Edit2,
  Check,
  CreditCard,
  UploadCloud,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  cancelBooking,
  getCurrentSession,
  getUserBookings,
  logoutUser,
  subscribeToStore,
  updateUserProfile,
} from '../services/storage';
import {
  formatDateIndo,
  formatRupiah,
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from '../utils/formatters';
import { isValidIndonesianPhone, normalizeIndonesianPhone } from '../utils/phoneNormalizer';
import { PaymentCountdown } from '../components/PaymentCountdown';
import { Booking } from '../types';

export const ProfilePage: React.FC = () => {
  const [session, setSession] = useState(getCurrentSession());
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>(() =>
    session ? getUserBookings(session.user.id) : []
  );

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(session?.user.full_name || '');
  const [phoneInput, setPhoneInput] = useState(session?.user.phone || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Filter booking status
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (!session) {
      navigate('/login?redirect=/profile');
      return;
    }

    const unsub = subscribeToStore(() => {
      const current = getCurrentSession();
      setSession(current);
      if (current) {
        setBookings(getUserBookings(current.user.id));
      }
    });
    return unsub;
  }, [session, navigate]);

  if (!session) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!fullNameInput.trim()) {
      setProfileErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (!isValidIndonesianPhone(phoneInput)) {
      setProfileErrorMsg('Nomor telepon tidak valid. Gunakan format Indonesia (misal: 081234567890).');
      return;
    }

    const res = updateUserProfile(session.user.id, {
      full_name: fullNameInput,
      phone: phoneInput,
    });

    if (!res.success) {
      setProfileErrorMsg(res.error || 'Gagal memperbarui profil.');
      return;
    }

    setProfileSuccessMsg('Profil berhasil diperbarui.');
    setIsEditingProfile(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = updateUserProfile(session.user.id, {
      new_password: newPassword,
    });

    if (!res.success) {
      setPasswordErrorMsg(res.error || 'Gagal mengubah kata sandi.');
      return;
    }

    setPasswordSuccessMsg('Kata sandi berhasil diubah.');
    setIsChangingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pemesanan ini?')) {
      cancelBooking(bookingId, session.user.id, 'Dibatalkan oleh pelanggan');
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'active') {
      return ['awaiting_payment', 'awaiting_verification', 'confirmed'].includes(b.booking_status);
    }
    if (statusFilter === 'completed') {
      return b.booking_status === 'confirmed';
    }
    if (statusFilter === 'cancelled') {
      return ['cancelled', 'expired', 'rejected'].includes(b.booking_status);
    }
    return true;
  });

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Profil Saya & Riwayat Booking
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Kelola informasi akun dan pantau status pemesanan meja tenis meja Anda.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/booking"
              className="px-4 py-2.5 rounded-lg bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-colors"
            >
              + Booking Meja Baru
            </Link>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 hover:border-rose-300 hover:text-rose-600 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: PROFIL INFO & SETTINGS */}
          <div className="lg:col-span-4 space-y-6">
            {/* PROFILE CARD */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-[#0080FF] flex items-center justify-center text-xl font-black">
                  {session.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{session.user.full_name}</h3>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{session.user.phone}</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {session.user.role === 'admin' ? 'Administrator' : 'Pelanggan GOR SBC'}
                  </span>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
                  {profileSuccessMsg}
                </div>
              )}
              {profileErrorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-medium">
                  {profileErrorMsg}
                </div>
              )}

              {/* EDIT PROFILE FORM */}
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Nama Lengkap</label>
                    <input
                      type="text"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Nomor Telepon (WhatsApp)</label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-[#0080FF] text-white font-bold text-xs hover:bg-blue-600 cursor-pointer"
                    >
                      Simpan Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setFullNameInput(session.user.full_name);
                      setPhoneInput(session.user.phone);
                      setIsEditingProfile(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profil</span>
                  </button>
                </div>
              )}
            </div>

            {/* CHANGE PASSWORD CARD */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0080FF]" />
                <span>Keamanan Kata Sandi</span>
              </h4>

              {passwordSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
                  {passwordSuccessMsg}
                </div>
              )}
              {passwordErrorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-medium">
                  {passwordErrorMsg}
                </div>
              )}

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Kata Sandi Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      placeholder="Minimal 6 karakter"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Konfirmasi Kata Sandi Baru</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      placeholder="Ulangi kata sandi"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-[#0080FF] text-white font-bold text-xs hover:bg-blue-600 cursor-pointer"
                    >
                      Update Kata Sandi
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ganti Kata Sandi</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: RIWAYAT PEMESANAN */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Riwayat Pemesanan Anda</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total {bookings.length} pemesanan tercatat di akun ini
                  </p>
                </div>

                {/* FILTER TABS */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'active'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dikonfirmasi
                  </button>
                  <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'cancelled'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Batal/Selesai
                  </button>
                </div>
              </div>

              {/* LIST BOOKINGS */}
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Belum Ada Pemesanan</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Anda belum memiliki riwayat pemesanan pada kategori ini. Silakan pilih meja dan jam bermain di halaman booking.
                  </p>
                  <Link
                    to="/booking"
                    className="inline-block mt-2 px-4 py-2 rounded-lg bg-[#0080FF] text-white font-bold text-xs hover:bg-blue-600"
                  >
                    Booking Meja Sekarang
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((b) => {
                    const statusBadge = getBookingStatusLabel(b.booking_status);
                    const paymentBadge = getPaymentStatusLabel(b.payment_status);
                    const isAwaitingPay = b.booking_status === 'awaiting_payment';

                    return (
                      <div
                        key={b.id}
                        className="rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors bg-white space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <span className="font-mono text-xs font-black text-slate-900">
                              {b.booking_code}
                            </span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-xs font-semibold text-slate-600 uppercase">
                              {b.booking_type === 'tournament' ? 'Turnamen' : 'Reguler'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${paymentBadge.className}`}>
                              {paymentBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* DETAIL GRID */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Tanggal:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatDateIndo(b.booking_date)}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Jam Main:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {b.start_time} - {b.end_time} WIB
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Meja:</span>
                            <span className="font-bold text-slate-900">
                              {b.booking_type === 'tournament'
                                ? 'Meja 1 & 2'
                                : `Meja ${b.tables.join(' & ')}`}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Total Bayar:</span>
                            <span className="font-black text-[#0080FF] font-mono">
                              {formatRupiah(b.total_price)}
                            </span>
                          </div>
                        </div>

                        {/* COUNTDOWN / WARNING IF AWAITING PAYMENT */}
                        {isAwaitingPay && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200">
                            <div className="text-xs text-amber-900">
                              <p className="font-bold">Menunggu Pembayaran Transfer BCA</p>
                              <p className="text-[11px]">Unggah bukti transfer sebelum waktu berakhir.</p>
                            </div>
                            <PaymentCountdown deadline={b.payment_deadline} />
                          </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                          {isAwaitingPay && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:text-rose-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                            >
                              Batalkan
                            </button>
                          )}

                          <Link
                            to={`/payment/${b.id}`}
                            className="px-4 py-1.5 rounded-lg bg-[#0080FF] text-white text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>
                              {b.payment_status === 'paid'
                                ? 'Lihat Bukti Bayar'
                                : 'Rincian & Upload Bukti'}
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
