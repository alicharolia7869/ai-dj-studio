import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true,
    index: true
  },
  lounge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DJLounge'
  },
  eventType: {
    type: String,
    enum: ['played', 'completed', 'liked', 'unliked', 'queued', 'voted', 'skipped'],
    default: 'played'
  },
  listeningDuration: {
    type: Number,
    default: 0 // seconds
  },
  completed: {
    type: Boolean,
    default: false
  },
  liked: {
    type: Boolean,
    default: false
  },
  coListenedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

export const Interaction = mongoose.model('Interaction', interactionSchema);
