/**
 * AI DJ Studio — Contextual AI Engine & Commentary Service
 *
 * Provides intelligent, grounded DJ transition commentary, Soundclash battle announcements,
 * and live Q&A grounded strictly in available track metadata, room sentiment, and acoustic facts.
 */

import { evaluateHarmonicCompatibility, evaluateBpmCompatibility } from '../utils/camelot.js';

export class AiDjEngine {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'heuristic';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Generates transition commentary when transitioning from currentTrack to nextTrack
   *
   * @param {Object} currentTrack
   * @param {Object} nextTrack
   * @param {Object} context { crowdSentiment, roomVibe, venueName }
   * @returns {Promise<string>}
   */
  async generateTransitionCommentary(currentTrack, nextTrack, context = {}) {
    const { crowdSentiment = { category: 'Neutral', score: 0 }, roomVibe = 'High-Energy EDM' } = context;

    const currBpm = currentTrack?.acousticProfile?.bpm || currentTrack?.bpm || 128;
    const nextBpm = nextTrack?.acousticProfile?.bpm || nextTrack?.bpm || 128;
    const currKey = currentTrack?.acousticProfile?.camelotKey || currentTrack?.camelotKey || '8A';
    const nextKey = nextTrack?.acousticProfile?.camelotKey || nextTrack?.camelotKey || '8A';
    const nextEnergy = Number(nextTrack?.acousticProfile?.energy ?? nextTrack?.energy ?? 0.7);

    const harmonic = evaluateHarmonicCompatibility(currKey, nextKey);
    const bpmEval = evaluateBpmCompatibility(currBpm, nextBpm);

    // If external LLM API is configured, attempt call with graceful fallback
    if (this.provider === 'openai' && this.openaiApiKey) {
      try {
        const commentary = await this._callOpenAiTransition(currentTrack, nextTrack, context, harmonic, bpmEval);
        if (commentary) return commentary;
      } catch (err) {
        console.warn('[AI DJ] OpenAI transition failed, using deterministic engine:', err.message);
      }
    }

    // Deterministic High-Quality Commentary Generator
    return this._generateDeterministicTransition(currentTrack, nextTrack, {
      harmonic,
      bpmEval,
      crowdSentiment,
      roomVibe,
      nextEnergy
    });
  }

  /**
   * Deterministic transition commentary builder
   */
  _generateDeterministicTransition(currentTrack, nextTrack, data) {
    const { harmonic, bpmEval, crowdSentiment, nextEnergy } = data;

    let moodPhrase = "The room is locked into a steady groove";
    if (crowdSentiment.score >= 0.35) {
      moodPhrase = "The crowd's energy is electric right now";
    } else if (crowdSentiment.score <= -0.3) {
      moodPhrase = "Resetting the room's pace with a fresh dynamic";
    }

    let harmonicPhrase = "locking in on the exact same root key";
    if (harmonic.relation.includes('Relative')) {
      harmonicPhrase = `sliding into the ${harmonic.relation} for an emotional shift`;
    } else if (harmonic.relation.includes('Energy Boost')) {
      harmonicPhrase = "stepping one key up Camelot-style to elevate the floor";
    } else if (harmonic.relation.includes('Deep Resonance')) {
      harmonicPhrase = "stepping one key down to bring deep warmth to the bassline";
    }

    let tempoPhrase = `holding steady at ${nextTrack?.acousticProfile?.bpm || 128} BPM`;
    if (bpmEval.relation.includes('Double-Time')) {
      tempoPhrase = `hitting a double-time acceleration`;
    } else if (bpmEval.relation.includes('Half-Time')) {
      tempoPhrase = `dropping into a half-time groove`;
    }

    let energyPhrase = nextEnergy >= 0.8
      ? "brace for peak floor drive."
      : nextEnergy <= 0.45
      ? "bringing down the intensity for a smooth atmospheric breath."
      : "keeping the dancefloor perfectly synchronized.";

    const currTitle = currentTrack?.title || 'Current Track';
    const currArtist = currentTrack?.artist || 'Unknown Artist';
    const nextTitle = nextTrack?.title || 'Next Track';
    const nextArtist = nextTrack?.artist || 'Unknown Artist';

    return `${moodPhrase}. Moving from "${currTitle}" by ${currArtist} into "${nextTitle}" by ${nextArtist} — ${harmonicPhrase} while ${tempoPhrase}. ${energyPhrase}`;
  }

  /**
   * Answers a user's question about the track, queue, acoustic science, or room mood.
   * Grounded strictly in available metadata.
   *
   * @param {string} question
   * @param {Object} loungeContext { currentTrack, nextTrack, queue, crowdSentiment, roomSettings }
   * @returns {Promise<string>}
   */
  async answerLoungeQuestion(question, loungeContext = {}) {
    const qLower = (question || '').toLowerCase().trim();
    const { currentTrack, queue = [], crowdSentiment = { score: 0, category: 'Neutral' } } = loungeContext;

    if (!currentTrack) {
      return "There is no track currently playing in this lounge.";
    }

    // 1. "Why is this track next?" or "Why next?"
    if (qLower.includes('why') && (qLower.includes('next') || qLower.includes('queued') || qLower.includes('recommended'))) {
      if (!queue.length) {
        return "The queue is currently empty. Add a track to see acoustic compatibility recommendations.";
      }
      const candidate = queue[0].track || queue[0];
      const currKey = currentTrack.acousticProfile?.camelotKey;
      const nextKey = candidate.acousticProfile?.camelotKey;
      const currBpm = currentTrack.acousticProfile?.bpm;
      const nextBpm = candidate.acousticProfile?.bpm;

      const harm = evaluateHarmonicCompatibility(currKey, nextKey);
      const bpm = evaluateBpmCompatibility(currBpm, nextBpm);

      return `"${candidate.title}" is next because of acoustic compatibility: ${harm.relation} (${currKey} → ${nextKey}), ${bpm.relation}, and a matched energy profile of ${(candidate.acousticProfile?.energy * 100).toFixed(0)}%.`;
    }

    // 2. "Which song has the closest BPM?"
    if (qLower.includes('closest bpm') || (qLower.includes('closest') && qLower.includes('tempo'))) {
      if (!queue.length) {
        return "The queue has no pending tracks to compare against.";
      }
      const currBpm = currentTrack.acousticProfile?.bpm || 120;
      let closest = null;
      let minDiff = Infinity;

      for (const item of queue) {
        const t = item.track || item;
        const diff = Math.abs((t.acousticProfile?.bpm || 120) - currBpm);
        if (diff < minDiff) {
          minDiff = diff;
          closest = t;
        }
      }

      if (!closest) return "Could not determine closest BPM from current queue.";
      return `"${closest.title}" by ${closest.artist} has the closest tempo at ${closest.acousticProfile?.bpm} BPM (a difference of only ${minDiff.toFixed(1)} BPM from current ${currBpm} BPM).`;
    }

    // 3. "How has the crowd's mood changed?" or "What's the crowd vibe?"
    if (qLower.includes('mood') || qLower.includes('sentiment') || qLower.includes('crowd') || qLower.includes('vibe')) {
      const score = crowdSentiment.score;
      const cat = crowdSentiment.category;
      const trend = crowdSentiment.trend || 'steady';
      return `Room crowd sentiment is currently ${cat} (Score: ${score > 0 ? '+' : ''}${score.toFixed(2)} on a scale of -1.0 to +1.0) with a ${trend} trend across recent chat messages.`;
    }

    // 4. "Tell me about this track" or track metadata
    if (qLower.includes('tell me about') || qLower.includes('this track') || qLower.includes('info') || qLower.includes('details') || qLower.includes('key')) {
      const profile = currentTrack.acousticProfile || {};
      const notes = (currentTrack.metadataTimeline || []).map(m => m.note).join('; ');
      return `"${currentTrack.title}" by ${currentTrack.artist} is a ${currentTrack.genre || 'electronic'} track running at ${profile.bpm || 'unknown'} BPM in Camelot Key ${profile.camelotKey || 'unknown'}. Energy is ${(profile.energy * 100).toFixed(0)}% and Valence is ${(profile.valence * 100).toFixed(0)}%. ${notes ? `Timeline notes: ${notes}.` : 'No additional sample or timeline notes recorded in catalog metadata.'}`;
    }

    // 5. Explicit check for unrecorded metadata (sample credits, bio, etc.)
    if (qLower.includes('who wrote') || qLower.includes('sample') || qLower.includes('biography') || qLower.includes('history') || qLower.includes('awards')) {
      return `The track metadata for "${currentTrack.title}" does not contain historical biography, external sample credits, or label publishing records. Only verified acoustic profile data (BPM: ${currentTrack.acousticProfile?.bpm}, Key: ${currentTrack.acousticProfile?.camelotKey}) is stored.`;
    }

    // Generic grounded response
    return `Currently playing "${currentTrack.title}" by ${currentTrack.artist} (${currentTrack.acousticProfile?.bpm} BPM, Camelot ${currentTrack.acousticProfile?.camelotKey}). Crowd mood is ${crowdSentiment.category}. Ask me about BPM compatibility, harmonic transitions, or upcoming queue selections!`;
  }

  /**
   * Generates a Soundclash battle winner announcement
   */
  generateSoundclashAnnouncement(winningTrack, totalVotes, tieBreak = false) {
    if (tieBreak) {
      return `Soundclash tie resolved! By host decision, "${winningTrack.title}" by ${winningTrack.artist} takes the round and enters the main queue!`;
    }
    return `The crowd has spoken! With ${totalVotes} total votes, "${winningTrack.title}" by ${winningTrack.artist} wins the Soundclash battle and takes the next position in the live queue!`;
  }

  /**
   * Optional OpenAI call if configured
   */
  async _callOpenAiTransition(currentTrack, nextTrack, context, harmonic, bpmEval) {
    const prompt = `You are DJ Nexus, a resident AI DJ in a live collaborative music room.
Current track: "${currentTrack.title}" by ${currentTrack.artist} (${currentTrack.acousticProfile?.bpm} BPM, Camelot ${currentTrack.acousticProfile?.camelotKey}).
Next track: "${nextTrack.title}" by ${nextTrack.artist} (${nextTrack.acousticProfile?.bpm} BPM, Camelot ${nextTrack.acousticProfile?.camelotKey}).
Acoustic relationship: ${harmonic.relation}, ${bpmEval.relation}.
Room mood: ${context.crowdSentiment?.category} (score ${context.crowdSentiment?.score}).
Provide 2 short, energetic sentences of transition commentary. Ground all facts strictly in these values. Do not invent facts or samples.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME || 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 120,
        temperature: 0.7
      })
    });

    if (!res.ok) throw new Error(`OpenAI responded with status ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim();
  }
}

export const aiDjEngine = new AiDjEngine();
