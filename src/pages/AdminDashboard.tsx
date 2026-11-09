import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Users,
  Grid,
  Image,
  Settings,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  LogOut,
  Search,
  Filter,
  Eye,
  Check,
  X,
  UploadCloud,
  Trash2,
  Save,
  Download,
  Copy,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Maximize2,
  Edit2,
} from 'lucide-react';
import {
  addGalleryPhoto,
  cancelBooking,
  deleteGalleryPhoto,
  getAllBookings,
  getAllUsers,
  getCurrentSession,
  getGalleryPhotos,
  getSettings,
  getTables,
  logoutUser,
  reorderGalleryPhotos,
  subscribeToStore,
  toggleTableActive,
  updateGalleryPhoto,
  updateSettings,
  verifyPaymentByAdmin,
} from '../services/storage';
import {
  formatDateIndo,
  formatDateTimeIndo,
  formatRupiah,
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from '../utils/formatters';
import { Booking, GalleryPhoto, GorSettings, PingpongTable, UserProfile } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(getCurrentSession());

  // Data states
  const [bookings, setBookings] = useState<Booking[]>(getAllBookings());
  const [users, setUsers] = useState<UserProfile[]>(getAllUsers());
  const [tables, setTables] = useState<PingpongTable[]>(getTables());
  const [gallery, setGallery] = useState<GalleryPhoto[]>(getGalleryPhotos());
  const [settings, setSettingsState] = useState<GorSettings>(getSettings());

  // Active Tab
  type TabKey =
    | 'overview'
    | 'bookings'
    | 'verification'
    | 'users'
    | 'tables'
    | 'gallery'
    | 'settings'
    | 'reports'
    | 'database';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Modal / Interaction states
  const [selectedProofBooking, setSelectedProofBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<Booking | null>(null);

  // Filter Bookings state
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState<string>('all');
  const [bookingDateFilter, setBookingDateFilter] = useState<string>('');

  // Gallery add form state
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');
  const [newPhotoFeatured, setNewPhotoFeatured] = useState<boolean>(false);
  const [galleryMsg, setGalleryMsg] = useState<string>('');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState<string>('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<GorSettings>(settings);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string>('');

  // Report filter state
  const [reportPeriod, setReportPeriod] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());
  const [reportMonth, setReportMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );

  // Copy SQL feedback
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Ensure Admin Auth
  useEffect(() => {
    if (!session || session.user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    const unsub = subscribeToStore(() => {
      const cur = getCurrentSession();
      setSession(cur);
      if (!cur || cur.user.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      setBookings(getAllBookings());
      setUsers(getAllUsers());
      setTables(getTables());
      setGallery(getGalleryPhotos());
      const s = getSettings();
      setSettingsState(s);
    });

    return unsub;
  }, [session, navigate]);

  // Keep settingsForm synced when settings update
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  // -------------------------------------------------------------
  // METRICS COMPUTATION (OVERVIEW)
  // -------------------------------------------------------------
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }, []);

  const totalUsersCount = users.length;
  const totalBookingsCount = bookings.length;
  const todayBookingsCount = bookings.filter((b) => b.booking_date === todayStr).length;
  const awaitingPaymentCount = bookings.filter((b) => b.booking_status === 'awaiting_payment').length;
  const awaitingVerificationCount = bookings.filter(
    (b) => b.booking_status === 'awaiting_verification'
  ).length;
  const confirmedCount = bookings.filter((b) => b.booking_status === 'confirmed').length;

  const totalRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total_price, 0);
  }, [bookings]);

  // -------------------------------------------------------------
  // ACTIONS: VERIFICATION
  // -------------------------------------------------------------
  const handleApprovePayment = (bookingId: string) => {
    verifyPaymentByAdmin(bookingId, session.user.id, 'approve');
    setSelectedProofBooking(null);
  };

  const handleOpenReject = (booking: Booking) => {
    setSelectedProofBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (!selectedProofBooking) return;
    if (!rejectionReason.trim()) {
      alert('Mohon isi alasan penolakan pembayaran.');
      return;
    }
    verifyPaymentByAdmin(selectedProofBooking.id, session.user.id, 'reject', rejectionReason);
    setShowRejectModal(false);
    setSelectedProofBooking(null);
    setRejectionReason('');
  };

  // -------------------------------------------------------------
  // ACTIONS: TABLE TOGGLE
  // -------------------------------------------------------------
  const handleToggleTable = (tableNumber: 1 | 2, currentActive: boolean) => {
    const note = currentActive ? prompt('Masukkan catatan perawatan (opsional):') || undefined : undefined;
    toggleTableActive(tableNumber, !currentActive, note);
  };

  // -------------------------------------------------------------
  // ACTIONS: GALLERY MANAGEMENT
  // -------------------------------------------------------------
  const handleUploadPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl) {
      setGalleryMsg('Pilih foto terlebih dahulu.');
      return;
    }
    addGalleryPhoto({
      imageUrl: newPhotoUrl,
      caption: newPhotoCaption || 'Fasilitas GOR SBC',
      isFeatured: newPhotoFeatured,
    });
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setNewPhotoFeatured(false);
    setGalleryMsg('Foto berhasil ditambahkan!');
    setTimeout(() => setGalleryMsg(''), 3000);
  };

  const handleDeletePhoto = (photoId: string) => {
    if (confirm('Hapus foto ini dari galeri?')) {
      deleteGalleryPhoto(photoId);
    }
  };

  const handleSetFeaturedPhoto = (photoId: string, current: boolean) => {
    updateGalleryPhoto(photoId, { is_featured: !current });
  };

  const handleStartEditCaption = (photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingCaptionText(photo.caption);
  };

  const handleSaveCaption = (photoId: string) => {
    if (!editingCaptionText.trim()) {
      alert('Caption foto tidak boleh kosong.');
      return;
    }
    updateGalleryPhoto(photoId, { caption: editingCaptionText.trim() });
    setEditingPhotoId(null);
    setGalleryMsg('Caption foto berhasil diperbarui!');
    setTimeout(() => setGalleryMsg(''), 3000);
  };

  const handleCancelEditCaption = () => {
    setEditingPhotoId(null);
    setEditingCaptionText('');
  };

  // -------------------------------------------------------------
  // ACTIONS: SETTINGS UPDATE
  // -------------------------------------------------------------
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    setSettingsSavedMsg('Pengaturan GOR SBC berhasil disimpan!');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  // -------------------------------------------------------------
  // ACTIONS: REPORT CSV EXPORT
  // -------------------------------------------------------------
  const reportData = useMemo(() => {
    return bookings.filter((b) => {
      if (reportPeriod === 'monthly') {
        const prefix = `${reportYear}-${reportMonth}`;
        return b.booking_date.startsWith(prefix);
      }
      if (reportPeriod === 'yearly') {
        return b.booking_date.startsWith(reportYear);
      }
      return true;
    });
  }, [bookings, reportPeriod, reportYear, reportMonth]);

  const reportRevenueTotal = reportData
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.total_price, 0);

  const reportRegularRevenue = reportData
    .filter((b) => b.payment_status === 'paid' && b.booking_type === 'regular')
    .reduce((sum, b) => sum + b.total_price, 0);

  const reportTournamentRevenue = reportData
    .filter((b) => b.payment_status === 'paid' && b.booking_type === 'tournament')
    .reduce((sum, b) => sum + b.total_price, 0);

  const exportCSV = () => {
    const headers = [
      'Kode Booking',
      'Nama Pelanggan',
      'Nomor Telepon',
      'Jenis Pemesanan',
      'Tanggal Main',
      'Jam Mulai',
      'Jam Selesai',
      'Durasi (Jam)',
      'Meja',
      'Total Biaya (IDR)',
      'Status Pemesanan',
      'Status Pembayaran',
      'Waktu Dibuat',
    ];

    const rows = reportData.map((b) => [
      `"${b.booking_code}"`,
      `"${b.user_name}"`,
      `"${b.user_phone}"`,
      `"${b.booking_type}"`,
      `"${b.booking_date}"`,
      `"${b.start_time}"`,
      `"${b.end_time}"`,
      b.duration_hours,
      `"${b.tables.join(',')}"`,
      b.total_price,
      `"${b.booking_status}"`,
      `"${b.payment_status}"`,
      `"${b.created_at}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-booking-gor-sbc-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Bookings for the Booking Management tab
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingSearch) {
        const query = bookingSearch.toLowerCase();
        const matchCode = b.booking_code.toLowerCase().includes(query);
        const matchName = b.user_name.toLowerCase().includes(query);
        const matchPhone = b.user_phone.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchPhone) return false;
      }
      if (bookingStatusFilter !== 'all' && b.booking_status !== bookingStatusFilter) {
        return false;
      }
      if (bookingTypeFilter !== 'all' && b.booking_type !== bookingTypeFilter) {
        return false;
      }
      if (bookingDateFilter && b.booking_date !== bookingDateFilter) {
        return false;
      }
      return true;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, bookingTypeFilter, bookingDateFilter]);

  const navTabs = [
    { key: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    {
      key: 'verification',
      label: 'Verifikasi Pembayaran',
      icon: CreditCard,
      badge: awaitingVerificationCount,
    },
    { key: 'bookings', label: 'Manajemen Booking', icon: CalendarDays },
    { key: 'tables', label: 'Manajemen Meja', icon: Grid },
    { key: 'gallery', label: 'Manajemen Foto', icon: Image },
    { key: 'users', label: 'Pengguna', icon: Users },
    { key: 'settings', label: 'Pengaturan GOR', icon: Settings },
    { key: 'reports', label: 'Laporan & CSV', icon: FileSpreadsheet },
    { key: 'database', label: 'Database Supabase', icon: Database },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP ADMIN HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0080FF] flex items-center justify-center font-black text-sm">
              SBC
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Admin GOR SBC
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">
                Pusat Kendali Pengelola
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              Lihat Website Utama
            </Link>
            <button
              onClick={() => {
                logoutUser();
                navigate('/admin/login');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTAINER WITH TABS */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0080FF] text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white text-[#0080FF]' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================= */}
        {/* TAB 1: OVERVIEW & STATISTIK */}
        {/* ============================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI STATS STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Pendapatan Lunas
                </span>
                <p className="text-2xl font-black text-[#0080FF] font-mono">
                  {formatRupiah(totalRevenue)}
                </p>
                <p className="text-[11px] text-slate-400">Dari pemesanan terverifikasi</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Menunggu Verifikasi
                </span>
                <p className="text-2xl font-black text-blue-600 font-mono">
                  {awaitingVerificationCount}
                </p>
                <p className="text-[11px] text-slate-400">Bukti transfer baru diunggah</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Booking Hari Ini
                </span>
                <p className="text-2xl font-black text-slate-900 font-mono">
                  {todayBookingsCount}
                </p>
                <p className="text-[11px] text-slate-400">Jadwal main tanggal {todayStr}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Pengguna Terdaftar
                </span>
                <p className="text-2xl font-black text-slate-900 font-mono">{totalUsersCount}</p>
                <p className="text-[11px] text-slate-400">Akun terverifikasi nomor telepon</p>
              </div>
            </div>

            {/* QUICK ACTIONS & PENDING VERIFICATION CALLOUT */}
            {awaitingVerificationCount > 0 && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0080FF] shrink-0" />
                  <span>
                    Ada <strong>{awaitingVerificationCount}</strong> bukti transfer yang menunggu
                    pemeriksaan dan konfirmasi admin.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('verification')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0080FF] text-white font-bold hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                >
                  Periksa Sekarang
                </button>
              </div>
            )}

            {/* CHARTS / SUMMARY GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* STATUS BREAKDOWN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Distribusi Status Pemesanan</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Dikonfirmasi (Lunas)</span>
                    <span className="font-mono font-bold text-emerald-600">{confirmedCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${totalBookingsCount ? (confirmedCount / totalBookingsCount) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Menunggu Verifikasi Bukti</span>
                    <span className="font-mono font-bold text-blue-600">
                      {awaitingVerificationCount}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-[#0080FF] h-2 rounded-full"
                      style={{
                        width: `${
                          totalBookingsCount
                            ? (awaitingVerificationCount / totalBookingsCount) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Menunggu Transfer (Hold 30m)</span>
                    <span className="font-mono font-bold text-amber-600">{awaitingPaymentCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${
                          totalBookingsCount ? (awaitingPaymentCount / totalBookingsCount) * 100 : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* BOOKING TYPE RATIO */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Perbandingan Jenis Pemesanan</h3>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Sewa Reguler Per Jam</span>
                    <p className="text-2xl font-black text-slate-900 font-mono">
                      {bookings.filter((b) => b.booking_type === 'regular').length}
                    </p>
                    <p className="text-[11px] text-slate-400">Rp50.000 / meja / jam</p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                    <span className="text-xs text-[#0080FF] font-medium">Tournament Booking</span>
                    <p className="text-2xl font-black text-[#0080FF] font-mono">
                      {bookings.filter((b) => b.booking_type === 'tournament').length}
                    </p>
                    <p className="text-[11px] text-blue-700">Rp1.500.000 (Flat 2 Meja)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: VERIFIKASI PEMBAYARAN BUKTI TRANSFER */}
        {/* ============================================================= */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Antrean Verifikasi Pembayaran Transfer BCA
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periksa struk / bukti mutasi transfer sebelum mengonfirmasi ketersediaan meja.
                </p>
              </div>
            </div>

            {bookings.filter((b) => b.booking_status === 'awaiting_verification').length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Tidak Ada Antrean Verifikasi</p>
                <p className="text-xs text-slate-400">
                  Seluruh bukti transfer yang masuk telah selesai diperiksa.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings
                  .filter((b) => b.booking_status === 'awaiting_verification')
                  .map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-slate-200 p-5 space-y-4 bg-slate-50/50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-slate-900">
                          {b.booking_code}
                        </span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Menunggu Verifikasi
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Pelanggan:</span>
                          <span className="font-bold text-slate-900">{b.user_name}</span>
                          <span className="font-mono text-slate-500 block text-[11px]">
                            {b.user_phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nominal Transfer:</span>
                          <span className="font-mono font-black text-[#0080FF] text-sm">
                            {formatRupiah(b.total_price)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Jadwal Main:</span>
                          <span className="font-bold text-slate-900">{b.booking_date}</span>
                          <span className="font-mono text-slate-600 block text-[11px]">
                            {b.start_time} - {b.end_time} WIB
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Meja:</span>
                          <span className="font-bold text-slate-900">
                            {b.booking_type === 'tournament' ? 'Meja 1 & 2' : `Meja ${b.tables.join(' & ')}`}
                          </span>
                        </div>
                      </div>

                      {/* PROOF THUMBNAIL */}
                      {b.payment_proof_url ? (
                        <div
                          onClick={() => setSelectedProofBooking(b)}
                          className="relative rounded-lg overflow-hidden border border-slate-300 bg-black cursor-pointer group h-44"
                        >
                          <img
                            src={b.payment_proof_url}
                            alt="Bukti Transfer"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-opacity">
                            <Maximize2 className="w-4 h-4" />
                            <span>Perbesar Bukti</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                          File bukti belum tersedia.
                        </div>
                      )}

                      {/* ACTION BUTTONS */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleApprovePayment(b.id)}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui Pembayaran</span>
                        </button>
                        <button
                          onClick={() => handleOpenReject(b)}
                          className="py-2 px-3 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: MANAJEMEN BOOKING */}
        {/* ============================================================= */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Seluruh Pemesanan Meja</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total {bookings.length} pemesanan terdaftar di sistem.
                </p>
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari kode, nama, nomor HP..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-[#0080FF]"
                />
              </div>

              <div>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-[#0080FF]"
                >
                  <option value="all">Semua Status Booking</option>
                  <option value="awaiting_payment">Menunggu Pembayaran</option>
                  <option value="awaiting_verification">Menunggu Verifikasi</option>
                  <option value="confirmed">Dikonfirmasi</option>
                  <option value="rejected">Ditolak</option>
                  <option value="expired">Kedaluwarsa</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div>
                <select
                  value={bookingTypeFilter}
                  onChange={(e) => setBookingTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-[#0080FF]"
                >
                  <option value="all">Semua Jenis Booking</option>
                  <option value="regular">Reguler Per Jam</option>
                  <option value="tournament">Tournament Booking</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-[#0080FF]"
                />
              </div>
            </div>

            {/* TABLE LIST */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-3 px-3">Kode Booking</th>
                    <th className="py-3 px-3">Pelanggan</th>
                    <th className="py-3 px-3">Tanggal Main</th>
                    <th className="py-3 px-3">Jam & Meja</th>
                    <th className="py-3 px-3">Biaya</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada pemesanan yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const statusBadge = getBookingStatusLabel(b.booking_status);
                      const paymentBadge = getPaymentStatusLabel(b.payment_status);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {b.booking_code}
                            <span className="block text-[10px] text-slate-400 uppercase font-sans">
                              {b.booking_type}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 block">{b.user_name}</span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              {b.user_phone}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            {b.booking_date}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-semibold block">
                              {b.start_time} - {b.end_time} WIB
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {b.booking_type === 'tournament' ? 'Meja 1 & 2' : `Meja ${b.tables.join(' & ')}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatRupiah(b.total_price)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                            {b.payment_proof_url && (
                              <button
                                onClick={() => setSelectedProofBooking(b)}
                                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-[#0080FF] hover:bg-slate-100 cursor-pointer"
                                title="Lihat Bukti Transfer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {['awaiting_payment', 'awaiting_verification'].includes(b.booking_status) && (
                              <button
                                onClick={() => {
                                  if (confirm(`Batalkan pemesanan ${b.booking_code}?`)) {
                                    cancelBooking(b.id, session.user.id, 'Dibatalkan oleh admin');
                                  }
                                }}
                                className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Batalkan Booking"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: MANAJEMEN MEJA */}
        {/* ============================================================= */}
        {activeTab === 'tables' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Manajemen Fasilitas Meja GOR SBC</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola status operasional Meja 1 dan Meja 2 atau blokir waktu perawatan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 p-6 space-y-4 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0080FF]">
                        Meja {t.table_number}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900">{t.table_name}</h4>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        t.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {t.is_active ? 'Aktif & Tersedia' : 'Dalam Perawatan'}
                    </span>
                  </div>

                  {t.maintenance_note && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                      <strong>Catatan Perawatan:</strong> {t.maintenance_note}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
                    <span className="text-slate-500">Ubah Status Operasional:</span>
                    <button
                      onClick={() => handleToggleTable(t.table_number, t.is_active)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        t.is_active
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {t.is_active ? 'Tutup Untuk Perawatan' : 'Buka Meja Kembali'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: MANAJEMEN FOTO GALERI */}
        {/* ============================================================= */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kelola Galeri Foto Website</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah foto baru, perbarui caption, atau tandai foto utama tanpa mengubah kode program.
                </p>
              </div>
            </div>

            {/* FORM UPLOAD FOTO BARU */}
            <form onSubmit={handleAddPhoto} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tambah Foto Baru
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilih File Foto atau URL</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPhotoFile}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0080FF] file:text-white hover:file:bg-blue-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Atau tempel URL gambar..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs mt-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Keterangan / Caption Foto</label>
                  <input
                    type="text"
                    placeholder="Contoh: Suasana latihan sore Meja 1 GOR SBC"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="featCheck"
                      checked={newPhotoFeatured}
                      onChange={(e) => setNewPhotoFeatured(e.target.checked)}
                      className="rounded text-[#0080FF]"
                    />
                    <label htmlFor="featCheck" className="text-xs text-slate-700">
                      Tandai sebagai Foto Utama
                    </label>
                  </div>
                </div>
              </div>

              {galleryMsg && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
                  {galleryMsg}
                </p>
              )}

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0080FF] text-white font-bold text-xs hover:bg-blue-600 cursor-pointer shadow-sm"
              >
                Simpan Foto ke Galeri
              </button>
            </form>

            {/* DAFTAR FOTO SAAT INI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              {gallery.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 bg-slate-900 overflow-hidden relative">
                      <img
                        src={photo.image_url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                      {photo.is_featured && (
                        <span className="absolute top-2 left-2 bg-[#0080FF] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                          Foto Utama
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 space-y-2">
                      {editingPhotoId === photo.id ? (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-700 block">Edit Caption Foto:</label>
                          <textarea
                            rows={2}
                            value={editingCaptionText}
                            onChange={(e) => setEditingCaptionText(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#0080FF] text-xs outline-none focus:ring-1 focus:ring-[#0080FF]"
                            placeholder="Tulis caption foto..."
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveCaption(photo.id)}
                              className="px-3 py-1 rounded-md bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditCaption}
                              className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 leading-snug">
                              {photo.caption}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleStartEditCaption(photo)}
                              className="p-1 rounded text-slate-500 hover:text-[#0080FF] hover:bg-blue-50 cursor-pointer shrink-0"
                              title="Edit Caption Foto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Urutan: {photo.display_order}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => handleSetFeaturedPhoto(photo.id, photo.is_featured)}
                      className="text-[11px] font-semibold text-[#0080FF] hover:underline cursor-pointer"
                    >
                      {photo.is_featured ? 'Hapus Foto Utama' : 'Jadikan Utama'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditCaption(photo)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-[#0080FF] cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Caption</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 6: PENGGUNA TERDAFTAR */}
        {/* ============================================================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daftar Pengguna Terdaftar</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {users.length} pengguna dengan nomor telepon Indonesia (+62).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-3 px-3">Nama Lengkap</th>
                    <th className="py-3 px-3">Nomor Telepon</th>
                    <th className="py-3 px-3">Peran (Role)</th>
                    <th className="py-3 px-3">Jumlah Booking</th>
                    <th className="py-3 px-3">Total Belanja</th>
                    <th className="py-3 px-3">Terdaftar Sejak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const userBookings = bookings.filter((b) => b.user_id === u.id);
                    const userSpent = userBookings
                      .filter((b) => b.payment_status === 'paid')
                      .reduce((s, b) => s + b.total_price, 0);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{u.full_name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{u.phone}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrator' : 'Pelanggan'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold">{userBookings.length}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0080FF]">
                          {formatRupiah(userSpent)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {u.created_at ? u.created_at.split('T')[0] : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 7: PENGATURAN GOR SBC */}
        {/* ============================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Informasi & Tarif GOR SBC</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perubahan pada data rekening dan tarif akan langsung berlaku pada sistem pemesanan.
              </p>
            </div>

            {settingsSavedMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
                {settingsSavedMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* REKENING TRANSFER BCA */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#0080FF]" />
                  <span>Rekening Transfer BCA Resmi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nomor Rekening BCA</label>
                    <input
                      type="text"
                      value={settingsForm.bca_account_number}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, bca_account_number: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={settingsForm.bca_account_holder}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, bca_account_holder: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* TARIF HARGA */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#0080FF]" />
                  <span>Tarif Penyewaan Meja</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Harga Reguler Per Jam / Meja (IDR)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.price_regular_per_hour}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          price_regular_per_hour: parseInt(e.target.value, 10) || 50000,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Harga Tournament Booking Flat (IDR)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.price_tournament}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          price_tournament: parseInt(e.target.value, 10) || 1500000,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-[#0080FF]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* INFORMASI ALAMAT & KONTAK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Usaha / GOR</label>
                  <input
                    type="text"
                    value={settingsForm.gor_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gor_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Alamat Lengkap GOR SBC</label>
                  <textarea
                    rows={2}
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 8: LAPORAN & EKSPOR CSV */}
        {/* ============================================================= */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Laporan Keuangan & Pemesanan GOR SBC
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekap pendapatan pemesanan umum dan turnamen serta ekspor spreadsheet CSV.
                </p>
              </div>

              <button
                onClick={exportCSV}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Laporan CSV</span>
              </button>
            </div>

            {/* FILTER PERIODE */}
            <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Filter Periode:</span>
              <button
                onClick={() => setReportPeriod('all')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                  reportPeriod === 'all'
                    ? 'bg-[#0080FF] text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Seluruh Waktu
              </button>
              <button
                onClick={() => setReportPeriod('monthly')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                  reportPeriod === 'monthly'
                    ? 'bg-[#0080FF] text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setReportPeriod('yearly')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                  reportPeriod === 'yearly'
                    ? 'bg-[#0080FF] text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Tahunan
              </button>

              {reportPeriod === 'monthly' && (
                <div className="flex items-center gap-2">
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="px-2 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(
                      (m) => (
                        <option key={m} value={m}>
                          Bulan {m}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {(reportPeriod === 'monthly' || reportPeriod === 'yearly') && (
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              )}
            </div>

            {/* REKAP KARTU PENDAPATAN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Pendapatan Booking Umum
                </span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {formatRupiah(reportRegularRevenue)}
                </p>
                <p className="text-[10px] text-slate-400">Tarif per jam terverifikasi</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Pendapatan Tournament
                </span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {formatRupiah(reportTournamentRevenue)}
                </p>
                <p className="text-[10px] text-slate-400">Paket kompetisi flat 2 meja</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-[11px] font-bold text-[#0080FF] uppercase">
                  Total Terverifikasi (Lunas)
                </span>
                <p className="text-xl font-black text-[#0080FF] font-mono">
                  {formatRupiah(reportRevenueTotal)}
                </p>
                <p className="text-[10px] text-blue-700">Total pemasukan bersih</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 9: DATABASE & SUPABASE POSTGRESQL TOOLS */}
        {/* ============================================================= */}
        {activeTab === 'database' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Integrasi & Migrasi Database Supabase (PostgreSQL)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Skrip DDL tabel, Row Level Security (RLS), dan fungsi RPC pencegah double booking.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`-- Salin dari supabase/schema.sql`);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 overflow-x-auto">
              <p className="text-emerald-400 font-bold">
                -- File migrasi lengkap tersedia di: /supabase/schema.sql
              </p>
              <p className="text-slate-400">
                Tabel: profiles, user_roles, tables, bookings, booking_tables, payments, gallery_photos, settings
              </p>
              <p className="text-slate-400">
                Fungsi Atomik: public.create_booking_atomic(...) dengan Transaction Advisory Lock
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
              <p className="font-bold">Panduan Menjalankan di Supabase Console:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>Buka dashboard proyek Supabase Anda di https://supabase.com.</li>
                <li>Masuk ke menu <strong>SQL Editor</strong> di sidebar sebelah kiri.</li>
                <li>Buat Query baru, tempel isi file <code>supabase/schema.sql</code>, lalu klik <strong>Run</strong>.</li>
                <li>Tabel, kebijakan RLS, relasi foreign key, dan fungsi atomik akan dibuat secara otomatis.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PROOF PREVIEW */}
      {selectedProofBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProofBooking(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bukti Transfer: {selectedProofBooking.booking_code}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProofBooking.user_name} ({selectedProofBooking.user_phone}) · {formatRupiah(selectedProofBooking.total_price)}
                </p>
              </div>
              <button
                onClick={() => setSelectedProofBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedProofBooking.payment_proof_url ? (
              <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center max-h-[60vh]">
                <img
                  src={selectedProofBooking.payment_proof_url}
                  alt="Bukti Transfer Lengkap"
                  className="max-h-[60vh] object-contain"
                />
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 py-10">
                Bukti transfer belum diunggah oleh pelanggan.
              </p>
            )}

            {selectedProofBooking.booking_status === 'awaiting_verification' && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleApprovePayment(selectedProofBooking.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui Pembayaran</span>
                </button>
                <button
                  onClick={() => handleOpenReject(selectedProofBooking)}
                  className="px-4 py-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Tolak Pembayaran</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL INPUT REJECTION REASON */}
      {showRejectModal && selectedProofBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Tolak Pembayaran: {selectedProofBooking.booking_code}
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Alasan Penolakan (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Nominal transfer kurang, foto struk blur / tidak terbaca, mutasi belum masuk ke rekening BCA."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
