import React from 'react';

const CAMELOT_KEY_NAMES = {
  '1A': 'Ab minor', '2A': 'Eb minor', '3A': 'Bb minor', '4A': 'F minor',
  '5A': 'C minor',  '6A': 'G minor',  '7A': 'D minor',  '8A': 'A minor',
  '9A': 'E minor',  '10A': 'B minor', '11A': 'F# minor','12A': 'Db minor',

  '1B': 'B Major',  '2B': 'F# Major', '3B': 'Db Major', '4B': 'Ab Major',
  '5B': 'Eb Major', '6B': 'Bb Major', '7B': 'F Major',  '8B': 'C Major',
  '9B': 'G Major',  '10B': 'D Major', '11B': 'A Major', '12B': 'E Major'
};

export default function CamelotBadge({ camelotKey = '8A', size = 'sm', showName = false }) {
  const normalized = (camelotKey || '8A').toUpperCase();
  const musicalName = CAMELOT_KEY_NAMES[normalized] || 'Standard';
  const isMinor = normalized.endsWith('A');

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm font-semibold',
    lg: 'px-3 py-1.5 text-base font-bold'
  };

  // Color palette by Camelot letter/wheel
  const colorClasses = isMinor
    ? 'bg-violet-950/80 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]';

  return (
    <span
      title={`Camelot Key ${normalized} (${musicalName})`}
      className={`inline-flex items-center gap-1 font-mono rounded-full border transition-transform hover:scale-105 select-none ${sizeClasses[size] || sizeClasses.sm} ${colorClasses}`}
    >
      <span className="font-bold tracking-tight">{normalized}</span>
      {showName && <span className="opacity-75 font-sans text-[11px]">({musicalName})</span>}
    </span>
  );
}
