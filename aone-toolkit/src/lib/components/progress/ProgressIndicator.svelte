<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-svelte';
  import { progressStore, type ProgressState } from '$lib/stores/progressStore.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let progress = $state<ProgressState | null>(null);

  // Subscribe to store
  progressStore.subscribe((value) => {
    progress = value;
  });

  const statusColors = {
    idle: 'bg-slate-200 dark:bg-slate-700',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-emerald-500',
    error: 'bg-red-500',
    cancelled: 'bg-amber-500',
  };

  const statusIcons = {
    idle: null,
    running: Loader2,
    completed: CheckCircle,
    error: AlertCircle,
    cancelled: X,
  };

  function formatDuration(startTime: number, endTime?: number): string {
    const end = endTime || Date.now();
    const duration = end - startTime;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  }
</script>

{#if progress}
  <div
    class="fixed bottom-4 right-4 z-50 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    transition:fly={{ y: 20, duration: 300 }}
    role="progressbar"
    aria-valuenow={progress.totalProgress}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-2">
        {#if progress.status === 'running'}
          <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
        {:else if progress.status === 'completed'}
          <CheckCircle class="w-4 h-4 text-emerald-500" />
        {:else if progress.status === 'error'}
          <AlertCircle class="w-4 h-4 text-red-500" />
        {/if}
        <span class="font-medium text-slate-900 dark:text-white">{progress.title}</span>
      </div>
      <button
        class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        onclick={() => progressStore.reset()}
        aria-label="Close"
      >
        <X class="w-4 h-4 text-slate-500" />
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="h-1.5 bg-slate-100 dark:bg-slate-700">
      <div
        class="h-full transition-all duration-300 {statusColors[progress.status]}"
        style="width: {progress.totalProgress}%"
      ></div>
    </div>

    <!-- Steps -->
    <div class="p-4 space-y-2 max-h-64 overflow-y-auto">
      {#each progress.steps as step, index}
        <div class="flex items-center gap-3">
          <div class="w-5 h-5 flex items-center justify-center">
            {#if step.status === 'running'}
              <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
            {:else if step.status === 'completed'}
              <CheckCircle class="w-4 h-4 text-emerald-500" />
            {:else if step.status === 'error'}
              <AlertCircle class="w-4 h-4 text-red-500" />
            {:else if step.status === 'cancelled'}
              <X class="w-4 h-4 text-amber-500" />
            {:else}
              <div class="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
            {/if}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-sm {index === progress.currentStepIndex ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}">
                {step.label}
              </span>
              <span class="text-xs text-slate-500">
                {#if step.status === 'running'}
                  {step.progress}%
                {:else if step.status === 'completed' || step.status === 'error'}
                  {#if step.startTime}
                    {formatDuration(step.startTime, step.endTime)}
                  {/if}
                {/if}
              </span>
            </div>
            {#if step.status === 'running'}
              <div class="mt-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-500 transition-all duration-300"
                  style="width: {step.progress}%"
                ></div>
              </div>
            {/if}
            {#if step.error}
              <p class="text-xs text-red-500 mt-1">{step.error}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <span class="text-xs text-slate-500">
        {progress.totalProgress.toFixed(0)}% complete
      </span>
      {#if progress.canCancel && progress.status === 'running'}
        <Button size="sm" variant="ghost" onclick={() => progressStore.cancel()}>
          Cancel
        </Button>
      {/if}
    </div>
  </div>
{/if}
