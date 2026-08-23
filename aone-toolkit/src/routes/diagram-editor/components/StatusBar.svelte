<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { lintDiagram, type LintResult } from "../lib/linting";
    import { AlertTriangle, CheckCircle, Info } from "lucide-svelte";

    let {
        line = 1,
        col = 1,
        chars = 0,
    } = $props<{
        line: number;
        col: number;
        chars: number;
    }>();

    let lintResults = $derived(
        lintDiagram(diagramStore.code, diagramStore.mode),
    );
    let hasIssues = $derived(lintResults.length > 0);
    let topIssue = $derived(lintResults[0]);
</script>

<div
    class="flex items-center justify-between px-3 h-6 bg-slate-50/80 dark:bg-[#090d14] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono select-none z-20 shrink-0"
>
    <div class="flex items-center gap-3">
        <span class="font-bold text-slate-700 dark:text-slate-300">{diagramStore.mode.toUpperCase()}</span>
        <span class="w-px h-2.5 bg-slate-300 dark:bg-slate-700"></span>

        {#if hasIssues}
            <div
                class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                title={topIssue.message}
            >
                <AlertTriangle size={12} />
                <span class="max-w-[240px] truncate"
                    >{topIssue.message}</span
                >
                {#if lintResults.length > 1}
                    <span>+{lintResults.length - 1}</span>
                {/if}
            </div>
        {:else}
            <div
                class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
            >
                <CheckCircle size={12} />
                <span>Healthy</span>
            </div>
        {/if}
    </div>

    <div
        class="flex items-center gap-3 text-[11px] tabular-nums text-slate-400 dark:text-slate-500"
    >
        <span>Ln {line}, Col {col}</span>
        <span class="w-px h-2.5 bg-slate-300 dark:bg-slate-700"></span>
        <span>{chars} chars</span>
        <span class="w-px h-2.5 bg-slate-300 dark:bg-slate-700"></span>
        <span>UTF-8</span>
    </div>
</div>
