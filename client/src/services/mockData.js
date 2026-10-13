/**
 * AI DJ Studio — Fallback Acoustic Catalog & Standalone Simulation Engine
 * Used when running on serverless static hosting (e.g. Vercel) or when remote backend is offline.
 */

export const MOCK_TRACKS = [
  {
    _id: 't_001',
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
    _id: 't_002',
    title: 'Midnight Transmission',
    artist: 'Velvet Pulse',
    genre: 'Deep House',
    duration: 218,
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 124,
      camelotKey: '8A', // Identical key to Neon Odyssey
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
    _id: 't_003',
    title: 'Quantum Horizon',
    artist: 'Astral Echoes',
    genre: 'Tech House',
    duration: 232,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 127,
      camelotKey: '9A', // Adjacent key (+1 energy boost) to 8A
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
    _id: 't_004',
    title: 'Solar Flare',
    artist: 'Hyperion',
    genre: 'Progressive House',
    duration: 260,
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 128,
      camelotKey: '9B', // Relative Major to 9A
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
    _id: 't_005',
    title: 'Echoes in the Rain',
    artist: 'Luna Sol',
    genre: 'Lo-Fi Chill',
    duration: 175,
    artworkUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 85,
      camelotKey: '7A', // D minor
      energy: 0.42,
      valence: 0.50,
      danceability: 0.65
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Vinyl crackle and gentle rain FX' },
      { timestamp: 30, note: 'Warm tape-saturated Rhodes' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_006',
    title: 'Cyber City Rush',
    artist: 'Vector 88',
    genre: 'Synthwave',
    duration: 210,
    artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 132,
      camelotKey: '10A', // B minor
      energy: 0.89,
      valence: 0.74,
      danceability: 0.78
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Pulsing gated bassline intro' },
      { timestamp: 44, note: 'Analog lead synthesizer hook' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_007',
    title: 'Sunset Boulevard',
    artist: 'Mirage Project',
    genre: 'Deep House',
    duration: 225,
    artworkUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 122,
      camelotKey: '8A', // A minor
      energy: 0.68,
      valence: 0.78,
      danceability: 0.82
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Warm Fender bass and shaker groove' },
      { timestamp: 60, note: 'Sun-drenched brass stabs' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_008',
    title: 'Deep Abyss',
    artist: 'Subliminal',
    genre: 'Melodic Techno',
    duration: 250,
    artworkUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 125,
      camelotKey: '6A', // G minor
      energy: 0.79,
      valence: 0.40,
      danceability: 0.81
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Deep hypnotic submarine bass' },
      { timestamp: 64, note: 'Dark atmospheric plucks' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_009',
    title: 'Apex Overdrive',
    artist: 'Nova Kinetic',
    genre: 'High-Energy EDM',
    duration: 205,
    artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 130,
      camelotKey: '8B', // C Major (Relative Major to 8A)
      energy: 0.94,
      valence: 0.85,
      danceability: 0.89
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Punchy festival build' },
      { timestamp: 32, note: 'Massive euphoric synth drop' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_010',
    title: 'Elysium Dreams',
    artist: 'Aura',
    genre: 'Progressive House',
    duration: 240,
    artworkUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 128,
      camelotKey: '9A', // E minor
      energy: 0.81,
      valence: 0.69,
      danceability: 0.83
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Spiritual pad introduction' },
      { timestamp: 48, note: 'Driving four-on-the-floor kick' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_011',
    title: 'Velvet Soul',
    artist: 'Kofi & The Rhythm',
    genre: 'Afro House',
    duration: 235,
    artworkUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 123,
      camelotKey: '7A', // D minor
      energy: 0.77,
      valence: 0.82,
      danceability: 0.90
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Tribal talking drums and polyrhythms' },
      { timestamp: 50, note: 'Warm vocal chant layer' }
    ],
    isDemoTrack: true
  },
  {
    _id: 't_012',
    title: 'Electric Funk',
    artist: 'Groove Mechanics',
    genre: 'Tech House',
    duration: 215,
    artworkUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    acousticProfile: {
      bpm: 126,
      camelotKey: '8A', // A minor
      energy: 0.86,
      valence: 0.75,
      danceability: 0.94
    },
    metadataTimeline: [
      { timestamp: 0, note: 'Slap bass and clavinet funk intro' },
      { timestamp: 45, note: 'Brass section crescendo' }
    ],
    isDemoTrack: true
  }
];

export const MOCK_USERS = [
  {
    _id: 'u_host',
    email: 'host@aidjstudio.io',
    displayName: 'DJ Maya (Host)',
    role: 'host',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    musicPreferences: {
      favoriteGenres: ['Deep House', 'Afro House', 'Progressive House'],
      preferredBpmRange: { min: 122, max: 128 },
      preferredCamelotKeys: ['8A', '7A', '9A'],
      preferredEnergy: 0.80,
      preferredValence: 0.65
    }
  },
  {
    _id: 'u_codj',
    email: 'codj@aidjstudio.io',
    displayName: 'DJ Liam (Co-DJ)',
    role: 'co-dj',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    musicPreferences: {
      favoriteGenres: ['Tech House', 'High-Energy EDM'],
      preferredBpmRange: { min: 125, max: 132 },
      preferredCamelotKeys: ['8A', '9A', '9B'],
      preferredEnergy: 0.90,
      preferredValence: 0.75
    }
  },
  {
    _id: 'u_listener',
    email: 'listener@aidjstudio.io',
    displayName: 'Alex Riva',
    role: 'listener',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    musicPreferences: {
      favoriteGenres: ['Melodic Techno', 'Deep House', 'Lo-Fi Chill'],
      preferredBpmRange: { min: 118, max: 128 },
      preferredCamelotKeys: ['8A', '7A'],
      preferredEnergy: 0.72,
      preferredValence: 0.60
    }
  },
  {
    _id: 'u_admin',
    email: 'admin@aidjstudio.io',
    displayName: 'Admin Apex',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    musicPreferences: {
      favoriteGenres: ['Melodic Techno', 'Tech House', 'Deep House'],
      preferredBpmRange: { min: 124, max: 130 },
      preferredCamelotKeys: ['8A', '9A', '8B'],
      preferredEnergy: 0.85,
      preferredValence: 0.70
    }
  }
];

export const MOCK_LOUNGES = [
  {
    _id: 'l_nexus1',
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
    host: MOCK_USERS[0],
    currentTrack: {
      track: MOCK_TRACKS[0], // Neon Odyssey (8A, 126 BPM)
      startedAt: new Date().toISOString(),
      isPlaying: true,
      playbackPosition: 42,
      volume: 0.85
    },
    queue: [
      {
        _id: 'q_01',
        track: MOCK_TRACKS[1], // Midnight Transmission (8A, 124 BPM)
        addedBy: MOCK_USERS[1],
        addedAt: new Date(Date.now() - 60000).toISOString(),
        votes: [{ user: MOCK_USERS[1]._id, vote: 1 }, { user: MOCK_USERS[2]._id, vote: 1 }],
        score: 2,
        recommendationReason: 'Identical Key (8A), 124 BPM (1.6% diff), smooth transition.'
      },
      {
        _id: 'q_02',
        track: MOCK_TRACKS[2], // Quantum Horizon (9A, 127 BPM)
        addedBy: MOCK_USERS[2],
        addedAt: new Date(Date.now() - 40000).toISOString(),
        votes: [{ user: MOCK_USERS[2]._id, vote: 1 }],
        score: 1,
        recommendationReason: 'Harmonic +1 Energy Step (8A → 9A). Peak groove build.'
      },
      {
        _id: 'q_03',
        track: MOCK_TRACKS[3], // Solar Flare (9B, 128 BPM)
        addedBy: MOCK_USERS[0],
        addedAt: new Date(Date.now() - 20000).toISOString(),
        votes: [],
        score: 0,
        recommendationReason: 'Relative Major Modulation (9A → 9B). Uplifting melodic shift.'
      }
    ],
    participants: [
      { user: MOCK_USERS[0], role: 'host' },
      { user: MOCK_USERS[1], role: 'co-dj' },
      { user: MOCK_USERS[2], role: 'listener' }
    ],
    activeBattle: {
      _id: 'b_01',
      lounge: 'l_nexus1',
      status: 'voting',
      durationSeconds: 45,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 40000).toISOString(),
      candidates: [
        {
          _id: 'bc_01',
          track: MOCK_TRACKS[2], // Quantum Horizon
          submittedBy: MOCK_USERS[1],
          votes: [{ user: MOCK_USERS[1]._id }, { user: MOCK_USERS[2]._id }]
        },
        {
          _id: 'bc_02',
          track: MOCK_TRACKS[8], // Apex Overdrive
          submittedBy: MOCK_USERS[0],
          votes: [{ user: MOCK_USERS[0]._id }]
        }
      ]
    }
  },
  {
    _id: 'l_velvet',
    name: 'Velvet Horizon Sessions',
    description: 'Smooth, soul-infused Afro and Deep House grooves curated for evening focus.',
    inviteCode: 'VELVET',
    vibeProfile: 'Afro House',
    genrePreference: 'Deep House',
    maxParticipants: 40,
    bpmTolerance: 0.08,
    soundclashEnabled: true,
    aiCommentaryLevel: 'balanced',
    queueVotingMode: 'democracy',
    isPrivate: false,
    status: 'active',
    host: MOCK_USERS[1],
    currentTrack: {
      track: MOCK_TRACKS[6], // Sunset Boulevard (8A, 122 BPM)
      startedAt: new Date().toISOString(),
      isPlaying: true,
      playbackPosition: 15,
      volume: 0.8
    },
    queue: [
      {
        _id: 'q_v1',
        track: MOCK_TRACKS[10], // Velvet Soul (7A, 123 BPM)
        addedBy: MOCK_USERS[1],
        addedAt: new Date().toISOString(),
        votes: [{ user: MOCK_USERS[1]._id, vote: 1 }],
        score: 1,
        recommendationReason: 'Adjacent Key (8A → 7A), warm acoustic decay.'
      }
    ],
    participants: [
      { user: MOCK_USERS[1], role: 'host' }
    ]
  }
];

export const MOCK_MESSAGES = [
  {
    _id: 'm_01',
    user: MOCK_USERS[0],
    message: 'Welcome to Nexus Peak Floor! Starting off with Neon Odyssey in 8A 🔥',
    sentiment: { score: 0.85, label: 'positive', arousal: 0.8 },
    createdAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    _id: 'm_02',
    user: MOCK_USERS[1],
    message: 'Queued Midnight Transmission — 100% key lock with 8A for smooth transition 🙌',
    sentiment: { score: 0.75, label: 'positive', arousal: 0.7 },
    createdAt: new Date(Date.now() - 90000).toISOString()
  },
  {
    _id: 'm_03',
    user: MOCK_USERS[2],
    message: 'The rolling bassline on this synthesizer sounds crisp!',
    sentiment: { score: 0.70, label: 'positive', arousal: 0.65 },
    createdAt: new Date(Date.now() - 40000).toISOString()
  }
];
