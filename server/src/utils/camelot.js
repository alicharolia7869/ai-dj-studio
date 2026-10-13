/**
 * Camelot Musical Key & BPM Acoustic Compatibility Engine
 *
 * Implements deterministic acoustic matching according to strict harmonic mixing standards.
 * Camelot notation: 1A-12A (Minor keys), 1B-12B (Major keys).
 */

const VALID_CAMELOT_KEYS = new Set([
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
]);

/**
 * Validates whether a key string is a valid Camelot key
 * @param {string} key
 * @returns {boolean}
 */
export function isValidCamelotKey(key) {
  if (!key || typeof key !== 'string') return false;
  return VALID_CAMELOT_KEYS.has(key.toUpperCase().trim());
}

/**
 * Parses a Camelot key into { number: 1..12, letter: 'A'|'B' }
 * @param {string} key
 * @returns {{ number: number, letter: 'A'|'B' } | null}
 */
export function parseCamelotKey(key) {
  if (!isValidCamelotKey(key)) return null;
  const normalized = key.toUpperCase().trim();
  const letter = normalized.slice(-1);
  const number = parseInt(normalized.slice(0, -1), 10);
  return { number, letter };
}

/**
 * Checks harmonic compatibility between current key and candidate key.
 * Valid transitions:
 *  1. Exact same key (e.g. 8A -> 8A)
 *  2. Adjacent number on the same letter with 12-1 wrap (e.g. 8A -> 7A, 8A -> 9A, 12A -> 1A, 1A -> 12A)
 *  3. Same number with opposite letter (relative major/minor, e.g. 8A -> 8B, 4B -> 4A)
 * All other transitions are rejected as immediate harmonic segues.
 *
 * @param {string} currentKey
 * @param {string} candidateKey
 * @returns {{ compatible: boolean, relation: string, harmonicScore: number }}
 */
export function evaluateHarmonicCompatibility(currentKey, candidateKey) {
  const current = parseCamelotKey(currentKey);
  const candidate = parseCamelotKey(candidateKey);

  if (!current || !candidate) {
    return { compatible: false, relation: 'Invalid Key', harmonicScore: 0 };
  }

  // 1. Same Key
  if (current.number === candidate.number && current.letter === candidate.letter) {
    return { compatible: true, relation: 'Identical Key (Perfect Match)', harmonicScore: 1.0 };
  }

  // 2. Relative Key (Same number, opposite letter)
  if (current.number === candidate.number && current.letter !== candidate.letter) {
    const relationName = candidate.letter === 'B' ? 'Relative Major' : 'Relative Minor';
    return { compatible: true, relation: relationName, harmonicScore: 0.88 };
  }

  // 3. Adjacent Key on Same Letter (with circular wrap 12 <-> 1)
  if (current.letter === candidate.letter) {
    const diff = Math.abs(current.number - candidate.number);
    const isAdjacent = diff === 1 || diff === 11; // 12 and 1 wrap-around

    if (isAdjacent) {
      const direction = (candidate.number === (current.number % 12) + 1) || (current.number === 12 && candidate.number === 1)
        ? 'Energy Boost (+1 Key)'
        : 'Deep Resonance (-1 Key)';
      return { compatible: true, relation: direction, harmonicScore: 0.92 };
    }
  }

  // Incompatible
  return {
    compatible: false,
    relation: `Harmonic Clash (${currentKey} to ${candidateKey})`,
    harmonicScore: 0
  };
}

/**
 * Checks BPM compatibility.
 * A candidate is valid if its BPM is within ±8% of current track's BPM,
 * or is a valid half-time/double-time match within the same ±8% tolerance.
 *
 * @param {number} currentBpm
 * @param {number} candidateBpm
 * @param {number} tolerance (default 0.08 = 8%)
 * @returns {{ compatible: boolean, relation: string, bpmDifferencePercent: number }}
 */
export function evaluateBpmCompatibility(currentBpm, candidateBpm, tolerance = 0.08) {
  if (!currentBpm || !candidateBpm || currentBpm <= 0 || candidateBpm <= 0) {
    return { compatible: false, relation: 'Invalid BPM', bpmDifferencePercent: 1.0 };
  }

  // Direct match check: |candidate - current| / current
  const directDiff = Math.abs(candidateBpm - currentBpm) / currentBpm;
  if (directDiff <= tolerance) {
    const pct = Math.round(directDiff * 100 * 10) / 10;
    return {
      compatible: true,
      relation: `Direct Tempo (${candidateBpm} vs ${currentBpm} BPM, ${pct}% diff)`,
      bpmDifferencePercent: directDiff
    };
  }

  // Double-time match: candidate is ~2x current (e.g. 70 BPM -> 140 BPM)
  const doubleTarget = currentBpm * 2;
  const doubleDiff = Math.abs(candidateBpm - doubleTarget) / doubleTarget;
  if (doubleDiff <= tolerance) {
    const pct = Math.round(doubleDiff * 100 * 10) / 10;
    return {
      compatible: true,
      relation: `Double-Time Jump (${candidateBpm} BPM, ${pct}% diff to 2x)`,
      bpmDifferencePercent: doubleDiff
    };
  }

  // Half-time match: candidate is ~0.5x current (e.g. 140 BPM -> 70 BPM)
  const halfTarget = currentBpm * 0.5;
  const halfDiff = Math.abs(candidateBpm - halfTarget) / halfTarget;
  if (halfDiff <= tolerance) {
    const pct = Math.round(halfDiff * 100 * 10) / 10;
    return {
      compatible: true,
      relation: `Half-Time Drop (${candidateBpm} BPM, ${pct}% diff to 0.5x)`,
      bpmDifferencePercent: halfDiff
    };
  }

  const pct = Math.round(directDiff * 100 * 10) / 10;
  return {
    compatible: false,
    relation: `Tempo Incompatible (${candidateBpm} vs ${currentBpm} BPM, ${pct}% diff exceeds ${tolerance * 100}%)`,
    bpmDifferencePercent: directDiff
  };
}

/**
 * Evaluates full segue transition compatibility between current track and candidate track.
 * Returns compatibility, component scores, and ranking score.
 *
 * Ranking weights:
 *  - 50% Harmonic closeness
 *  - 30% Energy fit against crowd sentiment and room vibe
 *  - 20% Recency penalty (penalizing recently played tracks)
 *
 * @param {Object} currentTrack
 * @param {Object} candidateTrack
 * @param {Object} options { roomSentimentScore: number (-1 to 1), roomVibeTargetEnergy: number (0 to 1), recentTrackIds: string[] }
 * @returns {Object} Evaluation details
 */
export function evaluateSegueCandidate(currentTrack, candidateTrack, options = {}) {
  const {
    roomSentimentScore = 0.0,
    roomVibeTargetEnergy = 0.7,
    recentTrackIds = []
  } = options;

  if (!currentTrack || !candidateTrack) {
    return {
      candidateId: candidateTrack?._id || candidateTrack?.id || 'unknown',
      title: candidateTrack?.title || 'Unknown Track',
      compatible: false,
      score: 0,
      confidence: 0,
      harmonicCloseness: 0,
      bpmDifferencePercent: 1.0,
      energyDelta: 1.0,
      reason: 'Missing track data for harmonic evaluation'
    };
  }

  const currentKey = currentTrack?.acousticProfile?.camelotKey || currentTrack?.camelotKey;
  const candidateKey = candidateTrack?.acousticProfile?.camelotKey || candidateTrack?.camelotKey;
  const currentBpm = currentTrack?.acousticProfile?.bpm || currentTrack?.bpm;
  const candidateBpm = candidateTrack?.acousticProfile?.bpm || candidateTrack?.bpm;
  const candidateEnergy = Number(candidateTrack?.acousticProfile?.energy ?? candidateTrack?.energy ?? 0.5);

  const harmonic = evaluateHarmonicCompatibility(currentKey, candidateKey);
  const bpm = evaluateBpmCompatibility(currentBpm, candidateBpm, 0.08);

  // Hard constraint: If either BPM or harmonic key is incompatible, reject candidate
  if (!harmonic.compatible || !bpm.compatible) {
    return {
      candidateId: candidateTrack._id || candidateTrack.id,
      title: candidateTrack.title,
      artist: candidateTrack.artist,
      compatible: false,
      rejectionReasons: [
        !harmonic.compatible ? harmonic.relation : null,
        !bpm.compatible ? bpm.relation : null
      ].filter(Boolean),
      harmonic,
      bpm,
      score: 0,
      explanation: `Cannot transition into "${candidateTrack.title}": ${!harmonic.compatible ? harmonic.relation : bpm.relation}`
    };
  }

  // 1. Harmonic score (weight 50%)
  const harmonicScore = harmonic.harmonicScore;

  // 2. Energy fit (weight 30%):
  // Adjust target energy based on room sentiment (-1.0 to +1.0)
  // Positive sentiment raises target energy slightly, negative lowers it
  const adjustedTargetEnergy = Math.max(0.1, Math.min(1.0, roomVibeTargetEnergy + (roomSentimentScore * 0.15)));
  const energyDiff = Math.abs(candidateEnergy - adjustedTargetEnergy);
  const energyFitScore = Math.max(0, 1 - energyDiff);

  // 3. Recency score (weight 20%):
  // Check if candidate was recently played
  const candidateIdStr = String(candidateTrack._id || candidateTrack.id || '');
  const recentIndex = recentTrackIds.indexOf(candidateIdStr);
  let recencyScore = 1.0;
  if (recentIndex !== -1) {
    // Played very recently: 0 tracks ago -> 0.2, 5 tracks ago -> 0.7, etc.
    recencyScore = Math.min(1.0, 0.2 + (recentIndex * 0.15));
  }

  // Total deterministic score
  const totalScore = (harmonicScore * 0.50) + (energyFitScore * 0.30) + (recencyScore * 0.20);
  const roundedScore = Math.round(totalScore * 1000) / 1000;

  // Craft clear human/DJ explanation
  const bpmText = bpm.relation;
  const keyText = harmonic.relation;
  const energyText = candidateEnergy >= 0.75 ? 'high energy drive' : candidateEnergy <= 0.45 ? 'smooth chill down' : 'balanced energy';

  const explanation = `Compatible segue via ${keyText} (${candidateKey}), ${bpmText}, with ${energyText} (Energy: ${candidateEnergy.toFixed(2)}, Match Score: ${(roundedScore * 100).toFixed(1)}%).`;

  return {
    candidateId: candidateTrack._id || candidateTrack.id,
    track: candidateTrack,
    title: candidateTrack.title,
    artist: candidateTrack.artist,
    compatible: true,
    harmonic,
    bpm,
    energyFit: {
      candidateEnergy,
      adjustedTargetEnergy,
      energyFitScore: Math.round(energyFitScore * 100) / 100
    },
    recencyScore: Math.round(recencyScore * 100) / 100,
    score: roundedScore,
    explanation
  };
}

/**
 * Selects and ranks all eligible segue candidates from a pool against current track
 *
 * @param {Object} currentTrack
 * @param {Array<Object>} candidates
 * @param {Object} options
 * @returns {{ validCandidates: Array<Object>, rejectedCandidates: Array<Object>, bestCandidate: Object|null }}
 */
export function rankSegueCandidates(currentTrack, candidates = [], options = {}) {
  const evaluations = candidates.map(candidate => evaluateSegueCandidate(currentTrack, candidate, options));

  const validCandidates = evaluations
    .filter(res => res.compatible)
    .sort((a, b) => b.score - a.score);

  const rejectedCandidates = evaluations.filter(res => !res.compatible);

  return {
    validCandidates,
    rejectedCandidates,
    bestCandidate: validCandidates.length > 0 ? validCandidates[0] : null
  };
}
