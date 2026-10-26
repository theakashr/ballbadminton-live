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
        // Semantic Premium Light Palette
        'app-bg': '#F5F7FB',
        'surface': '#FFFFFF',
        'surface-muted': '#F0F2F6',
        'border-neutral': '#E4E7EC',
        'text-primary': '#182230',
        'text-secondary': '#667085',

        // Brand Accents
        brand: {
          orange: '#FF851B',
          orangeHover: '#E96F0B',
          soft: '#FFF1E5',
          yellow: '#FFDC00',
          coral: '#D92D20',
        },

        // Status Indicators
        status: {
          success: '#16803D',
          warning: '#B54708',
          error: '#D92D20',
          live: '#D92D20',
        },

        // Legacy Color Names mapped cleanly to Light System
        plum: {
          950: '#FFFFFF',
          900: '#F0F2F6',
          850: '#F0F2F6',
          800: '#E4E7EC',
          700: '#D0D5DD',
          600: '#667085',
        },
        charcoal: {
          950: '#F5F7FB',
          900: '#FFFFFF',
          850: '#F0F2F6',
          800: '#E4E7EC',
          700: '#D0D5DD',
          600: '#667085',
        },
        'soft-white': '#182230',
        'muted-grey': '#667085',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        score: ['"Space Grotesk"', 'tabular-nums', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(16, 24, 40, 0.05)',
        'elevated': '0 4px 20px -2px rgba(16, 24, 40, 0.06), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        'orange-glow': '0 4px 14px -2px rgba(255, 133, 27, 0.25)',
        'coral-glow': '0 4px 14px -2px rgba(217, 45, 32, 0.25)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'digit-pop': {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '40%': { transform: 'scale(1.18) translateY(-2px)', filter: 'brightness(1.1)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'digit-pop': 'digit-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in-up': 'fade-in-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
