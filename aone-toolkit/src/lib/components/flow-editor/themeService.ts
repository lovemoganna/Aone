/**
 * Theme Service for Flow Editor
 * 
 * Problem: No theme switching capability, users stuck with single theme
 * Solution: Full light/dark theme support with system preference detection and persistence
 * 
 * Benefits:
 * - Better user experience in different lighting conditions
 * - Reduced eye strain for extended use
 * - System preference detection
 * - Persistent theme preference
 */

import { writable, derived, get } from 'svelte/store';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';

// Theme configuration
export interface ThemeColors {
  // Background
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgActive: string;
  bgOverlay: string;
  
  // Borders
  borderColor: string;
  borderLight: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Accent colors
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Node colors
  nodeDefault: string;
  nodeTrigger: string;
  nodeAction: string;
  nodeLogic: string;
  nodeAgent: string;
  nodeIntegration: string;
  nodeOutput: string;
  
  // Edge colors
  edgeDefault: string;
  edgeActive: string;
  edgeError: string;
  
  // Canvas
  canvasBg: string;
  gridLine: string;
  gridLineLight: string;
}

// Dark theme colors
const DARK_COLORS: ThemeColors = {
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  bgHover: '#334155',
  bgActive: '#475569',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',
  
  borderColor: '#334155',
  borderLight: '#1e293b',
  
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#0f172a',
  
  primary: '#3b82f6',
  primaryHover: '#60a5fa',
  primaryLight: 'rgba(59, 130, 246, 0.1)',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  nodeDefault: '#374151',
  nodeTrigger: '#f59e0b',
  nodeAction: '#3b82f6',
  nodeLogic: '#8b5cf6',
  nodeAgent: '#10b981',
  nodeIntegration: '#ec4899',
  nodeOutput: '#06b6d4',
  
  edgeDefault: '#475569',
  edgeActive: '#3b82f6',
  edgeError: '#ef4444',
  
  canvasBg: '#0f172a',
  gridLine: '#1e293b',
  gridLineLight: '#334155',
};

// Light theme colors
const LIGHT_COLORS: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgTertiary: '#f1f5f9',
  bgHover: '#f1f5f9',
  bgActive: '#e2e8f0',
  bgOverlay: 'rgba(255, 255, 255, 0.8)',
  
  borderColor: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  
  primary: '#2563eb',
  primaryHover: '#3b82f6',
  primaryLight: 'rgba(37, 99, 235, 0.1)',
  secondary: '#64748b',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  
  nodeDefault: '#e2e8f0',
  nodeTrigger: '#f59e0b',
  nodeAction: '#2563eb',
  nodeLogic: '#7c3aed',
  nodeAgent: '#059669',
  nodeIntegration: '#db2777',
  nodeOutput: '#0891b2',
  
  edgeDefault: '#94a3b8',
  edgeActive: '#2563eb',
  edgeError: '#dc2626',
  
  canvasBg: '#f8fafc',
  gridLine: '#e2e8f0',
  gridLineLight: '#f1f5f9',
};

// Theme storage
const THEME_MODE_KEY = 'flow_editor_theme_mode';
const THEME_COLORS_KEY = 'flow_editor_theme_colors';

// Stores
export const themeMode = writable<ThemeMode>('system');
export const colorScheme = writable<ColorScheme>('default');

// Derived system preference
const systemPrefersDark = writable<boolean>(
  typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : true
);

// Derived effective theme (resolves system to light/dark)
export const effectiveTheme = derived(
  [themeMode, systemPrefersDark],
  ([$mode, $systemDark]) => {
    if ($mode === 'system') {
      return $systemDark ? 'dark' : 'light';
    }
    return $mode;
  }
);

// Derived current colors based on theme and scheme
export const currentColors = derived(
  [effectiveTheme, colorScheme],
  ([$theme, $scheme]) => {
    const baseColors = $theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    
    // Apply color scheme modifications if not default
    if ($scheme !== 'default') {
      return applyColorScheme(baseColors, $scheme);
    }
    
    return baseColors;
  }
);

// Apply color scheme
function applyColorScheme(colors: ThemeColors, scheme: ColorScheme): ThemeColors {
  const schemeColors: Record<ColorScheme, Partial<ThemeColors>> = {
    default: {},
    blue: {
      primary: '#0ea5e9',
      primaryHover: '#38bdf8',
      nodeAction: '#0ea5e9',
    },
    green: {
      primary: '#22c55e',
      primaryHover: '#4ade80',
      nodeAgent: '#22c55e',
    },
    purple: {
      primary: '#a855f7',
      primaryHover: '#c084fc',
      nodeLogic: '#a855f7',
    },
    orange: {
      primary: '#f97316',
      primaryHover: '#fb923c',
      nodeTrigger: '#f97316',
    },
  };
  
  return {
    ...colors,
    ...schemeColors[scheme],
  };
}

// Toggle theme between light and dark
export function toggleTheme() {
  themeMode.update(mode => {
    if (mode === 'dark') return 'light';
    if (mode === 'light') return 'system';
    return 'dark';
  });
}

// Set specific theme mode
export function setThemeMode(mode: ThemeMode) {
  themeMode.set(mode);
}

// Set color scheme
export function setColorScheme(scheme: ColorScheme) {
  colorScheme.set(scheme);
}

// Apply theme to document (CSS variables)
export function applyThemeToDocument(colors: ThemeColors) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Background
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--bg-active', colors.bgActive);
  root.style.setProperty('--bg-overlay', colors.bgOverlay);
  
  // Borders
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--border-light', colors.borderLight);
  
  // Text
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--text-inverse', colors.textInverse);
  
  // Accents
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-hover', colors.primaryHover);
  root.style.setProperty('--primary-light', colors.primaryLight);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--error', colors.error);
  root.style.setProperty('--info', colors.info);
  
  // Nodes
  root.style.setProperty('--node-default', colors.nodeDefault);
  root.style.setProperty('--node-trigger', colors.nodeTrigger);
  root.style.setProperty('--node-action', colors.nodeAction);
  root.style.setProperty('--node-logic', colors.nodeLogic);
  root.style.setProperty('--node-agent', colors.nodeAgent);
  root.style.setProperty('--node-integration', colors.nodeIntegration);
  root.style.setProperty('--node-output', colors.nodeOutput);
  
  // Edges
  root.style.setProperty('--edge-default', colors.edgeDefault);
  root.style.setProperty('--edge-active', colors.edgeActive);
  root.style.setProperty('--edge-error', colors.edgeError);
  
  // Canvas
  root.style.setProperty('--canvas-bg', colors.canvasBg);
  root.style.setProperty('--grid-line', colors.gridLine);
  root.style.setProperty('--grid-line-light', colors.gridLineLight);
  
  // Set data attribute for CSS selectors
  root.setAttribute('data-theme', get(effectiveTheme));
}

// Initialize theme from storage and system preference
export function initializeTheme() {
  if (typeof window === 'undefined') return;
  
  // Load saved preference
  try {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    if (savedMode) {
      themeMode.set(savedMode);
    }
    
    const savedScheme = localStorage.getItem(THEME_COLORS_KEY) as ColorScheme | null;
    if (savedScheme) {
      colorScheme.set(savedScheme);
    }
  } catch {}
  
  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    systemPrefersDark.set(e.matches);
  };
  mediaQuery.addEventListener('change', handler);
  
  // Apply initial theme
  const unsubscribe = currentColors.subscribe(colors => {
    applyThemeToDocument(colors);
  });
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
    unsubscribe();
  };
}

// Save theme preference
export function saveThemePreference() {
  try {
    localStorage.setItem(THEME_MODE_KEY, get(themeMode));
    localStorage.setItem(THEME_COLORS_KEY, get(colorScheme));
  } catch {}
}

// Subscribe to theme changes and apply
let unsubscribe: (() => void) | null = null;

export function setupThemeListener() {
  if (typeof window === 'undefined') return;
  
  unsubscribe = currentColors.subscribe(colors => {
    applyThemeToDocument(colors);
  });
  
  // Save on changes
  themeMode.subscribe(() => saveThemePreference());
  colorScheme.subscribe(() => saveThemePreference());
}

export function cleanupThemeListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// Get theme icon
export function getThemeIcon(mode: ThemeMode): string {
  switch (mode) {
    case 'light': return '☀️';
    case 'dark': return '🌙';
    case 'system': return '💻';
    default: return '🌗';
  }
}

// Get theme label
export function getThemeLabel(mode: ThemeMode): string {
  switch (mode) {
    case 'light': return 'Light';
    case 'dark': return 'Dark';
    case 'system': return 'System';
    default: return 'System';
  }
}

export const themeUtils = {
  DARK_COLORS,
  LIGHT_COLORS,
  themeMode,
  colorScheme,
  effectiveTheme,
  currentColors,
  toggleTheme,
  setThemeMode,
  setColorScheme,
  applyThemeToDocument,
  initializeTheme,
  setupThemeListener,
  cleanupThemeListener,
  getThemeIcon,
  getThemeLabel,
};

export default themeUtils;
