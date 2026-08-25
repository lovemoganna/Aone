<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    quickAddQuery, 
    quickAddPanelOpen, 
    filteredNodes, 
    handleQuickAddShortcut,
    addNodeFromPanel,
    NODE_CATEGORIES,
    favoriteNodes,
    toggleFavorite
  } from './quickAddPanel';
  import { flowState } from './flowState.svelte';
  
  let inputRef: HTMLInputElement;
  let selectedIndex = 0;
  let allResults: any[] = [];
  
  // Update results when filtered nodes change
  $: {
    const fn = $filteredNodes;
    if (fn.results) {
      allResults = fn.results;
    } else if (fn.favorites?.length) {
      allResults = fn.favorites;
    } else if (fn.recent?.length) {
      allResults = fn.recent;
    } else {
      allResults = [];
    }
    selectedIndex = 0;
  }
  
  // Get favorites for display
  let favoritesList: any[] = [];
  $: {
    const fn = $filteredNodes;
    favoritesList = fn.favorites || [];
  }
  
  // Focus input when panel opens
  $: if ($quickAddPanelOpen && inputRef) {
    setTimeout(() => inputRef?.focus(), 50);
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (!$quickAddPanelOpen) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, allResults.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex].type);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closePanel();
        break;
    }
  }
  
  function handleSelect(type: string) {
    addNodeFromPanel(type);
  }
  
  function closePanel() {
    quickAddPanelOpen.set(false);
    quickAddQuery.set('');
    selectedIndex = 0;
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closePanel();
    }
  }
  
  function getCategoryColor(categoryId: string): string {
    const cat = NODE_CATEGORIES.find(c => c.id === categoryId);
    return cat?.color || '#6b7280';
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleQuickAddShortcut);
  });
  
  onDestroy(() => {
    window.removeEventListener('keydown', handleQuickAddShortcut);
  });
</script>

{#if $quickAddPanelOpen}
  <div 
    class="quick-add-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="quick-add-panel">
      <!-- Search Input -->
      <div class="quick-add-search">
        <span class="search-icon">Search</span>
        <input
          bind:this={inputRef}
          bind:value={$quickAddQuery}
          type="text"
          placeholder="Search nodes... (Ctrl+N)"
          class="search-input"
        />
        {#if $quickAddQuery}
          <button class="clear-btn" onclick={() => quickAddQuery.set('')}>Clear</button>
        {/if}
      </div>
      
      <!-- Results List -->
      <div class="quick-add-results">
        <!-- Favorites Section -->
        {#if !$quickAddQuery && favoritesList.length > 0}
          <div class="results-section">
            <div class="section-title">Favorites</div>
            {#each favoritesList as node, index}
              <div
                class="result-item"
                class:selected={index === selectedIndex}
                onclick={() => handleSelect(node.type)}
                onkeydown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(node.type);
                  }
                }}
                onmouseenter={() => selectedIndex = index}
                role="button"
                tabindex="0"
              >
                <span class="node-icon">{node.icon}</span>
                <div class="node-info">
                  <span class="node-label">{node.label}</span>
                  <span class="node-desc">{node.useCase || node.description}</span>
                </div>
                <button
                  type="button"
                  class="favorite-btn" 
                  title="Favorite"
                  aria-label={`Favorite ${node.label}`}
                  onclick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(node.type);
                  }}
                >
                  *
                </button>
              </div>
            {/each}
          </div>
        {/if}
        
        {#if allResults.length > 0}
          {#if !$quickAddQuery && favoritesList.length > 0}
            <div class="section-title">Recent</div>
          {/if}
          {#each allResults as node, index}
            <div
              class="result-item"
              class:selected={index === selectedIndex}
              onclick={() => handleSelect(node.type)}
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSelect(node.type);
                }
              }}
              onmouseenter={() => selectedIndex = index}
              role="button"
              tabindex="0"
            >
              <span class="node-icon">{node.icon}</span>
              <div class="node-info">
                <span class="node-label">{node.label}</span>
                <span class="node-desc">{node.useCase || node.description}</span>
              </div>
              <button
                type="button"
                class="favorite-btn" 
                title={$favoriteNodes.includes(node.type) ? "Remove favorite" : "Add favorite"}
                aria-label={`${$favoriteNodes.includes(node.type) ? "Remove favorite" : "Add favorite"} ${node.label}`}
                onclick={(event) => {
                  event.stopPropagation();
                  toggleFavorite(node.type);
                }}
              >
                {$favoriteNodes.includes(node.type) ? '*' : '+'}
              </button>
            </div>
          {/each}
        {:else if !$quickAddQuery}
          <!-- Show categories when no search -->
          <div class="categories-grid">
            {#each NODE_CATEGORIES as category}
              <button
                class="category-item"
                onclick={() => quickAddQuery.set(category.label)}
              >
                <span class="category-icon" style="background-color: {category.color}20; color: {category.color}">
                  {category.icon}
                </span>
                <span class="category-label">{category.label}</span>
              </button>
            {/each}
          </div>
        {:else}
          <div class="no-results">
            <span>Search</span>
            <p>No nodes found for "{$quickAddQuery}"</p>
          </div>
        {/if}
      </div>
      
      <!-- Footer hint -->
      <div class="quick-add-footer">
        <span class="hint"><kbd>Arrow keys</kbd> Navigate</span>
        <span class="hint"><kbd>Enter</kbd> Select</span>
        <span class="hint"><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .quick-add-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: 9999;
  }
  
  .quick-add-panel {
    background: var(--bg-primary, #1f2937);
    border: 1px solid var(--border-color, #374151);
    border-radius: 12px;
    width: 520px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  
  .quick-add-search {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-color, #374151);
    gap: 12px;
  }
  
  .search-icon {
    font-size: 18px;
    opacity: 0.6;
  }
  
  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 16px;
    color: var(--text-primary, #f3f4f6);
  }
  
  .search-input::placeholder {
    color: var(--text-muted, #9ca3af);
  }
  
  .clear-btn {
    background: none;
    border: none;
    color: var(--text-muted, #9ca3af);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .clear-btn:hover {
    background: var(--bg-hover, #374151);
  }
  
  .quick-add-results {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    gap: 12px;
    text-align: left;
    transition: background 0.15s;
  }
  
  .result-item:hover,
  .result-item.selected {
    background: var(--bg-hover, #374151);
  }
  
  .node-icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary, #111827);
    border-radius: 8px;
  }
  
  .node-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .node-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary, #f3f4f6);
  }
  
  .node-desc {
    font-size: 12px;
    color: var(--text-muted, #9ca3af);
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 8px;
  }
  
  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  
  .category-item:hover {
    background: var(--bg-hover, #374151);
  }
  
  .category-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  .category-label {
    font-size: 12px;
    color: var(--text-primary, #f3f4f6);
  }
  
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px;
    color: var(--text-muted, #9ca3af);
  }
  
  .no-results span {
    font-size: 32px;
    margin-bottom: 8px;
  }
  
  .quick-add-footer {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    border-top: 1px solid var(--border-color, #374151);
    background: var(--bg-secondary, #111827);
  }
  
  .hint {
    font-size: 12px;
    color: var(--text-muted, #9ca3af);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  kbd {
    background: var(--bg-primary, #1f2937);
    border: 1px solid var(--border-color, #4b5563);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
  }
</style>
