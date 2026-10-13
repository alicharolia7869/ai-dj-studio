import { create } from 'zustand';
import { socketService } from '../services/socket.js';
import { audioEngine } from '../services/audioSynth.js';
import { api } from '../services/api.js';

export const useLoungeStore = create((set, get) => ({
  lounge: null,
  currentTrack: null,
  queue: [],
  participants: [],
  activeBattle: null,
  messages: [],
  crowdSentiment: {
    score: 0.74,
    category: 'Positive / Energetic',
    trend: 'rising',
    sampleSize: 15,
    history: []
  },
  aiAnnouncement: null,
  aiCommentary: null,
  isPlaying: false,
  playbackPosition: 0,
  duration: 240,
  volume: 0.85,
  isAudioConnected: false,
  loading: false,
  error: null,
  typingUsers: [],

  // Join a lounge and setup socket listeners with immediate REST state hydration
  joinLounge: async (loungeId) => {
    set({ loading: true, error: null });

    // 1. Immediate REST data hydration in parallel so UI renders instantly
    try {
      const [loungeRes, msgRes, sentimentRes] = await Promise.allSettled([
        api.getLounge(loungeId),
        api.getMessages(loungeId),
        api.getSentiment(loungeId)
      ]);

      if (loungeRes.status === 'fulfilled' && loungeRes.value?.data?.lounge) {
        const l = loungeRes.value.data.lounge;
        const curTrack = l.currentTrack?.track || null;
        set({
          lounge: l,
          currentTrack: curTrack,
          queue: l.queue || [],
          participants: l.participants || [],
          activeBattle: l.activeBattle || null,
          messages: msgRes.status === 'fulfilled' ? (msgRes.value?.data?.messages || []) : [],
          crowdSentiment: sentimentRes.status === 'fulfilled' ? (sentimentRes.value?.data?.crowdSentiment || get().crowdSentiment) : get().crowdSentiment,
          loading: false
        });
      }
    } catch (_) {}

    // Safety timeout to ensure spinner is removed even on slow network
    setTimeout(() => {
      if (get().loading) set({ loading: false });
    }, 2000);

    // 2. Connect socket and register listeners
    const socket = socketService.getSocket();

    // Hook audio engine time updates
    audioEngine.onTimeUpdate((currentTime, duration) => {
      set({ playbackPosition: currentTime, duration });
    });

    audioEngine.onEnded(() => {
      set({ isPlaying: false });
      get().skipNext();
    });

    // Cleanup existing listeners before attaching
    socket.off('lounge:state');
    socket.off('queue:update');
    socket.off('chat:message');
    socket.off('chat:typing');
    socket.off('sentiment:update');
    socket.off('soundclash:opened');
    socket.off('soundclash:vote-update');
    socket.off('soundclash:resolved');
    socket.off('ai:recommendation');
    socket.off('ai:announcement');
    socket.off('playback:update');
    socket.off('lounge:participant-joined');
    socket.off('lounge:participant-left');

    socket.on('lounge:state', (data) => {
      const lounge = data?.lounge;
      if (!lounge) {
        set({ loading: false });
        return;
      }
      const curTrack = lounge.currentTrack?.track || null;
      set({
        lounge,
        currentTrack: curTrack,
        queue: lounge.queue || [],
        participants: lounge.participants || [],
        activeBattle: lounge.activeBattle || null,
        messages: data.messages || get().messages,
        crowdSentiment: data.crowdSentiment || get().crowdSentiment,
        loading: false
      });

      // Synchronize audio engine if playing
      if (curTrack && lounge.currentTrack?.isPlaying && !get().isPlaying) {
        set({ isPlaying: true });
        audioEngine.playTrack(curTrack, lounge.currentTrack.playbackPosition || 0);
      }
    });

    socket.on('queue:update', ({ queue }) => {
      set({ queue: queue || [] });
    });

    socket.on('chat:message', (message) => {
      set((state) => ({
        messages: [...state.messages.slice(-60), message]
      }));
    });

    socket.on('chat:typing', ({ userId, displayName, isTyping }) => {
      set((state) => {
        const filtered = state.typingUsers.filter((u) => u.userId !== userId);
        if (isTyping) {
          return { typingUsers: [...filtered, { userId, displayName }] };
        }
        return { typingUsers: filtered };
      });
    });

    socket.on('sentiment:update', (sentiment) => {
      if (sentiment) set({ crowdSentiment: sentiment });
    });

    socket.on('soundclash:opened', ({ battle }) => {
      set({ activeBattle: battle });
    });

    socket.on('soundclash:vote-update', ({ battle }) => {
      set({ activeBattle: battle });
    });

    socket.on('soundclash:resolved', ({ battle, winner, announcement, updatedQueue }) => {
      set((state) => ({
        activeBattle: battle,
        aiAnnouncement: announcement,
        queue: updatedQueue || state.queue
      }));
    });

    socket.on('ai:recommendation', ({ commentary }) => {
      set({ aiCommentary: commentary });
    });

    socket.on('ai:announcement', ({ question, answer, speaker }) => {
      set({
        aiAnnouncement: `${speaker}: ${answer}`,
        messages: [
          ...get().messages,
          {
            _id: `ai_${Date.now()}`,
            user: { displayName: 'DJ Nexus (AI)', role: 'co-dj' },
            message: `Q: "${question}" → ${answer}`,
            isAiDj: true,
            createdAt: new Date().toISOString()
          }
        ]
      });
    });

    socket.on('playback:update', ({ currentTrack, queue, command }) => {
      const curTrack = currentTrack?.track || null;
      set({
        currentTrack: curTrack || get().currentTrack,
        queue: queue || get().queue,
        isPlaying: currentTrack?.isPlaying ?? get().isPlaying
      });

      if (command === 'play') {
        audioEngine.resume();
      } else if (command === 'pause') {
        audioEngine.pause();
      } else if (command === 'seek' && typeof currentTrack?.playbackPosition === 'number') {
        audioEngine.seek(currentTrack.playbackPosition);
      } else if (command === 'next' && curTrack) {
        audioEngine.playTrack(curTrack, 0);
      }
    });

    socket.on('lounge:participant-joined', ({ user }) => {
      set((state) => ({
        participants: [...state.participants, { user }]
      }));
    });

    socket.on('lounge:participant-left', ({ userId }) => {
      set((state) => ({
        participants: state.participants.filter(p => p.user?._id !== userId)
      }));
    });

    socket.emit('lounge:join', { loungeId });
  },

  leaveLounge: () => {
    const socket = socketService.getSocket();
    socket.emit('lounge:leave');
    audioEngine.stop();
    set({
      lounge: null,
      currentTrack: null,
      queue: [],
      participants: [],
      activeBattle: null,
      messages: [],
      isPlaying: false
    });
  },

  addToQueue: async (trackId) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('queue:add', { loungeId, trackId });
    // Also call REST API fallback to guarantee state synchronization
    try {
      const res = await api.addToQueue(loungeId, trackId);
      if (res.data?.queue) set({ queue: res.data.queue });
    } catch (_) {}
  },

  voteQueueTrack: async (trackId) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('queue:vote', { loungeId, trackId });
    // Also call REST API fallback
    try {
      const res = await api.voteQueue(loungeId, trackId);
      if (res.data?.queue) set({ queue: res.data.queue });
    } catch (_) {}
  },

  reorderQueue: async (reorderedQueueIds) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('queue:reorder', { loungeId, reorderedQueueIds });
  },

  sendMessage: async (message) => {
    const loungeId = get().lounge?._id;
    if (!loungeId || !message.trim()) return;
    const socket = socketService.getSocket();
    socket.emit('chat:send', { loungeId, message });
  },

  setTyping: (isTyping) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('chat:typing', { loungeId, isTyping });
  },

  createSoundclash: async (candidateTrackIds, durationSeconds = 45) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('soundclash:create', { loungeId, candidateTrackIds, durationSeconds });
  },

  voteSoundclash: async (battleId, candidateTrackId) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('soundclash:vote', { loungeId, battleId, candidateTrackId });
  },

  resolveSoundclash: async (battleId, tieBreakerTrackId) => {
    const loungeId = get().lounge?._id;
    if (!loungeId) return;
    const socket = socketService.getSocket();
    socket.emit('soundclash:resolve', { loungeId, battleId, tieBreakerTrackId });
  },

  askAiDj: async (question) => {
    const loungeId = get().lounge?._id;
    if (!loungeId || !question.trim()) return;
    const socket = socketService.getSocket();
    socket.emit('ai:ask', { loungeId, question });
  },

  togglePlayPause: () => {
    const loungeId = get().lounge?._id;
    const isPlaying = get().isPlaying;
    const socket = socketService.getSocket();
    const command = isPlaying ? 'pause' : 'play';

    if (isPlaying) {
      audioEngine.pause();
      set({ isPlaying: false });
    } else {
      audioEngine.resume();
      set({ isPlaying: true });
    }

    if (loungeId) {
      socket.emit('playback:command', { loungeId, command });
    }
  },

  seekPlayback: (pos) => {
    const loungeId = get().lounge?._id;
    audioEngine.seek(pos);
    set({ playbackPosition: pos });
    if (loungeId) {
      const socket = socketService.getSocket();
      socket.emit('playback:command', { loungeId, command: 'seek', position: pos });
    }
  },

  skipNext: () => {
    const loungeId = get().lounge?._id;
    const queue = get().queue;
    if (queue && queue.length > 0) {
      const nextItem = queue[0];
      const nextTrack = nextItem.track || nextItem;
      const updatedQueue = queue.slice(1);
      set({ currentTrack: nextTrack, queue: updatedQueue, isPlaying: true });
      audioEngine.playTrack(nextTrack, 0);
    }
    if (loungeId) {
      const socket = socketService.getSocket();
      socket.emit('playback:command', { loungeId, command: 'next' });
    }
  },

  setVolume: (vol) => {
    audioEngine.setVolume(vol);
    set({ volume: vol });
  }
}));
