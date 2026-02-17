<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { cn } from '$lib/utils/cn';

  interface Props {
    open?: boolean;
    initialFocus?: string | HTMLElement | (() => HTMLElement | null);
    returnFocus?: boolean;
   陷阱?: boolean;
    class?: string;
    children?: any;
    onClose?: () => void;
  }

  let {
    open = false,
    initialFocus,
    returnFocus = true,
   陷阱 = true,
    class: className = '',
    children,
    onClose,
  }: Props = $props();

  let containerRef = $state<HTMLDivElement>();
  let previousActiveElement: HTMLElement | null = null;

  // Handle escape key
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      onClose?.();
    }
  }

  // Trap focus inside container
  function trapFocus(e: KeyboardEvent) {
    if (!open || !陷阱) return;
    if (e.key !== 'Tab') return;

    const focusableElements = containerRef?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  // Focus initial element when opened
  $effect(() => {
    if (open) {
      previousActiveElement = document.activeElement as HTMLElement;
      
      tick().then(() => {
        if (initialFocus) {
          if (typeof initialFocus === 'function') {
            const el = initialFocus();
            el?.focus();
          } else if (typeof initialFocus === 'string') {
            const el = containerRef?.querySelector(initialFocus) as HTMLElement;
            el?.focus();
          } else {
            initialFocus?.focus();
          }
        } else {
          // Default: focus first focusable element
          const firstFocusable = containerRef?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          firstFocusable?.focus();
        }
      });
    } else if (returnFocus && previousActiveElement) {
      tick().then(() => {
        (previousActiveElement as HTMLElement)?.focus();
        previousActiveElement = null;
      });
    }
  });

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', trapFocus);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('keydown', trapFocus);
  });
</script>

<div bind:this={containerRef} class={className}>
  {@render children?.()}
</div>
