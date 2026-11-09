import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Shield,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { getCurrentSession, logoutUser, subscribeToStore } from '../services/storage';

export const Navbar: React.FC = () => {
  const [session, setSession] = useState(getCurrentSession());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setSession(getCurrentSession());
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/55 backdrop-blur-md border-b border-white/60 shadow-[0_4px_30px_rgba(0,128,255,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* LOGO: ONLY 'SBC' IN BRAND BLUE */}
          <Link
            to="/"
            className="flex items-center tracking-wider font-display text-2xl sm:text-3xl text-[#0080FF] hover:text-blue-600 transition-colors"
          >
            SBC
          </Link>

          {/* USER PROFILE & AUTHENTICATION ONLY */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-slate-800 text-sm font-semibold transition-all cursor-pointer shadow-xs backdrop-blur-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0080FF] text-white flex items-center justify-center text-xs font-bold font-display">
                    {session.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] sm:max-w-[160px] truncate text-slate-800">
                    {session.user.full_name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 text-xs">
                      <p className="font-semibold text-slate-900">{session.user.full_name}</p>
                      <p className="text-slate-500 font-mono mt-0.5">{session.user.phone}</p>
                      {session.user.role === 'admin' && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Administrator
                        </span>
                      )}
                    </div>

                    {session.user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0080FF]"
                      >
                        <Shield className="w-4 h-4 text-[#0080FF]" />
                        Dashboard Admin
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0080FF]"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Profil & Riwayat Booking
                    </Link>

                    <Link
                      to="/booking"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0080FF]"
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Pesan Meja
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left cursor-pointer border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-[#0080FF] hover:bg-white/50 rounded-lg transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/booking"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#0080FF] hover:bg-blue-600 rounded-lg shadow-sm transition-all active:scale-[0.98]"
                >
                  Booking Meja
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
