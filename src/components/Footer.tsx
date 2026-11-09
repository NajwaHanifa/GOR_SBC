import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, CreditCard, Shield } from 'lucide-react';
import { getSettings } from '../services/storage';

export const Footer: React.FC = () => {
  const settings = getSettings();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* COL 1: IDENTITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display tracking-tight text-white">
                SBC
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Gelanggang Olahraga Tenis Meja (PTM SBC) di Jagakarsa, Jakarta Selatan. 
              Menyediakan 2 meja standar turnamen berkualitas prima untuk latihan harian, sparring, dan kompetisi.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-400 font-medium">Buka untuk umum & turnamen</span>
            </div>
          </div>

          {/* COL 2: LOKASI & KONTAK */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Lokasi & Kontak
            </h4>
            <div className="flex items-start gap-3 text-sm text-slate-400">
              <MapPin className="w-5 h-5 text-[#0080FF] shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400 pt-2">
              <Phone className="w-4 h-4 text-[#0080FF] shrink-0" />
              <span>{settings.phone}</span>
            </div>
          </div>

          {/* COL 3: JADWAL OPERASIONAL */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Jadwal Operasional
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex justify-between py-1 border-b border-slate-800">
                <span className="font-medium text-slate-300">Senin, Kamis, Jumat</span>
                <span className="font-mono text-white">08.00 - 16.00 WIB</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-800">
                <span className="font-medium text-slate-300">Selasa, Rabu</span>
                <span className="font-mono text-white">12.00 - 16.00 WIB</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-800">
                <span className="font-medium text-slate-300">Sabtu, Minggu</span>
                <span className="font-mono text-white">12.00 - 16.00 WIB</span>
              </li>
              <li className="flex justify-between py-1 pt-1.5 text-blue-400 font-medium">
                <span>Tournament Booking</span>
                <span className="font-mono">Setiap Hari 08.00 - 20.00</span>
              </li>
            </ul>
          </div>

          {/* COL 4: PEMBAYARAN & ADMIN */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Metode Pembayaran
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CreditCard className="w-4 h-4 text-[#0080FF]" />
                <span>Transfer Bank BCA</span>
              </div>
              <p className="text-slate-400">
                A.N. <span className="font-bold text-slate-200">{settings.bca_account_holder}</span>
              </p>
              <p className="font-mono text-sm text-blue-400 tracking-wider">
                {settings.bca_account_number}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Portal Administrator</span>
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} GOR SBC (Gelanggang Olahraga SBC). Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/booking" className="hover:text-slate-300 transition-colors">
              Pemesanan Meja
            </Link>
            <Link to="/profile" className="hover:text-slate-300 transition-colors">
              Cek Status Booking
            </Link>
            <a href="#lokasi" className="hover:text-slate-300 transition-colors">
              Petunjuk Arah
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
