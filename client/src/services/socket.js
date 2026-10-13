import { io } from 'socket.io-client';
import { api } from './api.js';

class LocalSocketEmitter {
  constructor() {
    this.handlers = new Map();
    this.connected = true;
    this.id = 'local_' + Math.random().toString(36).substring(2, 9);
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    if (!handler) {
      this.handlers.delete(event);
    } else if (this.handlers.has(event)) {
      this.handlers.set(
        event,
        this.handlers.get(event).filter(h => h !== handler)
      );
    }
    return this;
  }

  _trigger(event, data) {
    const list = this.handlers.get(event) || [];
    list.forEach(fn => {
      try { fn(data); } catch (e) { console.error(`[LOCAL SOCKET] Error in ${event}:`, e); }
    });
  }

  async emit(event, data = {}) {
    const loungeId = data.loungeId || 'l_nexus1';

    if (event === 'lounge:join') {
      try {
        const res = await api.getLounge(loungeId);
        const lounge = res.data?.lounge;
        const msgRes = await api.getMessages(loungeId);
        const sentimentRes = await api.getSentiment(loungeId);

        setTimeout(() => {
          this._trigger('lounge:state', {
            lounge,
            messages: msgRes.data?.messages || [],
            crowdSentiment: sentimentRes.data?.crowdSentiment || { score: 0.75, category: 'Positive / Energetic' }
          });
        }, 80);
      } catch (_) {}
    } else if (event === 'chat:send') {
      try {
        const res = await api.postMessage(loungeId, data.message);
        if (res.data?.message) {
          this._trigger('chat:message', res.data.message);
          const sentimentRes = await api.getSentiment(loungeId);
          this._trigger('sentiment:update', sentimentRes.data?.crowdSentiment);
        }
      } catch (_) {}
    } else if (event === 'queue:add') {
      try {
        const res = await api.addToQueue(loungeId, data.trackId);
        if (res.data?.queue) {
          this._trigger('queue:update', { queue: res.data.queue, action: 'add' });
        }
      } catch (_) {}
    } else if (event === 'queue:vote') {
      try {
        const res = await api.voteQueue(loungeId, data.trackId);
        if (res.data?.queue) {
          this._trigger('queue:update', { queue: res.data.queue, action: 'vote' });
        }
      } catch (_) {}
    } else if (event === 'soundclash:vote') {
      try {
        const res = await api.voteBattle(loungeId, data.battleId, data.candidateTrackId);
        if (res.data?.battle) {
          this._trigger('soundclash:vote-update', { battle: res.data.battle });
        }
      } catch (_) {}
    } else if (event === 'soundclash:resolve') {
      try {
        const res = await api.resolveBattle(loungeId, data.battleId, data.tieBreakerTrackId);
        if (res.data?.battle) {
          this._trigger('soundclash:resolved', {
            battle: res.data.battle,
            winner: res.data.battle.candidates?.[0]?.track,
            announcement: `Soundclash winner announced and placed at top of queue!`,
            updatedQueue: res.data.queue
          });
        }
      } catch (_) {}
    } else if (event === 'ai:ask') {
      try {
        const res = await api.askAi(loungeId, data.question);
        if (res.data) {
          this._trigger('ai:announcement', {
            question: res.data.question,
            answer: res.data.answer,
            speaker: res.data.speaker || 'DJ Nexus AI'
          });
        }
      } catch (_) {}
    } else if (event === 'playback:command') {
      setTimeout(() => {
        this._trigger('playback:update', {
          command: data.command,
          timestamp: Date.now()
        });
      }, 50);
    }

    return this;
  }

  disconnect() {
    this.connected = false;
  }
}

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.isLocalEmitter = false;
  }

  connect() {
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    const envSocketUrl = import.meta.env.VITE_SOCKET_URL;

    // If on a remote static deployment (e.g. Vercel) and no external WebSocket server is configured
    if (!isLocalhost && (!envSocketUrl || envSocketUrl.includes('localhost'))) {
      console.log('[SOCKET] Running in Standalone Acoustic Real-Time Simulator Mode.');
      this.socket = new LocalSocketEmitter();
      this.connected = true;
      this.isLocalEmitter = true;
      return this.socket;
    }

    const socketUrl = envSocketUrl || 'http://localhost:5000';

    if (this.socket && this.connected && !this.isLocalEmitter) return this.socket;

    const token = localStorage.getItem('aidj_access_token');

    try {
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 4,
        reconnectionDelay: 1000,
        timeout: 4000
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.isLocalEmitter = false;
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SOCKET] Live socket unreachable:', err.message);
        // Fallback to local simulation if remote socket connection fails
        if (!this.connected) {
          this.socket = new LocalSocketEmitter();
          this.connected = true;
          this.isLocalEmitter = true;
        }
      });
    } catch (_) {
      this.socket = new LocalSocketEmitter();
      this.connected = true;
      this.isLocalEmitter = true;
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (typeof this.socket.disconnect === 'function') {
        this.socket.disconnect();
      }
      this.socket = null;
      this.connected = false;
      this.isLocalEmitter = false;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }
}

export const socketService = new SocketService();
