import mongoose from 'mongoose';

const sentimentPointSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  score: { type: Number, required: true },
  label: { type: String, default: 'neutral' }
}, { _id: false });

const energyPointSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  trackTitle: { type: String, required: true },
  energy: { type: Number, required: true },
  bpm: { type: Number, required: true }
}, { _id: false });

const mostVotedTrackSchema = new mongoose.Schema({
  track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
  title: String,
  artist: String,
  voteCount: { type: Number, default: 0 }
}, { _id: false });

const sessionAnalyticsSchema = new mongoose.Schema({
  lounge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DJLounge',
    required: true,
    unique: true
  },
  sessionDuration: {
    type: Number,
    default: 0 // minutes
  },
  peakParticipants: {
    type: Number,
    default: 1
  },
  totalTracksPlayed: {
    type: Number,
    default: 0
  },
  totalQueueVotes: {
    type: Number,
    default: 0
  },
  soundclashCount: {
    type: Number,
    default: 0
  },
  aiQuestionsCount: {
    type: Number,
    default: 0
  },
  averageSentiment: {
    type: Number,
    default: 0.0
  },
  sentimentTimeline: [sentimentPointSchema],
  energyProgression: [energyPointSchema],
  mostVotedTracks: [mostVotedTrackSchema]
}, {
  timestamps: true
});

export const SessionAnalytics = mongoose.model('SessionAnalytics', sessionAnalyticsSchema);
