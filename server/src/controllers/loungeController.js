import crypto from 'crypto';
import mongoose from 'mongoose';
import { DJLounge } from '../models/DJLounge.js';
import { Track } from '../models/Track.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { QueueEvent } from '../models/QueueEvent.js';
import { Interaction } from '../models/Interaction.js';
import { rankSegueCandidates, evaluateSegueCandidate } from '../utils/camelot.js';
import { analyzeMessageSentiment, calculateRoomCrowdSentiment } from '../utils/sentiment.js';
import { aiDjEngine } from '../services/aiEngine.js';

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export function resolveLoungeQuery(idOrCode) {
  if (!idOrCode) return { _id: null };
  const cleaned = idOrCode.toString().trim();
  if (mongoose.Types.ObjectId.isValid(cleaned)) {
    return { _id: cleaned };
  }
  return { inviteCode: cleaned.toUpperCase() };
}

export async function createLounge(req, res, next) {
  try {
    const {
      name,
      description,
      startingTrackId,
      vibeProfile = 'Deep House',
      genrePreference = 'Electronic',
      maxParticipants = 50,
      bpmTolerance = 0.08,
      soundclashEnabled = true,
      aiCommentaryLevel = 'full',
      queueVotingMode = 'democracy',
      isPrivate = false
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Lounge name is required.' });
    }

    let startingTrack = null;
    if (startingTrackId) {
      startingTrack = await Track.findById(startingTrackId);
    }
    if (!startingTrack) {
      // Pick any demo track if startingTrackId not provided
      startingTrack = await Track.findOne();
    }

    // Ensure unique invite code
    let inviteCode = generateInviteCode();
    while (await DJLounge.findOne({ inviteCode })) {
      inviteCode = generateInviteCode();
    }

    const lounge = new DJLounge({
      host: req.user._id,
      name,
      description: description || '',
      inviteCode,
      vibeProfile,
      genrePreference,
      maxParticipants: Number(maxParticipants),
      bpmTolerance: Number(bpmTolerance),
      soundclashEnabled: Boolean(soundclashEnabled),
      aiCommentaryLevel,
      queueVotingMode,
      isPrivate: Boolean(isPrivate),
      currentTrack: startingTrack ? {
        track: startingTrack._id,
        startedAt: new Date(),
        isPlaying: true,
        playbackPosition: 0,
        volume: 0.85
      } : undefined,
      participants: [{
        user: req.user._id,
        role: 'host',
        joinedAt: new Date(),
        lastSeenAt: new Date()
      }]
    });

    await lounge.save();

    // Populate track and host
    await lounge.populate([
      { path: 'host', select: 'displayName email avatar role' },
      { path: 'currentTrack.track' },
      { path: 'participants.user', select: 'displayName avatar role' }
    ]);

    // Record initial listening interaction
    if (startingTrack) {
      await Interaction.create({
        user: req.user._id,
        track: startingTrack._id,
        lounge: lounge._id,
        eventType: 'played',
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'DJ Lounge created successfully.',
      data: { lounge }
    });
  } catch (err) {
    next(err);
  }
}

export async function getLounges(req, res, next) {
  try {
    const { status = 'active', search, vibe } = req.query;
    const query = { status };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { inviteCode: search.toUpperCase() }
      ];
    }

    if (vibe) {
      query.vibeProfile = vibe;
    }

    const lounges = await DJLounge.find(query)
      .populate('host', 'displayName avatar role')
      .populate('currentTrack.track')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      data: { lounges }
    });
  } catch (err) {
    next(err);
  }
}

export async function getLoungeById(req, res, next) {
  try {
    const { loungeId } = req.params;
    const query = resolveLoungeQuery(loungeId);

    const lounge = await DJLounge.findOne(query)
      .populate('host', 'displayName email avatar role')
      .populate('currentTrack.track')
      .populate('queue.track')
      .populate('queue.addedBy', 'displayName avatar')
      .populate('participants.user', 'displayName avatar role')
      .populate({
        path: 'activeBattle',
        populate: [
          { path: 'candidates.track' },
          { path: 'candidates.submittedBy', select: 'displayName avatar' }
        ]
      });

    if (!lounge) {
      return res.status(404).json({ success: false, message: 'DJ Lounge not found or expired.' });
    }

    res.json({ success: true, data: { lounge } });
  } catch (err) {
    next(err);
  }
}

export async function joinLounge(req, res, next) {
  try {
    const { loungeId } = req.params;
    const { inviteCode } = req.body;

    let query;
    if (inviteCode && inviteCode.trim()) {
      query = { inviteCode: inviteCode.toUpperCase().trim() };
    } else {
      query = resolveLoungeQuery(loungeId);
    }

    const lounge = await DJLounge.findOne(query);
    if (!lounge) {
      return res.status(404).json({ success: false, message: 'DJ Lounge not found with this code or ID.' });
    }

    if (lounge.status === 'ended') {
      return res.status(410).json({ success: false, message: 'This lounge session has ended.' });
    }

    // Capacity check
    const isAlreadyParticipant = lounge.participants.some(p => p.user.toString() === req.user._id.toString());
    if (!isAlreadyParticipant && lounge.participants.length >= lounge.maxParticipants) {
      return res.status(403).json({ success: false, message: 'This lounge is at maximum participant capacity.' });
    }

    if (!isAlreadyParticipant) {
      const isHost = lounge.host.toString() === req.user._id.toString();
      lounge.participants.push({
        user: req.user._id,
        role: isHost ? 'host' : req.user.role === 'admin' ? 'host' : 'listener',
        joinedAt: new Date(),
        lastSeenAt: new Date()
      });
      await lounge.save();
    }

    // Record interaction
    if (lounge.currentTrack?.track) {
      await Interaction.create({
        user: req.user._id,
        track: lounge.currentTrack.track,
        lounge: lounge._id,
        eventType: 'played',
        timestamp: new Date()
      });
    }

    await lounge.populate([
      { path: 'host', select: 'displayName avatar role' },
      { path: 'currentTrack.track' },
      { path: 'queue.track' },
      { path: 'participants.user', select: 'displayName avatar role' }
    ]);

    res.json({
      success: true,
      message: 'Joined lounge successfully.',
      data: { lounge }
    });
  } catch (err) {
    next(err);
  }
}

export async function leaveLounge(req, res, next) {
  try {
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    lounge.participants = lounge.participants.filter(p => p.user.toString() !== req.user._id.toString());
    await lounge.save();

    res.json({ success: true, message: 'Left lounge successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateLoungeSettings(req, res, next) {
  try {
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    // Permissions: Host or Co-DJ or Admin
    const participant = lounge.participants.find(p => p.user.toString() === req.user._id.toString());
    const isAuthorized = req.user.role === 'admin' ||
      lounge.host.toString() === req.user._id.toString() ||
      participant?.role === 'co-dj';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the host or co-DJ can update lounge settings.' });
    }

    const {
      name,
      description,
      vibeProfile,
      maxParticipants,
      bpmTolerance,
      soundclashEnabled,
      aiCommentaryLevel,
      queueVotingMode,
      isPrivate
    } = req.body;

    if (name) lounge.name = name;
    if (description !== undefined) lounge.description = description;
    if (vibeProfile) lounge.vibeProfile = vibeProfile;
    if (maxParticipants) lounge.maxParticipants = Number(maxParticipants);
    if (bpmTolerance) lounge.bpmTolerance = Number(bpmTolerance);
    if (soundclashEnabled !== undefined) lounge.soundclashEnabled = Boolean(soundclashEnabled);
    if (aiCommentaryLevel) lounge.aiCommentaryLevel = aiCommentaryLevel;
    if (queueVotingMode) lounge.queueVotingMode = queueVotingMode;
    if (isPrivate !== undefined) lounge.isPrivate = Boolean(isPrivate);

    await lounge.save();

    res.json({
      success: true,
      message: 'Lounge settings updated.',
      data: { lounge }
    });
  } catch (err) {
    next(err);
  }
}

export async function endLounge(req, res, next) {
  try {
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    if (lounge.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the lounge host can end this session.' });
    }

    lounge.status = 'ended';
    lounge.endedAt = new Date();
    if (lounge.createdAt) {
      lounge.sessionDuration = Math.round((new Date().getTime() - new Date(lounge.createdAt).getTime()) / 60000);
    }
    await lounge.save();

    res.json({
      success: true,
      message: 'Lounge session ended.',
      data: { lounge }
    });
  } catch (err) {
    next(err);
  }
}

export async function getQueue(req, res, next) {
  try {
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId))
      .populate('queue.track')
      .populate('queue.addedBy', 'displayName avatar');

    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    res.json({
      success: true,
      data: { queue: lounge.queue }
    });
  } catch (err) {
    next(err);
  }
}

export async function addToQueue(req, res, next) {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ success: false, message: 'trackId is required.' });

    const [lounge, track] = await Promise.all([
      DJLounge.findOne(resolveLoungeQuery(req.params.loungeId)).populate('currentTrack.track'),
      Track.findById(trackId)
    ]);

    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });
    if (!track) return res.status(404).json({ success: false, message: 'Track not found.' });

    // Check duplicate in queue
    const alreadyQueued = lounge.queue.some(item => item.track?.toString() === trackId);
    if (alreadyQueued) {
      return res.status(400).json({ success: false, message: 'This track is already in the queue.' });
    }

    // Evaluate acoustic compatibility for recommendation reason
    let recommendationReason = 'Added by listener';
    if (lounge.currentTrack?.track) {
      const evalResult = evaluateSegueCandidate(lounge.currentTrack.track, track);
      if (evalResult.compatible) {
        recommendationReason = evalResult.explanation;
      } else {
        recommendationReason = `Added to queue (${evalResult.explanation})`;
      }
    }

    lounge.queue.push({
      track: track._id,
      addedBy: req.user._id,
      addedAt: new Date(),
      votes: [{ user: req.user._id, vote: 1 }],
      score: 1,
      recommendationReason
    });

    await lounge.save();

    await QueueEvent.create({
      lounge: lounge._id,
      user: req.user._id,
      eventType: 'add',
      payload: { trackId, trackTitle: track.title }
    });

    await lounge.populate([
      { path: 'queue.track' },
      { path: 'queue.addedBy', select: 'displayName avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Track added to queue.',
      data: { queue: lounge.queue }
    });
  } catch (err) {
    next(err);
  }
}

export async function voteQueueTrack(req, res, next) {
  try {
    const { trackId } = req.params;
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    const queueItem = lounge.queue.find(item => item.track?.toString() === trackId || item._id.toString() === trackId);
    if (!queueItem) {
      return res.status(404).json({ success: false, message: 'Track not found in queue.' });
    }

    // Check duplicate vote
    const existingVoteIndex = queueItem.votes.findIndex(v => v.user.toString() === req.user._id.toString());
    if (existingVoteIndex !== -1) {
      // Toggle vote (unvote)
      queueItem.votes.splice(existingVoteIndex, 1);
    } else {
      // Add upvote
      queueItem.votes.push({ user: req.user._id, vote: 1 });
    }

    queueItem.score = queueItem.votes.length;

    // In democracy mode, sort queue by score descending
    if (lounge.queueVotingMode === 'democracy') {
      lounge.queue.sort((a, b) => b.score - a.score);
    }

    await lounge.save();

    await QueueEvent.create({
      lounge: lounge._id,
      user: req.user._id,
      eventType: 'vote',
      payload: { trackId, newScore: queueItem.score }
    });

    await lounge.populate([
      { path: 'queue.track' },
      { path: 'queue.addedBy', select: 'displayName avatar' }
    ]);

    res.json({
      success: true,
      message: 'Vote recorded.',
      data: { queue: lounge.queue }
    });
  } catch (err) {
    next(err);
  }
}

export async function reorderQueue(req, res, next) {
  try {
    const { reorderedQueueIds } = req.body;
    if (!Array.isArray(reorderedQueueIds)) {
      return res.status(400).json({ success: false, message: 'reorderedQueueIds array is required.' });
    }

    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    // Authorization check
    const isHost = lounge.host.toString() === req.user._id.toString();
    const participant = lounge.participants.find(p => p.user.toString() === req.user._id.toString());
    const isCoDj = participant?.role === 'co-dj';

    if (!isHost && !isCoDj && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only hosts and co-DJs can reorder the queue.' });
    }

    const idMap = new Map(lounge.queue.map(item => [item._id.toString(), item]));
    const newQueue = [];

    for (const id of reorderedQueueIds) {
      if (idMap.has(id)) {
        newQueue.push(idMap.get(id));
        idMap.delete(id);
      }
    }
    // Append any leftover items
    for (const leftover of idMap.values()) {
      newQueue.push(leftover);
    }

    lounge.queue = newQueue;
    await lounge.save();

    await lounge.populate([
      { path: 'queue.track' },
      { path: 'queue.addedBy', select: 'displayName avatar' }
    ]);

    res.json({
      success: true,
      message: 'Queue reordered successfully.',
      data: { queue: lounge.queue }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAiSegue(req, res, next) {
  try {
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId))
      .populate('currentTrack.track')
      .populate('queue.track');

    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });
    if (!lounge.currentTrack?.track) {
      return res.status(400).json({ success: false, message: 'No track is currently playing in this lounge.' });
    }

    const currentTrack = lounge.currentTrack.track;
    let candidatePool = lounge.queue.map(q => q.track).filter(Boolean);

    // If queue is empty, pull eligible candidates from catalog
    if (candidatePool.length === 0) {
      candidatePool = await Track.find({ _id: { $ne: currentTrack._id } }).limit(20);
    }

    // Retrieve recent room sentiment
    const recentMessages = await ChatMessage.find({ lounge: lounge._id }).sort({ createdAt: -1 }).limit(30);
    const crowdSentiment = calculateRoomCrowdSentiment(recentMessages);

    // Rank candidates deterministically
    const ranking = rankSegueCandidates(currentTrack, candidatePool, {
      roomSentimentScore: crowdSentiment.score,
      roomVibeTargetEnergy: lounge.vibeProfile.includes('High-Energy') ? 0.85 : 0.65
    });

    if (!ranking.bestCandidate) {
      return res.json({
        success: true,
        data: {
          hasCompatibleCandidate: false,
          message: 'No harmonically and tempo-compatible track currently found in queue. Requesting more tracks from the crowd.',
          rejectedCandidates: ranking.rejectedCandidates
        }
      });
    }

    // Generate transition commentary
    const commentary = await aiDjEngine.generateTransitionCommentary(
      currentTrack,
      ranking.bestCandidate.track,
      { crowdSentiment, roomVibe: lounge.vibeProfile }
    );

    res.json({
      success: true,
      data: {
        hasCompatibleCandidate: true,
        bestCandidate: ranking.bestCandidate,
        allRankedCandidates: ranking.validCandidates,
        commentary,
        crowdSentiment,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req, res, next) {
  try {
    const { limit = 50 } = req.query;
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    const messages = await ChatMessage.find({ lounge: lounge._id })
      .populate('user', 'displayName avatar role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: { messages: messages.reverse() }
    });
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    const sentiment = analyzeMessageSentiment(message);

    const chatMsg = await ChatMessage.create({
      lounge: lounge._id,
      user: req.user._id,
      message: message.trim(),
      sentiment: {
        score: sentiment.score,
        label: sentiment.label,
        arousal: sentiment.arousal
      }
    });

    await chatMsg.populate('user', 'displayName avatar role');

    res.status(201).json({
      success: true,
      data: { message: chatMsg }
    });
  } catch (err) {
    next(err);
  }
}

export async function getSentiment(req, res, next) {
  try {
    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    const messages = await ChatMessage.find({ lounge: lounge._id })
      .sort({ createdAt: -1 })
      .limit(40);

    const sentimentSummary = calculateRoomCrowdSentiment(messages);

    res.json({
      success: true,
      data: { sentiment: sentimentSummary }
    });
  } catch (err) {
    next(err);
  }
}

export async function askAiDj(req, res, next) {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty.' });
    }

    const lounge = await DJLounge.findOne(resolveLoungeQuery(req.params.loungeId))
      .populate('currentTrack.track')
      .populate('queue.track');

    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    const recentMessages = await ChatMessage.find({ lounge: lounge._id }).sort({ createdAt: -1 }).limit(20);
    const crowdSentiment = calculateRoomCrowdSentiment(recentMessages);

    const answer = await aiDjEngine.answerLoungeQuestion(question, {
      currentTrack: lounge.currentTrack?.track,
      queue: lounge.queue,
      crowdSentiment,
      roomSettings: lounge
    });

    res.json({
      success: true,
      data: {
        question,
        answer,
        answeredAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}
