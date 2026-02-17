<script lang="ts">
    // Note: GitCompare icon removed as it was causing import errors

    // Note: GitCompare icon removed as it was causing import errors
    let { textA = $bindable(""), textB = $bindable("") } = $props<{
        textA?: string;
        textB?: string;
    }>();

    interface DiffLine {
        type: "same" | "added" | "removed";
        content: string;
        lineNum: number;
    }

    let diff = $derived.by(() => {
        const linesA = textA.split("\n");
        const linesB = textB.split("\n");
        const result: DiffLine[] = [];

        // Simple LCS-based diff would be better, but for now a basic comparison
        const maxLen = Math.max(linesA.length, linesB.length);

        for (let i = 0; i < maxLen; i++) {
            const a = linesA[i];
            const b = linesB[i];

            if (a === b) {
                if (a !== undefined) {
                    result.push({ type: "same", content: a, lineNum: i + 1 });
                }
            } else {
                if (a !== undefined) {
                    result.push({
                        type: "removed",
                        content: a,
                        lineNum: i + 1,
                    });
                }
                if (b !== undefined) {
                    result.push({ type: "added", content: b, lineNum: i + 1 });
                }
            }
        }

        return result;
    });

    let stats = $derived.by(() => {
        const added = diff.filter((d) => d.type === "added").length;
        const removed = diff.filter((d) => d.type === "removed").length;
        const same = diff.filter((d) => d.type === "same").length;
        return { added, removed, same };
    });
</script>

<div class="h-full flex flex-col gap-4">
    <!-- Inputs -->
    <div class="flex flex-col md:flex-row gap-4 flex-1 min-h-[200px]">
        <div class="flex-1 flex flex-col gap-2">
            <label
                for="diff-a"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Original</label
            >
            <textarea
                id="diff-a"
                bind:value={textA}
                class="flex-1 p-4 font-mono text-sm bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg outline-none resize-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-slate-400"
                placeholder="Paste original text here..."
            ></textarea>
        </div>

        <div class="flex-1 flex flex-col gap-2">
            <label
                for="diff-b"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Modified</label
            >
            <textarea
                id="diff-b"
                bind:value={textB}
                class="flex-1 p-4 font-mono text-sm bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-lg outline-none resize-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-slate-400"
                placeholder="Paste modified text here..."
            ></textarea>
        </div>
    </div>

    <!-- Stats -->
    <div class="flex gap-4 text-sm">
        <span
            class="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full font-medium"
        >
            +{stats.added} added
        </span>
        <span
            class="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full font-medium"
        >
            -{stats.removed} removed
        </span>
        <span
            class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-medium"
        >
            {stats.same} unchanged
        </span>
    </div>

    <!-- Diff Output -->
    <div
        class="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-auto max-h-[400px]"
    >
        {#if diff.length === 0}
            <div class="p-8 text-center text-slate-400 italic">
                Enter text in both fields to see differences...
            </div>
        {:else}
            <div
                class="font-mono text-sm divide-y divide-slate-100 dark:divide-slate-900"
            >
                {#each diff as line}
                    <div
                        class="flex {line.type === 'added'
                            ? 'bg-green-50 dark:bg-green-950/30'
                            : line.type === 'removed'
                              ? 'bg-red-50 dark:bg-red-950/30'
                              : ''}"
                    >
                        <div
                            class="w-12 shrink-0 px-2 py-1 text-right text-slate-400 border-r border-slate-200 dark:border-slate-800 select-none"
                        >
                            {line.lineNum}
                        </div>
                        <div
                            class="w-8 shrink-0 text-center py-1 font-bold select-none {line.type ===
                            'added'
                                ? 'text-green-600'
                                : line.type === 'removed'
                                  ? 'text-red-600'
                                  : 'text-slate-300'}"
                        >
                            {line.type === "added"
                                ? "+"
                                : line.type === "removed"
                                  ? "-"
                                  : " "}
                        </div>
                        <div
                            class="flex-1 px-2 py-1 whitespace-pre-wrap {line.type ===
                            'added'
                                ? 'text-green-700 dark:text-green-300'
                                : line.type === 'removed'
                                  ? 'text-red-700 dark:text-red-300'
                                  : 'text-slate-700 dark:text-slate-300'}"
                        >
                            {line.content || " "}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
