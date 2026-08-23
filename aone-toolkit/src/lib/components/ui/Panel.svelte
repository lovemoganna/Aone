<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    class?: string;
    children?: Snippet;
    header?: Snippet;
  }

  let { 
    title,
    padding = 'md',
    class: className = '',
    children,
    header
  }: Props = $props();

  const paddingClasses: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
</script>

<div class="
  bg-white dark:bg-slate-800 
  rounded-lg border border-slate-200 dark:border-slate-700 
  shadow-soft
  {className}
">
  {#if title || header}
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
      {#if header}
        {@render header()}
      {:else if title}
        <h3 class="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {/if}
    </div>
  {/if}
  
  <div class="{paddingClasses[padding]} {className.includes('flex') ? 'flex-1 min-h-0 flex flex-col h-full' : ''}">
    {@render children?.()}
  </div>
</div>
