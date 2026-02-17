<script lang="ts">
    import { skillRegistry, type SkillDefinition } from '$lib/skills';
    import {
        Puzzle,
        Search
    } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let skillSearchQuery = $state('');
    let skillFilterType = $state('');

    let allSkills = $derived(skillRegistry.getAll());
    
    const skillTypes = [
        { id: '', label: '全部' },
        { id: 'analysis', label: '分析型' },
        { id: 'quantitative', label: '量化型' },
        { id: 'evaluation', label: '评估型' },
        { id: 'exploration', label: '探索型' },
        { id: 'generation', label: '生成型' }
    ];

    let filteredSkills = $derived.by(() => {
        let list = allSkills;
        if (skillSearchQuery) {
            const q = skillSearchQuery.toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.oneLiner.toLowerCase().includes(q)
            );
        }
        if (skillFilterType) {
            list = list.filter(s => s.type === skillFilterType);
        }
        return list;
    });

    function getSkillTypeLabel(type: string): string {
        return skillTypes.find(t => t.id === type)?.label || type;
    }

    function getSkillIcon(type: string): string {
        const icons: Record<string, string> = {
            analysis: '🔍',
            quantitative: '⚖️',
            evaluation: '🃏',
            exploration: '🔄',
            generation: '✅'
        };
        return icons[type] || '🔧';
    }
</script>

<div class="space-y-6" in:fade={{ duration: 200 }}>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">技能池</h2>
            <p class="text-slate-500 dark:text-slate-400">认知工具管理中心</p>
        </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col md:flex-row gap-4">
        <div class="relative flex-1 max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                bind:value={skillSearchQuery}
                placeholder="搜索技能..." 
                class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
        </div>
        <div class="flex flex-wrap gap-2">
            {#each skillTypes as type}
                <button 
                    onclick={() => skillFilterType = type.id}
                    class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {skillFilterType === type.id ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}"
                >
                    {type.label}
                </button>
            {/each}
        </div>
    </div>

    <!-- Skills Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredSkills as skill (skill.id)}
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:border-teal-500/30 hover:shadow-xl transition-all">
                <div class="h-2 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                <div class="p-5">
                    <div class="flex items-start gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-xl">
                            {getSkillIcon(skill.type)}
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-slate-900 dark:text-white">{skill.name}</h3>
                            <span class="text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
                                {getSkillTypeLabel(skill.type)}
                            </span>
                        </div>
                    </div>
                    
                    <p class="text-sm text-slate-600 dark:text-slate-300 mb-2">{skill.oneLiner}</p>
                    <p class="text-xs text-slate-500 line-clamp-2 mb-4">{skill.description}</p>
                    
                    <div class="flex flex-wrap gap-1.5">
                        {#each (skill.trigger?.keywords || []).slice(0, 4) as keyword}
                            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded">
                                {keyword}
                            </span>
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>
    
    {#if filteredSkills.length === 0}
        <div class="text-center py-16">
            <Puzzle class="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">暂无技能</h3>
        </div>
    {/if}
</div>
