import mongoose from 'mongoose';
import { isValidCamelotKey } from '../utils/camelot.js';

const metadataTimelineItemSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true }, // seconds into track
  note: { type: String, required: true }
}, { _id: false });

const acousticProfileSchema = new mongoose.Schema({
  bpm: {
    type: Number,
    required: [true, 'BPM is required'],
    min: [40, 'BPM must be at least 40'],
    max: [240, 'BPM cannot exceed 240']
  },
  camelotKey: {
    type: String,
    required: [true, 'Camelot Key is required'],
    validate: {
      validator: isValidCamelotKey,
      message: props => `${props.value} is not a valid Camelot key (must be 1A-12A or 1B-12B)`
    }
  },
  energy: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  valence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  danceability: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1
  }
}, { _id: false });

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Track title is required'],
    trim: true
  },
  artist: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration in seconds is required'],
    min: 10
  },
  audioUrl: {
    type: String,
    default: ''
  },
  artworkUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
  },
  acousticProfile: {
    type: acousticProfileSchema,
    required: true
  },
  metadataTimeline: [metadataTimelineItemSchema],
  isDemoTrack: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

trackSchema.index({ genre: 1 });
trackSchema.index({ 'acousticProfile.bpm': 1 });
trackSchema.index({ 'acousticProfile.camelotKey': 1 });

export const Track = mongoose.model('Track', trackSchema);
