import {
  isValidCamelotKey,
  parseCamelotKey,
  evaluateHarmonicCompatibility,
  evaluateBpmCompatibility,
  evaluateSegueCandidate,
  rankSegueCandidates
} from '../src/utils/camelot.js';
import {
  analyzeMessageSentiment,
  calculateRoomCrowdSentiment
} from '../src/utils/sentiment.js';
import { RecommendationEngine } from '../src/services/recommendationEngine.js';

describe('Camelot Wheel & Harmonic Compatibility Engine', () => {
  test('Validates 24 Camelot keys correctly', () => {
    expect(isValidCamelotKey('8A')).toBe(true);
    expect(isValidCamelotKey('12B')).toBe(true);
    expect(isValidCamelotKey('1a')).toBe(true);
    expect(isValidCamelotKey('13A')).toBe(false);
    expect(isValidCamelotKey('0B')).toBe(false);
    expect(isValidCamelotKey('C Major')).toBe(false);
  });

  test('Parses Camelot keys into components', () => {
    expect(parseCamelotKey('8A')).toEqual({ number: 8, letter: 'A' });
    expect(parseCamelotKey('12B')).toEqual({ number: 12, letter: 'B' });
    expect(parseCamelotKey('invalid')).toBeNull();
  });

  // 20+ Simulated Acoustic Segue Cases
  const segueCases = [
    // Case 1: Identical key 8A -> 8A
    { currKey: '8A', candKey: '8A', currBpm: 126, candBpm: 126, expectedHarmonic: true, expectedBpm: true, desc: 'Identical key and exact BPM' },
    // Case 2: Identical key 11B -> 11B
    { currKey: '11B', candKey: '11B', currBpm: 128, candBpm: 125, expectedHarmonic: true, expectedBpm: true, desc: 'Identical key with 2.3% tempo delta' },
    // Case 3: Energy boost (+1 key) 8A -> 9A
    { currKey: '8A', candKey: '9A', currBpm: 124, candBpm: 127, expectedHarmonic: true, expectedBpm: true, desc: 'Energy boost (+1 Camelot key)' },
    // Case 4: Deep resonance (-1 key) 8A -> 7A
    { currKey: '8A', candKey: '7A', currBpm: 126, candBpm: 124, expectedHarmonic: true, expectedBpm: true, desc: 'Deep resonance (-1 Camelot key)' },
    // Case 5: Relative Major 8A -> 8B
    { currKey: '8A', candKey: '8B', currBpm: 128, candBpm: 130, expectedHarmonic: true, expectedBpm: true, desc: 'Relative major transition (same number, opposite letter)' },
    // Case 6: Relative Minor 8B -> 8A
    { currKey: '8B', candKey: '8A', currBpm: 128, candBpm: 128, expectedHarmonic: true, expectedBpm: true, desc: 'Relative minor transition' },
    // Case 7: Circular wrap around 12A -> 1A
    { currKey: '12A', candKey: '1A', currBpm: 125, candBpm: 126, expectedHarmonic: true, expectedBpm: true, desc: 'Circular wrap around 12A to 1A' },
    // Case 8: Circular wrap around 1A -> 12A
    { currKey: '1A', candKey: '12A', currBpm: 125, candBpm: 124, expectedHarmonic: true, expectedBpm: true, desc: 'Circular wrap around 1A to 12A' },
    // Case 9: Circular wrap around 12B -> 1B
    { currKey: '12B', candKey: '1B', currBpm: 120, candBpm: 122, expectedHarmonic: true, expectedBpm: true, desc: 'Circular wrap around 12B to 1B' },
    // Case 10: Circular wrap around 1B -> 12B
    { currKey: '1B', candKey: '12B', currBpm: 120, candBpm: 118, expectedHarmonic: true, expectedBpm: true, desc: 'Circular wrap around 1B to 12B' },
    // Case 11: Relative major in high key 10A -> 10B
    { currKey: '10A', candKey: '10B', currBpm: 120, candBpm: 122, expectedHarmonic: true, expectedBpm: true, desc: 'Relative major 10A to 10B' },
    // Case 12: Harmonic clash 8A -> 2A (rejected)
    { currKey: '8A', candKey: '2A', currBpm: 126, candBpm: 126, expectedHarmonic: false, expectedBpm: true, desc: 'Harmonic clash (distant keys 8A and 2A)' },
    // Case 13: Harmonic clash 8A -> 10A (rejected)
    { currKey: '8A', candKey: '10A', currBpm: 126, candBpm: 126, expectedHarmonic: false, expectedBpm: true, desc: 'Harmonic clash (2 steps away 8A to 10A)' },
    // Case 14: Harmonic clash 8A -> 3B (rejected)
    { currKey: '8A', candKey: '3B', currBpm: 126, candBpm: 126, expectedHarmonic: false, expectedBpm: true, desc: 'Harmonic clash (8A to 3B)' },
    // Case 15: Double-time transition 70 BPM -> 140 BPM
    { currKey: '8A', candKey: '8A', currBpm: 70, candBpm: 140, expectedHarmonic: true, expectedBpm: true, desc: 'Double-time BPM segue (70 to 140 BPM)' },
    // Case 16: Half-time transition 140 BPM -> 70 BPM
    { currKey: '8A', candKey: '8A', currBpm: 140, candBpm: 70, expectedHarmonic: true, expectedBpm: true, desc: 'Half-time BPM drop (140 to 70 BPM)' },
    // Case 17: Double-time with 2% variance 85 BPM -> 172 BPM
    { currKey: '4A', candKey: '5A', currBpm: 85, candBpm: 172, expectedHarmonic: true, expectedBpm: true, desc: 'Double-time within 8% tolerance (85 to 172 BPM)' },
    // Case 18: BPM drift exceeding 8% tolerance (128 -> 142 BPM rejected)
    { currKey: '8A', candKey: '8A', currBpm: 128, candBpm: 142, expectedHarmonic: true, expectedBpm: false, desc: 'BPM delta > 8% rejected' },
    // Case 19: BPM drift exceeding tolerance downwards (128 -> 114 BPM rejected)
    { currKey: '8A', candKey: '8A', currBpm: 128, candBpm: 114, expectedHarmonic: true, expectedBpm: false, desc: 'BPM drop > 8% rejected' },
    // Case 20: Both Harmonic clash AND BPM clash (8A 120 BPM -> 2B 150 BPM rejected)
    { currKey: '8A', candKey: '2B', currBpm: 120, candBpm: 150, expectedHarmonic: false, expectedBpm: false, desc: 'Both key clash and BPM mismatch' },
    // Case 21: Low key step 2A -> 1A
    { currKey: '2A', candKey: '1A', currBpm: 122, candBpm: 120, expectedHarmonic: true, expectedBpm: true, desc: 'Adjacent step 2A to 1A' },
    // Case 22: Boundary 8% match (100 -> 108 BPM)
    { currKey: '5A', candKey: '5B', currBpm: 100, candBpm: 108, expectedHarmonic: true, expectedBpm: true, desc: 'Boundary 8% tempo tolerance' }
  ];

  segueCases.forEach((tc, idx) => {
    test(`Simulated Segue #${idx + 1}: ${tc.desc} (${tc.currKey}/${tc.currBpm} -> ${tc.candKey}/${tc.candBpm})`, () => {
      const harm = evaluateHarmonicCompatibility(tc.currKey, tc.candKey);
      const bpm = evaluateBpmCompatibility(tc.currBpm, tc.candBpm, 0.08);

      expect(harm.compatible).toBe(tc.expectedHarmonic);
      expect(bpm.compatible).toBe(tc.expectedBpm);

      const candidateTrack = {
        id: `track_${idx}`,
        title: `Candidate ${idx}`,
        artist: 'Test Artist',
        acousticProfile: { bpm: tc.candBpm, camelotKey: tc.candKey, energy: 0.75 }
      };

      const currentTrack = {
        id: 'current_track',
        title: 'Current Track',
        artist: 'Current Artist',
        acousticProfile: { bpm: tc.currBpm, camelotKey: tc.currKey, energy: 0.70 }
      };

      const result = evaluateSegueCandidate(currentTrack, candidateTrack);
      if (tc.expectedHarmonic && tc.expectedBpm) {
        expect(result.compatible).toBe(true);
        expect(result.score).toBeGreaterThan(0);
        expect(result.explanation).toContain('Compatible segue');
      } else {
        expect(result.compatible).toBe(false);
        expect(result.score).toBe(0);
      }
    });
  });

  test('Deterministic ranking favors harmonic match and energy fit', () => {
    const currentTrack = {
      title: 'Current Floor Shaker',
      artist: 'DJ Nexus',
      acousticProfile: { bpm: 126, camelotKey: '8A', energy: 0.8 }
    };

    const candidates = [
      { id: '1', title: 'Perfect Match', artist: 'Artist A', acousticProfile: { bpm: 126, camelotKey: '8A', energy: 0.82 } },
      { id: '2', title: 'Adjacent Key', artist: 'Artist B', acousticProfile: { bpm: 127, camelotKey: '9A', energy: 0.75 } },
      { id: '3', title: 'Incompatible Key', artist: 'Artist C', acousticProfile: { bpm: 126, camelotKey: '2A', energy: 0.8 } },
      { id: '4', title: 'BPM Mismatch', artist: 'Artist D', acousticProfile: { bpm: 155, camelotKey: '8A', energy: 0.8 } }
    ];

    const ranking = rankSegueCandidates(currentTrack, candidates, { roomSentimentScore: 0.5 });
    expect(ranking.validCandidates.length).toBe(2);
    expect(ranking.rejectedCandidates.length).toBe(2);
    expect(ranking.bestCandidate.candidateId).toBe('1');
    expect(ranking.bestCandidate.score).toBeGreaterThan(ranking.validCandidates[1].score);
  });
});

describe('Real-Time Sentiment Analysis Module', () => {
  test('Accurately scores positive music-room messages', () => {
    const res = analyzeMessageSentiment('This drop is pure fire and insane energy! 🔥🔥');
    expect(res.score).toBeGreaterThanOrEqual(0.7);
    expect(res.label).toBe('positive');
  });

  test('Accurately scores negative / fatigue messages', () => {
    const res = analyzeMessageSentiment('So boring and slow, please skip 😴');
    expect(res.score).toBeLessThanOrEqual(-0.6);
    expect(res.label).toBe('negative');
  });

  test('Calculates rolling crowd sentiment and trend', () => {
    const messages = [
      { sentiment: { score: 0.8 }, createdAt: new Date() },
      { sentiment: { score: 0.9 }, createdAt: new Date() },
      { sentiment: { score: 0.7 }, createdAt: new Date() }
    ];

    const summary = calculateRoomCrowdSentiment(messages);
    expect(summary.category).toBe('Positive / Energetic');
    expect(summary.score).toBeGreaterThan(0.6);
  });
});

describe('Personalized Hybrid Recommendation Engine', () => {
  test('Ranks tracks based on preferences and generates clear explanations', () => {
    const engine = new RecommendationEngine();
    const user = {
      musicPreferences: {
        favoriteGenres: ['Melodic Techno'],
        preferredBpmRange: { min: 124, max: 128 },
        preferredCamelotKeys: ['8A'],
        preferredEnergy: 0.8,
        preferredValence: 0.6
      }
    };

    const tracks = [
      {
        _id: 't1',
        title: 'Techno Dream',
        artist: 'Sonic',
        genre: 'Melodic Techno',
        acousticProfile: { bpm: 126, camelotKey: '8A', energy: 0.8, valence: 0.6 }
      },
      {
        _id: 't2',
        title: 'Acoustic Guitar',
        artist: 'Folk Guy',
        genre: 'Acoustic Folk',
        acousticProfile: { bpm: 80, camelotKey: '3B', energy: 0.2, valence: 0.3 }
      }
    ];

    const recs = engine.getRecommendations({ user, allTracks: tracks });
    expect(recs.length).toBe(2);
    expect(recs[0].trackId).toBe('t1');
    expect(recs[0].explanation).toContain('matches your favorite genre');
  });
});
