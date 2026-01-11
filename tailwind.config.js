/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"Roboto Condensed"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        terminal: ['"VT323"', 'monospace'],
      },
      colors: {
        // Dark backgrounds
        bunker: {
          950: '#0a0b0c',
          900: '#0f1012',
          800: '#16181a',
          700: '#1e2024',
          600: '#282a2e',
        },
        // Wasteland accent colors
        rust: {
          600: '#8b3a3a',
          500: '#a64444',
          400: '#c45050',
        },
        amber: {
          600: '#b45309',
          500: '#d97706',
          400: '#f59e0b',
        },
        toxic: {
          600: '#15803d',
          500: '#22c55e',
          400: '#4ade80',
        },
        steel: {
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
        },
        // Rarity colors
        rarity: {
          common: '#a1a1aa',
          rare: '#3b82f6',
          legendary: '#a855f7',
          mythic: '#f59e0b',
        },
        // Legacy support (mapped from old theme)
        ink: {
          900: '#0a0b0c',
          800: '#0f1012',
          700: '#16181a',
        },
        paper: {
          100: '#e4e4e7',
          200: '#d4d4d8',
          800: '#27272a',
          900: '#18181b',
        },
        // Pip-Boy specific colors
        pip: {
          green: '#1aff1a',
          dark: '#0a0f0a',
          dim: '#00b300',
          amber: '#ffb642',
        },
      },
      animation: {
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'float-up': 'floatUp 1s ease-out forwards',
        slash: 'slash 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'radiation-pulse': 'radiationPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        floatUp: {
          '0%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(0.5)',
          },
          '20%': {
            opacity: '1',
            transform: 'translate(-50%, -150%) scale(1.2)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(-50%, -300%) scale(1)',
          },
        },
        slash: {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) rotate(45deg) scaleX(0)',
          },
          '50%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) rotate(45deg) scaleX(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) rotate(45deg) scaleX(1.2)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.5))',
          },
          '50%': {
            opacity: '0.9',
            filter: 'drop-shadow(0 0 50px rgba(245, 158, 11, 0.8))',
          },
        },
        radiationPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.4)',
          },
        },
        scanLine: {
          '0%': {
            transform: 'translateY(-100%)',
          },
          '100%': {
            transform: 'translateY(100vh)',
          },
        },
      },
    },
  },
  plugins: [],
};
