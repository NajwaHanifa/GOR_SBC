import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';
import { getCurrentSession, loginUser } from '../services/storage';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState('081234567890');
  const [password, setPassword] = useState('adminSBC2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    setLoading(true);
    const res = loginUser({ phone, password });
    setLoading(false);

    if (!res.success || !res.user) {
      setErrorMessage(res.error || 'Autentikasi admin gagal.');
      return;
    }

    if (res.user.role !== 'admin') {
      setErrorMessage('Akses ditolak: Akun ini tidak memiliki hak akses administrator.');
      return;
    }

    // Role is strictly admin -> Navigate to dashboard
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl space-y-6 text-slate-100">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0080FF] text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Portal Administrator GOR SBC
          </h1>
          <p className="text-xs text-slate-400">
            Khusus pengelola fasilitas untuk verifikasi pembayaran, manajemen meja, dan laporan.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nomor Telepon Admin</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 focus:border-[#0080FF] outline-none text-sm font-mono text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Kata Sandi Admin</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 focus:border-[#0080FF] outline-none text-sm text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Kredensial Default Admin:</p>
            <p className="font-mono">Nomor: 081234567890</p>
            <p className="font-mono">Sandi: adminSBC2026!</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard Admin'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-700">
          Bukan administrator?{' '}
          <Link to="/login" className="text-[#0080FF] hover:underline">
            Kembali ke Login Pengguna
          </Link>
        </div>
      </div>
    </div>
  );
};
