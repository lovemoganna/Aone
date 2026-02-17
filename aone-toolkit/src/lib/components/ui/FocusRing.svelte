<script lang="ts">
  import { cn } from '$lib/utils/cn';

  interface Props {
    visible?: boolean;
    class?: string;
  }

  let { visible = true, class: className = '' }: Props = $props();
</script>

{#if visible}
  <div
    class={cn(
      'absolute inset-0 pointer-events-none rounded-lg ring-2 ring-indigo-500 ring-offset-2 transition-all duration-150',
      className
    )}
  ></div>
{/if}
