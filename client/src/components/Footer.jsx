import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Disc3, Radio, Sparkles, Activity, ShieldCheck, Heart, Info, X } from 'lucide-react';

export default function Footer() {
  const [showCamelotModal, setShowCamelotModal] = useState(false);

  return (
    <footer className="bg-[#060609] border-t border-white/10 pt-16 pb-12 mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5">
                <div className="w-full h-full bg-[#0d0d14] rounded-[6px] flex items-center justify-center">
                  <Disc3 className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-display font-black text-white tracking-wider text-base">
                AI DJ STUDIO
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The real-time collaborative AI DJ engine. Crowd-voted queues, live sentiment analysis, Soundclash battles, and mathematically proven harmonic mixing.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Acoustic Engine Online (±8% BPM)</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/discover" className="hover:text-cyan-300 transition-colors">
                  Acoustic Catalog
                </Link>
              </li>
              <li>
                <Link to="/lounge/create" className="hover:text-cyan-300 transition-colors">
                  Create DJ Lounge
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-cyan-300 transition-colors">
                  Personalized Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-cyan-300 transition-colors">
                  Listening History
                </Link>
              </li>
            </ul>
          </div>

          {/* Acoustic Mixing Science */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">Acoustic Science</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => setShowCamelotModal(true)}
                  className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Camelot Wheel Guide</span>
                </button>
              </li>
              <li>
                <span className="text-slate-400">Harmonic Segue: 50% Key Closeness</span>
              </li>
              <li>
                <span className="text-slate-400">Tempo Locking: ±8% Tolerance</span>
              </li>
              <li>
                <span className="text-slate-400">Crowd Sentiment NLP (-1.0 to +1.0)</span>
              </li>
            </ul>
          </div>

          {/* Engine Architecture */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">Architecture</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>• Socket.IO Authoritative State</li>
              <li>• Web Audio Harmonic Synthesizer</li>
              <li>• Deterministic Camelot Validation</li>
              <li>• Grounded DJ Nexus LLM Commentary</li>
              <li>• Hybrid Collaborative Filtering</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} AI DJ Studio. All rights reserved. Original music technology design.</p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">Vite + React</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">Node + Express</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">Socket.IO</span>
          </div>
        </div>
      </div>

      {/* Camelot Modal Guide */}
      {showCamelotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCamelotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-bold text-white font-display">Camelot Wheel Harmonic Rules</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              AI DJ Studio strictly enforces professional DJ harmonic mixing using the 24-key Camelot notation system (1A-12A Minor, 1B-12B Major).
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/20">
                <span className="font-bold text-violet-300 block mb-1">1. Exact Key Match (e.g. 8A → 8A)</span>
                <p className="text-slate-400">Identical root key and scale. Highest harmonic blending compatibility (100%).</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-1">2. Adjacent Key on Same Letter (e.g. 8A → 7A or 9A)</span>
                <p className="text-slate-400">Stepping +1 elevates dancefloor energy; stepping -1 adds deep warmth. Supports 12-1 circular wrap.</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <span className="font-bold text-purple-300 block mb-1">3. Relative Major / Minor (e.g. 8A → 8B)</span>
                <p className="text-slate-400">Switching between A Minor and C Major introduces a dramatic, emotional mood shift without any harmonic clash.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
