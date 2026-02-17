<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { lintDiagram, type LintResult } from "../lib/linter";
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
    class="flex items-center justify-between px-4 py-1.5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 font-mono select-none z-20"
>
    <div class="flex items-center gap-4">
        <span class="font-mono">{diagramStore.mode.toUpperCase()}</span>
        <span class="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>

        {#if hasIssues}
            <div
                class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
                title={topIssue.message}
            >
                <AlertTriangle size={14} />
                <span class="text-xs font-medium max-w-[200px] truncate"
                    >{topIssue.message}</span
                >
                {#if lintResults.length > 1}
                    <span class="text-xs">+{lintResults.length - 1}</span>
                {/if}
            </div>
        {:else}
            <div
                class="flex items-center gap-1.5 text-green-600 dark:text-green-400"
            >
                <CheckCircle size={14} />
                <span class="text-xs">Healthy</span>
            </div>
        {/if}
    </div>

    <div
        class="flex items-center gap-4 text-xs tabular-nums text-gray-500 dark:text-gray-400"
    >
        <span>Ln {line}, Col {col}</span>
        <span class="w-px h-3 bg-gray-300 dark:bg-gray-700"></span>
        <span>{chars} chars</span>
        <span class="w-px h-3 bg-gray-300 dark:bg-gray-700"></span>
        <span>UTF-8</span>
    </div>
</div>
