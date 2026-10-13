import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Disc3, LogIn, AlertCircle, Key, ShieldAlert, Radio, Headphones, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to login. Please verify your credentials.');
    }
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-0.5 shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-4">
            <div className="w-full h-full bg-[#0d0d14] rounded-[14px] flex items-center justify-center">
              <Disc3 className="w-7 h-7 text-cyan-400 animate-[spin_8s_linear_infinite]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            Welcome to AI DJ Studio
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Sign in to access collaborative lounges and harmonic AI mixing
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* DEMO ACCOUNTS QUICK-FILL */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">
              One-Click Demo Roles (For Review / Testing):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('host@aidjstudio.io', 'HostNexus123!')}
                className="flex items-center gap-2 p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/20 text-violet-300 text-left transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold block truncate">DJ Maya</span>
                  <span className="text-[10px] text-slate-400">Host</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('codj@aidjstudio.io', 'CoDjPulse123!')}
                className="flex items-center gap-2 p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/20 text-violet-300 text-left transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold block truncate">DJ Liam</span>
                  <span className="text-[10px] text-slate-400">Co-DJ</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('listener@aidjstudio.io', 'ListenerVibe123!')}
                className="flex items-center gap-2 p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/20 text-violet-300 text-left transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold block truncate">Alex Riva</span>
                  <span className="text-[10px] text-slate-400">Listener</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@aidjstudio.io', 'StudioAdmin123!')}
                className="flex items-center gap-2 p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/20 text-violet-300 text-left transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold block truncate">Admin</span>
                  <span className="text-[10px] text-slate-400">Catalog Admin</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
