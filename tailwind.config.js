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
        plum: {
          950: '#150B1B',
          900: '#211329', // Deep plum (core primary)
          850: '#2A1834',
          800: '#341E40',
          700: '#482A59',
          600: '#623B78',
        },
        charcoal: {
          950: '#15131B', // Charcoal (core background)
          900: '#1C1924',
          850: '#23202E',
          800: '#2C283A',
          700: '#3F3B52',
          600: '#585370',
        },
        brand: {
          orange: '#FF851B', // Warm orange
          orangeHover: '#EA730B',
          coral: '#FF5B45', // Sunset coral
          coralHover: '#E94630',
          yellow: '#FFDC00', // Ball Badminton ball
        },
        'soft-white': '#F8F5F2',
        'muted-grey': '#B7AFBD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        score: ['"Space Grotesk"', 'tabular-nums', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'elevated': '0 12px 36px -6px rgba(15, 8, 20, 0.75)',
        'orange-glow': '0 0 25px -4px rgba(255, 133, 27, 0.3)',
        'coral-glow': '0 0 25px -4px rgba(255, 91, 69, 0.3)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'digit-pop': {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '40%': { transform: 'scale(1.18) translateY(-2px)', filter: 'brightness(1.3)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'digit-pop': 'digit-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2.5s infinite linear',
      }
    },
  },
  plugins: [],
}
