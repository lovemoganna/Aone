<script lang="ts">
    import { dynamicSkillComposer } from '$lib/orchestration';
    import type { SkillExecutionPlan } from '$lib/orchestration/dynamic-skill-composer';
    import { toastStore } from '$lib/stores/toastStore.svelte';
    
    // Props
    let {
        isOpen = $bindable(false),
        onApply = (plan: SkillExecutionPlan) => {},
    } = $props<{
        isOpen?: boolean;
        onApply?: (plan: SkillExecutionPlan) => void;
    }>();
    
    // State
    let taskInput = $state('');
    let isAnalyzing = $state(false);
    let executionPlan = $state<SkillExecutionPlan | null>(null);
    let selectedSkills = $state<string[]>([]);
    
    // Analyze task
    async function analyzeTask() {
        if (!taskInput.trim()) {
            toastStore.add({
                type: 'warning',
                message: '请输入任务描述',
                duration: 2000
            });
            return;
        }
        
        isAnalyzing = true;
        try {
            executionPlan = await dynamicSkillComposer.composeExecutionPlan(taskInput);
            if (!executionPlan) return;
            selectedSkills = [
                ...executionPlan.coreSkills.map(s => s.skillId),
                ...executionPlan.optionalSkills.map(s => s.skillId)
            ];
        } catch (error) {
            toastStore.add({
                type: 'error',
                message: '分析失败，请重试',
                duration: 3000
            });
        } finally {
            isAnalyzing = false;
        }
    }
    
    // Toggle skill selection
    function toggleSkill(skillId: string) {
        if (selectedSkills.includes(skillId)) {
            selectedSkills = selectedSkills.filter(s => s !== skillId);
        } else {
            selectedSkills = [...selectedSkills, skillId];
        }
    }
    
    // Apply selected skills
    function applySkills() {
        if (!executionPlan) return;
        
        const filteredPlan: SkillExecutionPlan = {
            ...executionPlan,
            coreSkills: executionPlan.coreSkills.filter(s => selectedSkills.includes(s.skillId)),
            optionalSkills: executionPlan.optionalSkills.filter(s => selectedSkills.includes(s.skillId))
        };
        
        onApply(filteredPlan);
        closeModal();
    }
    
    // Close modal
    function closeModal() {
        isOpen = false;
        taskInput = '';
        executionPlan = null;
        selectedSkills = [];
    }
    
    // Get skill priority color
    function getPriorityColor(priority: number): string {
        if (priority >= 4) return 'bg-red-100 text-red-700';
        if (priority >= 3) return 'bg-orange-100 text-orange-700';
        if (priority >= 2) return 'bg-yellow-100 text-yellow-700';
        return 'bg-slate-100 text-slate-700';
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onclick={closeModal}
        onkeydown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                closeModal();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close skill recommendation wizard"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                    技能推荐向导
                </h2>
                <button 
                    onclick={closeModal}
                    class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Close skill recommendation wizard"
                    aria-label="Close skill recommendation wizard"
                >
                    ✕
                </button>
            </div>
            
            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <!-- Task Input -->
                <div class="mb-6">
                    <label for="skill-recommendation-task" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        描述您的任务
                    </label>
                    <textarea 
                        id="skill-recommendation-task"
                        bind:value={taskInput}
                        placeholder="例如：帮我分析一下是否应该转行做程序员..."
                        class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        rows="3"
                    ></textarea>
                    
                    <button 
                        onclick={analyzeTask}
                        disabled={isAnalyzing || !taskInput.trim()}
                        class="mt-3 w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-medium rounded-xl transition-colors"
                    >
                        {#if isAnalyzing}
                            分析中...
                        {:else}
                            分析任务
                        {/if}
                    </button>
                </div>
                
                {#if executionPlan}
                    <!-- Summary -->
                    <div class="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl">
                        <h3 class="font-medium text-teal-900 dark:text-teal-300 mb-2">
                            分析结果
                        </h3>
                        <p class="text-sm text-teal-700 dark:text-teal-400">
                            {executionPlan.summary}
                        </p>
                        <div class="mt-2 flex items-center gap-2">
                            <span class="text-xs text-teal-600 dark:text-teal-500">
                                置信度:
                            </span>
                            <div class="flex-1 h-2 bg-teal-200 dark:bg-teal-800 rounded-full overflow-hidden">
                                <div 
                                    class="h-full bg-teal-500 rounded-full"
                                    style="width: {executionPlan.overallConfidence * 100}%"
                                ></div>
                            </div>
                            <span class="text-xs text-teal-600 dark:text-teal-500">
                                {Math.round(executionPlan.overallConfidence * 100)}%
                            </span>
                        </div>
                    </div>
                    
                    <!-- Core Skills -->
                    {#if executionPlan.coreSkills.length > 0}
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                核心技能（必需）
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                {#each executionPlan.coreSkills as rec}
                                    <button
                                        onclick={() => toggleSkill(rec.skillId)}
                                        class="px-3 py-2 rounded-lg border transition-all {selectedSkills.includes(rec.skillId) ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-200 dark:border-slate-700'} {getPriorityColor(rec.priority)}"
                                    >
                                        <span class="font-medium">{rec.skill.name}</span>
                                        <span class="text-xs ml-1 opacity-70">- {rec.reason}</span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Optional Skills -->
                    {#if executionPlan.optionalSkills.length > 0}
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                可选技能
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                {#each executionPlan.optionalSkills as rec}
                                    <button
                                        onclick={() => toggleSkill(rec.skillId)}
                                        class="px-3 py-2 rounded-lg border transition-all {selectedSkills.includes(rec.skillId) ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-200 dark:border-slate-700'} {getPriorityColor(rec.priority)}"
                                    >
                                        <span class="font-medium">{rec.skill.name}</span>
                                        <span class="text-xs ml-1 opacity-70">- {rec.reason}</span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Recommended Templates -->
                    {#if executionPlan.recommendedTemplates.length > 0}
                        <div class="mb-4">
                            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                推荐模板
                            </h4>
                            <div class="space-y-2">
                                {#each executionPlan.recommendedTemplates as template}
                                    <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <span class="font-medium text-slate-900 dark:text-white">{template.name}</span>
                                        <p class="text-xs text-slate-500 mt-1">{template.description}</p>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>
            
            <!-- Footer -->
            {#if executionPlan}
                <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <button 
                        onclick={closeModal}
                        class="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onclick={applySkills}
                        disabled={selectedSkills.length === 0}
                        class="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
                    >
                        应用所选技能 ({selectedSkills.length})
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}
