import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { audioEngine } from '../services/audioSynth.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Search,
  Filter,
  Play,
  Pause,
  Plus,
  Sparkles,
  Heart,
  Sliders,
  Check,
  Disc3,
  Layers
} from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';

const ALL_CAMELOT_KEYS = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
];

export default function DiscoverPage() {
  const { isAuthenticated } = useAuthStore();
  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [minBpm, setMinBpm] = useState(80);
  const [maxBpm, setMaxBpm] = useState(160);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [likedMap, setLikedMap] = useState({});
  const [activeLounges, setActiveLounges] = useState([]);
  const [queueModalTrack, setQueueModalTrack] = useState(null);
  const [selectedLoungeId, setSelectedLoungeId] = useState('');
  const [queueSuccessMsg, setQueueSuccessMsg] = useState('');

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.getTracks({
        search: search || undefined,
        key: selectedKey || undefined,
        genre: selectedGenre || undefined,
        minBpm: minBpm > 80 ? minBpm : undefined,
        maxBpm: maxBpm < 160 ? maxBpm : undefined
      });
      setTracks(res.data?.tracks || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [search, selectedKey, selectedGenre, minBpm, maxBpm]);

  useEffect(() => {
    async function loadLounges() {
      if (isAuthenticated) {
        try {
          const res = await api.getLounges({ status: 'active' });
          const lounges = res.data?.lounges || [];
          setActiveLounges(lounges);
          if (lounges.length > 0) setSelectedLoungeId(lounges[0]._id);
        } catch (_) {}
      }
    }
    loadLounges();
  }, [isAuthenticated]);

  const handleTogglePlay = (track) => {
    if (playingTrackId === track._id) {
      audioEngine.pause();
      setPlayingTrackId(null);
    } else {
      audioEngine.playTrack(track, 0);
      setPlayingTrackId(track._id);
    }
  };

  const handleToggleLike = async (trackId) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.toggleLike(trackId);
      setLikedMap(prev => ({ ...prev, [trackId]: res.liked }));
    } catch (_) {}
  };

  const handleAddToQueue = async () => {
    if (!selectedLoungeId || !queueModalTrack) return;
    try {
      await api.addToQueue(selectedLoungeId, queueModalTrack._id);
      setQueueSuccessMsg(`Added "${queueModalTrack.title}" to lounge queue!`);
      setTimeout(() => {
        setQueueSuccessMsg('');
        setQueueModalTrack(null);
      }, 1500);
    } catch (err) {
      setQueueSuccessMsg(err.message || 'Failed to add to queue.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Harmonic Audio Catalog</span>
          </div>
          <h1 className="text-3xl font-black text-white font-display">Acoustic Discovery</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified BPM and Camelot key profiles. Test compatibility and stream previews.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracks, artists, genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#11111a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        {/* Camelot Key Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Key:</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-[#161622] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="">All 24 Keys</option>
            {ALL_CAMELOT_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Genre:</span>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-[#161622] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Genres</option>
            <option value="Melodic Techno">Melodic Techno</option>
            <option value="Deep House">Deep House</option>
            <option value="Tech House">Tech House</option>
            <option value="Progressive House">Progressive House</option>
            <option value="Lo-Fi Chill">Lo-Fi Chill</option>
            <option value="Hip-Hop Party">Hip-Hop Party</option>
            <option value="Synthwave">Synthwave</option>
            <option value="Afro House">Afro House</option>
          </select>
        </div>

        {/* BPM Range Filter */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 ml-auto">
          <span>Tempo: {minBpm} - {maxBpm} BPM</span>
          <input
            type="range"
            min="80"
            max="160"
            value={minBpm}
            onChange={(e) => setMinBpm(Math.min(Number(e.target.value), maxBpm - 5))}
            className="w-24 accent-cyan-400"
          />
          <input
            type="range"
            min="80"
            max="160"
            value={maxBpm}
            onChange={(e) => setMaxBpm(Math.max(Number(e.target.value), minBpm + 5))}
            className="w-24 accent-cyan-400"
          />
        </div>
      </div>

      {/* Tracks Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading catalog...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-12 text-center text-slate-400">
          <Disc3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No tracks matched your acoustic filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the BPM range or Camelot key filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tracks.map((track) => {
            const isPlayingThis = playingTrackId === track._id;
            const profile = track.acousticProfile || {};
            const isLiked = likedMap[track._id];

            return (
              <div
                key={track._id}
                className="bg-[#12121c] border border-white/10 rounded-2xl p-5 hover:border-violet-500/40 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex gap-4 items-start mb-4">
                    <div className="relative shrink-0">
                      <img
                        src={track.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                        alt={track.title}
                        className="w-18 h-18 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <button
                        onClick={() => handleTogglePlay(track)}
                        className={`absolute inset-0 m-auto w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isPlayingThis
                            ? 'bg-cyan-500 text-black scale-100 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                            : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:scale-110'
                        }`}
                      >
                        {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 truncate">
                          {track.genre}
                        </span>
                        <CamelotBadge camelotKey={profile.camelotKey} size="xs" />
                      </div>

                      <h3 className="text-sm font-bold text-white truncate font-display group-hover:text-cyan-300 transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">{track.artist}</p>

                      <div className="flex items-center gap-2.5 mt-2 text-xs font-mono">
                        <span className="text-cyan-400 font-semibold">{profile.bpm} BPM</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-violet-400">Energy {((profile.energy ?? 0.7) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata timeline / notes preview */}
                  {track.metadataTimeline?.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-400 line-clamp-2 mb-4">
                      ⏱️ {track.metadataTimeline[0]?.note}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleLike(track._id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isLiked
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => setQueueModalTrack(track)}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-violet-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Lounge</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Lounge Queue Modal */}
      {queueModalTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 font-display">
              Add "{queueModalTrack.title}" to Live Queue
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Select the active DJ Lounge room to submit this track to:
            </p>

            {activeLounges.length === 0 ? (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center text-xs text-slate-400 mb-4">
                No active lounges currently live. You can launch your own lounge to start queueing tracks.
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                <label className="block text-xs font-mono text-slate-300">Select Lounge Room:</label>
                <select
                  value={selectedLoungeId}
                  onChange={(e) => setSelectedLoungeId(e.target.value)}
                  className="w-full bg-[#181824] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {activeLounges.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} (Code: {l.inviteCode} • {l.vibeProfile})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {queueSuccessMsg && (
              <div className="mb-4 text-xs font-mono text-cyan-400 text-center">{queueSuccessMsg}</div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setQueueModalTrack(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              {activeLounges.length > 0 && (
                <button
                  onClick={handleAddToQueue}
                  className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  Confirm Add
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
