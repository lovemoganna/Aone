import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface PreloadConfig {
  enabled: boolean;
  prefetchOnHover: boolean;
  prefetchOnFocus: boolean;
  cacheEnabled: boolean;
  cacheSize: number;
}

export interface PreloadItem {
  url: string;
  timestamp: number;
  cached: boolean;
}

const DEFAULT_CONFIG: PreloadConfig = {
  enabled: true,
  prefetchOnHover: true,
  prefetchOnFocus: true,
  cacheEnabled: true,
  cacheSize: 50,
};

const STORAGE_KEY = 'agent-studio-preload-config';

function createPreloadStore() {
  const config = writable<PreloadConfig>(DEFAULT_CONFIG);
  const cache = writable<PreloadItem[]>([]);

  function loadConfig(): PreloadConfig {
    if (!browser) return DEFAULT_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load preload config:', e);
    }
    return DEFAULT_CONFIG;
  }

  function saveConfig(c: PreloadConfig) {
    if (!browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch (e) {
      console.error('Failed to save preload config:', e);
    }
  }

  // Initialize config
  const initial = loadConfig();
  config.set(initial);

  // Subscribe to config changes
  config.subscribe((c) => {
    saveConfig(c);
  });

  function updateConfig(updates: Partial<PreloadConfig>) {
    config.update((c) => ({ ...c, ...updates }));
  }

  function resetConfig() {
    config.set(DEFAULT_CONFIG);
  }

  const prefetchedSet = new Set<string>();

  // Preload logic
  async function prefetch(url: string) {
    if (!browser || !url) return;
    
    const currentConfig = get(config);
    if (!currentConfig.enabled) return;

    if (prefetchedSet.has(url)) return;
    prefetchedSet.add(url);

    try {
      if (url.startsWith('/')) {
        const { preloadData } = await import('$app/navigation');
        await preloadData(url);
      }
    } catch {
      // Fallback or ignore non-route prefetch
    }

    // Add to cache
    if (currentConfig.cacheEnabled) {
      cache.update((items) => {
        const newItems = [{ url, timestamp: Date.now(), cached: true }, ...items];
        return newItems.slice(0, currentConfig.cacheSize);
      });
    }
  }

  // Preload on hover
  function handleMouseEnter(url: string) {
    const currentConfig = get(config);
    if (currentConfig.prefetchOnHover) {
      prefetch(url);
    }
  }

  // Preload on focus
  function handleFocus(url: string) {
    const currentConfig = get(config);
    if (currentConfig.prefetchOnFocus) {
      prefetch(url);
    }
  }

  // Manual prefetch
  function prefetchUrl(url: string) {
    prefetch(url);
  }

  // Clear cache
  function clearCache() {
    cache.set([]);
  }

  // Get cache stats
  function getCacheStats() {
    const currentCache = get(cache);
    return {
      size: currentCache.length,
      maxSize: get(config).cacheSize,
      urls: currentCache.map((item) => item.url),
    };
  }

  // Check if URL is cached
  function isCached(url: string): boolean {
    const currentCache = get(cache);
    return currentCache.some((item) => item.url === url);
  }

  return {
    config: {
      subscribe: config.subscribe,
      update: config.update,
      set: config.set,
    },
    cache: {
      subscribe: cache.subscribe,
    },
    updateConfig,
    resetConfig,
    handleMouseEnter,
    handleFocus,
    prefetchUrl,
    clearCache,
    getCacheStats,
    isCached,
  };
}

export const preloadStore = createPreloadStore();
