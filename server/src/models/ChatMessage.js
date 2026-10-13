import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  lounge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DJLounge',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: 500
  },
  sentiment: {
    score: { type: Number, default: 0 },
    label: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    arousal: { type: Number, default: 0.3 }
  },
  isAiDj: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

chatMessageSchema.index({ lounge: 1, createdAt: -1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
