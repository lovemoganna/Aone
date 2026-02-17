import { onMount, onDestroy } from 'svelte';

export interface KeyboardNavigationOptions {
  items: any[];
  onSelect?: (index: number) => void;
  onEnter?: (index: number) => void;
  onEscape?: () => void;
  vimMode?: boolean;
}

export function createKeyboardNavigation(options: KeyboardNavigationOptions) {
  let { items, onSelect, onEnter, onEscape, vimMode = false } = options;
  let selectedIndex = $state(0);

  function handleKeydown(e: KeyboardEvent) {
    const itemsLength = items?.length || 0;
    if (itemsLength === 0) return;

    // Vim mode: j = down, k = up
    if (vimMode) {
      if (e.key === 'j') {
        e.preventDefault();
        moveSelection(1);
        return;
      }
      if (e.key === 'k') {
        e.preventDefault();
        moveSelection(-1);
        return;
      }
    }

    // Arrow keys
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEnter?.(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onEscape?.();
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectedIndex = 0;
      onSelect?.(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      selectedIndex = itemsLength - 1;
      onSelect?.(itemsLength - 1);
    }
  }

  function moveSelection(direction: number) {
    const itemsLength = items?.length || 0;
    if (itemsLength === 0) return;
    
    selectedIndex = (selectedIndex + direction + itemsLength) % itemsLength;
    onSelect?.(selectedIndex);
  }

  function setIndex(index: number) {
    selectedIndex = index;
  }

  function reset() {
    selectedIndex = 0;
  }

  return {
    get selectedIndex() { return selectedIndex; },
    set selectedIndex(value) { selectedIndex = value; },
    handleKeydown,
    moveSelection,
    setIndex,
    reset,
  };
}

// Composable for list keyboard navigation
export function useListKeyboardNavigation(
  getItems: () => any[],
  onSelect?: (item: any, index: number) => void
) {
  let selectedIndex = $state(0);

  function handleKeydown(e: KeyboardEvent) {
    const items = getItems();
    const len = items.length;
    if (len === 0) return;

    if (e.key === 'ArrowDown' || (e.key === 'j' && !e.ctrlKey && !e.metaKey)) {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, len - 1);
      onSelect?.(items[selectedIndex], selectedIndex);
    } else if (e.key === 'ArrowUp' || (e.key === 'k' && !e.ctrlKey && !e.metaKey)) {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      onSelect?.(items[selectedIndex], selectedIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      return items[selectedIndex];
    }
  }

  return {
    get selectedIndex() { return selectedIndex; },
    set selectedIndex(value) { selectedIndex = value; },
    handleKeydown,
  };
}
