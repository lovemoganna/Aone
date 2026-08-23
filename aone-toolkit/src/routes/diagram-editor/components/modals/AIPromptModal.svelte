<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { generateDiagramFromAI } from "../../lib/generator";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { fade, fly } from "svelte/transition";
    import { X, Send, Loader2, Cpu } from "lucide-svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let prompt = $state("");
    let isGenerating = $state(false);

    let hasApiKey = $derived.by(() => {
        if (typeof localStorage === "undefined") return false;
        try {
            const cfg = JSON.parse(localStorage.getItem("aone_ai_config") || "{}");
            return Boolean(cfg.apiKey);
        } catch {
            return false;
        }
    });

    async function handleGenerate() {
        if (!prompt.trim() || isGenerating) return;

        isGenerating = true;
        try {
            const newCode = await generateDiagramFromAI(
                prompt,
                diagramStore.code,
                diagramStore.mode,
            );
            diagramStore.code = newCode;
            diagramStore.render();
            toastStore.success("Architecture diagram generated");
            onClose();
        } catch (e) {
            console.error(e);
            toastStore.error("Diagram generation failed. Please try again.");
        } finally {
            isGenerating = false;
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none"
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close diagram prompt modal"
        transition:fade={{ duration: 150 }}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 15, duration: 200 }}
        >
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div
                        class="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300"
                    >
                        <Cpu size={15} />
                    </div>
                    <div>
                        <h2 class="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Architecture Generator
                        </h2>
                        <p class="text-[11px] text-slate-500 font-normal">
                            Generate structure from archetype keywords or natural language
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                    onclick={onClose}
                    title="Close dialog"
                    aria-label="Close dialog"
                >
                    <X size={16} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Engine Mode:</span>
                    <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {hasApiKey ? "Custom LLM Endpoint" : "Zero-latency Offline Synthesis"}
                    </span>
                </div>

                <textarea
                    aria-label="Diagram prompt"
                    bind:value={prompt}
                    placeholder="e.g. Microservice architecture with API Gateway, Order Service (Postgres), and Kafka Event Bus..."
                    class="w-full h-28 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all resize-none"
                    onkeydown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleGenerate();
                        }
                    }}
                ></textarea>

                <div class="flex flex-wrap gap-1.5">
                    {#each ["Authentication Flow", "Microservices", "State Machine", "Entity Relationship"] as suggestion}
                        <button
                            type="button"
                            class="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                            onclick={() => (prompt = suggestion)}
                        >
                            {suggestion}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Footer -->
            <div
                class="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
                <span class="text-[11px] text-slate-400">
                    Ctrl+Enter to generate
                </span>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                        onclick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                        disabled={!prompt.trim() || isGenerating}
                        onclick={handleGenerate}
                    >
                        {#if isGenerating}
                            <Loader2 size={13} class="animate-spin" />
                            <span>Generating...</span>
                        {:else}
                            <Send size={12} />
                            <span>Generate</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
