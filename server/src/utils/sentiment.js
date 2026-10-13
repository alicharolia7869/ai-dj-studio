/**
 * Real-time Chat Sentiment Analysis & Mood Estimation Engine
 *
 * Analyzes chat messages using a calibrated music-room lexicon,
 * emoji mood scoring, exclamation/caps intensity analysis, and
 * calculates a rolling window sentiment score (-1.0 to +1.0).
 */

const POSITIVE_LEXICON = {
  // Ultra high energy / hype
  'fire': 0.9, 'lit': 0.85, 'banger': 0.95, 'drop': 0.8, 'tune': 0.7, 'insane': 0.85,
  'hype': 0.9, 'vibes': 0.75, 'vibe': 0.75, 'dancing': 0.8, 'dance': 0.75, 'energy': 0.85,
  'love': 0.8, 'amazing': 0.85, 'great': 0.7, 'awesome': 0.8, 'perfect': 0.85, 'groove': 0.8,
  'classic': 0.75, 'masterpiece': 0.9, 'bass': 0.7, 'electric': 0.8, 'goosebumps': 0.85,
  'slaps': 0.9, 'peak': 0.8, 'sick': 0.8, 'yes': 0.6, 'yess': 0.7, 'yesss': 0.8,
  'smooth': 0.75, 'clean': 0.7, 'beautiful': 0.8, 'heavy': 0.7, 'bop': 0.8, 'heat': 0.85,
  'party': 0.8, 'bounce': 0.75, 'flow': 0.7, 'legendary': 0.9
};

const NEGATIVE_LEXICON = {
  'boring': -0.75, 'bored': -0.7, 'skip': -0.8, 'trash': -0.9, 'mid': -0.5,
  'slow': -0.5, 'dead': -0.85, 'sleep': -0.7, 'sleepy': -0.75, 'tired': -0.65,
  'fatigued': -0.7, 'bad': -0.75, 'awful': -0.9, 'terrible': -0.9, 'stop': -0.6,
  'kill': -0.7, 'ruined': -0.8, 'hate': -0.85, 'annoying': -0.75, 'weak': -0.7,
  'flat': -0.6, 'dull': -0.65, 'clash': -0.6, 'noise': -0.55, 'offbeat': -0.7
};

const EMOJI_SCORES = {
  '🔥': 0.95, '⚡': 0.9, '🚀': 0.9, '💃': 0.85, '🕺': 0.85, '🎧': 0.75,
  '🔊': 0.85, '🎉': 0.85, '❤️': 0.8, '🙌': 0.8, '💯': 0.9, '✨': 0.75,
  '🤩': 0.85, '😎': 0.75, '🥳': 0.85, '🎶': 0.7, '🎵': 0.7, '👏': 0.75,
  '😴': -0.8, '🥱': -0.8, '💤': -0.85, '🗑️': -0.9, '👎': -0.85, '💀': -0.4,
  '🛑': -0.75, '🤮': -0.95, '🤐': -0.5, '😐': -0.3, '🙄': -0.6
};

/**
 * Analyzes a single chat message
 * @param {string} text
 * @returns {{ score: number, label: 'positive'|'neutral'|'negative', arousal: number, tokens: string[] }}
 */
export function analyzeMessageSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0.0, label: 'neutral', arousal: 0.2, tokens: [] };
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    return { score: 0.0, label: 'neutral', arousal: 0.2, tokens: [] };
  }

  let totalScore = 0;
  let matchesCount = 0;
  let arousal = 0.3; // baseline arousal

  // 1. Emoji analysis
  for (const [emoji, score] of Object.entries(EMOJI_SCORES)) {
    if (cleanText.includes(emoji)) {
      totalScore += score;
      matchesCount += 1;
      arousal += 0.25;
    }
  }

  // 2. Word token analysis
  const words = cleanText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  for (const word of words) {
    if (POSITIVE_LEXICON[word]) {
      totalScore += POSITIVE_LEXICON[word];
      matchesCount += 1;
      arousal += 0.15;
    } else if (NEGATIVE_LEXICON[word]) {
      totalScore += NEGATIVE_LEXICON[word];
      matchesCount += 1;
      arousal += 0.15;
    }
  }

  // 3. Exclamation and all-caps emphasis
  const exclamationMatches = (cleanText.match(/!+/g) || []).join('').length;
  if (exclamationMatches > 0) {
    arousal += Math.min(0.4, exclamationMatches * 0.1);
  }

  // Capitalization energy: if significant portion is uppercase
  const lettersOnly = cleanText.replace(/[^A-Za-z]/g, '');
  if (lettersOnly.length >= 4) {
    const uppercaseCount = cleanText.replace(/[^A-Z]/g, '').length;
    const capsRatio = uppercaseCount / lettersOnly.length;
    if (capsRatio > 0.6) {
      arousal += 0.2;
      // Caps amplifies current polarity
      if (totalScore > 0) totalScore *= 1.25;
      else if (totalScore < 0) totalScore *= 1.25;
      else totalScore += 0.2; // default positive excitement
      matchesCount = Math.max(1, matchesCount);
    }
  }

  // Calculate final clamped score
  let finalScore = matchesCount > 0 ? totalScore / matchesCount : 0.0;
  finalScore = Math.max(-1.0, Math.min(1.0, Math.round(finalScore * 100) / 100));
  arousal = Math.max(0.1, Math.min(1.0, Math.round(arousal * 100) / 100));

  let label = 'neutral';
  if (finalScore >= 0.25) label = 'positive';
  else if (finalScore <= -0.25) label = 'negative';

  return {
    score: finalScore,
    label,
    arousal,
    tokens: words
  };
}

/**
 * Calculates rolling crowd sentiment from recent messages
 *
 * @param {Array<{ score?: number, sentiment?: { score: number }, createdAt?: Date }>} messages
 * @param {number} maxWindow (default 30 messages)
 * @returns {{
 *   score: number,
 *   category: 'Positive / Energetic' | 'Neutral' | 'Negative / Fatigued',
 *   trend: 'rising' | 'steady' | 'falling',
 *   sampleSize: number,
 *   history: Array<{ score: number, timestamp: string }>
 * }}
 */
export function calculateRoomCrowdSentiment(messages = [], maxWindow = 30) {
  if (!messages || messages.length === 0) {
    return {
      score: 0.0,
      category: 'Neutral',
      trend: 'steady',
      sampleSize: 0,
      history: []
    };
  }

  const recent = messages.slice(-maxWindow);
  const scores = recent.map(m => {
    if (typeof m.score === 'number') return m.score;
    if (m.sentiment && typeof m.sentiment.score === 'number') return m.sentiment.score;
    return 0;
  });

  const sum = scores.reduce((acc, val) => acc + val, 0);
  const avg = scores.length > 0 ? sum / scores.length : 0;
  const clampedScore = Math.max(-1.0, Math.min(1.0, Math.round(avg * 100) / 100));

  // Determine category
  let category = 'Neutral';
  if (clampedScore >= 0.25) category = 'Positive / Energetic';
  else if (clampedScore <= -0.25) category = 'Negative / Fatigued';

  // Determine trend by comparing latest 5 against earlier window
  let trend = 'steady';
  if (scores.length >= 8) {
    const latestFive = scores.slice(-5);
    const earlier = scores.slice(0, -5);
    const avgLatest = latestFive.reduce((a, b) => a + b, 0) / latestFive.length;
    const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const diff = avgLatest - avgEarlier;
    if (diff > 0.15) trend = 'rising';
    else if (diff < -0.15) trend = 'falling';
  }

  const history = recent.map((m, idx) => ({
    index: idx + 1,
    score: typeof m.score === 'number' ? m.score : (m.sentiment?.score ?? 0),
    timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `Msg ${idx + 1}`
  }));

  return {
    score: clampedScore,
    category,
    trend,
    sampleSize: scores.length,
    history
  };
}
