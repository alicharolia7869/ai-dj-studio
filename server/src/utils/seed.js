import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Track } from '../models/Track.js';
import { DJLounge } from '../models/DJLounge.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Interaction } from '../models/Interaction.js';
import { SoundclashBattle } from '../models/SoundclashBattle.js';

export const SEED_TRACKS = [
  {
    title: 'Neon Odyssey',
    artist: 'Kroma & CyberVibe',
    genre: 'Melodic Techno',
    duration: 245,
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 126,
      camelotKey: '8A', // A minor
      energy: 0.82,
      valence: 0.65,
      danceability: 0.88
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Warm ambient synth pad intro' },
      { timestamp: 64, note: 'Driving rolling bassline enters' },
      { timestamp: 128, note: 'Main melodic arpeggio drop' },
      { timestamp: 192, note: 'Acoustic decay outro window' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Midnight Transmission',
    artist: 'Velvet Pulse',
    genre: 'Deep House',
    duration: 218,
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 124,
      camelotKey: '8A', // Identical key to Neon Odyssey!
      energy: 0.76,
      valence: 0.58,
      danceability: 0.85
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Sub-bass kick groove' },
      { timestamp: 48, note: 'Silky Rhodes chord progression' },
      { timestamp: 110, note: 'Vocal hook layer' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Quantum Horizon',
    artist: 'Astral Echoes',
    genre: 'Tech House',
    duration: 232,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 127,
      camelotKey: '9A', // Adjacent key (+1 energy boost) to 8A!
      energy: 0.88,
      valence: 0.72,
      danceability: 0.92
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Percussive tech shakers' },
      { timestamp: 32, note: 'Punchy 909 kick punch' },
      { timestamp: 96, note: 'High-energy bass drop' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Solar Flare',
    artist: 'Hyperion',
    genre: 'Progressive House',
    duration: 260,
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 128,
      camelotKey: '9B', // Relative Major to 9A!
      energy: 0.85,
      valence: 0.80,
      danceability: 0.84
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Bright euphoric chords' },
      { timestamp: 80, note: 'Snare roll riser' },
      { timestamp: 120, note: 'Peak uplift synth lead' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Echoes in the Rain',
    artist: 'Luna Sol',
    genre: 'Lo-Fi Chill',
    duration: 175,
    artworkUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 85,
      camelotKey: '7A', // D minor
      energy: 0.38,
      valence: 0.42,
      danceability: 0.60
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Vinyl crackle and gentle rain FX' },
      { timestamp: 30, note: 'Mellow Fender Rhodes keys' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Urban Sunset',
    artist: 'Beat Smith',
    genre: 'Hip-Hop Party',
    duration: 190,
    artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 92,
      camelotKey: '4A', // F minor
      energy: 0.72,
      valence: 0.78,
      danceability: 0.89
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Boom-bap drum break intro' },
      { timestamp: 45, note: 'Heavy 808 sub glide' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Cyberpunk Drive',
    artist: 'Synthwave Society',
    genre: 'Synthwave',
    duration: 210,
    artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 118,
      camelotKey: '10A', // B minor
      energy: 0.80,
      valence: 0.60,
      danceability: 0.78
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Retro arpeggiated bassline' },
      { timestamp: 60, note: 'Analog synth brass lead' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Subterranean Groove',
    artist: 'Deep State',
    genre: 'Deep House',
    duration: 228,
    artworkUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 122,
      camelotKey: '7A', // Compatible with 8A!
      energy: 0.68,
      valence: 0.52,
      danceability: 0.86
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Warm tape saturation percussion' },
      { timestamp: 55, note: 'Deep organ chord stabs' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Apex Overdrive',
    artist: 'Bassline Cartel',
    genre: 'High-Energy EDM',
    duration: 204,
    artworkUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 130,
      camelotKey: '8B', // C major (Relative Major to 8A Neon Odyssey!)
      energy: 0.94,
      valence: 0.85,
      danceability: 0.90
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Fast festival snare buildup' },
      { timestamp: 32, note: 'Massive brass lead drop' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Starlight Serenade',
    artist: 'Cosmo Divas',
    genre: 'Pop Anthems',
    duration: 198,
    artworkUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 120,
      camelotKey: '11B', // A Major
      energy: 0.79,
      valence: 0.91,
      danceability: 0.82
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Catchy guitar riff hook' },
      { timestamp: 40, note: 'Anthemic singalong chorus' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Voodoo Rhythm',
    artist: 'Tribal Force',
    genre: 'Afro House',
    duration: 250,
    artworkUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 123,
      camelotKey: '8A', // Perfect 8A harmonic match
      energy: 0.78,
      valence: 0.70,
      danceability: 0.94
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Live djembe and conga polyrhythms' },
      { timestamp: 60, note: 'Sub-heavy tribal bass drop' }
    ],
    isDemoTrack: true
  },
  {
    title: 'Future Funk Express',
    artist: 'Groove Machine',
    genre: 'Retro Classics',
    duration: 215,
    artworkUrl: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 116,
      camelotKey: '2A', // E-flat minor
      energy: 0.84,
      valence: 0.88,
      danceability: 0.91
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Slap bass and clavinet funk intro' },
      { timestamp: 45, note: 'Brass section crescendo' }
    ],
    isDemoTrack: true
  }
];

export async function seedDatabase(keepConnected = false) {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  console.log('[SEED] Clearing existing records for fresh demo state...');

  await Promise.all([
    User.deleteMany({}),
    Track.deleteMany({}),
    DJLounge.deleteMany({}),
    ChatMessage.deleteMany({}),
    Interaction.deleteMany({}),
    SoundclashBattle.deleteMany({})
  ]);

  console.log('[SEED] Seeding users with role hierarchy...');

  // Create accounts
  const admin = await User.create({
    email: 'admin@aidjstudio.io',
    password: 'StudioAdmin123!',
    displayName: 'Admin Apex',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    musicPreferences: {
      favoriteGenres: ['Melodic Techno', 'Tech House', 'Deep House'],
      preferredBpmRange: { min: 124, max: 130 },
      preferredCamelotKeys: ['8A', '9A', '8B'],
      preferredEnergy: 0.85,
      preferredValence: 0.70
    }
  });

  const host = await User.create({
    email: 'host@aidjstudio.io',
    password: 'HostNexus123!',
    displayName: 'DJ Maya (Host)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'host',
    musicPreferences: {
      favoriteGenres: ['Deep House', 'Afro House', 'Progressive House'],
      preferredBpmRange: { min: 122, max: 128 },
      preferredCamelotKeys: ['8A', '7A', '9A'],
      preferredEnergy: 0.80,
      preferredValence: 0.65
    }
  });

  const codj = await User.create({
    email: 'codj@aidjstudio.io',
    password: 'CoDjPulse123!',
    displayName: 'DJ Liam (Co-DJ)',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    role: 'co-dj',
    musicPreferences: {
      favoriteGenres: ['Tech House', 'High-Energy EDM'],
      preferredBpmRange: { min: 125, max: 132 },
      preferredCamelotKeys: ['8A', '9A', '9B'],
      preferredEnergy: 0.90,
      preferredValence: 0.75
    }
  });

  const listener = await User.create({
    email: 'listener@aidjstudio.io',
    password: 'ListenerVibe123!',
    displayName: 'Alex Riva',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'listener',
    musicPreferences: {
      favoriteGenres: ['Melodic Techno', 'Deep House', 'Lo-Fi Chill'],
      preferredBpmRange: { min: 118, max: 128 },
      preferredCamelotKeys: ['8A', '7A'],
      preferredEnergy: 0.72,
      preferredValence: 0.60
    }
  });

  console.log('[SEED] Seeding 12 verified acoustic demo tracks...');
  const createdTracks = await Track.insertMany(
    SEED_TRACKS.map(t => ({ ...t, addedBy: admin._id }))
  );

  console.log('[SEED] Creating live DJ Lounge with active queue and Soundclash stage...');
  const startingTrack = createdTracks[0]; // Neon Odyssey (8A, 126 BPM)
  const track2 = createdTracks[1]; // Midnight Transmission (8A, 124 BPM) - Perfect match!
  const track3 = createdTracks[2]; // Quantum Horizon (9A, 127 BPM) - Harmonic +1 energy boost!
  const track4 = createdTracks[3]; // Solar Flare (9B, 128 BPM) - Relative major!
  const track9 = createdTracks[8]; // Apex Overdrive (8B, 130 BPM)

  const lounge = await DJLounge.create({
    host: host._id,
    name: 'Nexus Club: Peak Floor',
    description: 'Live collaborative room exploring deep melodic techno and harmonic Camelot transitions.',
    inviteCode: 'NEXUS1',
    vibeProfile: 'Deep House',
    genrePreference: 'Melodic Techno',
    maxParticipants: 50,
    bpmTolerance: 0.08,
    soundclashEnabled: true,
    aiCommentaryLevel: 'full',
    queueVotingMode: 'democracy',
    isPrivate: false,
    status: 'active',
    currentTrack: {
      track: startingTrack._id,
      startedAt: new Date(),
      isPlaying: true,
      playbackPosition: 42,
      volume: 0.85
    },
    queue: [
      {
        track: track2._id,
        addedBy: codj._id,
        addedAt: new Date(Date.now() - 60000),
        votes: [{ user: codj._id, vote: 1 }, { user: listener._id, vote: 1 }],
        score: 2,
        recommendationReason: 'Identical Key (8A), 124 BPM (1.6% diff), smooth transition.'
      },
      {
        track: track3._id,
        addedBy: listener._id,
        addedAt: new Date(Date.now() - 40000),
        votes: [{ user: listener._id, vote: 1 }],
        score: 1,
        recommendationReason: 'Energy Boost (+1 Key: 9A), 127 BPM, high energy drive.'
      },
      {
        track: track4._id,
        addedBy: host._id,
        addedAt: new Date(Date.now() - 20000),
        votes: [],
        score: 0,
        recommendationReason: 'Relative Major transition (9B), 128 BPM euphoric lift.'
      }
    ],
    participants: [
      { user: host._id, role: 'host', joinedAt: new Date() },
      { user: codj._id, role: 'co-dj', joinedAt: new Date() },
      { user: listener._id, role: 'listener', joinedAt: new Date() }
    ]
  });

  // Create initial Soundclash Battle
  const battle = await SoundclashBattle.create({
    lounge: lounge._id,
    createdBy: host._id,
    candidates: [
      {
        track: track3._id,
        submittedBy: codj._id,
        votes: [{ user: codj._id }, { user: listener._id }]
      },
      {
        track: track9._id,
        submittedBy: host._id,
        votes: [{ user: host._id }]
      }
    ],
    status: 'voting',
    durationSeconds: 60,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 60000)
  });

  lounge.activeBattle = battle._id;
  await lounge.save();

  // Create initial chat messages with varied sentiment
  await ChatMessage.insertMany([
    {
      lounge: lounge._id,
      user: host._id,
      message: 'Welcome everyone to Nexus Club! Drop your tracks in queue or vote on the Soundclash battle! 🔥',
      sentiment: { score: 0.85, label: 'positive', arousal: 0.8 }
    },
    {
      lounge: lounge._id,
      user: listener._id,
      message: 'This Neon Odyssey drop is insane! Best vibes ever 🙌🚀',
      sentiment: { score: 0.90, label: 'positive', arousal: 0.9 }
    },
    {
      lounge: lounge._id,
      user: codj._id,
      message: 'Quantum Horizon is locked in for the battle, pure high energy tech house!',
      sentiment: { score: 0.75, label: 'positive', arousal: 0.7 }
    }
  ]);

  // Seed user interactions for recommendation engine
  await Interaction.insertMany([
    { user: listener._id, track: startingTrack._id, lounge: lounge._id, eventType: 'completed', listeningDuration: 245, liked: true },
    { user: listener._id, track: track2._id, lounge: lounge._id, eventType: 'completed', listeningDuration: 218, liked: true },
    { user: listener._id, track: track3._id, lounge: lounge._id, eventType: 'voted', liked: true },
    { user: host._id, track: startingTrack._id, lounge: lounge._id, eventType: 'completed', listeningDuration: 245, liked: true },
    { user: host._id, track: track4._id, lounge: lounge._id, eventType: 'played', liked: true },
    { user: codj._id, track: track3._id, lounge: lounge._id, eventType: 'queued', liked: true }
  ]);

  console.log('====================================================');
  console.log('✅ DATABASE SEEDING COMPLETE!');
  console.log('====================================================');
  console.log('Demo Accounts:');
  console.log('• Admin:    admin@aidjstudio.io    / StudioAdmin123!');
  console.log('• Host:     host@aidjstudio.io     / HostNexus123!');
  console.log('• Co-DJ:    codj@aidjstudio.io     / CoDjPulse123!');
  console.log('• Listener: listener@aidjstudio.io / ListenerVibe123!');
  console.log('');
  console.log(`Demo Lounge Code: NEXUS1 (URL: /lounge/${lounge._id})`);
  console.log('====================================================');
}

// Run if called directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => disconnectDB())
    .catch(err => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}
