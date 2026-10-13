import mongoose from 'mongoose';

const queueEventSchema = new mongoose.Schema({
  lounge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DJLounge',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventType: {
    type: String,
    enum: ['add', 'vote', 'remove', 'reorder', 'promote', 'track_start', 'track_end', 'battle_resolve'],
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const QueueEvent = mongoose.model('QueueEvent', queueEventSchema);
