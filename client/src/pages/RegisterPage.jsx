import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Disc3, UserPlus, AlertCircle, Sparkles, Check } from 'lucide-react';

const GENRE_OPTIONS = [
  'Melodic Techno',
  'Deep House',
  'Tech House',
  'Progressive House',
  'Lo-Fi Chill',
  'Hip-Hop Party',
  'Synthwave',
  'Afro House',
  'Pop Anthems'
];

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('listener');
  const [selectedGenres, setSelectedGenres] = useState(['Deep House', 'Melodic Techno']);
  const [minBpm, setMinBpm] = useState(120);
  const [maxBpm, setMaxBpm] = useState(130);
  const [energy, setEnergy] = useState(0.8);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? (prev.length > 1 ? prev.filter(g => g !== genre) : prev)
        : [...prev, genre]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({
        displayName,
        email,
        password,
        role,
        musicPreferences: {
          favoriteGenres: selectedGenres,
          preferredBpmRange: { min: minBpm, max: maxBpm },
          preferredCamelotKeys: ['8A', '9A', '8B'],
          preferredEnergy: energy,
          preferredValence: 0.65
        }
      });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-0.5 shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-4">
            <div className="w-full h-full bg-[#0d0d14] rounded-[14px] flex items-center justify-center">
              <Disc3 className="w-7 h-7 text-cyan-400 animate-[spin_8s_linear_infinite]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            Create Your DJ Profile
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Configure your music identity for personalized AI recommendations
          </p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="DJ Nexus"
                  className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="listener">Listener</option>
                  <option value="co-dj">Co-DJ</option>
                  <option value="host">Lounge Host</option>
                </select>
              </div>
            </div>

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
                className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Music Preference Onboarding */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Select Your Favorite Genres
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred BPM Range & Energy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target Tempo: {minBpm} - {maxBpm} BPM
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="80"
                    max="160"
                    value={minBpm}
                    onChange={(e) => setMinBpm(Math.min(Number(e.target.value), maxBpm - 5))}
                    className="w-full accent-cyan-400"
                  />
                  <input
                    type="range"
                    min="80"
                    max="160"
                    value={maxBpm}
                    onChange={(e) => setMaxBpm(Math.max(Number(e.target.value), minBpm + 5))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Energy Level: {(energy * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
