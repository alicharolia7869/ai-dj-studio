/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dj: {
          dark: '#08080c',
          card: '#111118',
          border: 'rgba(255, 255, 255, 0.08)',
          cardHover: '#161622',
          purple: '#8b5cf6',
          violet: '#a855f7',
          cyan: '#06b6d4',
          neonCyan: '#00f2fe',
          neonPink: '#f43f5e',
          neonEmerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'wave-bar': 'waveBar 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.6)' },
        },
        waveBar: {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
