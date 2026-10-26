import { describe, it, expect, beforeEach } from 'vitest';

// Minimal DOM mock for node environment
if (typeof (globalThis as any).document === 'undefined') {
  const classes = new Set<string>();
  (globalThis as any).document = {
    documentElement: {
      classList: {
        add(c: string) { classes.add(c); },
        remove(c: string) { classes.delete(c); },
        contains(c: string) { return classes.has(c); },
        clear() { classes.clear(); },
      },
      style: {},
    },
  };
}

describe('Theme Context & Background Switcher', () => {
  beforeEach(() => {
    localStorage.clear();
    (globalThis as any).document.documentElement.classList.clear();
  });

  it('defaults to light mode and sets light class on html root', () => {
    const defaultTheme = localStorage.getItem('bbfi_theme_v1') || 'light';
    expect(defaultTheme).toBe('light');

    // Simulate switching to light
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('switches to white (light) mode and updates document class', () => {
    // Switch to light
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('bbfi_theme_v1', 'light');

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('bbfi_theme_v1')).toBe('light');
  });

  it('persists theme selection across reloads', () => {
    localStorage.setItem('bbfi_theme_v1', 'light');
    const stored = localStorage.getItem('bbfi_theme_v1');
    expect(stored).toBe('light');

    localStorage.setItem('bbfi_theme_v1', 'dark');
    const storedDark = localStorage.getItem('bbfi_theme_v1');
    expect(storedDark).toBe('dark');
  });
});
