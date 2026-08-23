<script lang="ts">
    import { Network, Activity, Loader2, RefreshCw } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import {
        explainDiagram,
        type ExplainerResponse,
    } from "../lib/ai/explainer";
    import { fade } from "svelte/transition";

    let isLoading = $state(false);
    let result = $state<ExplainerResponse | null>(null);

    async function analyze() {
        if (!diagramStore.code) return;
        isLoading = true;
        result = null;
        try {
            result = await explainDiagram(diagramStore.code, diagramStore.mode);
        } catch (e) {
            console.error(e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 select-none text-xs">
    <div class="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Network size={14} class="text-slate-600 dark:text-slate-400" />
            <span>Topology Diagnostics</span>
        </div>
        {#if result}
            <button
                type="button"
                class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Re-analyze Topology"
                aria-label="Re-analyze Topology"
                onclick={analyze}
            >
                <RefreshCw size={12} />
            </button>
        {/if}
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-4">
        {#if !result && !isLoading}
            <div class="text-center py-8" in:fade>
                <div
                    class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-600 dark:text-slate-400"
                >
                    <Activity size={20} />
                </div>
                <h4 class="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Graph Architecture Scan
                </h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-4 max-w-[200px] mx-auto leading-relaxed">
                    Extracts dependency chains, entry/exit points, and topological structure.
                </p>
                <button
                    type="button"
                    class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-md font-medium text-xs shadow-xs transition-colors"
                    onclick={analyze}
                >
                    Run Scan
                </button>
            </div>
        {/if}

        {#if isLoading}
            <div class="flex flex-col items-center justify-center py-10" in:fade>
                <Loader2 class="animate-spin text-slate-500 mb-2" size={20} />
                <p class="text-[11px] text-slate-500 font-mono">Parsing AST topology...</p>
            </div>
        {/if}

        {#if result}
            <div class="space-y-3.5" in:fade>
                <!-- Summary Card -->
                <div class="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Topology Summary
                    </div>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        {result.summary}
                    </p>
                </div>

                <!-- Entities -->
                {#if result.entities.length > 0}
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Detected Nodes ({result.entities.length})
                        </div>
                        <div class="flex flex-wrap gap-1">
                            {#each result.entities as entity}
                                <span
                                    class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
                                >
                                    {entity}
                                </span>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Flows -->
                {#if result.flows.length > 0}
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Relationship Flow Paths ({result.flows.length})
                        </div>
                        <ul class="space-y-1">
                            {#each result.flows as flow}
                                <li
                                    class="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-1.5 rounded border border-slate-200/50 dark:border-slate-800 truncate"
                                    title={flow}
                                >
                                    {flow}
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
