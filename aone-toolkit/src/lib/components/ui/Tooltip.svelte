<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cn } from '$lib/utils/cn';

  type Placement = 'top' | 'bottom' | 'left' | 'right';
  type Variant = 'default' | 'dark' | 'light';

  interface Props {
    content: string;
    placement?: Placement;
    variant?: Variant;
    delay?: number;
    disabled?: boolean;
    shortcut?: string;
    children?: any;
    class?: string;
  }

  let {
    content,
    placement = 'top',
    variant = 'dark',
    delay = 500,
    disabled = false,
    shortcut,
    children,
    class: className = '',
  }: Props = $props();

  let visible = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let triggerRef = $state<HTMLElement>();

  function show() {
    if (disabled) return;
    timeoutId = setTimeout(() => {
      visible = true;
    }, delay);
  }

  function hide() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    visible = false;
  }

  const positionClasses: Record<Placement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const variantClasses: Record<Variant, string> = {
    default: 'bg-slate-900 text-white',
    dark: 'bg-slate-900 text-white',
    light: 'bg-white text-slate-900 border border-slate-200 dark:border-slate-700',
  };

  const arrowClasses: Record<Placement, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900',
  };
</script>

<div
  class="relative inline-flex {className}"
  onmouseenter={show}
  onmouseleave={hide}
  onfocus={show}
  onblur={hide}
  role="tooltip"
>
  <div bind:this={triggerRef}>
    {@render children?.()}
  </div>

  {#if visible && content}
    <div
      class="absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg whitespace-nowrap {positionClasses[placement]} {variantClasses[variant]}"
      transition:fly={{ y: 8, duration: 150 }}
    >
      <span>{content}</span>
      {#if shortcut}
        <kbd class="ml-2 px-1.5 py-0.5 text-xs rounded bg-black/20 dark:bg-white/10">
          {shortcut}
        </kbd>
      {/if}
      <!-- Arrow -->
      <div class="absolute w-0 h-0 border-4 border-transparent {arrowClasses[placement]}"></div>
    </div>
  {/if}
</div>
