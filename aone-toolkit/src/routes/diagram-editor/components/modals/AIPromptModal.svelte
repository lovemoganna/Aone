<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { generateDiagramFromAI } from "../../lib/generator";
    import { fade, fly, scale } from "svelte/transition";
    import { X, Sparkles, Send, Loader2 } from "lucide-svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let prompt = $state("");
    let isGenerating = $state(false);

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
            onClose();
        } catch (e) {
            console.error(e);
            alert("AI Generation failed. Please try again.");
        } finally {
            isGenerating = false;
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
        onclick={onClose}
        transition:fade={{ duration: 300 }}
    >
        <div
            class="glass-pro rounded-2xl w-full max-w-lg overflow-hidden flex flex-col group/modal transition-all duration-700"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 20, duration: 400, opacity: 0 }}
        >
            <!-- Header -->
            <div class="p-6 pb-0 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"
                    >
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2
                            class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
                        >
                            AI Diagram Engine
                        </h2>
                        <p class="text-xs text-gray-500 font-medium">
                            What should I build for you?
                        </p>
                    </div>
                </div>
                <button
                    class="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6">
                <div class="relative group">
                    <textarea
                        bind:value={prompt}
                        placeholder="e.g., A microservice architecture for an e-commerce platform with a catalog service and an auth provider..."
                        class="w-full h-32 bg-black/20 dark:bg-gray-950/40 border border-white/10 dark:border-white/5 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                    ></textarea>

                    <div class="mt-4 flex flex-wrap gap-2">
                        {#each ["Authentication Flow", "Microservices", "State Machine", "Entity Relationship"] as suggestion}
                            <button
                                class="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95"
                                onclick={() => (prompt = suggestion)}
                            >
                                {suggestion}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-4 bg-black/10 border-t border-white/5 flex justify-end"
            >
                <button
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all glow-premium active:scale-95"
                    disabled={!prompt.trim() || isGenerating}
                    onclick={handleGenerate}
                >
                    {#if isGenerating}
                        <Loader2 size={18} class="animate-spin" />
                        Generating Architecture...
                    {:else}
                        <Send size={18} />
                        Generate Diagram
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
