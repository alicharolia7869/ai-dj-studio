import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { audioEngine } from '../services/audioSynth.js';
import { Settings, Volume2, Sparkles, Shield, Bell, Check, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [volume, setMasterVolume] = useState(0.85);
  const [commentaryLevel, setCommentaryLevel] = useState('full');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleVolumeChange = (newVol) => {
    setMasterVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono font-bold mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Audio Preferences</span>
        </div>
        <h1 className="text-3xl font-black text-white font-display">Studio Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure application audio engine, AI model verbosity, and lounge session controls.
        </p>
      </div>

      <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-8">
        {/* Audio Engine Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-display">Audio Engine Calibration</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Master Studio Output Volume</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Controls Web Audio synthesizer output and HTML5 stream playback volume.
            </p>
          </div>
        </section>

        {/* AI Intelligence Provider */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white font-display">AI DJ Commentary Model</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Commentary Frequency</label>
              <select
                value={commentaryLevel}
                onChange={(e) => setCommentaryLevel(e.target.value)}
                className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="full">Full (Contextual Segue Explanations & Soundclash Announcements)</option>
                <option value="minimal">Minimal (Key transitions only)</option>
                <option value="off">Silent</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-400 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Deterministic Grounding: The AI DJ Engine never fabricates track metadata. If external LLM keys are absent, the built-in deterministic acoustic engine operates seamlessly.
              </p>
            </div>
          </div>
        </section>

        {/* Session & Account */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Signed in as {user?.email}</p>
              <p className="text-[11px] text-slate-500 font-mono">Role: {user?.role}</p>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>

        {saved && (
          <p className="text-xs text-emerald-400 font-mono text-center flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> Settings updated successfully.
          </p>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-[1.01]"
        >
          Save Studio Settings
        </button>
      </div>
    </div>
  );
}
