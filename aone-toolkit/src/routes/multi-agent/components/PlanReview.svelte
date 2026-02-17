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
    } from "lucide-svelte";
    import Button from "$lib/components/ui/Button.svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";

    let { plan }: { plan: any } = $props();

    let isEditing = $state(false);
    let editedSubtasks = $state<any[]>([]);

    $effect(() => {
        if (plan && plan.subtasks) {
            // deeply clone to avoid mutation by reference until saved
            editedSubtasks = JSON.parse(JSON.stringify(plan.subtasks));
        }
    });

    function handleApprove() {
        // Update the plan in store if edited
        if (isEditing) {
            agentStore.updatePlan(editedSubtasks);
        }
        agentStore.resumePipeline();
    }

    function handleRegenerate() {
        // Use retryStage('decompose') - need to implement this in store
        agentStore.retryStage("decompose");
    }

    function toggleEdit() {
        if (isEditing) {
            // Cancel edit - revert changes
            editedSubtasks = plan.subtasks.map((t: any) => ({ ...t }));
        }
        isEditing = !isEditing;
    }

    function saveEdit() {
        // Commit changes to local state, ready for approval
        // In this simple version, saving just keeps the current edited state valid
        isEditing = false;
    }

    function removeTask(index: number) {
        editedSubtasks = editedSubtasks.filter((_, i) => i !== index);
    }

    function moveTask(index: number, direction: "up" | "down") {
        if (direction === "up" && index > 0) {
            const temp = editedSubtasks[index];
            editedSubtasks[index] = editedSubtasks[index - 1];
            editedSubtasks[index - 1] = temp;
        } else if (direction === "down" && index < editedSubtasks.length - 1) {
            const temp = editedSubtasks[index];
            editedSubtasks[index] = editedSubtasks[index + 1];
            editedSubtasks[index + 1] = temp;
        }
    }
</script>

<div class="w-full max-w-3xl mx-auto mb-6">
    <div
        class="bg-white dark:bg-slate-800 rounded-xl border-2 border-primary-500/20 shadow-lg overflow-hidden flex flex-col"
    >
        <!-- Header -->
        <div
            class="p-4 bg-primary-50 dark:bg-primary-900/10 border-b border-primary-100 dark:border-primary-900/20 flex items-center justify-between"
        >
            <div
                class="flex items-center gap-2 text-primary-700 dark:text-primary-300"
            >
                <div
                    class="p-1.5 bg-primary-100 dark:bg-primary-800/50 rounded-lg"
                >
                    <ListTodo size={18} />
                </div>
                <div>
                    <h3 class="font-bold text-sm">Strategic Plan Review</h3>
                    <p class="text-xs opacity-70">
                        Review the proposed execution plan
                    </p>
                </div>
            </div>

            <span
                class="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded text-slate-500 border border-slate-200 dark:border-slate-700"
            >
                {plan.taskPlan?.overview || "Analysis Complete"}
            </span>
        </div>

        <!-- content -->
        <div class="p-4 space-y-3">
            {#if isEditing}
                {#each editedSubtasks as task, i}
                    <div class="flex gap-2 items-start" transition:slide>
                        <div
                            class="flex-1 space-y-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                        >
                            <div class="flex gap-2">
                                <span
                                    class="text-xs font-mono text-slate-400 mt-2.5"
                                    >#{i + 1}</span
                                >
                                <input
                                    bind:value={task.name}
                                    class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-medium"
                                    placeholder="Task Name"
                                />
                            </div>
                            <textarea
                                bind:value={task.description}
                                class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-600 dark:text-slate-400 min-h-[60px]"
                                placeholder="Task Description"
                            ></textarea>
                        </div>
                        <div class="flex flex-col gap-1">
                            <button
                                class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors"
                                onclick={() => removeTask(i)}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                {/each}
                <div
                    class="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
                >
                    <Button variant="ghost" size="sm" onclick={toggleEdit}
                        >Cancel</Button
                    >
                    <Button variant="primary" size="sm" onclick={saveEdit}>
                        <Save size={14} class="mr-1" /> Save Changes
                    </Button>
                </div>
            {:else}
                <div class="space-y-2">
                    {#each editedSubtasks as task, i}
                        <div
                            class="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div
                                class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5"
                            >
                                {i + 1}
                            </div>
                            <div>
                                <div
                                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                                >
                                    {task.name}
                                </div>
                                <div
                                    class="text-xs text-slate-500 dark:text-slate-400 mt-1"
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
                class="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3"
            >
                <Button
                    variant="outline"
                    size="sm"
                    onclick={toggleEdit}
                    disabled={agentStore.metaFlowFinished}
                >
                    <Edit2 size={14} class="mr-1.5" /> Edit Plan
                </Button>

                <div class="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={handleRegenerate}
                        disabled={agentStore.metaFlowFinished}
                        class="text-slate-500"
                    >
                        <RefreshCw size={14} class="mr-1.5" /> Regenerate
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onclick={handleApprove}
                        disabled={agentStore.metaFlowFinished}
                        class="shadow-lg shadow-primary-500/20"
                    >
                        <Play size={14} class="mr-1.5" /> Approve & Execute
                    </Button>
                </div>
            </div>
        {/if}
    </div>
</div>
