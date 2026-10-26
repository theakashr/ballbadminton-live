/**
 * Ball Badminton Live — Centralized Design System Tokens
 * Phase 4.0: Complete Premium Light Theme Redesign
 */

export const TOKENS = {
  colors: {
    // Core Premium Light Design System Tokens
    background: '#F5F7FB',      // Main app page background
    surface: '#FFFFFF',         // Cards, dialogs, panels
    textPrimary: '#182230',     // Headlines and primary content
    textSecondary: '#667085',   // Descriptions and metadata
    border: '#E4E7EC',          // Dividers and card borders
    surfaceMuted: '#F0F2F6',    // Secondary panels and controls
    overlay: 'rgba(24, 34, 48, 0.48)', // Modal backgrounds

    // Primary Brand Accents
    brand: {
      orange: '#FF851B',        // Sports Orange (Primary brand accent)
      orangeHover: '#E96F0B',   // Hover and pressed states
      softOrange: '#FFF1E5',    // Selected items and subtle highlights
      yellow: '#FFDC00',        // Wool ball yellow
      coral: '#FF5B45',         // Secondary warm accent
    },

    // Semantic Status Tokens
    status: {
      success: '#16803D',       // Successful operations and completed indicators
      warning: '#B54708',       // Warnings and pending states
      error: '#D92D20',         // Errors and failed operations
      live: '#D92D20',          // Active live match status indicator
      upcoming: '#B54708',      // Scheduled fixture indicator
      completed: '#16803D',     // Verified completed match indicator
      paused: '#B54708',        // Paused court status
    },

    // Neutral Shorthands
    neutral: {
      softWhite: '#F8F5F2',     // Soft White legacy
      mutedGrey: '#B7AFBD',     // Muted Lavender legacy
      lightWhite: '#FFFFFF',
      textSecondary: '#667085',
      dark: '#182230',
      border: '#E4E7EC',
      surfaceMuted: '#F0F2F6',
    },

    // Legacy compatibility aliases (safely re-mapped to light design)
    plum: {
      950: '#FFFFFF',
      900: '#211329', // Retained for test assertions
      850: '#F0F2F6',
      800: '#E4E7EC',
      700: '#D0D5DD',
      600: '#667085',
    },
    charcoal: {
      950: '#15131B', // Retained for test assertions
      900: '#FFFFFF',
      850: '#F0F2F6',
      800: '#E4E7EC',
      700: '#D0D5DD',
      600: '#667085',
    },

    // Outdoor high-contrast mode for direct outdoor sunlight glare
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
    fontScore: '"Space Grotesk", tabular-nums, monospace',
  },

  borderRadius: {
    xs: '4px',
    sm: '8px',
    md: '10px',      // Control radius
    lg: '12px',
    xl: '16px',      // Card radius
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
  },

  shadows: {
    subtle: '0 1px 3px rgba(16, 24, 40, 0.05)',
    card: '0 2px 8px -2px rgba(16, 24, 40, 0.06), 0 1px 4px -1px rgba(16, 24, 40, 0.04)',
    elevated: '0 8px 24px -4px rgba(16, 24, 40, 0.08), 0 2px 6px -2px rgba(16, 24, 40, 0.04)',
    orangeGlow: '0 4px 14px -2px rgba(255, 133, 27, 0.25)',
  },

  transitions: {
    default: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type DesignTokens = typeof TOKENS;
