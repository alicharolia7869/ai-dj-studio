import { Track } from '../models/Track.js';
import { isValidCamelotKey } from '../utils/camelot.js';

export async function getTracks(req, res, next) {
  try {
    const { page = 1, limit = 20, search, genre, key, minBpm, maxBpm } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } }
      ];
    }

    if (genre) {
      query.genre = { $regex: genre, $options: 'i' };
    }

    if (key) {
      query['acousticProfile.camelotKey'] = key.toUpperCase();
    }

    if (minBpm || maxBpm) {
      query['acousticProfile.bpm'] = {};
      if (minBpm) query['acousticProfile.bpm'].$gte = Number(minBpm);
      if (maxBpm) query['acousticProfile.bpm'].$lte = Number(maxBpm);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tracks, total] = await Promise.all([
      Track.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Track.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        tracks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrackById(req, res, next) {
  try {
    const track = await Track.findById(req.params.trackId);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }
    res.json({ success: true, data: { track } });
  } catch (err) {
    next(err);
  }
}

export async function getTrackAcousticProfile(req, res, next) {
  try {
    const track = await Track.findById(req.params.trackId);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }
    res.json({
      success: true,
      data: {
        trackId: track._id,
        title: track.title,
        artist: track.artist,
        acousticProfile: track.acousticProfile,
        metadataTimeline: track.metadataTimeline
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createTrack(req, res, next) {
  try {
    const {
      title,
      artist,
      genre,
      duration,
      bpm,
      camelotKey,
      energy,
      valence,
      danceability,
      audioUrl,
      artworkUrl,
      metadataTimeline
    } = req.body;

    if (!title || !artist || !genre || !duration || !bpm || !camelotKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required track fields (title, artist, genre, duration, bpm, camelotKey).'
      });
    }

    const numericBpm = Number(bpm);
    if (isNaN(numericBpm) || numericBpm < 40 || numericBpm > 240) {
      return res.status(400).json({
        success: false,
        message: 'BPM must be a valid number between 40 and 240.'
      });
    }

    if (!isValidCamelotKey(camelotKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Camelot key '${camelotKey}'. Must be 1A-12A or 1B-12B.`
      });
    }

    const numericEnergy = Number(energy ?? 0.7);
    const numericValence = Number(valence ?? 0.6);
    if (numericEnergy < 0 || numericEnergy > 1 || numericValence < 0 || numericValence > 1) {
      return res.status(400).json({
        success: false,
        message: 'Energy and valence must be between 0.0 and 1.0.'
      });
    }

    let resolvedAudioUrl = audioUrl || '';
    if (req.file) {
      resolvedAudioUrl = `/uploads/audio/${req.file.filename}`;
    }

    let parsedTimeline = [];
    if (metadataTimeline) {
      parsedTimeline = typeof metadataTimeline === 'string'
        ? JSON.parse(metadataTimeline)
        : metadataTimeline;
    }

    const track = await Track.create({
      title,
      artist,
      genre,
      duration: Number(duration),
      audioUrl: resolvedAudioUrl,
      artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      acousticProfile: {
        bpm: numericBpm,
        camelotKey: camelotKey.toUpperCase().trim(),
        energy: numericEnergy,
        valence: numericValence,
        danceability: Number(danceability ?? 0.8)
      },
      metadataTimeline: parsedTimeline,
      addedBy: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Track created successfully.',
      data: { track }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTrack(req, res, next) {
  try {
    const { camelotKey, bpm, energy, valence } = req.body;

    if (camelotKey && !isValidCamelotKey(camelotKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Camelot key '${camelotKey}'. Must be 1A-12A or 1B-12B.`
      });
    }

    if (bpm && (Number(bpm) < 40 || Number(bpm) > 240)) {
      return res.status(400).json({
        success: false,
        message: 'BPM must be between 40 and 240.'
      });
    }

    const track = await Track.findById(req.params.trackId);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    if (req.body.title) track.title = req.body.title;
    if (req.body.artist) track.artist = req.body.artist;
    if (req.body.genre) track.genre = req.body.genre;
    if (req.body.duration) track.duration = Number(req.body.duration);
    if (req.body.artworkUrl) track.artworkUrl = req.body.artworkUrl;

    if (bpm) track.acousticProfile.bpm = Number(bpm);
    if (camelotKey) track.acousticProfile.camelotKey = camelotKey.toUpperCase().trim();
    if (energy !== undefined) track.acousticProfile.energy = Number(energy);
    if (valence !== undefined) track.acousticProfile.valence = Number(valence);
    if (req.body.danceability !== undefined) track.acousticProfile.danceability = Number(req.body.danceability);

    if (req.body.metadataTimeline) {
      track.metadataTimeline = typeof req.body.metadataTimeline === 'string'
        ? JSON.parse(req.body.metadataTimeline)
        : req.body.metadataTimeline;
    }

    await track.save();

    res.json({
      success: true,
      message: 'Track updated successfully.',
      data: { track }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrack(req, res, next) {
  try {
    const track = await Track.findByIdAndDelete(req.params.trackId);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }
    res.json({
      success: true,
      message: 'Track removed from catalog successfully.'
    });
  } catch (err) {
    next(err);
  }
}
