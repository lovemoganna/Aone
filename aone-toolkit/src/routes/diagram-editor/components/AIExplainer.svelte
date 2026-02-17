<script lang="ts">
    import { Lightbulb, Loader2, Sparkles } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import {
        explainDiagram,
        type ExplainerResponse,
    } from "../lib/ai/explainer";
    import { fade, fly } from "svelte/transition";

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

<div
    class="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 w-80"
>
    <div
        class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
    >
        <Sparkles class="text-indigo-500" size={20} />
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">
            AI Explainer
        </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        {#if !result && !isLoading}
            <div class="text-center py-10" in:fade>
                <div
                    class="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400"
                >
                    <Lightbulb size={24} />
                </div>
                <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Detailed Analysis
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Get an AI-powered explanation of flows, entities, and logic
                    in your diagram.
                </p>
                <button
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                    onclick={analyze}
                >
                    Analyze Diagram
                </button>
            </div>
        {/if}

        {#if isLoading}
            <div
                class="flex flex-col items-center justify-center py-12"
                in:fade
            >
                <Loader2 class="animate-spin text-indigo-500 mb-3" size={32} />
                <p class="text-sm text-gray-500">Analyzing structure...</p>
            </div>
        {/if}

        {#if result}
            <div class="space-y-6" in:fly={{ y: 20, duration: 300 }}>
                <div
                    class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800"
                >
                    <h4
                        class="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2"
                    >
                        Summary
                    </h4>
                    <p
                        class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                        {result.summary}
                    </p>
                </div>

                {#if result.entities.length > 0}
                    <div>
                        <h4
                            class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3"
                        >
                            Key Entities
                        </h4>
                        <div class="flex flex-wrap gap-2">
                            {#each result.entities as entity}
                                <span
                                    class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                                >
                                    {entity}
                                </span>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if result.flows.length > 0}
                    <div>
                        <h4
                            class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3"
                        >
                            Detected Flows
                        </h4>
                        <ul class="space-y-2">
                            {#each result.flows as flow}
                                <li
                                    class="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800"
                                >
                                    {flow}
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                <button
                    class="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                    onclick={analyze}
                >
                    Regenerate Analysis
                </button>
            </div>
        {/if}
    </div>
</div>
