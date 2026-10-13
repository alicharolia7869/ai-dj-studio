import { DJLounge } from '../models/DJLounge.js';
import { QueueEvent } from '../models/QueueEvent.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { SoundclashBattle } from '../models/SoundclashBattle.js';
import { SessionAnalytics } from '../models/SessionAnalytics.js';
import { calculateRoomCrowdSentiment } from '../utils/sentiment.js';
import { resolveLoungeQuery } from './loungeController.js';

export async function getLoungeAnalytics(req, res, next) {
  try {
    const { loungeId } = req.params;

    const lounge = await DJLounge.findOne(resolveLoungeQuery(loungeId))
      .populate('currentTrack.track')
      .populate('queue.track');

    if (!lounge) {
      return res.status(404).json({ success: false, message: 'Lounge not found.' });
    }

    // Retrieve recorded events
    const [queueEvents, messages, battles] = await Promise.all([
      QueueEvent.find({ lounge: lounge._id }),
      ChatMessage.find({ lounge: lounge._id }).sort({ createdAt: 1 }),
      SoundclashBattle.find({ lounge: lounge._id }).populate('winner')
    ]);

    // Calculate real session duration in minutes
    const startTime = new Date(lounge.createdAt).getTime();
    const endTime = lounge.endedAt ? new Date(lounge.endedAt).getTime() : Date.now();
    const sessionDurationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));

    // Peak participants
    const peakParticipants = Math.max(1, lounge.participants.length);

    // Total tracks played
    const tracksPlayedCount = queueEvents.filter(e => e.eventType === 'track_start' || e.eventType === 'add').length + (lounge.currentTrack ? 1 : 0);

    // Total queue votes
    const totalQueueVotes = queueEvents.filter(e => e.eventType === 'vote').length;

    // Battles held
    const soundclashCount = battles.length;

    // AI questions asked
    const aiQuestionsCount = messages.filter(m => m.isAiDj || m.message.startsWith('/ai') || m.message.toLowerCase().includes('why') || m.message.toLowerCase().includes('bpm')).length;

    // Sentiment metrics & timeline
    const sentimentSummary = calculateRoomCrowdSentiment(messages);
    const sentimentTimeline = (sentimentSummary.history || []).map(h => ({
      timestamp: h.timestamp,
      score: h.score,
      label: h.score >= 0.25 ? 'positive' : h.score <= -0.25 ? 'negative' : 'neutral'
    }));

    // Energy progression
    const energyProgression = [];
    if (lounge.currentTrack?.track) {
      energyProgression.push({
        timestamp: new Date(lounge.currentTrack.startedAt || lounge.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        trackTitle: lounge.currentTrack.track.title,
        energy: lounge.currentTrack.track.acousticProfile?.energy || 0.7,
        bpm: lounge.currentTrack.track.acousticProfile?.bpm || 128
      });
    }

    for (const item of lounge.queue) {
      if (item.track) {
        energyProgression.push({
          timestamp: new Date(item.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          trackTitle: item.track.title,
          energy: item.track.acousticProfile?.energy || 0.7,
          bpm: item.track.acousticProfile?.bpm || 128
        });
      }
    }

    // Most-voted tracks
    const trackVoteMap = {};
    for (const item of lounge.queue) {
      if (item.track) {
        const id = item.track._id.toString();
        trackVoteMap[id] = {
          track: item.track._id,
          title: item.track.title,
          artist: item.track.artist,
          voteCount: item.score || item.votes?.length || 0
        };
      }
    }
    const mostVotedTracks = Object.values(trackVoteMap).sort((a, b) => b.voteCount - a.voteCount).slice(0, 5);

    const analyticsData = {
      loungeId: lounge._id,
      loungeName: lounge.name,
      vibeProfile: lounge.vibeProfile,
      sessionDuration: sessionDurationMinutes,
      peakParticipants,
      totalTracksPlayed: tracksPlayedCount,
      totalQueueVotes,
      soundclashCount,
      aiQuestionsCount,
      averageSentiment: sentimentSummary.score,
      sentimentCategory: sentimentSummary.category,
      sentimentTimeline,
      energyProgression,
      mostVotedTracks,
      isLiveSession: lounge.status === 'active'
    };

    res.json({
      success: true,
      data: { analytics: analyticsData }
    });
  } catch (err) {
    next(err);
  }
}
