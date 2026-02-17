<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cn } from '$lib/utils/cn';

  export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: any;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    separator?: boolean;
    action?: () => void;
    children?: ContextMenuItem[];
  }

  interface Props {
    items: ContextMenuItem[];
    x?: number;
    y?: number;
    class?: string;
  }

  let { items, x = 0, y = 0, class: className = '' }: Props = $props();

  let visible = $state(false);
  let menuRef = $state<HTMLDivElement>();

  export function show(event: MouseEvent, newItems: ContextMenuItem[]) {
    event.preventDefault();
    items = newItems;
    x = event.clientX;
    y = event.clientY;
    visible = true;
  }

  export function hide() {
    visible = false;
  }

  function handleClick(item: ContextMenuItem) {
    if (item.disabled || item.separator) return;
    item.action?.();
    hide();
  }

  function handleClickOutside(event: MouseEvent) {
    if (menuRef && !menuRef.contains(event.target as Node)) {
      hide();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      hide();
    }
  }
</script>

<svelte:window
  onclick={handleClickOutside}
  onkeydown={handleKeydown}
/>

{#if visible}
  <div
    bind:this={menuRef}
    class="fixed z-[100] min-w-[180px] py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 {className}"
    style="left: {x}px; top: {y}px;"
    transition:scale={{ duration: 100, start: 0.95 }}
    role="menu"
  >
    {#each items as item}
      {#if item.separator}
        <div class="my-1 border-t border-slate-200 dark:border-slate-700"></div>
      {:else}
        <button
          class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors
            {item.danger
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : item.disabled
                ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
          disabled={item.disabled}
          onclick={() => handleClick(item)}
          role="menuitem"
        >
          {#if item.icon}
            <svelte:component this={item.icon} class="w-4 h-4" />
          {/if}
          <span class="flex-1">{item.label}</span>
          {#if item.shortcut}
            <kbd class="text-xs text-slate-400 dark:text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
              {item.shortcut}
            </kbd>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
{/if}
