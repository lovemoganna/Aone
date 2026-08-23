<script lang="ts">
    import { slide } from "svelte/transition";
    import { Map as Sitemap } from "lucide-svelte";
    import RichMessageContent from "./RichMessageContent.svelte";

    let { content }: { content: string } = $props();
    let isExpanded = $state(false);
</script>

<div class="w-full max-w-3xl mx-auto mb-3">
    <button
        class="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
        onclick={() => (isExpanded = !isExpanded)}
    >
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sitemap size={13} class="text-slate-500" />
                <span>协同推演过程</span>
            </div>
            <div class="text-[11px] text-slate-400">
                {isExpanded ? "收起" : "展开详情"}
            </div>
        </div>

        {#if isExpanded}
            <div
                transition:slide
                class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
            >
                <RichMessageContent content={content} />
            </div>
        {/if}
    </button>
</div>
