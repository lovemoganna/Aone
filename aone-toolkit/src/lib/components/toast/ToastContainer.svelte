<script lang="ts">
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import Toast from './Toast.svelte';

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  interface Props {
    position?: keyof typeof positionClasses;
  }

  let { position = 'bottom-right' }: Props = $props();
</script>

<div 
  class="fixed z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none {positionClasses[position]}"
  aria-live="polite"
>
  {#each $toastStore as toast (toast.id)}
    <div class="pointer-events-auto">
      <Toast {toast} />
    </div>
  {/each}
</div>
