import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface LayoutConfig {
  id: string;
  name: string;
  icon?: string;
  isDefault?: boolean;
  panels: {
    [key: string]: {
      visible: boolean;
      width?: number;
      height?: number;
      position?: 'left' | 'right' | 'top' | 'bottom';
      order?: number;
    };
  };
}

export interface LayoutState {
  activeLayoutId: string;
  layouts: LayoutConfig[];
}

const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'default',
    name: '默认布局',
    isDefault: true,
    panels: {
      sidebar: { visible: true, width: 240 },
      main: { visible: true },
    },
  },
  {
    id: 'focus',
    name: '专注模式',
    panels: {
      sidebar: { visible: false },
      main: { visible: true },
    },
  },
  {
    id: 'wide',
    name: '宽屏模式',
    panels: {
      sidebar: { visible: true, width: 200 },
      main: { visible: true },
    },
  },
];

const STORAGE_KEY = 'agent-studio-layouts';

function loadFromStorage(): LayoutState {
  if (!browser) return { activeLayoutId: 'default', layouts: DEFAULT_LAYOUTS };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load layouts:', e);
  }
  return { activeLayoutId: 'default', layouts: DEFAULT_LAYOUTS };
}

function saveToStorage(state: LayoutState) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save layouts:', e);
  }
}

function createLayoutStore() {
  const initial = loadFromStorage();
  const { subscribe, set, update } = writable<LayoutState>(initial);

  subscribe((value) => {
    saveToStorage(value);
  });

  function setActiveLayout(id: string) {
    update((state) => ({
      ...state,
      activeLayoutId: id,
    }));
  }

  function addLayout(layout: Omit<LayoutConfig, 'id'>) {
    const id = `layout-${Date.now()}`;
    update((state) => ({
      ...state,
      layouts: [...state.layouts, { ...layout, id }],
    }));
    return id;
  }

  function updateLayout(id: string, updates: Partial<LayoutConfig>) {
    update((state) => ({
      ...state,
      layouts: state.layouts.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  }

  function deleteLayout(id: string) {
    update((state) => {
      const layout = state.layouts.find((l) => l.id === id);
      if (layout?.isDefault) return state;
      
      return {
        ...state,
        activeLayoutId: state.activeLayoutId === id ? 'default' : state.activeLayoutId,
        layouts: state.layouts.filter((l) => l.id !== id),
      };
    });
  }

  function resetToDefaults() {
    set({ activeLayoutId: 'default', layouts: DEFAULT_LAYOUTS });
  }

  function getActiveLayout(): LayoutConfig | undefined {
    const state = get({ subscribe });
    return state.layouts.find((l) => l.id === state.activeLayoutId);
  }

  return {
    subscribe,
    set,
    setActiveLayout,
    addLayout,
    updateLayout,
    deleteLayout,
    resetToDefaults,
    getActiveLayout,
  };
}

export const layoutStore = createLayoutStore();
