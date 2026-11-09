import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Trophy,
  ArrowRight,
  ShieldAlert,
  User,
  LogIn,
} from 'lucide-react';
import {
  createBooking,
  getAllBookings,
  getCurrentSession,
  getSettings,
  getTables,
  subscribeToStore,
} from '../services/storage';
import {
  calculateEndTime,
  calculateTotalPrice,
  checkBookingConflict,
  doIntervalsOverlap,
  getOperatingHoursForDate,
  isDateInPast,
  minutesToTime,
  timeToMinutes,
  validateBookingTime,
} from '../utils/scheduleValidator';
import { formatDateIndo, formatRupiah } from '../utils/formatters';
import { Booking, BookingType } from '../types';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(getCurrentSession());
  const [settings, setSettings] = useState(getSettings());
  const [tables] = useState(getTables());
  const [allBookings, setAllBookings] = useState<Booking[]>(getAllBookings());

  // Form State
  const initialType: BookingType = searchParams.get('type') === 'tournament' ? 'tournament' : 'regular';
  const [bookingType, setBookingType] = useState<BookingType>(initialType);

  // Default to today
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [bookingDate, setBookingDate] = useState<string>(todayStr);

  // Table selection: [1], [2], or [1, 2]
  const initialTableParam = searchParams.get('table');
  const [selectedTables, setSelectedTables] = useState<number[]>(
    initialTableParam === '2' ? [2] : initialTableParam === 'both' ? [1, 2] : [1]
  );

  const [startTime, setStartTime] = useState<string>('13:00');
  const [durationHours, setDurationHours] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setSession(getCurrentSession());
      setSettings(getSettings());
      setAllBookings(getAllBookings());
    });
    return unsub;
  }, []);

  // Sync tournament table lock
  useEffect(() => {
    if (bookingType === 'tournament') {
      setSelectedTables([1, 2]);
      if (startTime < '08:00' || startTime > '19:00') {
        setStartTime('08:00');
      }
    }
  }, [bookingType]);

  // Operating hours for chosen date
  const operatingInfo = useMemo(() => {
    return getOperatingHoursForDate(bookingDate, settings);
  }, [bookingDate, settings]);

  // Calculate End Time
  const calculatedEndTime = useMemo(() => {
    return calculateEndTime(startTime, durationHours);
  }, [startTime, durationHours]);

  // Calculate Price
  const calculatedTotalPrice = useMemo(() => {
    return calculateTotalPrice(bookingType, durationHours, selectedTables.length, settings);
  }, [bookingType, durationHours, selectedTables.length, settings]);

  // Available start time options based on operating hours
  const availableStartTimes = useMemo(() => {
    const times: string[] = [];
    if (bookingType === 'tournament') {
      // 08:00 to 19:00
      for (let h = 8; h <= 19; h++) {
        times.push(`${String(h).padStart(2, '0')}:00`);
      }
    } else {
      if (operatingInfo && operatingInfo.isOpen) {
        const startH = parseInt(operatingInfo.open.split(':')[0], 10);
        const closeH = parseInt(operatingInfo.close.split(':')[0], 10);
        for (let h = startH; h < closeH; h++) {
          times.push(`${String(h).padStart(2, '0')}:00`);
        }
      }
    }
    return times;
  }, [bookingType, operatingInfo]);

  // Max duration available from the chosen start time
  const maxAllowedDuration = useMemo(() => {
    if (bookingType === 'tournament') {
      const startMin = timeToMinutes(startTime);
      const closeMin = timeToMinutes('20:00');
      const maxH = Math.floor((closeMin - startMin) / 60);
      return Math.max(1, Math.min(12, maxH));
    } else {
      if (!operatingInfo || !operatingInfo.isOpen) return 1;
      const startMin = timeToMinutes(startTime);
      const closeMin = timeToMinutes(operatingInfo.close);
      const maxH = Math.floor((closeMin - startMin) / 60);
      return Math.max(1, maxH);
    }
  }, [bookingType, startTime, operatingInfo]);

  // Ensure duration does not exceed maxAllowedDuration
  useEffect(() => {
    if (durationHours > maxAllowedDuration) {
      setDurationHours(maxAllowedDuration);
    }
  }, [maxAllowedDuration, durationHours]);

  // Filter bookings for the selected date to display interactive timeline
  const dayBookings = useMemo(() => {
    return allBookings.filter(
      (b) =>
        b.booking_date === bookingDate &&
        ['awaiting_payment', 'awaiting_verification', 'confirmed'].includes(b.booking_status)
    );
  }, [allBookings, bookingDate]);

  // Live conflict check
  const liveConflict = useMemo(() => {
    if (!startTime || !calculatedEndTime || selectedTables.length === 0) {
      return { hasConflict: false };
    }
    return checkBookingConflict(allBookings, {
      booking_date: bookingDate,
      start_time: startTime,
      end_time: calculatedEndTime,
      tables: bookingType === 'tournament' ? [1, 2] : selectedTables,
    });
  }, [allBookings, bookingDate, startTime, calculatedEndTime, selectedTables, bookingType]);

  const handleTableToggle = (tableNum: number) => {
    if (bookingType === 'tournament') return; // locked to both

    if (selectedTables.includes(tableNum)) {
      if (selectedTables.length === 1) {
        // Can't deselect all
        return;
      }
      setSelectedTables(selectedTables.filter((t) => t !== tableNum));
    } else {
      setSelectedTables([...selectedTables, tableNum].sort());
    }
  };

  const handleSelectBothTables = () => {
    setSelectedTables([1, 2]);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!session) {
      navigate('/login?redirect=/booking');
      return;
    }

    if (isDateInPast(bookingDate)) {
      setErrorMessage('Tanggal pemesanan tidak boleh tanggal yang sudah lewat.');
      return;
    }

    const timeValidation = validateBookingTime(
      bookingType,
      bookingDate,
      startTime,
      calculatedEndTime,
      settings
    );

    if (!timeValidation.isValid) {
      setErrorMessage(timeValidation.error || 'Jadwal yang dipilih tidak valid.');
      return;
    }

    if (liveConflict.hasConflict) {
      setErrorMessage(liveConflict.reason || 'Jadwal bertabrakan dengan pemesanan lain.');
      return;
    }

    setSubmitting(true);

    const res = createBooking({
      userId: session.user.id,
      userName: session.user.full_name,
      userPhone: session.user.phone,
      bookingType,
      bookingDate,
      startTime,
      durationHours,
      tables: bookingType === 'tournament' ? [1, 2] : selectedTables,
      notes,
    });

    setSubmitting(false);

    if (!res.success || !res.booking) {
      setErrorMessage(res.error || 'Gagal membuat pemesanan.');
      return;
    }

    // Success! Redirect to Payment page
    navigate(`/payment/${res.booking.id}`);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER BREADCRUMB */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link to="/" className="hover:text-[#0080FF]">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-slate-800">Booking Meja</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pemesanan Meja Pingpong GOR SBC
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pilih jenis pemesanan, tanggal, meja, dan jam bermain sesuai kebutuhan Anda.
          </p>
        </div>

        {/* PROMPT NOTICE IF NOT LOGGED IN */}
        {!session && (
          <div className="mb-8 p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#0080FF] shrink-0" />
              <span>
                <strong>Perhatian:</strong> Anda dapat memilih jadwal sekarang. Namun untuk menyelesaikan pemesanan, Anda akan diminta login atau mendaftar terlebih dahulu.
              </span>
            </div>
            <Link
              to="/login?redirect=/booking"
              className="px-3.5 py-1.5 rounded-md bg-[#0080FF] text-white font-bold whitespace-nowrap hover:bg-blue-600 transition-colors"
            >
              Masuk / Daftar
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: SELECTION STEPS */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: JENIS PEMESANAN */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0080FF] flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  Jenis Pemesanan
                </h3>
                {bookingType === 'tournament' && (
                  <span className="text-xs bg-blue-50 text-[#0080FF] font-semibold px-2 py-0.5 rounded">
                    Sewa 2 Meja Seharian
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingType('regular')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    bookingType === 'regular'
                      ? 'border-[#0080FF] bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-slate-900 text-sm">Booking Reguler</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tarif per jam. Bebas pilih Meja 1, Meja 2, atau keduanya.
                  </p>
                  <p className="font-mono text-xs font-bold text-[#0080FF] mt-2">
                    Rp50.000 / jam / meja
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType('tournament')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    bookingType === 'tournament'
                      ? 'border-[#0080FF] bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm">Tournament Booking</p>
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Wajib kedua meja. Buka setiap hari, rentang jam 08.00–20.00 WIB.
                  </p>
                  <p className="font-mono text-xs font-bold text-[#0080FF] mt-2">
                    Rp1.500.000 (Flat)
                  </p>
                </button>
              </div>
            </div>

            {/* STEP 2: TANGGAL PEMESANAN */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0080FF] flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  Tanggal Bermain
                </h3>
                <span className="text-xs text-slate-500">Waktu Indonesia Barat (WIB)</span>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#0080FF] focus:ring-1 focus:ring-[#0080FF] outline-none text-sm font-medium"
                    required
                  />
                </div>

                {/* Operating hours hint */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-[#0080FF]" />
                    <span>
                      Jadwal Hari <strong>{operatingInfo?.dayName}</strong>:
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {bookingType === 'tournament'
                      ? '08.00 - 20.00 WIB (Khusus Turnamen)'
                      : `${operatingInfo?.open || '-'} - ${operatingInfo?.close || '-'} WIB`}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 3: PILIH MEJA */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0080FF] flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  Pilihan Meja Pingpong
                </h3>
                {bookingType === 'tournament' && (
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                    Turnamen wajib 2 meja
                  </span>
                )}
              </div>

              {bookingType === 'tournament' ? (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#0080FF]" />
                    Kedua Meja (Meja 1 & Meja 2) Otomatis Terpilih
                  </p>
                  <p className="text-slate-600">
                    Untuk menjamin keleluasaan peserta turnamen dan wasit, seluruh fasilitas arena GOR SBC akan dikhususkan bagi event Anda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTableToggle(1)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedTables.includes(1)
                          ? 'border-[#0080FF] bg-blue-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Meja 1</span>
                        {selectedTables.includes(1) && (
                          <CheckCircle className="w-4 h-4 text-[#0080FF]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Meja Standar Turnamen Area Pintu</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTableToggle(2)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedTables.includes(2)
                          ? 'border-[#0080FF] bg-blue-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Meja 2</span>
                        {selectedTables.includes(2) && (
                          <CheckCircle className="w-4 h-4 text-[#0080FF]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Meja Standar Turnamen Area Dalam</p>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectBothTables}
                    className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      selectedTables.length === 2
                        ? 'border-[#0080FF] bg-blue-100/60 text-[#0080FF]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Pesan Kedua Meja Sekaligus (Meja 1 + Meja 2)
                  </button>
                </div>
              )}
            </div>

            {/* STEP 4: JAM & DURASI */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0080FF] flex items-center justify-center text-xs font-black">
                  4
                </span>
                Jam Mulai & Durasi Bermain
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jam Mulai */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Jam Mulai (WIB)</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-[#0080FF] outline-none text-sm font-mono font-medium"
                  >
                    {availableStartTimes.map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Durasi Pemesanan</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-[#0080FF] outline-none text-sm font-medium"
                  >
                    {Array.from({ length: maxAllowedDuration }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {h} Jam (Selesai {calculateEndTime(startTime, h)} WIB)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Catatan Tambahan (Opsional) */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">Catatan Pemesanan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Latihan ganda, butuh bola tambahan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-[#0080FF] outline-none text-xs"
                />
              </div>
            </div>

            {/* STATUS JADWAL HARIAN INTERAKTIF */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status Ketersediaan Tanggal Ini ({formatDateIndo(bookingDate)})
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Tersedia</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Terisi</span>
                  </div>
                </div>
              </div>

              {dayBookings.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 text-center">
                  Belum ada pemesanan aktif pada tanggal ini. Seluruh jam operasional masih tersedia!
                </div>
              ) : (
                <div className="space-y-2">
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {b.start_time} - {b.end_time} WIB
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-semibold text-slate-700">
                          {b.booking_type === 'tournament'
                            ? 'Turnamen (Kedua Meja)'
                            : `Meja ${b.tables.join(' & ')}`}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Booked
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: RINGKASAN PEMESANAN & CHECKOUT */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Ringkasan Pemesanan
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Jenis Booking</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {bookingType === 'tournament' ? 'Turnamen' : 'Reguler Per Jam'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Bermain</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatDateIndo(bookingDate)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Meja yang Dipilih</span>
                  <span className="font-bold text-slate-900">
                    {bookingType === 'tournament'
                      ? 'Meja 1 & 2 (Eksklusif Turnamen)'
                      : `Meja ${selectedTables.join(' & ')}`}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Rentang Waktu</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {startTime} - {calculatedEndTime} WIB ({durationHours} Jam)
                  </span>
                </div>

                {bookingType === 'regular' && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                    <span>Rincian Tarif</span>
                    <span>
                      {selectedTables.length} Meja × {durationHours} Jam × Rp50.000
                    </span>
                  </div>
                )}
              </div>

              {/* TOTAL HARGA */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="text-xs text-slate-600 font-medium">Total Pembayaran</span>
                <p className="text-3xl font-black text-[#0080FF] font-mono">
                  {formatRupiah(calculatedTotalPrice)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Transfer lunas ke rekening Bank BCA setelah klik lanjutkan.
                </p>
              </div>

              {/* CONFLICT WARNING */}
              {liveConflict.hasConflict && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Jadwal Bertabrakan!</p>
                    <p className="mt-0.5">{liveConflict.reason}</p>
                    <p className="mt-1 text-[11px]">Silakan pilih meja atau jam lain yang tersedia.</p>
                  </div>
                </div>
              )}

              {/* ERROR MESSAGE */}
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div>
                <button
                  type="submit"
                  disabled={submitting || liveConflict.hasConflict}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    liveConflict.hasConflict
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-[#0080FF] hover:bg-blue-600 hover:shadow-lg active:scale-[0.99]'
                  }`}
                >
                  {submitting ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <span>Lanjut ke Pembayaran BCA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* GUARANTEE INFO */}
              <div className="space-y-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Jadwal Anda akan di-hold selama 30 menit untuk upload bukti bayar.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Verifikasi pembayaran resmi oleh admin GOR SBC.</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
