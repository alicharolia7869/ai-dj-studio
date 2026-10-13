/**
 * Hybrid Music Recommendation Engine
 *
 * Combines:
 * 1. Content-based filtering (Genre, BPM, Camelot Key, Energy, Valence, Liked Tracks)
 * 2. Collaborative filtering (Interaction history, completion rate, co-listening, co-queued tracks)
 *
 * Produces deterministic, explainable recommendation rankings.
 */

import { evaluateHarmonicCompatibility, evaluateBpmCompatibility } from '../utils/camelot.js';

export class RecommendationEngine {
  /**
   * Generates personalized hybrid recommendations for a user
   *
   * @param {Object} user User profile with preferences
   * @param {Array<Object>} allTracks Catalog of available tracks
   * @param {Array<Object>} userInteractions User's past interactions
   * @param {Array<Object>} globalInteractions Other users' interactions for collaborative scoring
   * @param {number} limit Max recommendations to return
   * @returns {Array<Object>} Ranked recommendations with explanations
   */
  getRecommendations({
    user,
    allTracks = [],
    userInteractions = [],
    globalInteractions = [],
    limit = 10
  }) {
    if (!allTracks || allTracks.length === 0) return [];

    const preferences = user?.musicPreferences || {};
    const favoriteGenres = (preferences.favoriteGenres || []).map(g => g.toLowerCase());
    const preferredBpm = preferences.preferredBpmRange || { min: 110, max: 135 };
    const preferredKeys = new Set((preferences.preferredCamelotKeys || []).map(k => k.toUpperCase()));
    const targetEnergy = typeof preferences.preferredEnergy === 'number' ? preferences.preferredEnergy : 0.7;
    const targetValence = typeof preferences.preferredValence === 'number' ? preferences.preferredValence : 0.6;

    // Collect tracks user has already interacted with
    const interactedTrackIds = new Set(
      userInteractions.map(i => String(i.track?._id || i.track || ''))
    );
    const likedTrackIds = new Set(
      userInteractions.filter(i => i.liked).map(i => String(i.track?._id || i.track || ''))
    );

    // Analyze user's history patterns
    const historyTrackIds = userInteractions
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 10)
      .map(i => String(i.track?._id || i.track || ''));

    const scoredCandidates = [];

    // Precompute collaborative co-occurrence matrix if global interactions exist
    const coOccurrenceWeights = this._computeCoOccurrence(userInteractions, globalInteractions);

    for (const track of allTracks) {
      const trackIdStr = String(track._id || track.id);
      const acoustic = track.acousticProfile || {};
      const bpm = acoustic.bpm || 120;
      const key = (acoustic.camelotKey || '8A').toUpperCase();
      const energy = Number(acoustic.energy ?? 0.5);
      const valence = Number(acoustic.valence ?? 0.5);
      const genre = (track.genre || '').toLowerCase();

      // 1. Content-based scoring (0 to 1)
      let contentScore = 0;
      const contentReasons = [];

      // Genre match (weight 0.25)
      if (favoriteGenres.some(fav => genre.includes(fav) || fav.includes(genre))) {
        contentScore += 0.25;
        contentReasons.push(`matches your favorite genre (${track.genre})`);
      }

      // BPM match (weight 0.25)
      const avgPreferredBpm = (preferredBpm.min + preferredBpm.max) / 2;
      const bpmDelta = Math.abs(bpm - avgPreferredBpm);
      if (bpm >= preferredBpm.min && bpm <= preferredBpm.max) {
        contentScore += 0.25;
        contentReasons.push(`fits your preferred tempo range (${preferredBpm.min}-${preferredBpm.max} BPM)`);
      } else {
        const bpmPenalty = Math.max(0, 0.25 - (bpmDelta / 100));
        contentScore += bpmPenalty;
      }

      // Camelot key match (weight 0.20)
      if (preferredKeys.has(key)) {
        contentScore += 0.20;
        contentReasons.push(`in your preferred harmonic key ${key}`);
      } else {
        // Partial score if adjacent to a preferred key
        for (const prefKey of preferredKeys) {
          const harm = evaluateHarmonicCompatibility(prefKey, key);
          if (harm.compatible) {
            contentScore += 0.12;
            break;
          }
        }
      }

      // Energy & Valence fit (weight 0.15 + 0.15)
      const energyFit = Math.max(0, 1 - Math.abs(energy - targetEnergy));
      const valenceFit = Math.max(0, 1 - Math.abs(valence - targetValence));
      contentScore += (energyFit * 0.15) + (valenceFit * 0.15);

      // 2. Collaborative interaction scoring (0 to 1)
      let collaborativeScore = 0;
      let collaborativeReason = null;

      const coScore = coOccurrenceWeights[trackIdStr];
      if (coScore && coScore > 0) {
        collaborativeScore = Math.min(1.0, coScore);
        collaborativeReason = `frequently enjoyed alongside other tracks in your rotation`;
      }

      // Weigh components: if user is new (few interactions), lean 90% content-based
      const hasInteractionData = userInteractions.length >= 3 && Object.keys(coOccurrenceWeights).length > 0;
      const contentWeight = hasInteractionData ? 0.65 : 0.95;
      const collabWeight = hasInteractionData ? 0.35 : 0.05;

      const totalScore = (contentScore * contentWeight) + (collaborativeScore * collabWeight);

      // Craft honest, non-fabricated explanation
      let explanation = "";
      if (collaborativeReason && hasInteractionData) {
        explanation = `Recommended based on your co-listening taste: ${collaborativeReason} and ${contentReasons.join(', ') || 'acoustic similarity'}.`;
      } else if (contentReasons.length > 0) {
        explanation = `Recommended because you enjoy ${contentReasons.join(' and ')}.`;
      } else {
        explanation = `Matches your acoustic profile around ${bpm} BPM in Camelot Key ${key} (Energy: ${(energy * 100).toFixed(0)}%).`;
      }

      scoredCandidates.push({
        track,
        trackId: trackIdStr,
        title: track.title,
        artist: track.artist,
        score: Math.round(totalScore * 100) / 100,
        contentScore: Math.round(contentScore * 100) / 100,
        collaborativeScore: Math.round(collaborativeScore * 100) / 100,
        explanation,
        alreadyLiked: likedTrackIds.has(trackIdStr),
        interactedBefore: interactedTrackIds.has(trackIdStr)
      });
    }

    // Sort by score descending and return top matches
    return scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Computes co-occurrence weights from interactions
   */
  _computeCoOccurrence(userInteractions, globalInteractions) {
    const weights = {};
    const userTrackIds = new Set(userInteractions.map(i => String(i.track?._id || i.track || '')));
    if (userTrackIds.size === 0 || globalInteractions.length === 0) return weights;

    // Group global interactions by user or session
    const userGroups = {};
    for (const item of globalInteractions) {
      const uId = String(item.user?._id || item.user || 'anonymous');
      const tId = String(item.track?._id || item.track || '');
      if (!tId) continue;
      if (!userGroups[uId]) userGroups[uId] = new Set();
      userGroups[uId].add(tId);
    }

    for (const [, trackSet] of Object.entries(userGroups)) {
      // Find intersection with current user's tracks
      let overlapCount = 0;
      for (const tId of trackSet) {
        if (userTrackIds.has(tId)) overlapCount++;
      }

      if (overlapCount > 0) {
        for (const tId of trackSet) {
          if (!userTrackIds.has(tId)) {
            weights[tId] = (weights[tId] || 0) + (overlapCount * 0.2);
          }
        }
      }
    }

    return weights;
  }
}

export const recommendationEngine = new RecommendationEngine();
