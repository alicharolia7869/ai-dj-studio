import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  Disc3,
  Sliders
} from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';

const ALL_CAMELOT_KEYS = [
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
];

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Add Track Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Melodic Techno');
  const [duration, setDuration] = useState(210);
  const [bpm, setBpm] = useState(126);
  const [camelotKey, setCamelotKey] = useState('8A');
  const [energy, setEnergy] = useState(0.8);
  const [valence, setValence] = useState(0.65);
  const [artworkUrl, setArtworkUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [timelineNotes, setTimelineNotes] = useState('Driving bassline drop at 0:32');
  const [audioFile, setAudioFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const res = await api.getTracks({ search: search || undefined, limit: 50 });
      setTracks(res.data?.tracks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [search]);

  const handleAddTrack = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: '', type: '' });

    // Validation
    const numBpm = Number(bpm);
    if (isNaN(numBpm) || numBpm < 40 || numBpm > 240) {
      setStatusMsg({ text: 'BPM must be a valid number between 40 and 240.', type: 'error' });
      return;
    }

    if (!ALL_CAMELOT_KEYS.includes(camelotKey.toUpperCase())) {
      setStatusMsg({ text: 'Camelot key must be one of the 24 standard keys (1A-12B).', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('genre', genre);
      formData.append('duration', String(duration));
      formData.append('bpm', String(numBpm));
      formData.append('camelotKey', camelotKey.toUpperCase());
      formData.append('energy', String(energy));
      formData.append('valence', String(valence));
      if (artworkUrl) formData.append('artworkUrl', artworkUrl);
      if (audioUrl) formData.append('audioUrl', audioUrl);
      if (audioFile) formData.append('audio', audioFile);

      if (timelineNotes) {
        formData.append('metadataTimeline', JSON.stringify([
          { timestamp: 0, note: 'Intro' },
          { timestamp: 32, note: timelineNotes }
        ]));
      }

      await api.createTrack(formData);
      setStatusMsg({ text: `Track "${title}" successfully added to catalog!`, type: 'success' });
      setShowAddModal(false);
      resetForm();
      loadTracks();
    } catch (err) {
      setStatusMsg({ text: err.message || 'Failed to create track.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (trackId, trackTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${trackTitle}" from the catalog?`)) return;
    try {
      await api.deleteTrack(trackId);
      setStatusMsg({ text: `Track "${trackTitle}" deleted.`, type: 'success' });
      loadTracks();
    } catch (err) {
      setStatusMsg({ text: err.message || 'Failed to delete track.', type: 'error' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setGenre('Melodic Techno');
    setDuration(210);
    setBpm(126);
    setCamelotKey('8A');
    setEnergy(0.8);
    setValence(0.65);
    setArtworkUrl('');
    setAudioUrl('');
    setTimelineNotes('');
    setAudioFile(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Restricted Access</span>
          </div>
          <h1 className="text-3xl font-black text-white font-display">
            Track & Acoustic Profile Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload audio assets, validate Camelot keys, and calibrate acoustic metadata profiles.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Upload / Add Track</span>
        </button>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Catalog Search & Table */}
      <div className="bg-[#11111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181824] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">{tracks.length} tracks cataloged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-white/[0.02]">
                <th className="py-3 px-4">Track Title & Artist</th>
                <th className="py-3 px-4">Genre</th>
                <th className="py-3 px-4">BPM</th>
                <th className="py-3 px-4">Camelot Key</th>
                <th className="py-3 px-4">Energy</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {tracks.map((t) => (
                <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                        alt={t.title}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">{t.title}</p>
                        <p className="text-[11px] text-slate-400">{t.artist}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-300">{t.genre}</td>

                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                    {t.acousticProfile?.bpm} BPM
                  </td>

                  <td className="py-3 px-4">
                    <CamelotBadge camelotKey={t.acousticProfile?.camelotKey} size="xs" />
                  </td>

                  <td className="py-3 px-4 font-mono text-violet-300">
                    {((t.acousticProfile?.energy ?? 0.7) * 100).toFixed(0)}%
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(t._id, t.title)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      title="Delete track from catalog"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4 font-display">
              Add Verified Track to Catalog
            </h3>

            <form onSubmit={handleAddTrack} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Artist *</label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Genre *</label>
                  <input
                    type="text"
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Duration (Seconds) *</label>
                  <input
                    type="number"
                    min="15"
                    max="600"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Acoustic Calibration Section */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <span className="block font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Acoustic Calibration
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">BPM (40 - 240) *</label>
                    <input
                      type="number"
                      min="40"
                      max="240"
                      required
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Camelot Key (1A - 12B) *</label>
                    <select
                      value={camelotKey}
                      onChange={(e) => setCamelotKey(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    >
                      {ALL_CAMELOT_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Energy: {(energy * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={energy}
                      onChange={(e) => setEnergy(Number(e.target.value))}
                      className="w-full accent-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Valence: {(valence * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={valence}
                      onChange={(e) => setValence(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Artwork & Audio Upload */}
              <div>
                <label className="block text-slate-400 font-mono mb-1">Artwork URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={artworkUrl}
                  onChange={(e) => setArtworkUrl(e.target.value)}
                  className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Audio File (Upload, Max 15MB)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:text-xs"
                />
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  If no file is provided, Web Audio harmonic synthesizer will automatically synthesize BPM-accurate playback.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Validating...' : 'Save Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
