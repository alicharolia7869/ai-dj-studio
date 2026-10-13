import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: { type: Date, default: Date.now }
  }]
});

const soundclashBattleSchema = new mongoose.Schema({
  lounge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DJLounge',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidates: {
    type: [candidateSchema],
    validate: [
      val => val.length >= 2 && val.length <= 4,
      'A Soundclash battle must have between 2 and 4 candidates'
    ]
  },
  status: {
    type: String,
    enum: ['voting', 'resolved', 'cancelled'],
    default: 'voting'
  },
  durationSeconds: {
    type: Number,
    default: 45
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  },
  tieBreak: {
    type: Boolean,
    default: false
  },
  resolutionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const SoundclashBattle = mongoose.model('SoundclashBattle', soundclashBattleSchema);
