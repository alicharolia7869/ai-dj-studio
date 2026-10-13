import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Radio,
  Sparkles,
  Sliders,
  Shield,
  Music,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';

const VIBE_PROFILES = [
  'Deep House',
  'High-Energy EDM',
  'Hip-Hop Party',
  'Lo-Fi Chill',
  'Pop Anthems',
  'Retro Classics',
  'Mixed Crowd'
];

export default function CreateLoungePage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startingTrackId, setStartingTrackId] = useState('');
  const [vibeProfile, setVibeProfile] = useState('Deep House');
  const [genrePreference, setGenrePreference] = useState('Melodic Techno');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [bpmTolerance, setBpmTolerance] = useState(0.08);
  const [soundclashEnabled, setSoundclashEnabled] = useState(true);
  const [aiCommentaryLevel, setAiCommentaryLevel] = useState('full');
  const [queueVotingMode, setQueueVotingMode] = useState('democracy');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadTracks() {
      try {
        const res = await api.getTracks({ limit: 30 });
        const list = res.data?.tracks || [];
        setTracks(list);
        if (list.length > 0) setStartingTrackId(list[0]._id);
      } catch (_) {}
    }
    loadTracks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please specify a name for your DJ Lounge.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createLounge({
        name,
        description,
        startingTrackId,
        vibeProfile,
        genrePreference,
        maxParticipants,
        bpmTolerance,
        soundclashEnabled,
        aiCommentaryLevel,
        queueVotingMode,
        isPrivate
      });

      if (res.data?.lounge) {
        navigate(`/lounge/${res.data.lounge._id}`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create lounge.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-0.5 shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-3">
          <div className="w-full h-full bg-[#0d0d14] rounded-[14px] flex items-center justify-center">
            <Radio className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
          Launch a Collaborative DJ Lounge
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure room audio rules, crowd voting dynamics, and harmonic tolerance
        </p>
      </div>

      <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name & Description */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Lounge Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Skyline Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What kind of audio experience are you hosting for the crowd?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Vibe Profile Picker */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-2">
              Room Vibe Profile
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VIBE_PROFILES.map((vp) => {
                const isSelected = vibeProfile === vp;
                return (
                  <button
                    type="button"
                    key={vp}
                    onClick={() => setVibeProfile(vp)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {vp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Starting Track Picker */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Opening Track (Starting Deck)
            </label>
            <select
              value={startingTrackId}
              onChange={(e) => setStartingTrackId(e.target.value)}
              className="w-full bg-[#09090e] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {tracks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} — {t.artist} ({t.acousticProfile?.bpm} BPM • Camelot {t.acousticProfile?.camelotKey})
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Room Controls */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <span className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Harmonic & Room Rules
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  BPM Tolerance: ±{(bpmTolerance * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.04"
                  max="0.15"
                  step="0.01"
                  value={bpmTolerance}
                  onChange={(e) => setBpmTolerance(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 font-mono">Professional default is ±8%</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Participants: {maxParticipants}
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Queue Voting Mode</label>
                <select
                  value={queueVotingMode}
                  onChange={(e) => setQueueVotingMode(e.target.value)}
                  className="w-full bg-[#141420] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="democracy">Democracy (Crowd Votes Auto-Sort Queue)</option>
                  <option value="host-curated">Host Curated (Host Approves Order)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">AI DJ Commentary</label>
                <select
                  value={aiCommentaryLevel}
                  onChange={(e) => setAiCommentaryLevel(e.target.value)}
                  className="w-full bg-[#141420] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="full">Full (Transitions & Live Q&A)</option>
                  <option value="minimal">Minimal (Key transitions only)</option>
                  <option value="off">Off (Silent transitions)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={soundclashEnabled}
                  onChange={(e) => setSoundclashEnabled(e.target.checked)}
                  className="rounded accent-cyan-400 w-4 h-4"
                />
                <span>Enable Soundclash Battles</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded accent-cyan-400 w-4 h-4"
                />
                <span>Private Room (Requires Invite Code)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Launch Lounge & Go Live</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
