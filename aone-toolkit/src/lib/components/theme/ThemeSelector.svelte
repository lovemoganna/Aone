<script lang="ts">
  import { themeStore, BUILT_IN_THEMES, generateThemeCSS, type AgentTheme } from '$lib/stores/agentThemeStore.svelte';
  import { Check, Plus, Trash2, Copy } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let customThemes = $derived($themeStore.customThemes);
  let currentThemeId = $derived($themeStore.currentThemeId);
  let allThemes = $derived([...BUILT_IN_THEMES, ...customThemes]);

  let showCreateModal = $state(false);
  let editingTheme = $state<AgentTheme | null>(null);

  function handleSelectTheme(themeId: string) {
    themeStore.setCurrentTheme(themeId);
  }

  function handleDuplicate(themeId: string) {
    themeStore.duplicateTheme(themeId);
  }

  function handleDelete(themeId: string) {
    themeStore.deleteCustomTheme(themeId);
  }

  const categoryLabels = {
    'built-in': '内置',
    'industry': '行业',
    'custom': '自定义',
  };
</script>

<div class="p-4 space-y-6">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">Agent 主题</h3>
    <Button size="sm" onclick={() => showCreateModal = true}>
      <Plus class="w-4 h-4" />
      创建主题
    </Button>
  </div>

  <!-- Theme Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {#each allThemes as theme}
      <div
        class="relative group p-3 rounded-xl border-2 transition-all hover:shadow-lg text-left
          {currentThemeId === theme.id 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}"
        onclick={() => handleSelectTheme(theme.id)}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelectTheme(theme.id);
          }
        }}
        role="button"
        tabindex="0"
      >
        <!-- Theme Preview -->
        <div 
          class="h-16 rounded-lg mb-2 flex items-center justify-center"
          style:background={theme.gradient || theme.primaryColor}
        >
          {#if theme.avatarShape === 'circle'}
            <div class="w-8 h-8 rounded-full bg-white/30"></div>
          {:else if theme.avatarShape === 'hexagon'}
            <div class="w-8 h-8 bg-white/30 clip-hexagon"></div>
          {:else if theme.avatarShape === 'rounded'}
            <div class="w-8 h-8 rounded-lg bg-white/30"></div>
          {:else}
            <div class="w-8 h-8 bg-white/30"></div>
          {/if}
        </div>

        <!-- Theme Info -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-medium text-sm truncate">{theme.name}</span>
            {#if currentThemeId === theme.id}
              <Check class="w-4 h-4 text-primary-500" />
            {/if}
          </div>
          <span class="text-xs text-slate-500">{categoryLabels[theme.category]}</span>
        </div>

        <!-- Actions (visible on hover) -->
        {#if theme.category === 'custom'}
          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-1 rounded bg-white dark:bg-slate-800 shadow"
              onclick={(e) => {
                e.stopPropagation();
                handleDuplicate(theme.id);
              }}
              title="复制"
            >
              <Copy class="w-3 h-3" />
            </button>
            <button
              class="p-1 rounded bg-white dark:bg-slate-800 shadow text-red-500"
              onclick={(e) => {
                e.stopPropagation();
                handleDelete(theme.id);
              }}
              title="删除"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Category Legend -->
  <div class="flex gap-4 text-xs text-slate-500">
    {#each Object.entries(categoryLabels) as [key, label]}
      <span class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full bg-slate-300"></span>
        {label}
      </span>
    {/each}
  </div>
</div>

<style>
  .clip-hexagon {
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }
</style>
