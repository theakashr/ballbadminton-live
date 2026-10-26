/**
 * Ball Badminton Live — Design System Tokens
 * Phase 3.0: Premium Mobile App & Android Experience
 */

export const TOKENS = {
  colors: {
    // Primary brand identity
    plum: {
      950: '#150B1B',
      900: '#211329', // Core Deep Plum
      850: '#2A1834',
      800: '#341E40',
      700: '#482A59',
      600: '#623B78',
    },
    charcoal: {
      950: '#15131B', // Core Dark Surface
      900: '#1C1924',
      850: '#23202E',
      800: '#2C283A',
      700: '#3F3B52',
      600: '#585370',
    },
    brand: {
      orange: '#FF851B', // Warm Orange (Action primary)
      orangeHover: '#EA730B',
      coral: '#FF5B45', // Sunset Coral (Live alert)
      coralHover: '#E94630',
      yellow: '#FFDC00', // Wool Ball Yellow
    },
    neutral: {
      softWhite: '#F8F5F2',
      mutedGrey: '#B7AFBD',
    },
    // Semantic status tokens
    status: {
      live: {
        bg: 'rgba(255, 91, 69, 0.15)',
        border: 'rgba(255, 91, 69, 0.4)',
        text: '#FF5B45',
        dot: '#FF5B45',
      },
      upcoming: {
        bg: 'rgba(2, 132, 199, 0.15)',
        border: 'rgba(2, 132, 199, 0.4)',
        text: '#38BDF8',
        dot: '#38BDF8',
      },
      completed: {
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
        text: '#34D399',
        dot: '#10B981',
      },
      paused: {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        text: '#FBBF24',
        dot: '#F59E0B',
      },
    },
    // Outdoor high-contrast mode for outdoor court glare
    outdoor: {
      bg: '#000000',
      surface: '#0A0A0A',
      border: '#FFE600',
      text: '#FFFFFF',
      team1: '#FFE600',
      team2: '#00E5FF',
    },
  },
  typography: {
    fontDisplay: '"Space Grotesk", sans-serif',
    fontBody: 'Inter, system-ui, -apple-system, sans-serif',
    fontScore: '"Space Grotesk", monospace',
  },
  borderRadius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
    elevated: '0 12px 36px -6px rgba(15, 8, 20, 0.75)',
    orangeGlow: '0 0 25px -4px rgba(255, 133, 27, 0.3)',
    coralGlow: '0 0 25px -4px rgba(255, 91, 69, 0.3)',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type DesignTokens = typeof TOKENS;
