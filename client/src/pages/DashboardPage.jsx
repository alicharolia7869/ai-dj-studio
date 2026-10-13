import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import {
  Radio,
  PlusCircle,
  KeyRound,
  Sparkles,
  Users,
  Compass,
  Play,
  Heart,
  TrendingUp,
  Activity,
  ArrowRight,
  Disc3,
  Clock,
  Music
} from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';
import { audioEngine } from '../services/audioSynth.js';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeLounges, setActiveLounges] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [loungesResult, recsResult, histResult] = await Promise.allSettled([
          api.getLounges({ status: 'active' }),
          api.getRecommendations(),
          api.getHistory({ limit: 5 })
        ]);

        if (loungesResult.status === 'fulfilled') {
          setActiveLounges(loungesResult.value?.data?.lounges || []);
        }
        if (recsResult.status === 'fulfilled') {
          setRecommendations(recsResult.value?.data?.recommendations || []);
        }
        if (histResult.status === 'fulfilled') {
          setHistory(histResult.value?.data?.history || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!inviteCode.trim()) return;

    try {
      const res = await api.getLounge(inviteCode.trim().toUpperCase());
      if (res.data?.lounge) {
        navigate(`/lounge/${res.data.lounge._id}`);
      }
    } catch (err) {
      setJoinError('Invalid invitation code or lounge session has ended.');
    }
  };

  const handlePreviewTrack = (track) => {
    if (playingTrackId === track._id) {
      audioEngine.pause();
      setPlayingTrackId(null);
    } else {
      audioEngine.playTrack(track, 0);
      setPlayingTrackId(track._id);
    }
  };

  const preferences = user?.musicPreferences || {};
  const bpmRange = preferences.preferredBpmRange || { min: 120, max: 130 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome & Profile Header */}
      <div className="bg-gradient-to-r from-[#12121e] via-[#101018] to-[#0c0c14] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.displayName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-display">
                  Welcome back, {user?.displayName}
                </h1>
                <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your AI DJ workspace is tuned to {preferences.favoriteGenres?.join(', ') || 'Electronic'} at {bpmRange.min}-{bpmRange.max} BPM.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/lounge/create"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Lounge</span>
            </Link>

            {/* Quick Join by Code */}
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Invite Code (e.g. NEXUS1)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono tracking-wider placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
              />
              <button
                type="submit"
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {joinError && (
          <p className="text-xs text-rose-400 mt-3 font-mono">{joinError}</p>
        )}
      </div>

      {/* Acoustic Profile Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Preferred Keys</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(preferences.preferredCamelotKeys || ['8A', '9A']).map((k) => (
              <CamelotBadge key={k} camelotKey={k} size="xs" />
            ))}
          </div>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Tempo Range</span>
          <p className="text-sm font-bold text-cyan-300 font-mono">{bpmRange.min} - {bpmRange.max} BPM</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Target Energy</span>
          <p className="text-sm font-bold text-violet-300 font-mono">{((preferences.preferredEnergy ?? 0.75) * 100).toFixed(0)}% Drive</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Active Rooms</span>
          <p className="text-sm font-bold text-emerald-400 font-mono">{activeLounges.length} Live</p>
        </div>
      </div>

      {/* Active DJ Lounges Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-display">Live DJ Lounges</h2>
          </div>
          <Link to="/lounge/create" className="text-xs text-cyan-400 hover:underline font-mono">
            + Host Room
          </Link>
        </div>

        {activeLounges.length === 0 ? (
          <div className="bg-[#11111a] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium">No public lounges are live right now.</p>
            <Link
              to="/lounge/create"
              className="inline-block mt-3 text-xs font-semibold text-cyan-400 hover:underline"
            >
              Launch the first lounge & invite friends →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeLounges.map((lounge) => (
              <div
                key={lounge._id}
                className="bg-[#12121c] border border-white/10 rounded-2xl p-5 hover:border-violet-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                      {lounge.vibeProfile}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      CODE: {lounge.inviteCode}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                    {lounge.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {lounge.description || 'Live crowd-curated audio session.'}
                  </p>

                  {/* Now Playing in Lounge */}
                  {lounge.currentTrack?.track && (
                    <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                      <img
                        src={lounge.currentTrack.track.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                        alt="track art"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{lounge.currentTrack.track.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{lounge.currentTrack.track.artist}</p>
                      </div>
                      <CamelotBadge camelotKey={lounge.currentTrack.track.acousticProfile?.camelotKey} size="xs" />
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lounge.participants?.length || 1} listening</span>
                  </div>

                  <Link
                    to={`/lounge/${lounge._id}`}
                    className="flex items-center gap-1 bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>Enter Lounge</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended For You Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white font-display">Recommended For You</h2>
          </div>
          <Link to="/discover" className="text-xs text-cyan-400 hover:underline font-mono">
            View All Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 6).map((rec) => (
            <div
              key={rec.trackId}
              className="bg-[#11111a] border border-white/10 rounded-2xl p-4 hover:border-violet-500/30 transition-all flex flex-col justify-between"
            >
              <div className="flex gap-3 items-start">
                <img
                  src={rec.track?.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                  alt={rec.title}
                  className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate font-display">{rec.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{rec.artist}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <CamelotBadge camelotKey={rec.track?.acousticProfile?.camelotKey} size="xs" />
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      {rec.track?.acousticProfile?.bpm} BPM
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePreviewTrack(rec.track)}
                  title="Preview with synthesized Web Audio"
                  className="p-2 rounded-xl bg-white/5 hover:bg-violet-600 text-white transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Recommendation Explanation Tag */}
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] text-violet-300/90 leading-relaxed font-sans">
                💡 {rec.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Listening History Peek */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white font-display">Recent Listening Activity</h2>
            </div>
            <Link to="/history" className="text-xs text-cyan-400 hover:underline font-mono">
              Full History →
            </Link>
          </div>

          <div className="bg-[#11111a] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {history.map((item) => (
              <div key={item._id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Music className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white truncate block">{item.track?.title || 'Unknown Track'}</span>
                    <span className="text-[10px] text-slate-400">{item.track?.artist} • {item.lounge?.name ? `in ${item.lounge.name}` : 'Catalog'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
                  <CamelotBadge camelotKey={item.track?.acousticProfile?.camelotKey} size="xs" />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
