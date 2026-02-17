<script lang="ts">
  import { onMount } from 'svelte';

  interface VirtualScrollItem<T = any> {
    id: string;
    data: T;
    height?: number;
  }

  interface Props<T = any> {
    items: VirtualScrollItem<T>[];
    itemHeight: number;
    containerHeight?: number;
    overscan?: number;
    renderItem: (item: VirtualScrollItem<T>, index: number) => any;
    class?: string;
  }

  let {
    items,
    itemHeight,
    containerHeight = 400,
    overscan = 3,
    renderItem,
    class: className = '',
  }: Props = $props();

  let scrollTop = $state(0);
  let containerRef = $state<HTMLDivElement>();

  // Calculate visible range
  let startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan));
  let endIndex = $derived(Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  ));

  let visibleItems = $derived(items.slice(startIndex, endIndex));
  let totalHeight = $derived(items.length * itemHeight);
  let offsetY = $derived(startIndex * itemHeight);

  function handleScroll(e: Event) {
    const target = e.target as HTMLDivElement;
    scrollTop = target.scrollTop;
  }
</script>

<div
  bind:this={containerRef}
  class="overflow-auto {className}"
  style:height="{containerHeight}px"
  onscroll={handleScroll}
>
  <div style:height="{totalHeight}px" style:position="relative">
    <div style:transform="translateY({offsetY}px)">
      {#each visibleItems as item, i (item.id)}
        <div style:height="{itemHeight}px">
          {@render renderItem(item, startIndex + i)}
        </div>
      {/each}
    </div>
  </div>
</div>
