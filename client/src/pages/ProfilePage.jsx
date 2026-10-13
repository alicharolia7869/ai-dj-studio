import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { User, Sparkles, Sliders, Check, Heart, Shield, Save } from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';

const ALL_GENRES = [
  'Melodic Techno', 'Deep House', 'Tech House', 'Progressive House',
  'Lo-Fi Chill', 'Hip-Hop Party', 'Synthwave', 'Afro House', 'Pop Anthems'
];

export default function ProfilePage() {
  const { user, updatePreferences, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const prefs = user?.musicPreferences || {};
  const [genres, setGenres] = useState(prefs.favoriteGenres || ['Deep House', 'Melodic Techno']);
  const [minBpm, setMinBpm] = useState(prefs.preferredBpmRange?.min || 120);
  const [maxBpm, setMaxBpm] = useState(prefs.preferredBpmRange?.max || 130);
  const [energy, setEnergy] = useState(prefs.preferredEnergy ?? 0.8);
  const [savedMsg, setSavedMsg] = useState('');

  const toggleGenre = (g) => {
    setGenres(prev =>
      prev.includes(g)
        ? (prev.length > 1 ? prev.filter(x => x !== g) : prev)
        : [...prev, g]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSavedMsg('');
    try {
      await updateProfile({ displayName, avatar });
      await updatePreferences({
        favoriteGenres: genres,
        preferredBpmRange: { min: minBpm, max: maxBpm },
        preferredEnergy: energy
      });
      setSavedMsg('Profile and acoustic preferences updated!');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      setSavedMsg('Failed to update preferences: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono font-bold mb-2">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span>User Profile & Vibe Calibration</span>
        </div>
        <h1 className="text-3xl font-black text-white font-display">Acoustic Identity</h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize how the AI DJ matches harmonic keys and sets room energy curves for your taste.
        </p>
      </div>

      <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar and basic info */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/10">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-violet-500/50 shadow-xl"
            />
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Account Role:</span>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              {user?.role}
            </span>
          </div>

          {/* Genre Preferences */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">Favorite Genres</label>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => {
                const selected = genres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-cyan-500 text-black font-semibold shadow-md'
                        : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BPM range & Energy sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Preferred BPM Range: {minBpm} - {maxBpm} BPM
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
                Target Energy: {(energy * 100).toFixed(0)}%
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

          {savedMsg && (
            <p className="text-xs font-mono text-emerald-400 text-center">{savedMsg}</p>
          )}

          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </form>
      </div>
    </div>
  );
}
