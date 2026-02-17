import Fuse from 'fuse.js';
import { writable, derived } from 'svelte/store';

export interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category: 'agent' | 'skill' | 'page' | 'command' | 'workflow' | 'history';
  icon?: string;
  keywords?: string[];
  action: () => void;
  url?: string;
}

function createSearchStore() {
  const items = writable<SearchItem[]>([]);
  const searchQuery = writable('');
  
  const fuse = derived([items, searchQuery], ([$items, $query]) => {
    if (!$query.trim()) return [];
    
    const fuseInstance = new Fuse($items, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'keywords', weight: 0.2 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1,
    });
    
    return fuseInstance.search($query).slice(0, 10).map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches,
    }));
  });

  function addItem(item: SearchItem) {
    items.update(current => [...current, item]);
  }

  function addItems(newItems: SearchItem[]) {
    items.update(current => [...current, ...newItems]);
  }

  function removeItem(id: string) {
    items.update(current => current.filter(item => item.id !== id));
  }

  function clear() {
    items.set([]);
  }

  function setQuery(query: string) {
    searchQuery.set(query);
  }

  return {
    items,
    searchQuery,
    results: fuse,
    addItem,
    addItems,
    removeItem,
    clear,
    setQuery,
  };
}

export const searchStore = createSearchStore();
