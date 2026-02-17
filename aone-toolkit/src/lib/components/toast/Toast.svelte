<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-svelte';
  import type { Toast } from '$lib/stores/toastStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';

  interface Props {
    toast: Toast;
  }

  let { toast }: Props = $props();

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };
</script>

<div
  class="flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm {colors[toast.type]}"
  transition:fly={{ y: -20, duration: 300 }}
  role="alert"
>
  <svelte:component this={icons[toast.type]} class="w-5 h-5 shrink-0 {iconColors[toast.type]}" />
  
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium">{toast.message}</p>
    {#if toast.action}
      <button
        class="mt-2 text-sm font-semibold underline hover:no-underline"
        onclick={toast.action.onClick}
      >
        {toast.action.label}
      </button>
    {/if}
  </div>

  {#if toast.dismissible}
    <button
      class="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      onclick={() => toastStore.dismiss(toast.id)}
      aria-label="Dismiss"
    >
      <X class="w-4 h-4 opacity-60" />
    </button>
  {/if}
</div>
