import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/context/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        cream:      '#F7F3EE',
        ink:        '#1A1614',
        gold:       '#C9A96E',
        'gold-light': '#E8D5B0',
        rust:       '#9B4520',
        stone:      '#8A8078',
        surface:    '#EFEBE5',
        border:     '#DDD5C8',
      },
      transitionDuration: { '350': '350ms' },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn:    'fadeIn 0.6s ease forwards',
        slideLeft: 'slideInLeft 0.6s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
