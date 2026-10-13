import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Play,
  Pause,
  ThumbsUp,
  Sparkles,
  Swords,
  Flame,
  Activity,
  Layers,
  ArrowRight,
  Disc3,
  Users,
  Compass,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import AudioVisualizer from '../components/AudioVisualizer.jsx';
import CamelotBadge from '../components/CamelotBadge.jsx';
import SentimentGauge from '../components/SentimentGauge.jsx';
import { audioEngine } from '../services/audioSynth.js';

export default function LandingPage() {
  // Interactive Simulation Demo State (Clearly labeled as demonstration)
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoVotes, setDemoVotes] = useState(7);
  const [demoVoted, setDemoVoted] = useState(false);
  const [demoBattleVotes, setDemoBattleVotes] = useState({ trackA: 14, trackB: 18 });
  const [demoUserVotedTrack, setDemoUserVotedTrack] = useState(null);
  const [demoSentiment, setDemoSentiment] = useState({
    score: 0.78,
    category: 'Positive / Energetic',
    trend: 'rising',
    sampleSize: 18
  });
  const [demoChatInput, setDemoChatInput] = useState('');
  const [demoChatMessages, setDemoChatMessages] = useState([
    { id: 1, user: 'DJ Maya', text: 'Welcome to the floor! Testing Camelot 8A transition 🔥', positive: true },
    { id: 2, user: 'Liam', text: 'That sub bass drop hits so clean 🙌', positive: true },
    { id: 3, user: 'Elena', text: 'Vote Quantum Horizon in the Soundclash battle!', positive: true }
  ]);

  const toggleDemoAudio = () => {
    if (demoPlaying) {
      audioEngine.pause();
      setDemoPlaying(false);
    } else {
      audioEngine.playTrack({
        title: 'Neon Odyssey (Interactive Demo)',
        artist: 'Kroma & CyberVibe',
        duration: 240,
        acousticProfile: { bpm: 126, camelotKey: '8A', energy: 0.85 }
      }, 30);
      setDemoPlaying(true);
    }
  };

  const handleDemoVote = () => {
    if (demoVoted) {
      setDemoVotes(v => v - 1);
      setDemoVoted(false);
    } else {
      setDemoVotes(v => v + 1);
      setDemoVoted(true);
    }
  };

  const handleDemoBattleVote = (track) => {
    if (demoUserVotedTrack === track) return;
    setDemoBattleVotes(prev => ({
      ...prev,
      [track === 'A' ? 'trackA' : 'trackB']: prev[track === 'A' ? 'trackA' : 'trackB'] + 1,
      ...(demoUserVotedTrack ? { [demoUserVotedTrack === 'A' ? 'trackA' : 'trackB']: Math.max(0, prev[demoUserVotedTrack === 'A' ? 'trackA' : 'trackB'] - 1) } : {})
    }));
    setDemoUserVotedTrack(track);
  };

  const handleDemoSendMessage = (e) => {
    e.preventDefault();
    if (!demoChatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      user: 'You (Visitor)',
      text: demoChatInput,
      positive: demoChatInput.includes('fire') || demoChatInput.includes('vibe') || demoChatInput.includes('🔥')
    };

    setDemoChatMessages(prev => [...prev, newMsg]);
    setDemoChatInput('');

    // Dynamically adjust simulated sentiment
    setDemoSentiment(prev => ({
      score: Math.min(1.0, prev.score + 0.05),
      category: 'Positive / Energetic',
      trend: 'rising',
      sampleSize: prev.sampleSize + 1
    }));
  };

  return (
    <div className="relative min-h-screen bg-[#08080c] overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.2)] animate-pulse-slow">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Next-Generation Collaborative Audio Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-white leading-[1.08] mb-6">
            Your Music. Your Crowd.{' '}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-white bg-clip-text text-transparent">
              One Intelligent DJ.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Create a shared music experience where the crowd sets the vibe and AI keeps the rhythm alive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/lounge/create"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <Radio className="w-5 h-5" />
              <span>Launch Your Lounge</span>
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#12121a] hover:bg-white/10 text-slate-200 border border-white/15 font-semibold text-base px-7 py-4 rounded-2xl transition-all"
            >
              <span>Explore the Experience</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>
        </div>

        {/* HERO LIVE PREVIEW MOCKUP DECK */}
        <div className="mt-16 lg:mt-20 max-w-5xl mx-auto bg-gradient-to-b from-white/10 via-white/5 to-transparent p-1 rounded-3xl shadow-2xl backdrop-blur-2xl">
          <div className="bg-[#0e0e16] border border-white/10 rounded-[22px] p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left: Now Playing Hero Card */}
              <div className="lg:col-span-7 bg-[#141420] border border-white/10 rounded-2xl p-5 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Now Playing in Nexus Lounge
                  </span>
                  <CamelotBadge camelotKey="8A" size="sm" showName={true} />
                </div>

                <div className="flex gap-4 items-center mb-5">
                  <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                    alt="Album Artwork"
                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-violet-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white truncate font-display">Neon Odyssey</h3>
                    <p className="text-sm text-slate-400 truncate">Kroma & CyberVibe</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-300">
                      <span className="text-violet-400 font-semibold">126 BPM</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-semibold">Energy 82%</span>
                    </div>
                  </div>
                </div>

                {/* Animated Waveform */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                  <AudioVisualizer isPlaying={true} height={36} barsCount={32} />
                </div>

                {/* Live AI Transition Commentary Box */}
                <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-200 flex gap-2.5 items-start">
                  <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-cyan-300">DJ Nexus AI:</span> "The crowd energy is surging. Holding tempo at 126 BPM and smoothly transitioning into Midnight Transmission (8A) for seamless harmonic resonance."
                  </p>
                </div>
              </div>

              {/* Right: Live Queue & Battle Peek */}
              <div className="lg:col-span-5 space-y-4">
                {/* Live Queue peek */}
                <div className="bg-[#141420] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Next Up Queue</span>
                    <span className="text-[11px] text-cyan-400 font-mono">3 Tracks</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-slate-500 font-mono">#1</span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">Midnight Transmission</p>
                          <p className="text-[11px] text-slate-400">124 BPM • 8A</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        +14 votes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Soundclash Preview Peek */}
                <div className="bg-[#141420] border border-amber-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                      <Swords className="w-3.5 h-3.5" />
                      Live Soundclash Battle
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-300">
                      32s left
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium truncate">Quantum Horizon vs. Apex Overdrive</p>
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mt-2.5 flex">
                    <div className="bg-cyan-400 h-full w-[60%]" />
                    <div className="bg-rose-500 h-full w-[40%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PRODUCT FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase mb-3">
            Engineered For Pure Audio Flow
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            A DJ booth in the cloud with real-time crowd dynamics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#101018] border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Collaborative Live Queues</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every participant can contribute tracks and upvote their favorites. Authoritative WebSocket synchronization ensures all connected clients stay locked in real time.
            </p>
          </div>

          <div className="bg-[#101018] border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Real-Time Crowd Sentiment</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Natural Language Processing continuously evaluates room chat energy (-1.0 to +1.0). When the room gets hyped, the AI DJ automatically dials up the energy curve.
            </p>
          </div>

          <div className="bg-[#101018] border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Soundclash Battles</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pit 2 to 4 competitor tracks head-to-head in rapid countdown rounds. The crowd votes live, duplicate votes are rejected, and the winner claims top queue spot automatically.
            </p>
          </div>

          <div className="bg-[#101018] border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Camelot Acoustic Matching</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict mathematical enforcement: candidates must be within ±8% BPM (or half/double time) and match harmonic Camelot wheel keys (1A-12B) to prevent dissonant segues.
            </p>
          </div>

          <div className="bg-[#101018] border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Personalized Hybrid AI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Combines content-based acoustic analysis with collaborative interaction telemetry. Recommends tracks with clear human explanations rather than opaque popularity metrics.
            </p>
          </div>

          <div className="bg-[#101018] border border-white/10 rounded-2xl p-7 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Granular Role Governance</h3>
            <p className="text-sm text-slate-400 capacity-relaxed">
              Four distinct roles: Listener, Co-DJ, Host, and Admin. Permissions are verified server-side on every REST route and Socket.IO event.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO SECTION (SIMULATED DJ ROOM) */}
      <section id="interactive-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-b from-[#12121e] to-[#0a0a10] border border-violet-500/30 rounded-3xl p-6 lg:p-10 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden">
          {/* Label banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase mb-2">
                <span>Interactive Demonstration Experience</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                Try The AI DJ Console Right Now
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Notice: This interactive demonstration runs a client-side simulation so you can explore real audio playback, voting, and sentiment dynamics without creating an account.
              </p>
            </div>

            <Link
              to="/lounge/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-transform hover:scale-105"
            >
              <span>Create Real Lounge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Simulated DJ Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. Now Playing Deck */}
            <div className="lg:col-span-5 bg-[#161624] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-violet-400 font-mono uppercase">Simulation Deck</span>
                  <CamelotBadge camelotKey="8A" size="sm" showName={true} />
                </div>

                <div className="flex gap-4 items-center mb-5">
                  <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                    alt="Album artwork"
                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-violet-500/40"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Neon Odyssey</h3>
                    <p className="text-xs text-slate-400">Kroma & CyberVibe</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                      <span className="text-cyan-400">126 BPM</span>
                      <span>•</span>
                      <span className="text-violet-400">Energy 82%</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Audio Visualizer */}
                <div className="bg-black/50 p-3 rounded-xl border border-white/5 mb-4">
                  <AudioVisualizer isPlaying={demoPlaying} height={40} barsCount={28} />
                </div>
              </div>

              {/* Play / Pause button */}
              <button
                onClick={toggleDemoAudio}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
              >
                {demoPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause Web Audio Synth</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Test Synthesized Audio Playback</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Interactive Queue & Soundclash */}
            <div className="lg:col-span-4 space-y-4">
              {/* Queue card */}
              <div className="bg-[#161624] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white font-mono uppercase">Live Queue</span>
                  <span className="text-[10px] font-mono text-cyan-400">Harmonic Match</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">Midnight Transmission</p>
                    <p className="text-[11px] text-slate-400">124 BPM • 8A (Identical Key)</p>
                  </div>

                  <button
                    onClick={handleDemoVote}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      demoVoted
                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{demoVotes}</span>
                  </button>
                </div>
              </div>

              {/* Soundclash Stage Simulation */}
              <div className="bg-[#161624] border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                    <Swords className="w-3.5 h-3.5" />
                    Soundclash Battle
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    28s
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  <button
                    onClick={() => handleDemoBattleVote('A')}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                      demoUserVotedTrack === 'A'
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">Quantum Horizon (9A)</span>
                    <span className="font-mono font-bold">{demoBattleVotes.trackA} votes</span>
                  </button>

                  <button
                    onClick={() => handleDemoBattleVote('B')}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                      demoUserVotedTrack === 'B'
                        ? 'bg-rose-950/60 border-rose-400 text-rose-200'
                        : 'bg-white/5 border-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">Apex Overdrive (8B)</span>
                    <span className="font-mono font-bold">{demoBattleVotes.trackB} votes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Live Chat & Sentiment */}
            <div className="lg:col-span-3 flex flex-col justify-between bg-[#161624] border border-white/10 rounded-2xl p-4">
              <div>
                <SentimentGauge sentiment={demoSentiment} compact={false} />

                <div className="mt-4 mb-3">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-400">Live Crowd Chat</span>
                  <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                    {demoChatMessages.map((m) => (
                      <div key={m.id} className="text-xs p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="font-bold text-violet-400 mr-1.5">{m.user}:</span>
                        <span className="text-slate-300">{m.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleDemoSendMessage} className="mt-2">
                <input
                  type="text"
                  value={demoChatInput}
                  onChange={(e) => setDemoChatInput(e.target.value)}
                  placeholder="Type a hype message (e.g. fire drop 🔥)..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-white font-display mb-6">
          Ready to Host Your First AI DJ Lounge?
        </h2>
        <p className="text-base text-slate-400 mb-8 max-w-xl mx-auto">
          Gather your friends, test your music taste in Soundclash battles, and enjoy perfectly matched transitions every time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-transform hover:scale-105"
          >
            Create Free Account
          </Link>
          <Link
            to="/discover"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-7 py-3.5 rounded-2xl border border-white/15 transition-colors"
          >
            Explore Music Catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
