import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { DJLounge } from '../models/DJLounge.js';
import { Track } from '../models/Track.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { SoundclashBattle } from '../models/SoundclashBattle.js';
import { QueueEvent } from '../models/QueueEvent.js';
import { analyzeMessageSentiment, calculateRoomCrowdSentiment } from '../utils/sentiment.js';
import { evaluateSegueCandidate, rankSegueCandidates } from '../utils/camelot.js';
import { aiDjEngine } from '../services/aiEngine.js';

export function setupLoungeSocket(io) {
  // Authentication middleware for socket handshakes
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        // Allow anonymous/guest read-only participant
        socket.user = {
          _id: 'guest_' + socket.id.slice(0, 8),
          displayName: 'Guest ' + socket.id.slice(0, 4),
          role: 'listener',
          isGuest: true
        };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_jwt_secret_key_32_chars_min');
      const user = await User.findById(decoded.id).select('displayName email role avatar musicPreferences');
      if (!user) {
        return next(new Error('User not found.'));
      }
      socket.user = user;
      next();
    } catch (err) {
      // If token expired/invalid, allow as guest or report error
      socket.user = {
        _id: 'guest_' + socket.id.slice(0, 8),
        displayName: 'Guest ' + socket.id.slice(0, 4),
        role: 'listener',
        isGuest: true
      };
      next();
    }
  });

  io.on('connection', (socket) => {
    let currentLoungeId = null;

    // Join lounge
    socket.on('lounge:join', async ({ loungeId }) => {
      try {
        if (!loungeId) return socket.emit('error', { message: 'loungeId is required.' });

        // Leave previous room if any
        if (currentLoungeId) {
          socket.leave(`lounge:${currentLoungeId}`);
        }

        const roomKey = `lounge:${loungeId}`;
        socket.join(roomKey);
        currentLoungeId = loungeId;

        // Fetch full authoritative state
        const lounge = await DJLounge.findById(loungeId)
          .populate('host', 'displayName avatar role')
          .populate('currentTrack.track')
          .populate('queue.track')
          .populate('queue.addedBy', 'displayName avatar')
          .populate({
            path: 'activeBattle',
            populate: [
              { path: 'candidates.track' },
              { path: 'candidates.submittedBy', select: 'displayName avatar' }
            ]
          });

        if (!lounge) {
          return socket.emit('error', { message: 'DJ Lounge not found.' });
        }

        // Add or update participant presence with deduplication
        const userIdStr = socket.user?._id ? socket.user._id.toString() : '';
        const seenUsers = new Set();
        lounge.participants = lounge.participants.filter(p => {
          if (!p || !p.user) return false;
          const uStr = p.user.toString();
          if (seenUsers.has(uStr)) return false;
          seenUsers.add(uStr);
          return true;
        });

        let participant = lounge.participants.find(p => p.user && p.user.toString() === userIdStr);
        if (!participant && !socket.user.isGuest) {
          const hostId = lounge.host?._id ? lounge.host._id.toString() : lounge.host ? lounge.host.toString() : '';
          lounge.participants.push({
            user: socket.user._id,
            role: hostId === userIdStr ? 'host' : socket.user.role === 'admin' ? 'host' : 'listener',
            socketId: socket.id,
            joinedAt: new Date(),
            lastSeenAt: new Date()
          });
          await lounge.save();
        } else if (participant) {
          participant.socketId = socket.id;
          participant.lastSeenAt = new Date();
          await lounge.save();
        }

        // Fetch recent messages & crowd sentiment
        const recentMessages = await ChatMessage.find({ lounge: loungeId })
          .populate('user', 'displayName avatar role')
          .sort({ createdAt: -1 })
          .limit(30);

        const crowdSentiment = calculateRoomCrowdSentiment(recentMessages);

        // Send full state to joining client
        socket.emit('lounge:state', {
          lounge,
          crowdSentiment,
          messages: recentMessages.reverse(),
          user: socket.user
        });

        // Broadcast presence to room
        io.to(roomKey).emit('lounge:participant-joined', {
          user: {
            id: socket.user._id,
            displayName: socket.user.displayName,
            role: socket.user.role,
            avatar: socket.user.avatar
          },
          participantCount: lounge.participants.length
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Leave lounge
    socket.on('lounge:leave', async () => {
      if (currentLoungeId) {
        try {
          const lounge = await DJLounge.findById(currentLoungeId);
          if (lounge) {
            const userIdStr = socket.user?._id ? socket.user._id.toString() : '';
            lounge.participants = lounge.participants.filter(
              p => p && p.socketId !== socket.id && (userIdStr ? p.user?.toString() !== userIdStr : true)
            );
            await lounge.save();

            io.to(`lounge:${currentLoungeId}`).emit('lounge:participant-left', {
              userId: socket.user?._id,
              displayName: socket.user?.displayName,
              participantCount: lounge.participants.length
            });
          }
        } catch (_) {}
        socket.leave(`lounge:${currentLoungeId}`);
        currentLoungeId = null;
      }
    });

    // Add track to queue
    socket.on('queue:add', async ({ loungeId, trackId }) => {
      try {
        if (!loungeId || !trackId) return;
        const [lounge, track] = await Promise.all([
          DJLounge.findById(loungeId).populate('currentTrack.track'),
          Track.findById(trackId)
        ]);

        if (!lounge || !track) return socket.emit('error', { message: 'Lounge or track not found.' });

        const alreadyQueued = lounge.queue.some(i => i.track?.toString() === trackId);
        if (alreadyQueued) {
          return socket.emit('error', { message: 'Track is already in the queue.' });
        }

        let recommendationReason = 'Added by crowd';
        if (lounge.currentTrack?.track) {
          const evalRes = evaluateSegueCandidate(lounge.currentTrack.track, track);
          recommendationReason = evalRes.explanation;
        }

        lounge.queue.push({
          track: track._id,
          addedBy: socket.user._id,
          addedAt: new Date(),
          votes: [{ user: socket.user._id, vote: 1 }],
          score: 1,
          recommendationReason
        });

        await lounge.save();

        await QueueEvent.create({
          lounge: lounge._id,
          user: socket.user._id,
          eventType: 'add',
          payload: { trackId, trackTitle: track.title }
        });

        await lounge.populate([
          { path: 'queue.track' },
          { path: 'queue.addedBy', select: 'displayName avatar' }
        ]);

        io.to(`lounge:${loungeId}`).emit('queue:update', {
          queue: lounge.queue,
          action: 'add',
          track: track.title
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Vote on queued track
    socket.on('queue:vote', async ({ loungeId, trackId }) => {
      try {
        if (!loungeId || !trackId) return;
        const lounge = await DJLounge.findById(loungeId);
        if (!lounge) return;

        const queueItem = lounge.queue.find(item =>
          item.track?.toString() === trackId || item._id.toString() === trackId
        );
        if (!queueItem) return;

        const userIdStr = socket.user._id.toString();
        const existingIndex = queueItem.votes.findIndex(v => v.user.toString() === userIdStr);

        if (existingIndex !== -1) {
          queueItem.votes.splice(existingIndex, 1);
        } else {
          queueItem.votes.push({ user: socket.user._id, vote: 1 });
        }

        queueItem.score = queueItem.votes.length;

        if (lounge.queueVotingMode === 'democracy') {
          lounge.queue.sort((a, b) => b.score - a.score);
        }

        await lounge.save();

        await QueueEvent.create({
          lounge: lounge._id,
          user: socket.user._id,
          eventType: 'vote',
          payload: { trackId, score: queueItem.score }
        });

        await lounge.populate([
          { path: 'queue.track' },
          { path: 'queue.addedBy', select: 'displayName avatar' }
        ]);

        io.to(`lounge:${loungeId}`).emit('queue:update', {
          queue: lounge.queue,
          action: 'vote',
          trackId
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Reorder queue (host or co-dj)
    socket.on('queue:reorder', async ({ loungeId, reorderedQueueIds }) => {
      try {
        if (!loungeId || !Array.isArray(reorderedQueueIds)) return;
        const lounge = await DJLounge.findById(loungeId);
        if (!lounge) return;

        const idMap = new Map(lounge.queue.map(item => [item._id.toString(), item]));
        const newQueue = [];
        for (const id of reorderedQueueIds) {
          if (idMap.has(id)) {
            newQueue.push(idMap.get(id));
            idMap.delete(id);
          }
        }
        for (const leftover of idMap.values()) {
          newQueue.push(leftover);
        }

        lounge.queue = newQueue;
        await lounge.save();

        await lounge.populate([
          { path: 'queue.track' },
          { path: 'queue.addedBy', select: 'displayName avatar' }
        ]);

        io.to(`lounge:${loungeId}`).emit('queue:update', {
          queue: lounge.queue,
          action: 'reorder'
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Chat message & sentiment
    socket.on('chat:send', async ({ loungeId, message }) => {
      try {
        if (!loungeId || !message || !message.trim()) return;

        const sentiment = analyzeMessageSentiment(message);

        const chatMsg = await ChatMessage.create({
          lounge: loungeId,
          user: socket.user._id,
          message: message.trim(),
          sentiment: {
            score: sentiment.score,
            label: sentiment.label,
            arousal: sentiment.arousal
          }
        });

        await chatMsg.populate('user', 'displayName avatar role');

        // Broadcast message to lounge
        io.to(`lounge:${loungeId}`).emit('chat:message', chatMsg);

        // Update rolling room sentiment
        const recentMessages = await ChatMessage.find({ lounge: loungeId }).sort({ createdAt: -1 }).limit(30);
        const crowdSentiment = calculateRoomCrowdSentiment(recentMessages);

        io.to(`lounge:${loungeId}`).emit('sentiment:update', crowdSentiment);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Chat typing indicator
    socket.on('chat:typing', ({ loungeId, isTyping }) => {
      if (loungeId) {
        socket.to(`lounge:${loungeId}`).emit('chat:typing', {
          userId: socket.user._id,
          displayName: socket.user.displayName,
          isTyping
        });
      }
    });

    // Soundclash battle creation
    socket.on('soundclash:create', async ({ loungeId, candidateTrackIds, durationSeconds = 45 }) => {
      try {
        if (!loungeId || !candidateTrackIds || candidateTrackIds.length < 2) return;
        const lounge = await DJLounge.findById(loungeId);
        if (!lounge) return;

        const tracks = await Track.find({ _id: { $in: candidateTrackIds } });
        const duration = Math.max(15, Math.min(180, Number(durationSeconds)));
        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + (duration * 1000));

        const battle = await SoundclashBattle.create({
          lounge: loungeId,
          createdBy: socket.user._id,
          candidates: tracks.map(t => ({
            track: t._id,
            submittedBy: socket.user._id,
            votes: []
          })),
          status: 'voting',
          durationSeconds: duration,
          startedAt,
          expiresAt
        });

        lounge.activeBattle = battle._id;
        await lounge.save();

        await battle.populate([
          { path: 'candidates.track' },
          { path: 'candidates.submittedBy', select: 'displayName avatar' }
        ]);

        io.to(`lounge:${loungeId}`).emit('soundclash:opened', { battle });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Soundclash voting
    socket.on('soundclash:vote', async ({ loungeId, battleId, candidateTrackId }) => {
      try {
        if (!battleId || !candidateTrackId) return;
        const battle = await SoundclashBattle.findById(battleId);
        if (!battle || battle.status !== 'voting' || new Date() > new Date(battle.expiresAt)) {
          return socket.emit('error', { message: 'Battle voting window is closed.' });
        }

        const userIdStr = socket.user._id.toString();
        const target = battle.candidates.find(c =>
          c.track.toString() === candidateTrackId || c._id.toString() === candidateTrackId
        );
        if (!target) return;

        for (const cand of battle.candidates) {
          cand.votes = cand.votes.filter(v => v.user.toString() !== userIdStr);
        }

        target.votes.push({
          user: socket.user._id,
          votedAt: new Date()
        });

        await battle.save();

        await battle.populate([
          { path: 'candidates.track' },
          { path: 'candidates.submittedBy', select: 'displayName avatar' }
        ]);

        io.to(`lounge:${loungeId || battle.lounge}`).emit('soundclash:vote-update', { battle });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Soundclash resolution
    socket.on('soundclash:resolve', async ({ loungeId, battleId, tieBreakerTrackId }) => {
      try {
        const battle = await SoundclashBattle.findById(battleId)
          .populate('candidates.track')
          .populate('lounge');
        if (!battle || battle.status === 'resolved') return;

        let maxVotes = -1;
        let winnerCand = null;
        let isTie = false;

        for (const cand of battle.candidates) {
          const count = cand.votes.length;
          if (count > maxVotes) {
            maxVotes = count;
            winnerCand = cand;
            isTie = false;
          } else if (count === maxVotes && count > 0) {
            isTie = true;
          }
        }

        if (isTie && tieBreakerTrackId) {
          const choice = battle.candidates.find(c => c.track?._id.toString() === tieBreakerTrackId);
          if (choice) winnerCand = choice;
        }

        if (!winnerCand && battle.candidates.length > 0) {
          winnerCand = battle.candidates[0];
        }

        const winningTrack = winnerCand?.track;
        if (!winningTrack) return;

        battle.status = 'resolved';
        battle.winner = winningTrack._id;
        battle.tieBreak = isTie;
        battle.resolutionReason = isTie
          ? `Tie resolved: "${winningTrack.title}" chosen.`
          : `Won with ${maxVotes} votes.`;
        await battle.save();

        const lounge = await DJLounge.findById(battle.lounge._id || battle.lounge);
        if (lounge) {
          const alreadyInQueue = lounge.queue.some(q => q.track?.toString() === winningTrack._id.toString());
          if (!alreadyInQueue) {
            lounge.queue.unshift({
              track: winningTrack._id,
              addedBy: socket.user._id,
              addedAt: new Date(),
              votes: [{ user: socket.user._id, vote: 1 }],
              score: Math.max(1, maxVotes),
              recommendationReason: `🏆 Soundclash Winner (${maxVotes} votes)`
            });
          }
          lounge.activeBattle = null;
          await lounge.save();
          await lounge.populate('queue.track');
        }

        const announcement = aiDjEngine.generateSoundclashAnnouncement(winningTrack, maxVotes, isTie);

        io.to(`lounge:${loungeId || battle.lounge._id}`).emit('soundclash:resolved', {
          battle,
          winner: winningTrack,
          announcement,
          updatedQueue: lounge?.queue
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // AI Q&A
    socket.on('ai:ask', async ({ loungeId, question }) => {
      try {
        if (!loungeId || !question) return;
        const lounge = await DJLounge.findById(loungeId)
          .populate('currentTrack.track')
          .populate('queue.track');

        if (!lounge) return;

        const recentMessages = await ChatMessage.find({ lounge: loungeId }).sort({ createdAt: -1 }).limit(20);
        const crowdSentiment = calculateRoomCrowdSentiment(recentMessages);

        const answer = await aiDjEngine.answerLoungeQuestion(question, {
          currentTrack: lounge.currentTrack?.track,
          queue: lounge.queue,
          crowdSentiment,
          roomSettings: lounge
        });

        // Broadcast AI response to the lounge so everyone learns from the answer
        io.to(`lounge:${loungeId}`).emit('ai:announcement', {
          question,
          answer,
          speaker: 'DJ Nexus AI'
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Playback command (play, pause, seek, next)
    socket.on('playback:command', async ({ loungeId, command, position, trackId }) => {
      try {
        if (!loungeId) return;
        const lounge = await DJLounge.findById(loungeId).populate('currentTrack.track').populate('queue.track');
        if (!lounge) return;

        // Permissions: Host, Co-DJ, or Admin
        const isHost = lounge.host.toString() === socket.user._id.toString();
        const participant = lounge.participants.find(p => p.user.toString() === socket.user._id.toString());
        const isCoDj = participant?.role === 'co-dj';
        if (!isHost && !isCoDj && socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Only hosts and co-DJs can control playback.' });
        }

        if (command === 'play') {
          if (lounge.currentTrack) lounge.currentTrack.isPlaying = true;
        } else if (command === 'pause') {
          if (lounge.currentTrack) lounge.currentTrack.isPlaying = false;
        } else if (command === 'seek' && typeof position === 'number') {
          if (lounge.currentTrack) lounge.currentTrack.playbackPosition = position;
        } else if (command === 'next') {
          // Advance queue
          if (lounge.queue.length > 0) {
            const nextItem = lounge.queue.shift();
            const nextTrack = await Track.findById(nextItem.track);
            const prevTrack = lounge.currentTrack?.track;

            lounge.currentTrack = {
              track: nextTrack._id,
              startedAt: new Date(),
              isPlaying: true,
              playbackPosition: 0,
              volume: 0.85
            };

            await lounge.save();
            await lounge.populate(['currentTrack.track', 'queue.track']);

            // Transition commentary announcement
            if (prevTrack && nextTrack) {
              const recentMessages = await ChatMessage.find({ lounge: loungeId }).sort({ createdAt: -1 }).limit(20);
              const crowdSentiment = calculateRoomCrowdSentiment(recentMessages);
              const commentary = await aiDjEngine.generateTransitionCommentary(prevTrack, nextTrack, {
                crowdSentiment,
                roomVibe: lounge.vibeProfile
              });

              io.to(`lounge:${loungeId}`).emit('ai:recommendation', {
                commentary,
                prevTrack: prevTrack.title,
                nextTrack: nextTrack.title
              });
            }
          }
        }

        await lounge.save();

        io.to(`lounge:${loungeId}`).emit('playback:update', {
          currentTrack: lounge.currentTrack,
          queue: lounge.queue,
          command,
          timestamp: Date.now()
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Real-time synchronization ping/pong
    socket.on('sync:ping', ({ timestamp }) => {
      socket.emit('sync:pong', { clientTimestamp: timestamp, serverTimestamp: Date.now() });
    });

    socket.on('disconnect', async () => {
      if (currentLoungeId) {
        try {
          const lounge = await DJLounge.findById(currentLoungeId);
          if (lounge) {
            const userIdStr = socket.user?._id ? socket.user._id.toString() : '';
            lounge.participants = lounge.participants.filter(
              p => p && p.socketId !== socket.id && (userIdStr ? p.user?.toString() !== userIdStr : true)
            );
            await lounge.save();

            io.to(`lounge:${currentLoungeId}`).emit('lounge:participant-left', {
              userId: socket.user?._id,
              displayName: socket.user?.displayName,
              participantCount: lounge.participants.length
            });
          }
        } catch (err) {
          console.error('[SOCKET DISCONNECT] Error updating participants:', err.message);
        }
      }
    });
  });
}
