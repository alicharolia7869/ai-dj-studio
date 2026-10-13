import { User } from '../models/User.js';
import { Track } from '../models/Track.js';
import { Interaction } from '../models/Interaction.js';
import { recommendationEngine } from '../services/recommendationEngine.js';

export async function getRecommendations(req, res, next) {
  try {
    const user = req.user;
    const [allTracks, userInteractions, globalInteractions] = await Promise.all([
      Track.find().limit(100),
      Interaction.find({ user: user._id }).populate('track').sort({ timestamp: -1 }).limit(50),
      Interaction.find({ user: { $ne: user._id } }).populate('track').limit(200)
    ]);

    const recommendations = recommendationEngine.getRecommendations({
      user,
      allTracks,
      userInteractions,
      globalInteractions,
      limit: 12
    });

    res.json({
      success: true,
      data: { recommendations }
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [interactions, total] = await Promise.all([
      Interaction.find({ user: req.user._id })
        .populate('track')
        .populate('lounge', 'name vibeProfile inviteCode')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Interaction.countDocuments({ user: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        history: interactions,
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

export async function getPreferences(req, res, next) {
  try {
    res.json({
      success: true,
      data: { preferences: req.user.musicPreferences }
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const {
      favoriteGenres,
      preferredBpmRange,
      preferredCamelotKeys,
      preferredEnergy,
      preferredValence
    } = req.body;

    if (favoriteGenres) user.musicPreferences.favoriteGenres = favoriteGenres;
    if (preferredBpmRange) user.musicPreferences.preferredBpmRange = preferredBpmRange;
    if (preferredCamelotKeys) user.musicPreferences.preferredCamelotKeys = preferredCamelotKeys;
    if (preferredEnergy !== undefined) user.musicPreferences.preferredEnergy = Number(preferredEnergy);
    if (preferredValence !== undefined) user.musicPreferences.preferredValence = Number(preferredValence);

    await user.save();

    res.json({
      success: true,
      message: 'Music preferences updated.',
      data: { preferences: user.musicPreferences }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (req.body.displayName) user.displayName = req.body.displayName.trim();
    if (req.body.avatar) user.avatar = req.body.avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          musicPreferences: user.musicPreferences
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleLikeTrack(req, res, next) {
  try {
    const { trackId } = req.params;
    const track = await Track.findById(trackId);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found.' });

    const existingLike = await Interaction.findOne({
      user: req.user._id,
      track: track._id,
      liked: true
    });

    if (existingLike) {
      existingLike.liked = false;
      await existingLike.save();
      return res.json({ success: true, message: 'Unliked track.', liked: false });
    }

    await Interaction.create({
      user: req.user._id,
      track: track._id,
      eventType: 'liked',
      liked: true,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Liked track.', liked: true });
  } catch (err) {
    next(err);
  }
}
