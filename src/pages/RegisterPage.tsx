import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { registerUser } from '../services/storage';
import { isValidIndonesianPhone, normalizeIndonesianPhone } from '../utils/phoneNormalizer';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectPath = searchParams.get('redirect') || '/';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!isValidIndonesianPhone(phone)) {
      setErrorMessage(
        'Nomor telepon tidak valid. Masukkan nomor HP Indonesia yang aktif (misal: 081234567890).'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter demi keamanan akun.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    const res = registerUser({
      full_name: fullName,
      phone,
      password,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Pendaftaran gagal.');
      return;
    }

    // Success -> Redirect to intended destination
    navigate(redirectPath);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="w-12 h-12 rounded-xl bg-[#0080FF] text-white font-black text-xl flex items-center justify-center mx-auto shadow-sm">
              SBC
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daftar Akun GOR SBC
          </h1>
          <p className="text-xs text-slate-500">
            Daftarkan nomor telepon Anda untuk kemudahan memesan meja pingpong secara online.
          </p>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* REGISTRATION FORM (ONLY 4 REQUIRED FIELDS) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. NAMA LENGKAP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">1. Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0080FF] focus:ring-1 focus:ring-[#0080FF] outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* 2. NOMOR TELEPON */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">2. Nomor Telepon (WhatsApp)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0080FF] focus:ring-1 focus:ring-[#0080FF] outline-none text-sm font-mono font-medium"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Format otomatis disesuaikan ke standar +62.
            </p>
          </div>

          {/* 3. KATA SANDI */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">3. Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#0080FF] focus:ring-1 focus:ring-[#0080FF] outline-none text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 4. KONFIRMASI KATA SANDI */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">4. Konfirmasi Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ketik ulang kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0080FF] focus:ring-1 focus:ring-[#0080FF] outline-none text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0080FF] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* LOGIN LINK */}
        <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
          Sudah memiliki akun?{' '}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="font-bold text-[#0080FF] hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
};
