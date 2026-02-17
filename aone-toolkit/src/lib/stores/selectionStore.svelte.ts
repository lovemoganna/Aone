import { writable, derived } from 'svelte/store';

export interface SelectionItem {
  id: string;
  type: 'agent' | 'skill' | 'workflow' | 'node';
  name: string;
  selected?: boolean;
}

function createSelectionStore<T extends SelectionItem = SelectionItem>() {
  const items = writable<T[]>([]);
  const { subscribe, update } = items;

  // Derived store for selected items
  const selectedItems = derived(items, ($items) => 
    $items.filter(item => item.selected)
  );

  // Derived store for selected IDs
  const selectedIds = derived(selectedItems, ($selected) => 
    new Set($selected.map(item => item.id))
  );

  // Check if all items are selected
  const allSelected = derived(items, ($items) => 
    $items.length > 0 && $items.every(item => item.selected)
  );

  // Check if some items are selected
  const someSelected = derived(items, ($items) => 
    $items.some(item => item.selected) && !$items.every(item => item.selected)
  );

  function setItems(newItems: T[]) {
    items.set(newItems);
  }

  function toggleSelect(id: string) {
    update(($items) => 
      $items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }

  function selectOne(id: string) {
    update(($items) => 
      $items.map(item => 
        item.id === id ? { ...item, selected: true } : item
      )
    );
  }

  function selectAll() {
    update(($items) => 
      $items.map(item => ({ ...item, selected: true }))
    );
  }

  function deselectAll() {
    update(($items) => 
      $items.map(item => ({ ...item, selected: false }))
    );
  }

  // Range select - select from last selected to target
  function selectRange(targetId: string) {
    update(($items) => {
      const lastSelected = $items.findLast(item => item.selected);
      if (!lastSelected) {
        // If nothing was selected, just select the target
        return $items.map(item => 
          item.id === targetId ? { ...item, selected: true } : item
        );
      }

      const lastIndex = $items.findIndex(item => item.id === lastSelected.id);
      const targetIndex = $items.findIndex(item => item.id === targetId);

      if (lastIndex === -1 || targetIndex === -1) return $items;

      const [start, end] = lastIndex < targetIndex 
        ? [lastIndex, targetIndex] 
        : [targetIndex, lastIndex];

      return $items.map((item, index) => ({
        ...item,
        selected: index >= start && index <= end ? true : item.selected,
      }));
    });
  }

  function isSelected(id: string): boolean {
    let result = false;
    subscribe(($items) => {
      result = $items.some(item => item.id === id && item.selected);
    })();
    return result;
  }

  function getSelected(): T[] {
    let result: T[] = [];
    subscribe(($items) => {
      result = $items.filter(item => item.selected);
    })();
    return result;
  }

  function addItem(item: T) {
    update(($items) => [...$items, item]);
  }

  function removeItem(id: string) {
    update(($items) => $items.filter(item => item.id !== id));
  }

  function updateItem(id: string, updates: Partial<T>) {
    update(($items) => 
      $items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }

  function clear() {
    items.set([]);
  }

  return {
    subscribe,
    selectedItems,
    selectedIds,
    allSelected,
    someSelected,
    setItems,
    toggleSelect,
    selectOne,
    selectAll,
    deselectAll,
    selectRange,
    isSelected,
    getSelected,
    addItem,
    removeItem,
    updateItem,
    clear,
  };
}

export const selectionStore = createSelectionStore();
