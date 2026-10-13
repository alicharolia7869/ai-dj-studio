import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoungeStore } from '../store/loungeStore.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { audioEngine } from '../services/audioSynth.js';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  Users,
  MessageSquare,
  Swords,
  Sparkles,
  ThumbsUp,
  Plus,
  Send,
  Share2,
  Settings,
  HelpCircle,
  TrendingUp,
  Flame,
  Check,
  Disc3,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';
import AudioVisualizer from '../components/AudioVisualizer.jsx';
import CamelotBadge from '../components/CamelotBadge.jsx';
import SentimentGauge from '../components/SentimentGauge.jsx';

export default function LoungeRoomPage() {
  const { loungeId } = useParams();
  const { user } = useAuthStore();
  const {
    lounge,
    currentTrack,
    queue,
    participants,
    activeBattle,
    messages,
    crowdSentiment,
    aiCommentary,
    aiAnnouncement,
    isPlaying,
    playbackPosition,
    duration,
    volume,
    typingUsers,
    loading,
    error,
    joinLounge,
    leaveLounge,
    addToQueue,
    voteQueueTrack,
    sendMessage,
    setTyping,
    createSoundclash,
    voteSoundclash,
    resolveSoundclash,
    askAiDj,
    togglePlayPause,
    seekPlayback,
    skipNext,
    setVolume
  } = useLoungeStore();

  const [chatInput, setChatInput] = useState('');
  const [aiQuestionInput, setAiQuestionInput] = useState('');
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [showCreateBattleModal, setShowCreateBattleModal] = useState(false);
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [selectedBattleTrackIds, setSelectedBattleTrackIds] = useState([]);
  const [battleDuration, setBattleDuration] = useState(45);
  const [copiedCode, setCopiedCode] = useState(false);
  const [aiAnswerHistory, setAiAnswerHistory] = useState([]);
  const [askingAi, setAskingAi] = useState(false);

  useEffect(() => {
    if (loungeId) {
      joinLounge(loungeId);
    }
    return () => {
      leaveLounge();
    };
  }, [loungeId]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await api.getTracks({ limit: 40 });
        setCatalogTracks(res.data?.tracks || []);
      } catch (_) {}
    }
    loadCatalog();
  }, []);

  const isHost = lounge?.host?._id === user?._id || lounge?.host === user?._id || user?.role === 'admin';
  const isCoDj = isHost || user?.role === 'co-dj' || lounge?.participants?.some(p => p.user?._id === user?._id && p.role === 'co-dj');

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyInvite = () => {
    if (lounge?.inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/lounge/${lounge._id}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
    setTyping(false);
  };

  const handleQuickReaction = (emoji) => {
    sendMessage(emoji);
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!aiQuestionInput.trim()) return;
    const q = aiQuestionInput.trim();
    setAskingAi(true);
    setAiQuestionInput('');

    try {
      const res = await api.askAi(lounge._id, q);
      if (res.data) {
        setAiAnswerHistory(prev => [res.data, ...prev.slice(0, 5)]);
      }
    } catch (_) {
      askAiDj(q);
    } finally {
      setAskingAi(false);
    }
  };

  const handleCreateBattleSubmit = (e) => {
    e.preventDefault();
    if (selectedBattleTrackIds.length < 2) return;
    createSoundclash(selectedBattleTrackIds, battleDuration);
    setShowCreateBattleModal(false);
    setSelectedBattleTrackIds([]);
  };

  const toggleSelectBattleTrack = (trackId) => {
    setSelectedBattleTrackIds(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : prev.length < 4
        ? [...prev, trackId]
        : prev
    );
  };

  if (loading || !lounge) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-cyan-400 animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400">Connecting to DJ Lounge Audio Synchronizer...</p>
      </div>
    );
  }

  const currentAcoustic = currentTrack?.acousticProfile || {};

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Lounge Bar */}
      <div className="bg-[#101018] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white font-display truncate">
                {lounge.name}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase font-bold">
                {lounge.vibeProfile}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Host: <span className="text-slate-300 font-semibold">{lounge.host?.displayName}</span> • {participants.length} connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SentimentGauge sentiment={crowdSentiment} compact={true} />

          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 px-3 py-1.5 rounded-xl transition-all"
            title="Copy shareable invitation link"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>CODE: {lounge.inviteCode}</span>
          </button>

          <Link
            to={`/analytics/${lounge._id}`}
            className="flex items-center gap-1.5 bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-xs font-medium text-violet-300 px-3 py-1.5 rounded-xl transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
        </div>
      </div>

      {/* AI Transition Announcement Banner */}
      {(aiCommentary || aiAnnouncement) && (
        <div className="bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-cyan-950/40 border border-violet-500/40 rounded-2xl p-3.5 text-xs text-violet-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
            <p className="leading-relaxed">
              <span className="font-bold text-cyan-300">DJ Nexus AI:</span> {aiCommentary || aiAnnouncement}
            </p>
          </div>
          <button
            onClick={() => useLoungeStore.setState({ aiCommentary: null, aiAnnouncement: null })}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONSOLE 3-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: NOW PLAYING & SOUNDCLASH STAGE (Col 1-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* A. NOW PLAYING CARD */}
          <div className="bg-[#12121c] border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                Now Playing Deck
              </span>
              <CamelotBadge camelotKey={currentAcoustic.camelotKey} size="sm" showName={true} />
            </div>

            {/* Track Artwork & Title */}
            <div className="flex gap-4 items-center mb-5">
              <div className="relative group shrink-0">
                <img
                  src={currentTrack?.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                  alt={currentTrack?.title || 'Playing track'}
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-violet-500/40 shadow-xl"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Disc3 className="w-8 h-8 text-cyan-400 animate-[spin_4s_linear_infinite]" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-black text-white font-display truncate">
                  {currentTrack?.title || 'Waiting for Track...'}
                </h2>
                <p className="text-xs text-slate-400 truncate">{currentTrack?.artist || 'Unknown Artist'}</p>
                <span className="inline-block text-[10px] font-mono font-bold text-violet-400 uppercase mt-1">
                  {currentTrack?.genre || 'Electronic'}
                </span>

                {/* Acoustic Gauges */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px]">TEMPO</span>
                    <span className="text-cyan-300 font-bold">{currentAcoustic.bpm || 126} BPM</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">ENERGY</span>
                    <span className="text-violet-300 font-bold">{((currentAcoustic.energy ?? 0.75) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Waveform Canvas */}
            <div className="bg-black/50 p-2.5 rounded-2xl border border-white/5 mb-4">
              <AudioVisualizer isPlaying={isPlaying} height={42} barsCount={34} />
            </div>

            {/* Playback Scrubber Bar */}
            <div className="space-y-1 mb-5">
              <input
                type="range"
                min="0"
                max={duration || 240}
                value={playbackPosition}
                onChange={(e) => seekPlayback(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-white/10"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{formatTime(playbackPosition)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-transform hover:scale-105 active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                {isCoDj && (
                  <button
                    onClick={skipNext}
                    title="Skip to next queued track"
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 accent-violet-400"
                />
              </div>
            </div>
          </div>

          {/* C. SOUNDCLASH STAGE PANEL */}
          <div className="bg-[#12121c] border border-amber-500/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(245,158,11,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <Swords className="w-4 h-4 text-amber-400" />
                Soundclash Stage
              </span>

              {isCoDj && !activeBattle && (
                <button
                  onClick={() => setShowCreateBattleModal(true)}
                  className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors"
                >
                  + Launch Battle
                </button>
              )}
            </div>

            {activeBattle ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Battle in Progress</span>
                  <span className="text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full">
                    {activeBattle.status === 'voting' ? 'Live Voting' : 'Resolved'}
                  </span>
                </div>

                {/* Candidate tracks */}
                <div className="space-y-2.5">
                  {activeBattle.candidates.map((cand, idx) => {
                    const totalVotes = activeBattle.candidates.reduce((sum, c) => sum + (c.votes?.length || 0), 0);
                    const voteCount = cand.votes?.length || 0;
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const userVotedForThis = cand.votes?.some(v => (v.user?._id || v.user) === user?._id);

                    return (
                      <div
                        key={cand._id || idx}
                        className={`p-3 rounded-2xl border transition-all ${
                          userVotedForThis
                            ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400">#{idx + 1}</span>
                            <div className="truncate">
                              <p className="text-xs font-bold text-white truncate">{cand.track?.title}</p>
                              <p className="text-[10px] text-slate-400">{cand.track?.artist}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => voteSoundclash(activeBattle._id, cand.track?._id || cand.track || cand._id)}
                            disabled={activeBattle.status !== 'voting'}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-transform hover:scale-105 ${
                              userVotedForThis
                                ? 'bg-amber-400 text-black shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            Vote ({voteCount})
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
                          <span>Camelot: {cand.track?.acousticProfile?.camelotKey}</span>
                          <span>{pct}% ({voteCount} votes)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isHost && activeBattle.status === 'voting' && (
                  <button
                    onClick={() => resolveSoundclash(activeBattle._id)}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-transform hover:scale-101"
                  >
                    Resolve Battle & Insert Winner into Queue
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-slate-400">
                <Swords className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">No active Soundclash battle right now.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hosts and co-DJs can launch head-to-head voting rounds for the crowd.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: NEXT UP QUEUE & ACOUSTIC SEGUE (Col 5-8) */}
        <div className="lg:col-span-4 space-y-6">
          {/* B. NEXT UP QUEUE PANEL */}
          <div className="bg-[#12121c] border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col h-[750px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Next Up Queue ({queue.length})
                </span>
                <p className="text-[10px] text-slate-400">Crowd-voted authoritative playback order</p>
              </div>

              <button
                onClick={() => setShowAddTrackModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-transform hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Track</span>
              </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Disc3 className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-white">The queue is currently empty</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Click "Add Track" to queue songs from the catalog. The AI DJ will automatically calculate harmonic transitions.
                  </p>
                  <button
                    onClick={() => setShowAddTrackModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                  >
                    + Browse Catalog Tracks
                  </button>
                </div>
              ) : (
                queue.map((item, index) => {
                  const track = item.track;
                  const profile = track?.acousticProfile || {};
                  const userVoted = item.votes?.some(v => (v.user?._id || v.user) === user?._id);

                  return (
                    <div
                      key={item._id || index}
                      className="bg-[#161624] border border-white/5 rounded-2xl p-3.5 hover:border-violet-500/30 transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                            #{index + 1}
                          </span>
                          <img
                            src={track?.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                            alt={track?.title}
                            className="w-11 h-11 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate font-display">
                              {track?.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">{track?.artist}</p>
                          </div>
                        </div>

                        {/* Upvote button */}
                        <button
                          onClick={() => voteQueueTrack(track?._id || item.track?._id || item.track || item._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                            userVoted
                              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{item.score || item.votes?.length || 0}</span>
                        </button>
                      </div>

                      {/* Harmonic compatibility metadata badge */}
                      <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <CamelotBadge camelotKey={profile.camelotKey} size="xs" />
                          <span className="text-cyan-400 font-semibold">{profile.bpm} BPM</span>
                        </div>
                        <span className="text-slate-400 truncate max-w-[180px]">
                          Added by {item.addedBy?.displayName?.split(' ')[0] || 'User'}
                        </span>
                      </div>

                      {item.recommendationReason && (
                        <div className="text-[10px] text-violet-300/80 leading-relaxed bg-black/30 p-1.5 rounded-lg">
                          💡 {item.recommendationReason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CHAT, SENTIMENT & AI DJ Q&A (Col 9-12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* D. LIVE CHAT & CROWD SENTIMENT */}
          <div className="bg-[#12121c] border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                Live Crowd Chat
              </span>
              <span className="text-[10px] font-mono text-slate-500">{messages.length} msgs</span>
            </div>

            {/* Messages scroll pane */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {messages.map((m) => {
                const isAI = m.isAiDj;
                return (
                  <div
                    key={m._id}
                    className={`p-2.5 rounded-2xl ${
                      isAI
                        ? 'bg-violet-950/50 border border-violet-500/30 text-violet-200'
                        : 'bg-[#181824] border border-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isAI ? 'text-cyan-300' : 'text-violet-300'}`}>
                          {m.user?.displayName || 'Listener'}
                        </span>
                        {m.user?.role && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400 uppercase">
                            {m.user.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed break-words">{m.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick emoji reactions */}
            <div className="flex items-center gap-1.5 py-2">
              {['🔥', '🙌', '⚡', '🚀', '❤️', '😴'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleQuickReaction(emoji)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-sm transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                placeholder="Share your vibe or react..."
                value={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  setTyping(true);
                }}
                className="flex-1 bg-[#09090e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* E. AI DJ PANEL & GROUNDED Q&A */}
          <div className="bg-[#12121c] border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Ask DJ Nexus AI
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Ask about BPM compatibility, harmonic segue rationale, or crowd sentiment:
            </p>

            <form onSubmit={handleAskAi} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Why is this track next?"
                value={aiQuestionInput}
                onChange={(e) => setAiQuestionInput(e.target.value)}
                className="flex-1 bg-[#09090e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={askingAi}
                className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors disabled:opacity-50"
              >
                {askingAi ? '...' : 'Ask'}
              </button>
            </form>

            {/* AI Q&A Recent Answers */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {aiAnswerHistory.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px]">
                  <p className="font-semibold text-cyan-300 mb-1">Q: "{item.question}"</p>
                  <p className="text-slate-300 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD TRACK TO QUEUE MODAL */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white font-display">Select Track to Add to Queue</h3>
              <button onClick={() => setShowAddTrackModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {catalogTracks.map((t) => (
                <div
                  key={t._id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={t.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                      alt={t.title}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{t.artist}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CamelotBadge camelotKey={t.acousticProfile?.camelotKey} size="xs" />
                        <span className="text-[10px] font-mono text-cyan-400">{t.acousticProfile?.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToQueue(t._id);
                      setShowAddTrackModal(false);
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH SOUNDCLASH BATTLE MODAL */}
      {showCreateBattleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-display">Launch Soundclash Battle</h3>
              </div>
              <button onClick={() => setShowCreateBattleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Pick 2 to 4 tracks from the catalog to compete for the next position in the live queue:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {catalogTracks.map((t) => {
                const isSelected = selectedBattleTrackIds.includes(t._id);
                return (
                  <div
                    key={t._id}
                    onClick={() => toggleSelectBattleTrack(t._id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.artist} • {t.acousticProfile?.bpm} BPM</p>
                    </div>
                    <CamelotBadge camelotKey={t.acousticProfile?.camelotKey} size="xs" />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs font-mono text-amber-400 font-bold">
                {selectedBattleTrackIds.length} of 4 tracks selected
              </span>

              <button
                onClick={handleCreateBattleSubmit}
                disabled={selectedBattleTrackIds.length < 2}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
              >
                Start Battle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
