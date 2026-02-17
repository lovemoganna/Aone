<script lang="ts">
    import { slide } from "svelte/transition";
    import { Map as Sitemap } from "lucide-svelte";
    import { marked } from "marked";

    let { content }: { content: string } = $props();

    let isExpanded = $state(false);
    let htmlContent = $derived(marked.parse(content));
</script>

<div class="w-full max-w-3xl mx-auto mb-4">
    <button
        class="w-full text-left p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100/50 transition-all group/thought"
        onclick={() => (isExpanded = !isExpanded)}
    >
        <div class="flex items-center justify-between gap-2">
            <div
                class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
            >
                <Sitemap size={12} class="animate-pulse" />
                Thinking Process
            </div>
            <div class="text-[10px] text-indigo-400 opacity-60">
                {isExpanded ? "Click to collapse" : "Click to expand"}
            </div>
        </div>

        {#if isExpanded}
            <div
                transition:slide
                class="mt-2 pt-2 border-t border-indigo-100/50 dark:border-indigo-900/20 prose prose-sm dark:prose-invert max-w-none text-xs text-indigo-900/70 dark:text-indigo-200/70"
            >
                {@html htmlContent}
            </div>
        {/if}
    </button>
</div>
