import React from 'react';
import { Flame, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

export default function SentimentGauge({ sentiment, compact = false }) {
  const score = sentiment?.score ?? 0;
  const category = sentiment?.category || 'Neutral';
  const trend = sentiment?.trend || 'steady';
  const sampleSize = sentiment?.sampleSize ?? 0;

  // Convert -1.0..+1.0 into 0..100% for progress gauge
  const percentage = Math.round(((score + 1) / 2) * 100);

  const getCategoryStyles = () => {
    if (score >= 0.25) {
      return {
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        bar: 'from-cyan-500 to-emerald-400',
        text: 'text-emerald-400',
        icon: Flame
      };
    }
    if (score <= -0.25) {
      return {
        badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        bar: 'from-amber-500 to-rose-500',
        text: 'text-rose-400',
        icon: Activity
      };
    }
    return {
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      bar: 'from-violet-600 to-cyan-500',
      text: 'text-violet-300',
      icon: Activity
    };
  };

  const style = getCategoryStyles();
  const IconComponent = style.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-[#12121a]/80 border border-white/10 px-3 py-1.5 rounded-full">
        <IconComponent className={`w-4 h-4 ${style.text} animate-pulse`} />
        <span className="text-xs font-semibold text-slate-200">{category}</span>
        <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-300">
          {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#12121c]/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Crowd Sentiment</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-sm font-bold ${style.text}`}>{category}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${style.badge}`}>
                {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-xs font-medium text-slate-300">
            {trend === 'rising' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
            {trend === 'falling' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
            {trend === 'steady' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
            <span className="capitalize text-slate-300">{trend}</span>
          </div>
          <span className="text-[10px] text-slate-500">{sampleSize} msgs analyzed</span>
        </div>
      </div>

      {/* Meter Bar */}
      <div className="relative w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
        />
        {/* Center line (0.0 score) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30" />
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5 px-0.5">
        <span>-1.0 Fatigued</span>
        <span>0.0 Neutral</span>
        <span>+1.0 Energetic</span>
      </div>
    </div>
  );
}
