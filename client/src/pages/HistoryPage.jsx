import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { History, Music, Radio, Clock, CheckCircle2, Heart } from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  const loadHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getHistory({ page, limit: 15 });
      setHistory(res.data?.history || []);
      setPagination(res.data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold mb-2">
          <History className="w-3.5 h-3.5" />
          <span>Listening Telemetry</span>
        </div>
        <h1 className="text-3xl font-black text-white font-display">Listening History</h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical record of tracks heard, completed, liked, and queued across all collaborative lounges.
        </p>
      </div>

      <div className="bg-[#11111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Fetching listening log...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Music className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">No listening activity recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Join a lounge to start building your interaction history!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-white/[0.02]">
                  <th className="py-3.5 px-4">Track Title</th>
                  <th className="py-3.5 px-4">Key / BPM</th>
                  <th className="py-3.5 px-4">Lounge Room</th>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.track?.artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                          alt={item.track?.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{item.track?.title || 'Unknown Track'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.track?.artist}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono">
                        <CamelotBadge camelotKey={item.track?.acousticProfile?.camelotKey} size="xs" />
                        <span className="text-cyan-400">{item.track?.acousticProfile?.bpm} BPM</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {item.lounge?.name ? item.lounge.name : 'Catalog Preview'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                        {item.eventType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadHistory(pagination.page - 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadHistory(pagination.page + 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
