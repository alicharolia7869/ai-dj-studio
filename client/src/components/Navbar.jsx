import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import {
  Radio,
  Disc3,
  Compass,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  User,
  Settings,
  PlusCircle,
  Menu,
  X,
  History
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#0d0d14] rounded-[10px] flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-cyan-400 animate-[spin_6s_linear_infinite]" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent font-display">
                AI DJ STUDIO
              </span>
              <span className="block text-[9px] font-mono tracking-widest text-violet-400 uppercase -mt-1">
                Real-Time Harmonic Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/discover"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/discover')
                  ? 'bg-violet-500/20 text-cyan-300 border border-violet-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/dashboard')
                      ? 'bg-violet-500/20 text-cyan-300 border border-violet-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/history"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/history')
                      ? 'bg-violet-500/20 text-cyan-300 border border-violet-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/tracks"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/admin/tracks')
                        ? 'bg-violet-500/20 text-cyan-300 border border-violet-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Admin Catalog</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/lounge/create"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch Lounge</span>
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-white/5 transition-colors border border-white/10"
                >
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.displayName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/50"
                  />
                  <span className="text-xs font-semibold text-slate-200 pr-1">{user?.displayName?.split(' ')[0]}</span>
                </button>

                {profileDropdownOpen && (
                  <div
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Role: {user?.role}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profile & Vibe</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3.5 py-2 rounded-xl transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d0d14] border-b border-white/10 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/discover"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Discover Catalog
          </Link>
          <Link
            to="/lounge/create"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-cyan-300 bg-cyan-500/10"
          >
            + Launch Lounge
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Listening History
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Profile & Preferences
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-center py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm"
              >
                Register Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
