import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Users,
  Music,
  ThumbsUp,
  Swords,
  Sparkles,
  Activity,
  ArrowLeft,
  Disc3
} from 'lucide-react';
import CamelotBadge from '../components/CamelotBadge.jsx';

export default function AnalyticsPage() {
  const { loungeId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await api.getAnalytics(loungeId);
        setAnalytics(res.data?.analytics || null);
      } catch (err) {
        console.error('Failed to load session analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [loungeId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Compiling session analytics telemetry...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <p className="text-sm font-semibold text-white">No analytics records found for this lounge session.</p>
        <Link to="/dashboard" className="inline-block mt-3 text-xs text-cyan-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/lounge/${loungeId}`}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline mb-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Live Lounge</span>
          </Link>
          <h1 className="text-3xl font-black text-white font-display">
            Session Analytics: {analytics.loungeName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recorded acoustic telemetry, sentiment curve, and crowd engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
            {analytics.vibeProfile}
          </span>
          <span className="text-[10px] font-mono uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            {analytics.isLiveSession ? 'Live Stream' : 'Completed Session'}
          </span>
        </div>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <Clock className="w-4 h-4 text-cyan-400 mb-2" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Duration</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">{analytics.sessionDuration}m</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <Users className="w-4 h-4 text-violet-400 mb-2" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Peak Listeners</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">{analytics.peakParticipants}</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <Music className="w-4 h-4 text-cyan-400 mb-2" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tracks Played</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">{analytics.totalTracksPlayed}</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <ThumbsUp className="w-4 h-4 text-emerald-400 mb-2" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Queue Votes</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">{analytics.totalQueueVotes}</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <Swords className="w-4 h-4 text-amber-400 mb-2" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Soundclashes</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">{analytics.soundclashCount}</p>
        </div>

        <div className="bg-[#11111a] border border-white/10 rounded-2xl p-4">
          <Activity className="w-4 h-4 text-cyan-400 mb-2" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Avg Sentiment</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">
            {analytics.averageSentiment > 0 ? `+${analytics.averageSentiment.toFixed(2)}` : analytics.averageSentiment.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Two Recharts Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Timeline Chart */}
        <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Crowd Sentiment Progression</h3>
              <p className="text-[11px] text-slate-400">Rolling sentiment score (-1.0 to +1.0) across recent chat</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {analytics.sentimentCategory}
            </span>
          </div>

          <div className="h-64 w-full">
            {analytics.sentimentTimeline?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.sentimentTimeline}>
                  <defs>
                    <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="timestamp" stroke="#666" fontSize={10} />
                  <YAxis domain={[-1, 1]} stroke="#666" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161622', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#sentimentGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No chat messages recorded yet to plot sentiment timeline.
              </div>
            )}
          </div>
        </div>

        {/* Energy Progression Chart */}
        <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Acoustic Energy & BPM Trajectory</h3>
              <p className="text-[11px] text-slate-400">Normalized energy index (0 to 1) for consecutive tracks</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics.energyProgression?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.energyProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="trackTitle" stroke="#666" fontSize={10} />
                  <YAxis domain={[0, 1]} stroke="#666" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161622', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="energy" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#00f2fe', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No track transitions recorded yet to plot energy trajectory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Most-Voted Tracks Leaderboard */}
      {analytics.mostVotedTracks?.length > 0 && (
        <div className="bg-[#11111a] border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white font-display mb-4">
            Most Voted Crowd Anthems
          </h3>

          <div className="divide-y divide-white/5">
            {analytics.mostVotedTracks.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-amber-400">#{idx + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.artist}</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/20">
                  {item.voteCount} votes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
