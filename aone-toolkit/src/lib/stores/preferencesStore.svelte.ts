import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'zh';

export interface UserPreferences {
  theme: Theme;
  language: Language;
  sidebarCollapsed: boolean;
  commandPaletteHistory: string[];
  recentAgents: string[];
  recentSkills: string[];
  favoritePages: string[];
  fontSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
  highContrast: boolean;
  lastVisitedPage: string;
  workflowLayout: string;
  skillViewMode: 'grid' | 'list';
  agentViewMode: 'grid' | 'list';
  onboardingCompleted: boolean;
  onboardingStep: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'zh',
  sidebarCollapsed: true,
  commandPaletteHistory: [],
  recentAgents: [],
  recentSkills: [],
  favoritePages: [],
  fontSize: 'md',
  reducedMotion: false,
  highContrast: false,
  lastVisitedPage: '/',
  workflowLayout: 'default',
  skillViewMode: 'grid',
  agentViewMode: 'grid',
  onboardingCompleted: false,
  onboardingStep: 0,
};

const STORAGE_KEY = 'agent-studio-preferences';

function loadFromStorage(): UserPreferences {
  if (!browser) return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

function saveToStorage(prefs: UserPreferences) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

function createPreferencesStore() {
  const initial = loadFromStorage();
  const { subscribe, set, update } = writable<UserPreferences>(initial);

  // Auto-save on changes
  subscribe((value) => {
    saveToStorage(value);
  });

  function reset() {
    set(DEFAULT_PREFERENCES);
  }

  function updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    update((prefs) => ({
      ...prefs,
      [key]: value,
    }));
  }

  function addToHistory(item: string, maxItems = 10) {
    update((prefs) => {
      const history = [item, ...prefs.commandPaletteHistory.filter((h) => h !== item)].slice(
        0,
        maxItems
      );
      return { ...prefs, commandPaletteHistory: history };
    });
  }

  function addRecentAgent(agentId: string, maxItems = 10) {
    update((prefs) => {
      const recent = [agentId, ...prefs.recentAgents.filter((a) => a !== agentId)].slice(
        0,
        maxItems
      );
      return { ...prefs, recentAgents: recent };
    });
  }

  function addRecentSkill(skillId: string, maxItems = 10) {
    update((prefs) => {
      const recent = [skillId, ...prefs.recentSkills.filter((s) => s !== skillId)].slice(
        0,
        maxItems
      );
      return { ...prefs, recentSkills: recent };
    });
  }

  function toggleFavoritePage(page: string) {
    update((prefs) => {
      const isFavorite = prefs.favoritePages.includes(page);
      return {
        ...prefs,
        favoritePages: isFavorite
          ? prefs.favoritePages.filter((p) => p !== page)
          : [...prefs.favoritePages, page],
      };
    });
  }

  function completeOnboarding() {
    update((prefs) => ({
      ...prefs,
      onboardingCompleted: true,
      onboardingStep: 0,
    }));
  }

  function updateOnboardingStep(step: number) {
    update((prefs) => ({
      ...prefs,
      onboardingStep: step,
    }));
  }

  return {
    subscribe,
    set,
    update,
    reset,
    updatePreference,
    addToHistory,
    addRecentAgent,
    addRecentSkill,
    toggleFavoritePage,
    completeOnboarding,
    updateOnboardingStep,
  };
}

export const preferencesStore = createPreferencesStore();
