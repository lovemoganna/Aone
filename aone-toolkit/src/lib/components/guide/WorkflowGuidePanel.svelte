<script lang="ts">
  import { workflowGuideStore, BUILT_IN_EXAMPLES, type WorkflowExample } from '$lib/stores/workflowGuideStore.svelte';
  import { Search, Play, Star, BookOpen, Sparkles, Zap, Clock, ChevronRight } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let searchQuery = $state('');
  let selectedCategory = $state<WorkflowExample['category'] | 'all'>('all');
  let selectedDifficulty = $state<WorkflowExample['difficulty'] | 'all'>('all');

  let allExamples = $derived([...BUILT_IN_EXAMPLES, ...$workflowGuideStore]);
  
  let filteredExamples = $derived(() => {
    let result = allExamples;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }
    
    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      result = result.filter(e => e.difficulty === selectedDifficulty);
    }
    
    return result;
  });

  let categories = $derived([
    { id: 'all', label: '全部', icon: BookOpen },
    { id: 'getting-started', label: '入门', icon: Sparkles },
    { id: 'automation', label: '自动化', icon: Zap },
    { id: 'ai-workflow', label: 'AI 工作流', icon: Star },
  ]);

  let difficulties = [
    { id: 'all', label: '全部难度' },
    { id: 'beginner', label: '初级' },
    { id: 'intermediate', label: '中级' },
    { id: 'advanced', label: '高级' },
  ];

  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  let { onLoadExample = () => {} } = $props<{
    onLoadExample?: (example: WorkflowExample) => void;
  }>();
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="p-4 border-b border-slate-200 dark:border-slate-700">
    <h3 class="text-lg font-semibold mb-3">工作流指南</h3>
    
    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="搜索示例..."
        class="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Categories -->
  <div class="p-3 border-b border-slate-200 dark:border-slate-700">
    <div class="flex gap-2 overflow-x-auto pb-1">
      {#each categories as cat}
        {@const CategoryIcon = cat.icon}
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors
            {selectedCategory === cat.id 
              ? 'bg-primary-500 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}"
          onclick={() => selectedCategory = cat.id as any}
        >
          <CategoryIcon class="w-3.5 h-3.5" />
          {cat.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Difficulty Filter -->
  <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
    <select 
      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm"
      bind:value={selectedDifficulty}
    >
      {#each difficulties as diff}
        <option value={diff.id}>{diff.label}</option>
      {/each}
    </select>
  </div>

  <!-- Examples List -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#each filteredExamples() as example}
      <button
        class="w-full p-4 text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
        onclick={() => onLoadExample(example)}
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <h4 class="font-medium group-hover:text-primary-500 transition-colors">
            {example.name}
          </h4>
          <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
        </div>
        
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
          {example.description}
        </p>
        
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2 py-0.5 text-xs rounded-full {difficultyColors[example.difficulty]}">
            {example.difficulty === 'beginner' ? '初级' : example.difficulty === 'intermediate' ? '中级' : '高级'}
          </span>
          {#each example.tags as tag}
            <span class="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full">
              {tag}
            </span>
          {/each}
        </div>
      </button>
    {/each}
    
    {#if filteredExamples().length === 0}
      <div class="text-center py-8 text-slate-500">
        <BookOpen class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>没有找到匹配的示例</p>
      </div>
    {/if}
  </div>

  <!-- Quick Stats -->
  <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
    <div class="flex items-center justify-between text-sm text-slate-500">
      <span>共 {allExamples.length} 个示例</span>
      <div class="flex items-center gap-1">
        <Clock class="w-3.5 h-3.5" />
        <span>入门推荐: Hello World</span>
      </div>
    </div>
  </div>
</div>
