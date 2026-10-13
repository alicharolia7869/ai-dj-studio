import { SoundclashBattle } from '../models/SoundclashBattle.js';
import { DJLounge } from '../models/DJLounge.js';
import { Track } from '../models/Track.js';
import { aiDjEngine } from '../services/aiEngine.js';
import { resolveLoungeQuery } from './loungeController.js';

export async function createBattle(req, res, next) {
  try {
    const { loungeId } = req.params;
    const { candidateTrackIds = [], durationSeconds = 45 } = req.body;

    const lounge = await DJLounge.findOne(resolveLoungeQuery(loungeId));
    if (!lounge) return res.status(404).json({ success: false, message: 'Lounge not found.' });

    // Host or Co-DJ permission
    const isHost = lounge.host.toString() === req.user._id.toString();
    const isCoDj = lounge.participants.some(p => p.user.toString() === req.user._id.toString() && p.role === 'co-dj');
    if (!isHost && !isCoDj && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only hosts and co-DJs can launch Soundclash battles.' });
    }

    if (candidateTrackIds.length < 2 || candidateTrackIds.length > 4) {
      return res.status(400).json({ success: false, message: 'A Soundclash battle requires between 2 and 4 candidate tracks.' });
    }

    // Verify tracks exist
    const tracks = await Track.find({ _id: { $in: candidateTrackIds } });
    if (tracks.length !== candidateTrackIds.length) {
      return res.status(400).json({ success: false, message: 'One or more selected tracks could not be found.' });
    }

    const duration = Math.max(15, Math.min(180, Number(durationSeconds)));
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + (duration * 1000));

    const battle = new SoundclashBattle({
      lounge: lounge._id,
      createdBy: req.user._id,
      candidates: tracks.map(t => ({
        track: t._id,
        submittedBy: req.user._id,
        votes: []
      })),
      status: 'voting',
      durationSeconds: duration,
      startedAt,
      expiresAt
    });

    await battle.save();

    lounge.activeBattle = battle._id;
    await lounge.save();

    await battle.populate([
      { path: 'candidates.track' },
      { path: 'candidates.submittedBy', select: 'displayName avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Soundclash battle opened!',
      data: { battle }
    });
  } catch (err) {
    next(err);
  }
}

export async function addCandidate(req, res, next) {
  try {
    const { battleId } = req.params;
    const { trackId } = req.body;

    const battle = await SoundclashBattle.findById(battleId);
    if (!battle) return res.status(404).json({ success: false, message: 'Battle not found.' });

    if (battle.status !== 'voting' || new Date() > new Date(battle.expiresAt)) {
      return res.status(400).json({ success: false, message: 'This battle is no longer open for candidate submissions.' });
    }

    if (battle.candidates.length >= 4) {
      return res.status(400).json({ success: false, message: 'Battle candidate capacity reached (maximum 4 tracks).' });
    }

    const track = await Track.findById(trackId);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found.' });

    const alreadyCandidate = battle.candidates.some(c => c.track.toString() === trackId);
    if (alreadyCandidate) {
      return res.status(400).json({ success: false, message: 'This track is already competing in this battle.' });
    }

    battle.candidates.push({
      track: track._id,
      submittedBy: req.user._id,
      votes: []
    });

    await battle.save();
    await battle.populate('candidates.track');

    res.json({
      success: true,
      message: 'Candidate track submitted.',
      data: { battle }
    });
  } catch (err) {
    next(err);
  }
}

export async function voteBattle(req, res, next) {
  try {
    const { battleId } = req.params;
    const { candidateTrackId } = req.body;

    const battle = await SoundclashBattle.findById(battleId);
    if (!battle) return res.status(404).json({ success: false, message: 'Battle not found.' });

    if (battle.status !== 'voting') {
      return res.status(400).json({ success: false, message: 'Voting is closed for this battle.' });
    }

    if (new Date() > new Date(battle.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Battle voting window has expired.' });
    }

    const userIdStr = req.user._id.toString();

    // Check if candidate track is valid in this battle
    const targetCandidate = battle.candidates.find(c =>
      c.track.toString() === candidateTrackId || c._id.toString() === candidateTrackId
    );

    if (!targetCandidate) {
      return res.status(400).json({ success: false, message: 'Selected track is not a candidate in this battle.' });
    }

    // Remove user's previous vote from ANY candidate (enforcing 1 vote per user)
    for (const cand of battle.candidates) {
      cand.votes = cand.votes.filter(v => v.user.toString() !== userIdStr);
    }

    // Add new vote
    targetCandidate.votes.push({
      user: req.user._id,
      votedAt: new Date()
    });

    await battle.save();

    await battle.populate([
      { path: 'candidates.track' },
      { path: 'candidates.submittedBy', select: 'displayName avatar' }
    ]);

    res.json({
      success: true,
      message: 'Vote submitted.',
      data: { battle }
    });
  } catch (err) {
    next(err);
  }
}

export async function resolveBattle(req, res, next) {
  try {
    const { battleId } = req.params;
    const { tieBreakerWinnerTrackId } = req.body;

    const battle = await SoundclashBattle.findById(battleId)
      .populate('candidates.track')
      .populate('lounge');

    if (!battle) return res.status(404).json({ success: false, message: 'Battle not found.' });

    if (battle.status === 'resolved') {
      return res.json({ success: true, message: 'Battle was already resolved.', data: { battle } });
    }

    // Determine winner deterministically by vote count
    let maxVotes = -1;
    let winningCandidate = null;
    let isTie = false;
    const tiedCandidates = [];

    for (const cand of battle.candidates) {
      const count = cand.votes.length;
      if (count > maxVotes) {
        maxVotes = count;
        winningCandidate = cand;
        isTie = false;
        tiedCandidates.length = 0;
        tiedCandidates.push(cand);
      } else if (count === maxVotes && count > 0) {
        isTie = true;
        tiedCandidates.push(cand);
      }
    }

    // If all candidates received 0 votes, pick candidate 1 by default
    if (maxVotes === 0 && battle.candidates.length > 0) {
      winningCandidate = battle.candidates[0];
    }

    // If host supplied tie breaker override
    if (isTie && tieBreakerWinnerTrackId) {
      const hostChoice = battle.candidates.find(c => c.track?._id.toString() === tieBreakerWinnerTrackId);
      if (hostChoice) {
        winningCandidate = hostChoice;
      }
    }

    const winningTrack = winningCandidate?.track;
    if (!winningTrack) {
      return res.status(400).json({ success: false, message: 'Could not determine winning track.' });
    }

    battle.status = 'resolved';
    battle.winner = winningTrack._id;
    battle.tieBreak = isTie;
    battle.resolutionReason = isTie
      ? `Tie resolved: "${winningTrack.title}" selected by tie-break resolution.`
      : `Decided by crowd vote with ${maxVotes} votes.`;

    await battle.save();

    // Insert winning track into the lounge queue at top position!
    const lounge = await DJLounge.findById(battle.lounge._id || battle.lounge);
    if (lounge) {
      const alreadyInQueue = lounge.queue.some(q => q.track?.toString() === winningTrack._id.toString());
      if (!alreadyInQueue) {
        lounge.queue.unshift({
          track: winningTrack._id,
          addedBy: req.user._id,
          addedAt: new Date(),
          votes: [{ user: req.user._id, vote: 1 }],
          score: Math.max(1, maxVotes),
          recommendationReason: `🏆 Soundclash Winner (${maxVotes} votes)`
        });
      }
      lounge.activeBattle = null;
      await lounge.save();
    }

    const announcement = aiDjEngine.generateSoundclashAnnouncement(winningTrack, maxVotes, isTie);

    res.json({
      success: true,
      message: 'Battle resolved.',
      data: {
        battle,
        winner: winningTrack,
        announcement
      }
    });
  } catch (err) {
    next(err);
  }
}
