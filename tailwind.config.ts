import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'mint-ink': '#04080f',
        'mint-card': '#0a1620',
        'mint-highlight': '#12f7d6',
      },
      fontFamily: {
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 50px rgba(16, 185, 129, 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
