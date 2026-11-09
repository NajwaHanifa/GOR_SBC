import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Maximize2,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import {
  getGalleryPhotos,
  getSettings,
  getCurrentSession,
  updateGalleryPhoto,
  subscribeToStore,
} from '../services/storage';
import { GalleryPhoto } from '../types';

export const Home: React.FC = () => {
  const [settings, setSettings] = useState(getSettings());
  const [gallery, setGallery] = useState<GalleryPhoto[]>(getGalleryPhotos());
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [session, setSession] = useState(getCurrentSession());

  // State for admin editing caption
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState('');

  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setSettings(getSettings());
      setGallery(getGalleryPhotos());
      setSession(getCurrentSession());
    });
    return unsub;
  }, []);

  const isAdmin = session?.user?.role === 'admin';

  const handleStartEditCaption = (photo: GalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPhotoId(photo.id);
    setEditingCaption(photo.caption);
  };

  const handleSaveCaption = (photoId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingCaption.trim()) return;
    updateGalleryPhoto(photoId, { caption: editingCaption.trim() });
    setEditingPhotoId(null);
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, caption: editingCaption.trim() });
    }
  };

  return (
    <div className="min-h-screen">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-white/60 backdrop-blur-xs border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* LEFT SIDE (60% ON DESKTOP & TABLET): TITLE, ADDRESS, 2 BUTTONS ONLY */}
            <div className="w-full md:w-[58%] lg:w-[60%] space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.1] font-display uppercase tracking-tight">
                SEWA MEJA PINGPONG - JAKARTA SELATAN
              </h1>

              <div className="flex items-start gap-2.5 text-slate-700 font-medium text-sm sm:text-base leading-relaxed">
                <MapPin className="w-5 h-5 text-[#0080FF] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </div>

              {/* STRICTLY TWO BUTTONS: 'Booking Meja' and 'Galeri' */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/booking"
                  className="px-7 py-3.5 rounded-xl bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Booking Meja
                </Link>

                <a
                  href="#galeri"
                  className="px-7 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white/90 text-slate-800 font-bold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Galeri
                </a>
              </div>
            </div>

            {/* RIGHT SIDE (40% ON DESKTOP & TABLET): SEGI EMPAT 1:1 ASPECT RATIO */}
            <div className="w-full md:w-[42%] lg:w-[40%] flex justify-center md:justify-end">
              <div className="w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-white/90 bg-slate-900">
                <img
                  src="/assets/aistudio/Meja_1_9208dd16.jpeg"
                  alt="Arena Meja 1 GOR SBC"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. SECTION TENTANG */}
      {/* ------------------------------------------------------------- */}
      <section
        className="relative py-16 sm:py-24 bg-cover bg-center text-white"
        style={{
          backgroundImage: "url('/assets/aistudio/Banner_GOR_06089c23.jpeg')",
        }}
      >
        {/* Darkened overlay on the left side to ensure perfect text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 md:via-slate-950/80 to-slate-950/40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase tracking-tight text-white">
              TENTANG GOR SBC
            </h2>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
              GOR SBC adalah gelanggang olahraga tenis meja di Cipedak, Jagakarsa, Jakarta Selatan yang menyediakan dua meja permainan berkualitas standar turnamen dengan pencahayaan optimal, suasana yang nyaman untuk latihan, sparring komunitas, serta sewa eksklusif untuk penyelenggaraan kejuaraan.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. SECTION FASILITAS */}
      {/* ------------------------------------------------------------- */}
      <section id="fasilitas" className="py-10 sm:py-16 md:py-20 bg-white/60 backdrop-blur-xs border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2 mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl text-slate-900 font-display uppercase tracking-tight">
              FASILITAS YANG ADA
            </h2>
            <p className="text-slate-600 text-xs sm:text-base font-medium">
              Dua unit meja tenis meja standar turnamen dengan pantulan bola presisi dan area bermain yang nyaman.
            </p>
          </div>

          {/* TWO CARDS PER ROW IN MOBILE & DESKTOP */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8">
            {/* MEJA 1 */}
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-900">
                  <img
                    src="/assets/aistudio/Meja_1_9208dd16.jpeg"
                    alt="Meja 1 GOR SBC"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#0080FF] text-white text-[10px] sm:text-xs font-bold font-display px-2 sm:px-3 py-1 sm:py-1.5 rounded shadow">
                    MEJA 1
                  </div>
                </div>

                <div className="p-3 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-xl md:text-2xl font-display text-slate-900">
                    MEJA 1
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 font-medium leading-tight">
                    Di sebelah kiri dekat pintu masuk & papan skor
                  </p>

                  <div className="p-2 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 space-y-1 sm:space-y-1.5 mt-1 sm:mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-sm gap-0.5">
                      <span className="text-slate-500 font-medium text-[10px] sm:text-xs">Per Jam:</span>
                      <span className="font-bold text-slate-900 font-mono text-xs sm:text-base">50K / jam</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-sm gap-0.5">
                      <span className="text-slate-500 font-medium text-[10px] sm:text-xs">Turnamen:</span>
                      <span className="font-bold text-[#0080FF] font-mono text-xs sm:text-base">1.500K / hari</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-5 md:p-6 pt-0 flex flex-col gap-1.5 sm:gap-2">
                <Link
                  to="/booking?table=1&type=regular"
                  className="w-full text-center py-2 sm:py-2.5 px-2 rounded-lg bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-[11px] sm:text-xs shadow-xs transition-colors"
                >
                  Booking untuk perjam
                </Link>
                <Link
                  to="/booking?type=tournament"
                  className="w-full text-center py-2 sm:py-2.5 px-2 rounded-lg border border-[#0080FF] text-[#0080FF] hover:bg-blue-50 font-bold text-[11px] sm:text-xs transition-colors"
                >
                  Booking untuk turnamen
                </Link>
              </div>
            </div>

            {/* MEJA 2 */}
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-900">
                  <img
                    src="/assets/aistudio/Meja_2_aa5e9b05.jpeg"
                    alt="Meja 2 GOR SBC"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#0080FF] text-white text-[10px] sm:text-xs font-bold font-display px-2 sm:px-3 py-1 sm:py-1.5 rounded shadow">
                    MEJA 2
                  </div>
                </div>

                <div className="p-3 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-xl md:text-2xl font-display text-slate-900">
                    MEJA 2
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 font-medium leading-tight">
                    Di sebelah dalam area sparring & latihan intensif
                  </p>

                  <div className="p-2 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 space-y-1 sm:space-y-1.5 mt-1 sm:mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-sm gap-0.5">
                      <span className="text-slate-500 font-medium text-[10px] sm:text-xs">Per Jam:</span>
                      <span className="font-bold text-slate-900 font-mono text-xs sm:text-base">50K / jam</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-sm gap-0.5">
                      <span className="text-slate-500 font-medium text-[10px] sm:text-xs">Turnamen:</span>
                      <span className="font-bold text-[#0080FF] font-mono text-xs sm:text-base">1.500K / hari</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-5 md:p-6 pt-0 flex flex-col gap-1.5 sm:gap-2">
                <Link
                  to="/booking?table=2&type=regular"
                  className="w-full text-center py-2 sm:py-2.5 px-2 rounded-lg bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-[11px] sm:text-xs shadow-xs transition-colors"
                >
                  Booking untuk perjam
                </Link>
                <Link
                  to="/booking?type=tournament"
                  className="w-full text-center py-2 sm:py-2.5 px-2 rounded-lg border border-[#0080FF] text-[#0080FF] hover:bg-blue-50 font-bold text-[11px] sm:text-xs transition-colors"
                >
                  Booking untuk turnamen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. SECTION JADWAL OPERASIONAL */}
      {/* ------------------------------------------------------------- */}
      <section className="py-10 sm:py-16 md:py-20 bg-white/70 backdrop-blur-xs border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl text-slate-900 font-display uppercase tracking-tight">
              Jadwal Operasional
            </h2>
          </div>

          {/* TWO CARDS PER ROW IN MOBILE & DESKTOP */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8">
            {/* CARD 1: JADWAL HARIAN */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3.5 sm:p-6 md:p-8 shadow-xs space-y-3 sm:space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-slate-900 font-display leading-tight">
                  Jadwal Operasional Harian
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                  Penyewaan reguler per jam:
                </p>

                <div className="space-y-1.5 sm:space-y-3 pt-2">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <span className="font-semibold text-slate-800 text-[10px] sm:text-sm">Senin, Kamis, Jumat</span>
                    <span className="font-bold text-[#0080FF] font-mono text-[10px] sm:text-sm">08.00 - 16.00</span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <span className="font-semibold text-slate-800 text-[10px] sm:text-sm">Selasa, Rabu</span>
                    <span className="font-bold text-[#0080FF] font-mono text-[10px] sm:text-sm">12.00 - 16.00</span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <span className="font-semibold text-slate-800 text-[10px] sm:text-sm">Sabtu & Minggu</span>
                    <span className="font-bold text-[#0080FF] font-mono text-[10px] sm:text-sm">12.00 - 16.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: JADWAL KHUSUS TURNAMEN */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-blue-200 p-3.5 sm:p-6 md:p-8 shadow-xs space-y-3 sm:space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-slate-900 font-display leading-tight">
                  Jadwal Khusus Turnamen
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                  Sewa eksklusif 2 meja kompetisi:
                </p>

                <div className="space-y-1.5 sm:space-y-3 pt-2">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <span className="font-semibold text-slate-800 text-[10px] sm:text-sm">Setiap Hari (Senin - Minggu)</span>
                    <span className="font-bold text-[#0080FF] font-mono text-[10px] sm:text-sm">08.00 - 20.00</span>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 text-[10px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                    Otomatis menutup kedua meja penuh untuk publik selama 1 hari pelaksanaan turnamen.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. SECTION GALERI */}
      {/* ------------------------------------------------------------- */}
      <section id="galeri" className="py-14 sm:py-20 bg-sky-50/60 backdrop-blur-xs border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl text-slate-900 font-display uppercase tracking-tight">
              Galeri GOR SBC
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Dokumentasi fasilitas dan kegiatan tenis meja di GOR SBC Cipedak.
            </p>
          </div>

          {/* DESKTOP & TABLET: 3 CARDS PER ROW | MOBILE: 2 CARDS PER ROW */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {gallery.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer shadow-xs hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>

                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-white">
                  <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                    {photo.caption}
                  </p>
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  {isAdmin && (
                    <button
                      onClick={(e) => handleStartEditCaption(photo, e)}
                      title="Edit Caption"
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#0080FF] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADMIN EDIT CAPTION MODAL */}
      {editingPhotoId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingPhotoId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Edit Caption Foto</h3>
              <button
                onClick={() => setEditingPhotoId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveCaption(editingPhotoId, e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Caption / Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={editingCaption}
                  onChange={(e) => setEditingCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#0080FF]"
                  placeholder="Masukkan caption foto..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPhotoId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0080FF] hover:bg-blue-600 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Simpan Caption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedPhoto && !editingPhotoId && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.caption}
              className="w-full max-h-[75vh] object-contain bg-black"
              referrerPolicy="no-referrer"
            />
            <div className="p-4 bg-slate-950 text-white border-t border-slate-800 flex items-center justify-between">
              <p className="text-sm font-semibold">{selectedPhoto.caption}</p>
              {isAdmin && (
                <button
                  onClick={(e) => handleStartEditCaption(selectedPhoto, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0080FF] text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Caption
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SECTION LOKASI */}
      {/* ------------------------------------------------------------- */}
      <section id="lokasi" className="py-14 sm:py-20 bg-white/60 backdrop-blur-xs border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* LEFT: ADDRESS & DIRECTIONS */}
            <div className="lg:col-span-5 space-y-5">
              <h2 className="text-3xl font-display text-slate-900 uppercase tracking-tight">
                Lokasi GOR SBC
              </h2>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm space-y-2 shadow-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#0080FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Alamat Lengkap:</p>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {settings.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0080FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Buka di Google Maps</span>
                </a>
              </div>
            </div>

            {/* RIGHT: MAP EMBED */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md h-[360px] bg-slate-100">
                <iframe
                  title="Peta Lokasi GOR SBC Cipedak Jagakarsa"
                  src="https://maps.google.com/maps?q=Jl.+Brigif+No.55,+RT.1/RW.1,+Cipedak,+Kec.+Jagakarsa,+Kota+Jakarta+Selatan,+DKI+Jakarta+12630&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. CALL TO ACTION BAWAH */}
      {/* ------------------------------------------------------------- */}
      <section className="py-14 bg-[#0080FF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">
            Siap Bermain Tenis Meja di GOR SBC?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Pesan meja sekarang secara online dan nikmati kemudahan sparring di GOR SBC.
          </p>
          <div className="pt-2">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#0080FF] hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4" />
              <span>Mulai Pemesanan Meja</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
