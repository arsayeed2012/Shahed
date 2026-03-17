/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-jost)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-amiri)', 'serif'],
      },
      colors: {
        cream: {
          50: '#fdfaf6',
          100: '#f8f2e8',
          200: '#f0e4d0',
          300: '#e5ceb0',
          400: '#d4b08a',
          500: '#c4956a',
        },
        blush: {
          50: '#fdf5f5',
          100: '#fae8e8',
          200: '#f5d0d0',
          300: '#ecadad',
          400: '#de7f7f',
          500: '#cc5c5c',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cddccd',
          300: '#a8c1a8',
          400: '#7da07d',
          500: '#5c815c',
        },
        sand: {
          50: '#faf8f5',
          100: '#f2ede4',
          200: '#e5d9c8',
          300: '#d3c0a3',
          400: '#bfa37e',
          500: '#a8885e',
        },
        ink: {
          900: '#1a1612',
          800: '#2c2419',
          700: '#3d3422',
          600: '#4e432c',
          500: '#6b5c3e',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 20px rgba(0,0,0,0.06)',
        card: '0 4px 30px rgba(0,0,0,0.08)',
        glow: '0 0 40px rgba(212, 176, 138, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
