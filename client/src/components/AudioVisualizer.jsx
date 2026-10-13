import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioSynth.js';

export default function AudioVisualizer({ isPlaying = false, height = 48, barsCount = 28 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const data = audioEngine.getFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / barsCount) - 2;

      for (let i = 0; i < barsCount; i++) {
        // Sample frequency bin
        const binIndex = Math.floor((i / barsCount) * data.length);
        const value = isPlaying ? (data[binIndex] || Math.floor(Math.random() * 120 + 20)) : 8;
        const percent = Math.min(1, value / 255);
        const barHeight = Math.max(4, percent * canvas.height);

        // Electric purple to cyan gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6'); // Violet
        gradient.addColorStop(0.6, '#06b6d4'); // Cyan
        gradient.addColorStop(1, '#00f2fe'); // Neon Cyan

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;
        const radius = 2;
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, barsCount]);

  return (
    <canvas
      ref={canvasRef}
      width={barsCount * 8}
      height={height}
      className="w-full rounded opacity-90 transition-opacity hover:opacity-100"
    />
  );
}
