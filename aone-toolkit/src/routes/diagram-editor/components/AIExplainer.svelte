<script lang="ts">
    import { Network, Activity, RefreshCw, ArrowRight } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import {
        explainDiagram,
        type ExplainerResponse,
    } from "../lib/ai/explainer";

    let result = $state<ExplainerResponse | null>(null);

    $effect(() => {
        if (!diagramStore.code) {
            result = null;
            return;
        }
        explainDiagram(diagramStore.code, diagramStore.mode)
            .then((res) => {
                result = res;
            })
            .catch(() => {});
    });
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 select-none text-xs">
    <div class="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Network size={14} class="text-slate-600 dark:text-slate-400" />
            <span>Structure & Flow</span>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-3.5">
        {#if !result}
            <div class="text-center py-8 text-slate-400 font-mono text-xs">
                No active graph structure
            </div>
        {:else}
            <!-- Summary Card -->
            <div class="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Graph Architecture Summary
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.summary}
                </p>
            </div>

            <!-- Entities -->
            {#if result.entities.length > 0}
                <div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Identified Entities ({result.entities.length})
                    </div>
                    <div class="flex flex-wrap gap-1">
                        {#each result.entities as entity}
                            <button
                                type="button"
                                class="px-2 py-0.5 rounded text-[11px] font-mono transition-colors border {diagramStore.selectedElementId === entity
                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-semibold shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'}"
                                onclick={() => {
                                    diagramStore.selectedElementId = entity;
                                    diagramStore.multiSelection = [entity];
                                }}
                            >
                                {entity}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Flows -->
            {#if result.flows.length > 0}
                <div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Relationship Paths ({result.flows.length})
                    </div>
                    <ul class="space-y-1">
                        {#each result.flows as flow}
                            <li
                                class="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-1.5 rounded border border-slate-200/60 dark:border-slate-800 truncate"
                                title={flow}
                            >
                                {flow}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        {/if}
    </div>
</div>
