import { writable, get } from 'svelte/store';

export interface Shortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'meta' | 'shift' | 'alt')[];
  description: string;
  category: 'navigation' | 'action' | 'editor' | 'system';
  action: () => void;
  enabled?: boolean;
}

export interface ShortcutState {
  shortcuts: Shortcut[];
  customShortcuts: Record<string, string>; // shortcutId -> key combination
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  // Navigation
  { id: 'nav-home', key: 'g h', modifiers: [], description: '跳转首页', category: 'navigation', action: () => {} },
  { id: 'nav-agents', key: 'g a', modifiers: [], description: '跳转 Agent 列表', category: 'navigation', action: () => {} },
  { id: 'nav-skills', key: 'g s', modifiers: [], description: '跳转 Skills 列表', category: 'navigation', action: () => {} },
  { id: 'nav-workflow', key: 'g w', modifiers: [], description: '跳转工作流', category: 'navigation', action: () => {} },
  
  // Actions
  { id: 'save', key: 's', modifiers: ['ctrl'], description: '保存当前内容', category: 'action', action: () => {} },
  { id: 'new-agent', key: 'n', modifiers: ['ctrl'], description: '新建 Agent', category: 'action', action: () => {} },
  { id: 'new-skill', key: 'n', modifiers: ['ctrl', 'shift'], description: '新建 Skill', category: 'action', action: () => {} },
  { id: 'delete', key: 'Backspace', modifiers: ['ctrl'], description: '删除选中项', category: 'action', action: () => {} },
  { id: 'duplicate', key: 'd', modifiers: ['ctrl'], description: '复制选中项', category: 'action', action: () => {} },
  { id: 'rename', key: 'F2', modifiers: [], description: '重命名选中项', category: 'action', action: () => {} },
  
  // Editor
  { id: 'undo', key: 'z', modifiers: ['ctrl'], description: '撤销', category: 'editor', action: () => {} },
  { id: 'redo', key: 'z', modifiers: ['ctrl', 'shift'], description: '重做', category: 'editor', action: () => {} },
  { id: 'find', key: 'f', modifiers: ['ctrl'], description: '查找', category: 'editor', action: () => {} },
  { id: 'replace', key: 'f', modifiers: ['ctrl', 'shift'], description: '查找替换', category: 'editor', action: () => {} },
  
  // System
  { id: 'command-palette', key: 'k', modifiers: ['ctrl'], description: '打开命令面板', category: 'system', action: () => {} },
  { id: 'quick-jump', key: 'p', modifiers: ['ctrl'], description: '快速跳转', category: 'system', action: () => {} },
  { id: 'toggle-theme', key: 't', modifiers: ['ctrl', 'shift'], description: '切换主题', category: 'system', action: () => {} },
  { id: 'toggle-sidebar', key: 'b', modifiers: ['ctrl'], description: '切换侧边栏', category: 'system', action: () => {} },
];

const STORAGE_KEY = 'agent-studio-shortcuts';

function loadFromStorage(): ShortcutState {
  if (typeof window === 'undefined') return { shortcuts: DEFAULT_SHORTCUTS, customShortcuts: {} };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults (in case new shortcuts were added)
      return {
        shortcuts: DEFAULT_SHORTCUTS.map(defaultShortcut => {
          const custom = parsed.customShortcuts?.[defaultShortcut.id];
          return custom ? { ...defaultShortcut, key: custom } : defaultShortcut;
        }),
        customShortcuts: parsed.customShortcuts || {},
      };
    }
  } catch (e) {
    console.error('Failed to load shortcuts:', e);
  }
  return { shortcuts: DEFAULT_SHORTCUTS, customShortcuts: {} };
}

function saveToStorage(state: ShortcutState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save shortcuts:', e);
  }
}

function createShortcutStore() {
  const initial = loadFromStorage();
  const { subscribe, update } = writable<ShortcutState>(initial);

  subscribe((value) => {
    saveToStorage(value);
  });

  function parseKeyCombo(key: string, modifiers: string[]): string {
    const parts: string[] = [];
    if (modifiers.includes('ctrl')) parts.push('Ctrl');
    if (modifiers.includes('meta')) parts.push('Meta');
    if (modifiers.includes('shift')) parts.push('Shift');
    if (modifiers.includes('alt')) parts.push('Alt');
    parts.push(key.toUpperCase());
    return parts.join('+');
  }

  function getShortcutString(shortcut: Shortcut): string {
    return parseKeyCombo(shortcut.key, shortcut.modifiers);
  }

  function registerShortcut(id: string, action: () => void) {
    update((state) => ({
      ...state,
      shortcuts: state.shortcuts.map((s) =>
        s.id === id ? { ...s, action } : s
      ),
    }));
  }

  function unregisterShortcut(id: string) {
    update((state) => ({
      ...state,
      shortcuts: state.shortcuts.map((s) =>
        s.id === id ? { ...s, action: () => {} } : s
      ),
    }));
  }

  function setCustomShortcut(id: string, key: string) {
    update((state) => ({
      ...state,
      customShortcuts: { ...state.customShortcuts, [id]: key },
      shortcuts: state.shortcuts.map((s) =>
        s.id === id ? { ...s, key } : s
      ),
    }));
  }

  function resetShortcut(id: string) {
    update((state) => {
      const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.id === id);
      if (!defaultShortcut) return state;
      
      const newCustomShortcuts = { ...state.customShortcuts };
      delete newCustomShortcuts[id];
      
      return {
        customShortcuts: newCustomShortcuts,
        shortcuts: state.shortcuts.map((s) =>
          s.id === id ? { ...s, key: defaultShortcut.key, modifiers: defaultShortcut.modifiers } : s
        ),
      };
    });
  }

  function resetAllShortcuts() {
    update((state) => ({
      customShortcuts: {},
      shortcuts: DEFAULT_SHORTCUTS,
    }));
  }

  function getShortcutsByCategory(): Record<string, Shortcut[]> {
    const state = get({ subscribe });
    return state.shortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, Shortcut[]>);
  }

  return {
    subscribe,
    registerShortcut,
    unregisterShortcut,
    setCustomShortcut,
    resetShortcut,
    resetAllShortcuts,
    getShortcutsByCategory,
    getShortcutString,
  };
}

export const shortcutStore = createShortcutStore();

// Helper function to check if key matches shortcut
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const key = event.key.toLowerCase();
  const targetKey = shortcut.key.toLowerCase();
  
  const modifiersMatch = 
    (shortcut.modifiers.includes('ctrl') === (event.ctrlKey || event.metaKey)) &&
    (shortcut.modifiers.includes('shift') === event.shiftKey) &&
    (shortcut.modifiers.includes('alt') === event.altKey) &&
    (shortcut.modifiers.includes('meta') === event.metaKey);
  
  return key === targetKey && modifiersMatch;
}
