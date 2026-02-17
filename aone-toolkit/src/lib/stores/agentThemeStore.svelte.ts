import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface AgentTheme {
  id: string;
  name: string;
  description?: string;
  category: 'built-in' | 'industry' | 'custom';
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Visual effects
  gradient?: string;
  gradientAngle?: number;
  pattern?: string;
  
  // Shape
  avatarShape: 'circle' | 'square' | 'rounded' | 'hexagon' | 'custom';
  borderRadius?: number;
  
  // Animation
  hoverAnimation?: string;
  
  // Custom CSS (for advanced users)
  customCss?: string;
  
  // Preview
  preview?: string;
  
  // Metadata
  isDefault?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface AgentThemeConfig {
  currentThemeId: string | null;
  customThemes: AgentTheme[];
}

// Built-in themes
export const BUILT_IN_THEMES: AgentTheme[] = [
  {
    id: 'default',
    name: '默认',
    description: '系统默认主题',
    category: 'built-in',
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    accentColor: '#93C5FD',
    avatarShape: 'circle',
    isDefault: true,
  },
  {
    id: 'tech-blue',
    name: '科技蓝',
    description: '适合技术类 AI Agent',
    category: 'industry',
    primaryColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    accentColor: '#7DD3FC',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
    avatarShape: 'hexagon',
  },
  {
    id: 'medical-green',
    name: '医疗绿',
    description: '适合医疗健康类 Agent',
    category: 'industry',
    primaryColor: '#22C55E',
    secondaryColor: '#4ADE80',
    accentColor: '#86EFAC',
    avatarShape: 'circle',
  },
  {
    id: 'finance-gold',
    name: '金融金',
    description: '适合金融咨询类 Agent',
    category: 'industry',
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    accentColor: '#FDE68A',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    avatarShape: 'rounded',
  },
  {
    id: 'creative-purple',
    name: '创意紫',
    description: '适合创意设计类 Agent',
    category: 'industry',
    primaryColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
    accentColor: '#C4B5FD',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    avatarShape: 'hexagon',
  },
  {
    id: 'warm-orange',
    name: '温暖橙',
    description: '适合客服服务类 Agent',
    category: 'industry',
    primaryColor: '#F97316',
    secondaryColor: '#FB923C',
    accentColor: '#FDBA74',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    avatarShape: 'circle',
  },
  {
    id: 'dark-elegant',
    name: '暗夜雅致',
    description: '适合高端专业类 Agent',
    category: 'built-in',
    primaryColor: '#1E293B',
    secondaryColor: '#334155',
    accentColor: '#64748B',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    avatarShape: 'rounded',
  },
  {
    id: 'minimal-light',
    name: '极简白',
    description: '适合清爽简洁类 Agent',
    category: 'built-in',
    primaryColor: '#F8FAFC',
    secondaryColor: '#E2E8F0',
    accentColor: '#CBD5E1',
    avatarShape: 'square',
    pattern: 'dots',
  },
];

const STORAGE_KEY = 'agent-studio-themes';

function loadFromStorage(): AgentThemeConfig {
  if (!browser) return { currentThemeId: 'default', customThemes: [] };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load themes:', e);
  }
  return { currentThemeId: 'default', customThemes: [] };
}

function saveToStorage(config: AgentThemeConfig) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save themes:', e);
  }
}

function createThemeStore() {
  const initial = loadFromStorage();
  const { subscribe, update, set } = writable<AgentThemeConfig>(initial);

  subscribe((value) => {
    saveToStorage(value);
  });

  function setCurrentTheme(themeId: string) {
    update((config) => ({
      ...config,
      currentThemeId: themeId,
    }));
  }

  function getCurrentTheme(): AgentTheme {
    const config = get({ subscribe });
    const theme = BUILT_IN_THEMES.find(t => t.id === config.currentThemeId) 
      || config.customThemes.find(t => t.id === config.currentThemeId);
    return theme || BUILT_IN_THEMES[0];
  }

  function addCustomTheme(theme: Omit<AgentTheme, 'id' | 'createdAt' | 'updatedAt' | 'category'>) {
    const id = `theme-${Date.now()}`;
    const newTheme: AgentTheme = {
      ...theme,
      id,
      category: 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    update((config) => ({
      ...config,
      customThemes: [...config.customThemes, newTheme],
    }));

    return id;
  }

  function updateCustomTheme(themeId: string, updates: Partial<AgentTheme>) {
    update((config) => ({
      ...config,
      customThemes: config.customThemes.map((t) =>
        t.id === themeId ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    }));
  }

  function deleteCustomTheme(themeId: string) {
    update((config) => {
      const theme = config.customThemes.find(t => t.id === themeId);
      if (!theme) return config;
      
      return {
        currentThemeId: config.currentThemeId === themeId ? 'default' : config.currentThemeId,
        customThemes: config.customThemes.filter(t => t.id !== themeId),
      };
    });
  }

  function duplicateTheme(themeId: string, newName?: string): string | null {
    const config = get({ subscribe });
    const theme = [...BUILT_IN_THEMES, ...config.customThemes].find(t => t.id === themeId);
    if (!theme) return null;

    return addCustomTheme({
      ...theme,
      name: newName || `${theme.name} (副本)`,
      isDefault: false,
    });
  }

  function getAllThemes(): AgentTheme[] {
    const config = get({ subscribe });
    return [...BUILT_IN_THEMES, ...config.customThemes];
  }

  function resetToDefaults() {
    set({ currentThemeId: 'default', customThemes: [] });
  }

  return {
    subscribe,
    setCurrentTheme,
    getCurrentTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
    getAllThemes,
    resetToDefaults,
  };
}

export const themeStore = createThemeStore();

// CSS variable generator
export function generateThemeCSS(theme: AgentTheme): string {
  return `
    --agent-theme-primary: ${theme.primaryColor};
    --agent-theme-secondary: ${theme.secondaryColor};
    --agent-theme-accent: ${theme.accentColor};
    --agent-theme-gradient: ${theme.gradient || 'none'};
    --agent-theme-pattern: ${theme.pattern || 'none'};
  `;
}
