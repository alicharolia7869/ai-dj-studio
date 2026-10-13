import mongoose from 'mongoose';

const queueItemSchema = new mongoose.Schema({
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: Number, default: 1 } // 1 for upvote
  }],
  score: {
    type: Number,
    default: 0
  },
  recommendationReason: {
    type: String,
    default: ''
  }
});

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'co-dj', 'listener'],
    default: 'listener'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: ''
  }
}, { _id: false });

const djLoungeSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Lounge name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  vibeProfile: {
    type: String,
    enum: [
      'High-Energy EDM',
      'Hip-Hop Party',
      'Deep House',
      'Lo-Fi Chill',
      'Pop Anthems',
      'Retro Classics',
      'Mixed Crowd'
    ],
    default: 'Deep House'
  },
  genrePreference: {
    type: String,
    default: 'Electronic'
  },
  maxParticipants: {
    type: Number,
    default: 50,
    min: 2,
    max: 500
  },
  bpmTolerance: {
    type: Number,
    default: 0.08,
    min: 0.02,
    max: 0.20
  },
  soundclashEnabled: {
    type: Boolean,
    default: true
  },
  aiCommentaryLevel: {
    type: String,
    enum: ['off', 'minimal', 'full'],
    default: 'full'
  },
  queueVotingMode: {
    type: String,
    enum: ['democracy', 'host-curated'],
    default: 'democracy'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  currentTrack: {
    track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
    startedAt: { type: Date, default: Date.now },
    isPlaying: { type: Boolean, default: true },
    playbackPosition: { type: Number, default: 0 },
    volume: { type: Number, default: 0.85 }
  },
  queue: [queueItemSchema],
  participants: [participantSchema],
  activeBattle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SoundclashBattle'
  },
  sessionDuration: {
    type: Number,
    default: 0
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

djLoungeSchema.index({ status: 1 });
djLoungeSchema.index({ host: 1 });

export const DJLounge = mongoose.model('DJLounge', djLoungeSchema);
