<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    hint?: string;
  }

  let {
    label,
    error,
    hint,
    value = $bindable(),
    class: className = "",
    id,
    ...restProps
  }: Props = $props();

  const randomId = `input-${Math.random().toString(36).slice(2, 9)}`;
  let inputId = $derived(id || randomId);
</script>

<div class="w-full">
  {#if label}
    <label
      for={inputId}
      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
    >
      {label}
    </label>
  {/if}

  <input
    id={inputId}
    class="
      w-full px-3 py-2 rounded-lg border
      bg-white dark:bg-slate-800
      text-slate-900 dark:text-slate-100
      placeholder:text-slate-400 dark:placeholder:text-slate-500
      transition-all duration-200
      {error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500/20'}
      focus:outline-none focus:ring-2
      {className}
    "
    bind:value
    {...restProps}
  />

  {#if error}
    <p class="mt-1.5 text-sm text-red-500">{error}</p>
  {:else if hint}
    <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
  {/if}
</div>
