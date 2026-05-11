/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'fcp-dark':           '#1C1C1E',
        'fcp-gray':           '#2A2A2D',
        'fcp-border':         '#3A3A3E',
        'fcp-text':           '#F2F2F7',
        'fcp-text-secondary': '#A1A1AA',
        'fcp-accent':         '#0A84FF',
        'fcp-success':        '#30D158',
        'fcp-destructive':    '#FF453A',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0.7' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.5s ease-out both',
        'fade-in-up':     'fade-in-up 0.45s ease-out both',
        'fade-in-up-d1':  'fade-in-up 0.45s 0.1s ease-out both',
        'fade-in-up-d2':  'fade-in-up 0.45s 0.2s ease-out both',
        'fade-in-up-d3':  'fade-in-up 0.45s 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
