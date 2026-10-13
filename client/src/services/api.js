/**
 * AI DJ Studio — API Service Client
 * Supports dual-mode execution:
 * 1. Live Express + MongoDB API integration
 * 2. Adaptive Standalone Simulation Fallback when offline or deployed without backend proxy
 */

import { MOCK_TRACKS, MOCK_USERS, MOCK_LOUNGES, MOCK_MESSAGES } from './mockData.js';

function getInitialBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (envUrl && (!envUrl.includes('localhost') || isLocalHost)) {
    return envUrl;
  }

  if (isLocalHost) {
    return 'http://localhost:5000/api/v1';
  }

  // On remote host (e.g. Vercel), default to relative API or fallback
  return '/api/v1';
}

class ApiClient {
  constructor() {
    this.baseUrl = getInitialBaseUrl();
    this.isRemoteHost = typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';
    
    // In-memory / localStorage simulation state
    this._initSimulationStore();
  }

  _initSimulationStore() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('aidj_sim_tracks')) {
      localStorage.setItem('aidj_sim_tracks', JSON.stringify(MOCK_TRACKS));
    }
    if (!localStorage.getItem('aidj_sim_lounges')) {
      localStorage.setItem('aidj_sim_lounges', JSON.stringify(MOCK_LOUNGES));
    }
    if (!localStorage.getItem('aidj_sim_messages')) {
      localStorage.setItem('aidj_sim_messages', JSON.stringify(MOCK_MESSAGES));
    }
  }

  getToken() {
    return localStorage.getItem('aidj_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('aidj_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('aidj_access_token', accessToken);
    if (refreshToken) localStorage.setItem('aidj_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('aidj_access_token');
    localStorage.removeItem('aidj_refresh_token');
    localStorage.removeItem('aidj_user');
  }

  async request(endpoint, options = {}) {
    const envUrl = import.meta.env.VITE_API_URL;
    const hasExternalApi = envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost');

    // On remote deployment (e.g. Vercel) without external public API configured, use fallback directly
    if (this.isRemoteHost && !hasExternalApi) {
      return this.handleFallbackRequest(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Abort controller with 4.5s timeout to guarantee UI responsiveness
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Check for expired token and attempt refresh
      if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          response = await fetch(url, {
            ...options,
            headers
          });
        } else {
          this.clearTokens();
          window.dispatchEvent(new Event('auth:logout'));
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 404/405 on Vercel (static file or unsupported method), fallback gracefully
        if (this.isRemoteHost && (response.status === 404 || response.status === 405)) {
          return this.handleFallbackRequest(endpoint, options);
        }
        const error = new Error(data.message || `API error: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (networkErr) {
      clearTimeout(timeoutId);
      // If error has an HTTP status from the server (e.g. 400 validation, 401 unauthorized), rethrow
      if (networkErr.status && networkErr.status >= 400 && networkErr.status < 500) {
        throw networkErr;
      }

      console.warn(`[API] Remote endpoint unreachable (${networkErr.message}). Engaging harmonic fallback engine.`);
      return this.handleFallbackRequest(endpoint, options);
    }
  }

  /**
   * Standalone Simulation Fallback Layer
   * Fully replicates core backend responses so application runs seamlessly offline and on static hosts.
   */
  async handleFallbackRequest(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    let body = {};
    if (options.body && typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch (_) {}
    }

    // 1. Auth Login
    if (endpoint === '/auth/login' && method === 'POST') {
      const email = body.email || '';
      const matchedUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        _id: 'u_visitor',
        email,
        displayName: email.split('@')[0] || 'Music Explorer',
        role: 'listener',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        musicPreferences: {
          favoriteGenres: ['Melodic Techno', 'Deep House'],
          preferredBpmRange: { min: 120, max: 130 },
          preferredCamelotKeys: ['8A', '9A'],
          preferredEnergy: 0.8,
          preferredValence: 0.7
        }
      };

      const token = 'mock_jwt_token_' + Date.now();
      this.setTokens(token, 'mock_refresh_' + Date.now());
      localStorage.setItem('aidj_user', JSON.stringify(matchedUser));

      return {
        success: true,
        message: 'Logged in successfully (Acoustic Preview Mode).',
        data: {
          user: matchedUser,
          accessToken: token,
          refreshToken: 'mock_refresh_' + Date.now()
        }
      };
    }

    // 2. Auth Register
    if (endpoint === '/auth/register' && method === 'POST') {
      const newUser = {
        _id: 'u_' + Date.now(),
        email: body.email,
        displayName: body.displayName || body.email.split('@')[0],
        role: body.role || 'listener',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        musicPreferences: {
          favoriteGenres: ['Melodic Techno', 'Deep House'],
          preferredBpmRange: { min: 120, max: 130 },
          preferredCamelotKeys: ['8A', '9A'],
          preferredEnergy: 0.8,
          preferredValence: 0.7
        }
      };

      const token = 'mock_jwt_token_' + Date.now();
      this.setTokens(token, 'mock_refresh_' + Date.now());
      localStorage.setItem('aidj_user', JSON.stringify(newUser));

      return {
        success: true,
        message: 'Account created successfully (Acoustic Preview Mode).',
        data: {
          user: newUser,
          accessToken: token,
          refreshToken: 'mock_refresh_' + Date.now()
        }
      };
    }

    // 3. Auth Me
    if (endpoint === '/auth/me') {
      const userStr = localStorage.getItem('aidj_user');
      const user = userStr ? JSON.parse(userStr) : MOCK_USERS[0];
      return { success: true, data: { user } };
    }

    // 4. Tracks list & filtering
    if (endpoint.startsWith('/tracks') && method === 'GET') {
      const urlObj = new URL('http://dummy' + endpoint);
      const search = urlObj.searchParams.get('search')?.toLowerCase();
      const key = urlObj.searchParams.get('key')?.toUpperCase();
      const genre = urlObj.searchParams.get('genre')?.toLowerCase();
      const minBpmParam = urlObj.searchParams.get('minBpm');
      const maxBpmParam = urlObj.searchParams.get('maxBpm');

      let storedTracks = null;
      try {
        storedTracks = JSON.parse(localStorage.getItem('aidj_sim_tracks') || 'null');
      } catch (_) {}
      let tracks = (Array.isArray(storedTracks) && storedTracks.length > 0) ? storedTracks : [...MOCK_TRACKS];

      if (search) {
        tracks = tracks.filter(t =>
          t.title?.toLowerCase().includes(search) ||
          t.artist?.toLowerCase().includes(search) ||
          t.genre?.toLowerCase().includes(search)
        );
      }
      if (key) {
        tracks = tracks.filter(t => (t.acousticProfile?.camelotKey || t.camelotKey) === key);
      }
      if (genre) {
        tracks = tracks.filter(t => t.genre?.toLowerCase().includes(genre));
      }
      if (minBpmParam) {
        const minVal = Number(minBpmParam);
        tracks = tracks.filter(t => (t.acousticProfile?.bpm || t.bpm || 126) >= minVal);
      }
      if (maxBpmParam) {
        const maxVal = Number(maxBpmParam);
        tracks = tracks.filter(t => (t.acousticProfile?.bpm || t.bpm || 126) <= maxVal);
      }

      return {
        success: true,
        data: {
          tracks,
          pagination: { page: 1, limit: 50, total: tracks.length, pages: 1 }
        }
      };
    }

    // 5. Single Track
    if (endpoint.startsWith('/tracks/') && method === 'GET') {
      const trackId = endpoint.split('/')[2];
      const tracks = JSON.parse(localStorage.getItem('aidj_sim_tracks') || 'null') || MOCK_TRACKS;
      const track = tracks.find(t => t._id === trackId) || tracks[0];
      return { success: true, data: { track } };
    }

    // 6. Lounges list
    if (endpoint.startsWith('/lounges') && method === 'GET' && !endpoint.includes('/queue') && !endpoint.includes('/messages') && !endpoint.includes('/sentiment')) {
      const pathParts = endpoint.split('?')[0].split('/');
      const lounges = JSON.parse(localStorage.getItem('aidj_sim_lounges') || 'null') || MOCK_LOUNGES;

      if (pathParts.length > 2 && pathParts[2]) {
        // Single lounge by ID or inviteCode
        const idOrCode = pathParts[2].toUpperCase();
        const lounge = lounges.find(l => l._id === pathParts[2] || l.inviteCode === idOrCode) || lounges[0];
        return { success: true, data: { lounge } };
      }

      return {
        success: true,
        data: { lounges }
      };
    }

    // 7. Create Lounge
    if (endpoint === '/lounges' && method === 'POST') {
      const user = JSON.parse(localStorage.getItem('aidj_user') || 'null') || MOCK_USERS[0];
      const newLounge = {
        _id: 'l_' + Date.now(),
        name: body.name || 'New DJ Lounge',
        description: body.description || '',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        vibeProfile: body.vibeProfile || 'Deep House',
        genrePreference: body.genrePreference || 'Melodic Techno',
        maxParticipants: body.maxParticipants || 50,
        bpmTolerance: body.bpmTolerance || 0.08,
        soundclashEnabled: body.soundclashEnabled ?? true,
        aiCommentaryLevel: body.aiCommentaryLevel || 'full',
        queueVotingMode: body.queueVotingMode || 'democracy',
        isPrivate: body.isPrivate ?? false,
        status: 'active',
        host: user,
        currentTrack: {
          track: MOCK_TRACKS[0],
          startedAt: new Date().toISOString(),
          isPlaying: true,
          playbackPosition: 0,
          volume: 0.85
        },
        queue: [
          {
            _id: 'q_init1',
            track: MOCK_TRACKS[1],
            addedBy: user,
            addedAt: new Date().toISOString(),
            votes: [],
            score: 0,
            recommendationReason: 'Identical Key (8A), 124 BPM (1.6% diff), smooth transition.'
          }
        ],
        participants: [{ user, role: 'host' }]
      };

      const lounges = JSON.parse(localStorage.getItem('aidj_sim_lounges') || 'null') || MOCK_LOUNGES;
      lounges.unshift(newLounge);
      localStorage.setItem('aidj_sim_lounges', JSON.stringify(lounges));

      return { success: true, message: 'Lounge created successfully.', data: { lounge: newLounge } };
    }

    // 8. Queue operations
    if (endpoint.includes('/queue')) {
      const lounges = JSON.parse(localStorage.getItem('aidj_sim_lounges') || 'null') || MOCK_LOUNGES;
      const lounge = lounges[0];

      if (method === 'POST' && endpoint.includes('/vote')) {
        const parts = endpoint.split('/');
        const trackId = parts[parts.indexOf('queue') + 1];
        const item = lounge.queue.find(q => q.track?._id === trackId || q._id === trackId);
        if (item) {
          item.score = (item.score || 0) + 1;
        }
        localStorage.setItem('aidj_sim_lounges', JSON.stringify(lounges));
        return { success: true, data: { queue: lounge.queue } };
      }

      if (method === 'POST') {
        const track = MOCK_TRACKS.find(t => t._id === body.trackId) || MOCK_TRACKS[2];
        const user = JSON.parse(localStorage.getItem('aidj_user') || 'null') || MOCK_USERS[0];
        lounge.queue.push({
          _id: 'q_' + Date.now(),
          track,
          addedBy: user,
          addedAt: new Date().toISOString(),
          votes: [{ user: user._id, vote: 1 }],
          score: 1,
          recommendationReason: `Added by ${user.displayName}. Key: ${track.acousticProfile?.camelotKey || '8A'}`
        });
        localStorage.setItem('aidj_sim_lounges', JSON.stringify(lounges));
        return { success: true, data: { queue: lounge.queue } };
      }

      return { success: true, data: { queue: lounge.queue } };
    }

    // 9. Soundclash
    if (endpoint.includes('/soundclash')) {
      const lounges = JSON.parse(localStorage.getItem('aidj_sim_lounges') || 'null') || MOCK_LOUNGES;
      const lounge = lounges[0];

      if (endpoint.includes('/vote') && method === 'POST') {
        const battle = lounge.activeBattle;
        if (battle) {
          const cand = battle.candidates.find(c => (c.track?._id || c._id) === body.candidateTrackId);
          if (cand) cand.votes.push({ user: 'voter_' + Date.now() });
        }
        localStorage.setItem('aidj_sim_lounges', JSON.stringify(lounges));
        return { success: true, data: { battle: lounge.activeBattle } };
      }

      if (endpoint.includes('/resolve') && method === 'POST') {
        const battle = lounge.activeBattle;
        if (battle) {
          battle.status = 'resolved';
          const winnerTrack = battle.candidates[0]?.track || MOCK_TRACKS[2];
          lounge.queue.unshift({
            _id: 'q_win_' + Date.now(),
            track: winnerTrack,
            score: 10,
            recommendationReason: `🏆 Soundclash Winner (${winnerTrack.title})`
          });
          lounge.activeBattle = null;
        }
        localStorage.setItem('aidj_sim_lounges', JSON.stringify(lounges));
        return { success: true, data: { battle, queue: lounge.queue } };
      }

      return { success: true, data: { battle: lounge.activeBattle } };
    }

    // 10. Messages & Sentiment
    if (endpoint.includes('/messages')) {
      const msgs = JSON.parse(localStorage.getItem('aidj_sim_messages') || 'null') || MOCK_MESSAGES;
      if (method === 'POST') {
        const user = JSON.parse(localStorage.getItem('aidj_user') || 'null') || MOCK_USERS[0];
        const newMsg = {
          _id: 'm_' + Date.now(),
          user,
          message: body.message,
          sentiment: { score: 0.8, label: 'positive', arousal: 0.75 },
          createdAt: new Date().toISOString()
        };
        msgs.push(newMsg);
        localStorage.setItem('aidj_sim_messages', JSON.stringify(msgs.slice(-50)));
        return { success: true, data: { message: newMsg } };
      }
      return { success: true, data: { messages: msgs } };
    }

    if (endpoint.includes('/sentiment')) {
      return {
        success: true,
        data: {
          crowdSentiment: {
            score: 0.76,
            category: 'Positive / Energetic',
            trend: 'rising',
            sampleSize: 18,
            history: []
          }
        }
      };
    }

    // 11. AI DJ Q&A
    if (endpoint.includes('/ai/ask')) {
      const q = (body.question || '').toLowerCase();
      let answer = `The crowd energy is high at 76%. Transitioning harmonic Camelot keys with tight ±8% BPM tolerance keeps the energy locked!`;
      if (q.includes('why') && (q.includes('next') || q.includes('queued'))) {
        answer = `Next up is "Midnight Transmission" (8A, 124 BPM). It shares the identical Camelot root key (8A) and within 1.6% BPM tolerance of the current track, guaranteeing zero harmonic clashing.`;
      } else if (q.includes('camelot') || q.includes('key')) {
        answer = `Camelot harmonic mixing uses a 24-step wheel (1A-12B). Moving to identical or adjacent numbers (+/- 1) maintains pitch alignment and emotional continuity across transitions.`;
      } else if (q.includes('sentiment') || q.includes('crowd')) {
        answer = `Crowd sentiment is currently +0.76 (Positive / Energetic). Positive chat reaction terms like "fire", "drop", and "vibe" drive the room enthusiasm index.`;
      }

      return {
        success: true,
        data: {
          question: body.question,
          answer,
          speaker: 'DJ Nexus AI'
        }
      };
    }

    // 12. Recommendations
    if (endpoint.includes('/recommendations')) {
      return {
        success: true,
        data: {
          recommendations: [
            {
              track: MOCK_TRACKS[1],
              matchScore: 98,
              rationale: 'Harmonic lock with 8A. Smooth ±1.6% BPM matching.'
            },
            {
              track: MOCK_TRACKS[2],
              matchScore: 94,
              rationale: 'Camelot +1 energy step (8A → 9A). Peak groove elevation.'
            },
            {
              track: MOCK_TRACKS[3],
              matchScore: 89,
              rationale: 'Relative Major modulation (9A → 9B). Uplifting melodic shift.'
            },
            {
              track: MOCK_TRACKS[6],
              matchScore: 88,
              rationale: 'Deep House 122 BPM, matching favorite genres.'
            }
          ]
        }
      };
    }

    // 13. History
    if (endpoint.includes('/history')) {
      const history = MOCK_TRACKS.slice(0, 5).map((t, i) => ({
        _id: 'hist_' + i,
        track: t,
        eventType: i === 0 ? 'liked' : 'played',
        lounge: { name: 'Nexus Club: Peak Floor', inviteCode: 'NEXUS1' },
        timestamp: new Date(Date.now() - (i + 1) * 300000).toISOString()
      }));

      return {
        success: true,
        data: {
          history,
          pagination: { page: 1, limit: 15, total: history.length, pages: 1 }
        }
      };
    }

    // 14. Preferences
    if (endpoint.includes('/preferences')) {
      const user = JSON.parse(localStorage.getItem('aidj_user') || 'null') || MOCK_USERS[0];
      if (method === 'PATCH') {
        user.musicPreferences = { ...(user.musicPreferences || {}), ...body };
        localStorage.setItem('aidj_user', JSON.stringify(user));
        return { success: true, message: 'Preferences updated.', data: { preferences: user.musicPreferences } };
      }
      return { success: true, data: { preferences: user.musicPreferences } };
    }

    // 15. Profile
    if (endpoint.includes('/profile') && method === 'PATCH') {
      const user = JSON.parse(localStorage.getItem('aidj_user') || 'null') || MOCK_USERS[0];
      if (body.displayName) user.displayName = body.displayName;
      if (body.avatar) user.avatar = body.avatar;
      localStorage.setItem('aidj_user', JSON.stringify(user));
      return { success: true, message: 'Profile updated.', data: { user } };
    }

    // 16. Like Track
    if (endpoint.includes('/like') && method === 'POST') {
      return { success: true, message: 'Track liked status updated.', liked: true };
    }

    // 17. Analytics
    if (endpoint.includes('/analytics/')) {
      return {
        success: true,
        data: {
          analytics: {
            sessionSummary: {
              name: 'Nexus Club: Peak Floor',
              host: MOCK_USERS[0],
              durationMinutes: 45,
              totalTracksPlayed: 8,
              totalChatMessages: 42,
              peakListeners: 38,
              averageSentiment: 0.74,
              vibeProfile: 'Deep House'
            },
            timelineData: [
              { time: '21:00', sentiment: 0.5, listeners: 14, bpm: 124 },
              { time: '21:10', sentiment: 0.65, listeners: 22, bpm: 126 },
              { time: '21:20', sentiment: 0.82, listeners: 31, bpm: 127 },
              { time: '21:30', sentiment: 0.76, listeners: 38, bpm: 128 },
              { time: '21:40', sentiment: 0.79, listeners: 36, bpm: 126 }
            ],
            topVotedTracks: [
              { track: MOCK_TRACKS[1], votes: 14 },
              { track: MOCK_TRACKS[2], votes: 11 },
              { track: MOCK_TRACKS[0], votes: 9 }
            ]
          }
        }
      };
    }

    // Default fallback
    return { success: true, message: 'OK', data: {} };
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) return false;
      const json = await res.json();
      if (json.data?.accessToken) {
        this.setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data?.accessToken) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('aidj_user', JSON.stringify(res.data.user));
    }
    return res.data;
  }

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.data?.accessToken) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('aidj_user', JSON.stringify(res.data.user));
    }
    return res.data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (_) {}
    this.clearTokens();
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Lounges
  async getLounges(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/lounges${query ? `?${query}` : ''}`);
  }

  async getLounge(id) {
    return this.request(`/lounges/${id}`);
  }

  async createLounge(data) {
    return this.request('/lounges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async joinLounge(id, inviteCode) {
    return this.request(`/lounges/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    });
  }

  async updateLoungeSettings(id, data) {
    return this.request(`/lounges/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async endLounge(id) {
    return this.request(`/lounges/${id}/end`, { method: 'POST' });
  }

  // Queue
  async getQueue(loungeId) {
    return this.request(`/lounges/${loungeId}/queue`);
  }

  async addToQueue(loungeId, trackId) {
    return this.request(`/lounges/${loungeId}/queue`, {
      method: 'POST',
      body: JSON.stringify({ trackId })
    });
  }

  async voteQueue(loungeId, trackId) {
    return this.request(`/lounges/${loungeId}/queue/${trackId}/vote`, {
      method: 'POST'
    });
  }

  async reorderQueue(loungeId, reorderedQueueIds) {
    return this.request(`/lounges/${loungeId}/queue/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ reorderedQueueIds })
    });
  }

  async getAiSegue(loungeId) {
    return this.request(`/lounges/${loungeId}/ai/segue`, { method: 'POST' });
  }

  // Soundclash
  async createBattle(loungeId, data) {
    return this.request(`/lounges/${loungeId}/soundclash`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async voteBattle(loungeId, battleId, candidateTrackId) {
    return this.request(`/lounges/${loungeId}/soundclash/${battleId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ candidateTrackId })
    });
  }

  async resolveBattle(loungeId, battleId, tieBreakerWinnerTrackId) {
    return this.request(`/lounges/${loungeId}/soundclash/${battleId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ tieBreakerWinnerTrackId })
    });
  }

  // Chat & AI
  async getMessages(loungeId) {
    return this.request(`/lounges/${loungeId}/messages`);
  }

  async postMessage(loungeId, message) {
    return this.request(`/lounges/${loungeId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async getSentiment(loungeId) {
    return this.request(`/lounges/${loungeId}/sentiment`);
  }

  async askAi(loungeId, question) {
    return this.request(`/lounges/${loungeId}/ai/ask`, {
      method: 'POST',
      body: JSON.stringify({ question })
    });
  }

  // Tracks
  async getTracks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tracks${query ? `?${query}` : ''}`);
  }

  async getTrack(trackId) {
    return this.request(`/tracks/${trackId}`);
  }

  async createTrack(formData) {
    return this.request('/tracks', {
      method: 'POST',
      body: formData
    });
  }

  async updateTrack(trackId, data) {
    return this.request(`/tracks/${trackId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteTrack(trackId) {
    return this.request(`/tracks/${trackId}`, {
      method: 'DELETE'
    });
  }

  // User & Recommendations
  async getRecommendations() {
    return this.request('/users/me/recommendations');
  }

  async getHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/me/history${query ? `?${query}` : ''}`);
  }

  async getPreferences() {
    return this.request('/users/me/preferences');
  }

  async updatePreferences(preferences) {
    return this.request('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }

  async updateProfile(profileData) {
    return this.request('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  async toggleLike(trackId) {
    return this.request(`/users/tracks/${trackId}/like`, { method: 'POST' });
  }

  // Analytics
  async getAnalytics(loungeId) {
    return this.request(`/analytics/lounges/${loungeId}`);
  }
}

export const api = new ApiClient();
