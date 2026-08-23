<script lang="ts">
    import { slide } from "svelte/transition";
    import {
        CheckCircle2,
        Edit2,
        Play,
        RefreshCw,
        ListTodo,
        Save,
        X,
        Sparkles
    } from "lucide-svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";

    let { plan }: { plan: any } = $props();

    let isEditing = $state(false);
    let editedSubtasks = $state<any[]>([]);

    $effect(() => {
        if (plan && plan.subtasks) {
            editedSubtasks = JSON.parse(JSON.stringify(plan.subtasks));
        }
    });

    function handleApprove() {
        if (isEditing) {
            agentStore.updatePlan(editedSubtasks);
        }
        agentStore.resumePipeline();
    }

    function handleRegenerate() {
        agentStore.retryStage("decompose");
    }

    function toggleEdit() {
        if (isEditing) {
            editedSubtasks = plan.subtasks.map((t: any) => ({ ...t }));
        }
        isEditing = !isEditing;
    }

    function saveEdit() {
        isEditing = false;
    }

    function removeTask(index: number) {
        editedSubtasks = editedSubtasks.filter((_, i) => i !== index);
    }
</script>

<div class="w-full max-w-3xl mx-auto mb-6">
    <div
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
    >
        <!-- Header -->
        <div
            class="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
            <div
                class="flex items-center gap-2.5 text-slate-800 dark:text-slate-200"
            >
                <div
                    class="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                >
                    <ListTodo size={16} />
                </div>
                <div>
                    <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        方案策略复核
                    </h3>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        在推进执行前复核拆解方案，可直接编辑或确认执行
                    </p>
                </div>
            </div>

            <span
                class="text-[11px] font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
                {plan.taskPlan?.overview || "结构拆解完成"}
            </span>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-3">
            {#if isEditing}
                {#each editedSubtasks as task, i}
                    <div class="flex gap-2 items-start" transition:slide>
                        <div
                            class="flex-1 space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/80"
                        >
                            <div class="flex gap-2">
                                <span
                                    class="text-xs font-mono text-slate-400 mt-2.5 font-bold"
                                    >#{i + 1}</span
                                >
                                <input
                                    bind:value={task.name}
                                    class="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
                                    placeholder="任务名称"
                                />
                            </div>
                            <textarea
                                bind:value={task.description}
                                class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 min-h-[60px] focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
                                placeholder="任务描述与验收条件"
                            ></textarea>
                        </div>
                        <div class="flex flex-col gap-1">
                            <button
                                class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                onclick={() => removeTask(i)}
                                aria-label="删除子任务"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                {/each}
                <div
                    class="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
                >
                    <Button variant="ghost" size="sm" onclick={toggleEdit} class="cursor-pointer">
                        取消
                    </Button>
                    <Button variant="primary" size="sm" onclick={saveEdit} class="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">
                        <Save size={14} class="mr-1" /> 保存修改
                    </Button>
                </div>
            {:else}
                <div class="space-y-2">
                    {#each editedSubtasks as task, i}
                        <div
                            class="flex items-start gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                            <div
                                class="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                            >
                                {i + 1}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div
                                    class="text-xs font-bold text-slate-900 dark:text-white"
                                >
                                    {task.name}
                                </div>
                                <div
                                    class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed"
                                >
                                    {task.description}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Footer -->
        {#if !isEditing}
            <div
                class="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5"
            >
                <Button
                    variant="outline"
                    size="sm"
                    onclick={toggleEdit}
                    disabled={agentStore.metaFlowFinished}
                    class="cursor-pointer text-xs"
                >
                    <Edit2 size={13} class="mr-1.5" /> 修改方案
                </Button>

                <div class="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={handleRegenerate}
                        disabled={agentStore.metaFlowFinished}
                        class="text-slate-500 text-xs cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                    >
                        <RefreshCw size={13} class="mr-1.5" /> 重新拆解
                    </Button>
                    <button
                        onclick={handleApprove}
                        disabled={agentStore.metaFlowFinished}
                        class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Play size={13} class="fill-current" /> 确认并执行
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
