import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface HistoryItem {
  id: string;
  type: 'agent' | 'skill' | 'workflow' | 'page' | 'command';
  title: string;
  url?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface HistoryGroup {
  label: string;
  items: HistoryItem[];
}

const MAX_ITEMS = 50;
const STORAGE_KEY = 'agent-studio-history';

function loadFromStorage(): HistoryItem[] {
  if (!browser) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
  return [];
}

function saveToStorage(items: HistoryItem[]) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

function createHistoryStore() {
  const initial = loadFromStorage();
  const { subscribe, set, update } = writable<HistoryItem[]>(initial);

  // Auto-save on changes
  subscribe((value) => {
    saveToStorage(value);
  });

  function add(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: HistoryItem = {
      ...item,
      id,
      timestamp: Date.now(),
    };

    update((items) => {
      // Remove duplicate (same type and url)
      const filtered = items.filter(
        (i) => !(i.type === item.type && i.url === item.url)
      );
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      return updated;
    });

    return id;
  }

  function remove(id: string) {
    update((items) => items.filter((item) => item.id !== id));
  }

  function clear() {
    set([]);
  }

  function clearByType(type: HistoryItem['type']) {
    update((items) => items.filter((item) => item.type !== type));
  }

  function clearOlderThan(timestamp: number) {
    update((items) => items.filter((item) => item.timestamp > timestamp));
  }

  function search(query: string): HistoryItem[] {
    const items = get({ subscribe });
    const lowerQuery = query.toLowerCase();
    
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.type.toLowerCase().includes(lowerQuery)
    );
  }

  function getRecent(limit = 10): HistoryItem[] {
    const items = get({ subscribe });
    return items.slice(0, limit);
  }

  function getByType(type: HistoryItem['type']): HistoryItem[] {
    const items = get({ subscribe });
    return items.filter((item) => item.type === type);
  }

  return {
    subscribe,
    set,
    add,
    remove,
    clear,
    clearByType,
    clearOlderThan,
    search,
    getRecent,
    getByType,
  };
}

export const historyStore = createHistoryStore();

// Derived store for grouped history
export const groupedHistory = derived(historyStore, ($history) => {
  const now = Date.now();
  const today = new Date().setHours(0, 0, 0, 0);
  const thisWeek = today - 7 * 24 * 60 * 60 * 1000;
  const thisMonth = today - 30 * 24 * 60 * 60 * 1000;

  const groups: HistoryGroup[] = [
    { label: '今天', items: [] },
    { label: '本周', items: [] },
    { label: '本月', items: [] },
    { label: '更早', items: [] },
  ];

  $history.forEach((item) => {
    if (item.timestamp >= today) {
      groups[0].items.push(item);
    } else if (item.timestamp >= thisWeek) {
      groups[1].items.push(item);
    } else if (item.timestamp >= thisMonth) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  });

  return groups.filter((g) => g.items.length > 0);
});
