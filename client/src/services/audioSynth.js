/**
 * AI DJ Studio — Interactive Web Audio & Music Engine
 *
 * Supports:
 * 1. Direct HTML5 audio streaming when track has an audioUrl
 * 2. Harmonic Web Audio beat synthesizer calibrated to the track's BPM & Camelot root key
 * 3. Real-time AnalyserNode for audio waveforms and animated equalizer meters
 */

// Camelot root note frequencies (Hz) for bassline synthesis
const CAMELOT_ROOT_FREQUENCIES = {
  '1A': 207.65, // G# / Ab minor
  '2A': 155.56, // Eb / D# minor
  '3A': 233.08, // Bb minor
  '4A': 174.61, // F minor
  '5A': 130.81, // C minor
  '6A': 196.00, // G minor
  '7A': 146.83, // D minor
  '8A': 110.00, // A minor (A2)
  '9A': 164.81, // E minor
  '10A': 123.47, // B minor
  '11A': 185.00, // F# minor
  '12A': 138.59, // C# / Db minor

  '1B': 261.63, // B Major
  '2B': 196.00, // F# Major
  '3B': 146.83, // Db Major
  '4B': 220.00, // Ab Major
  '5B': 164.81, // Eb Major
  '6B': 123.47, // Bb Major
  '7B': 185.00, // F Major
  '8B': 130.81, // C Major
  '9B': 196.00, // G Major
  '10B': 146.83, // D Major
  '11B': 220.00, // A Major
  '12B': 164.81  // E Major
};

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.masterGain = null;
    this.htmlAudio = null;
    this.audioSourceNode = null;

    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 240;
    this.currentTrack = null;
    this.isSynthesized = false;

    this.synthInterval = null;
    this.timeUpdateCallback = null;
    this.endedCallback = null;
    this.stepIndex = 0;
    this.volume = 0.85;
  }

  _initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTrack(track, initialPosition = 0) {
    this._initContext();
    this.stop();

    this.currentTrack = track;
    this.duration = track.duration || 210;
    this.currentTime = initialPosition;
    this.isPlaying = true;

    if (track.audioUrl && track.audioUrl.trim().length > 0) {
      this._playHtmlAudio(track.audioUrl, initialPosition);
    } else {
      this._startSynthPlayback(track, initialPosition);
    }
  }

  _playHtmlAudio(url, position) {
    this.isSynthesized = false;
    this.htmlAudio = new Audio(url);
    this.htmlAudio.crossOrigin = 'anonymous';
    this.htmlAudio.currentTime = position;
    this.htmlAudio.volume = this.volume;

    try {
      this.audioSourceNode = this.audioCtx.createMediaElementSource(this.htmlAudio);
      this.audioSourceNode.connect(this.masterGain);
    } catch (_) {}

    this.htmlAudio.play().catch(() => {
      // If audio file playback fails, fallback to synthesized preview
      this._startSynthPlayback(this.currentTrack, position);
    });

    this.htmlAudio.ontimeupdate = () => {
      if (this.htmlAudio) {
        this.currentTime = this.htmlAudio.currentTime;
        if (this.timeUpdateCallback) this.timeUpdateCallback(this.currentTime, this.duration);
      }
    };

    this.htmlAudio.onended = () => {
      this.isPlaying = false;
      if (this.endedCallback) this.endedCallback();
    };
  }

  _startSynthPlayback(track, startPosition) {
    this.isSynthesized = true;
    this.currentTime = startPosition;

    const bpm = track.acousticProfile?.bpm || track.bpm || 126;
    const camelotKey = (track.acousticProfile?.camelotKey || track.camelotKey || '8A').toUpperCase();
    const rootFreq = CAMELOT_ROOT_FREQUENCIES[camelotKey] || 110.0;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th note step

    this.stepIndex = Math.floor((this.currentTime / (60 / bpm / 4)) % 16);

    this.synthInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;

      this.currentTime += stepDurationMs / 1000;
      if (this.timeUpdateCallback) {
        this.timeUpdateCallback(this.currentTime, this.duration);
      }

      if (this.currentTime >= this.duration) {
        this.stop();
        if (this.endedCallback) this.endedCallback();
        return;
      }

      this._playBeatStep(this.stepIndex, rootFreq);
      this.stepIndex = (this.stepIndex + 1) % 16;
    }, stepDurationMs);
  }

  _playBeatStep(step, rootFreq) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // 1. Kick on beats 0, 4, 8, 12 (4-on-the-floor)
    if (step % 4 === 0) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
      osc.start(now);
      osc.stop(now + 0.2);
    }

    // 2. Snare / Clap on beats 4 and 12 (backbeat)
    if (step === 4 || step === 12) {
      const noise = this._createSnareNoise();
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noise.connect(gain);
      gain.connect(this.masterGain);
      noise.onended = () => {
        try {
          noise.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
      noise.start(now);
      noise.stop(now + 0.16);
    }

    // 3. Hi-Hats on offbeat 2, 6, 10, 14
    if (step % 2 === 1) {
      const hat = this._createSnareNoise();
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      hat.connect(gain);
      gain.connect(this.masterGain);
      hat.onended = () => {
        try {
          hat.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
      hat.start(now);
      hat.stop(now + 0.06);
    }

    // 4. Bassline melodic synth on steps 2, 6, 8, 14
    if ([2, 6, 8, 14].includes(step)) {
      const bass = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      bass.type = 'sawtooth';
      const semitoneOffset = step === 8 ? 7 : step === 14 ? 3 : 0;
      const freq = rootFreq * Math.pow(2, semitoneOffset / 12);
      bass.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.18);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      bass.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      bass.onended = () => {
        try {
          bass.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
      bass.start(now);
      bass.stop(now + 0.22);
    }
  }

  _createSnareNoise() {
    const bufferSize = this.audioCtx.sampleRate * 0.1;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  pause() {
    this.isPlaying = false;
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;
    if (this.htmlAudio) {
      this.htmlAudio.play();
    } else {
      this._startSynthPlayback(this.currentTrack, this.currentTime);
    }
  }

  seek(timeInSeconds) {
    this.currentTime = Math.max(0, Math.min(this.duration, timeInSeconds));
    if (this.htmlAudio) {
      this.htmlAudio.currentTime = this.currentTime;
    }
    if (this.timeUpdateCallback) {
      this.timeUpdateCallback(this.currentTime, this.duration);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.volume;
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.src = '';
      this.htmlAudio = null;
    }
    if (this.audioSourceNode) {
      try { this.audioSourceNode.disconnect(); } catch (_) {}
      this.audioSourceNode = null;
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  destroy() {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (_) {}
      this.audioCtx = null;
      this.analyser = null;
      this.masterGain = null;
    }
  }

  getFrequencyData() {
    if (!this.analyser) {
      // Simulated equalizer bars if audio context not yet initialized
      return new Uint8Array(16).map(() => (this.isPlaying ? Math.floor(Math.random() * 180 + 40) : 10));
    }
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    return buffer;
  }

  onTimeUpdate(callback) {
    this.timeUpdateCallback = callback;
  }

  onEnded(callback) {
    this.endedCallback = callback;
  }
}

export const audioEngine = new AudioEngine();
