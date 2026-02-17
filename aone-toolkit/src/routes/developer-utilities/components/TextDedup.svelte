<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, Eraser, ArrowDownAZ, ArrowUpZA } from "lucide-svelte";

    let input = $state("");
    let config = $state({
        trim: true,
        empty: true,
        dedup: true,
    });

    let calculation = $derived.by(() => {
        if (!input) {
            return {
                text: "",
                stats: { original: 0, result: 0, removed: 0 },
            };
        }

        let lines = input.split("\n");
        const original = lines.length;

        if (config.trim) lines = lines.map((l) => l.trim());
        if (config.empty) lines = lines.filter((l) => l.length > 0);
        if (config.dedup) lines = [...new Set(lines)];

        const result = lines.length;
        const removed = original - result;

        return {
            text: lines.join("\n"),
            stats: { original, result, removed },
        };
    });

    let output = $derived(calculation.text);
    let stats = $derived(calculation.stats);

    function sort(order: "asc" | "desc") {
        let lines = output.split("\n");
        if (order === "asc") lines.sort();
        else lines.sort().reverse();

        // We can't easily modify the Derived output directly, so we modify Input? No.
        // This is a transformation tool. Better to update Input with result THEN sort?
        // Or essentially "Process" -> "Output".
        // Let's replicate simple behavior: The Sort button updates the input (or output displayed?).

        // Actually, for a transformer, let's just update the Input to match the cleaned version + sort.
        input = lines.join("\n");
    }
</script>

<div class="h-full flex flex-col md:flex-row gap-6">
    <!-- Input -->
    <div class="flex-1 flex flex-col gap-2">
        <label
            for="dedup-input"
            class="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >Original List</label
        >
        <textarea
            id="dedup-input"
            bind:value={input}
            class="flex-1 min-h-[300px] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400"
            placeholder="Paste list here..."
        ></textarea>
        <div class="text-xs text-slate-500 text-right">
            Lines: {input ? input.split("\n").length : 0}
        </div>
    </div>

    <!-- Controls -->
    <div
        class="flex md:flex-col items-center justify-center gap-4 py-4 md:py-0 w-full md:w-48 shrink-0"
    >
        <div
            class="space-y-3 w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
        >
            <div
                class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
                Filters
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    bind:checked={config.dedup}
                    class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm">Remove Duplicates</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    bind:checked={config.trim}
                    class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm">Trim Whitespace</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    bind:checked={config.empty}
                    class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm">Remove Empty</span>
            </label>
        </div>

        <div class="w-full space-y-2">
            <Button
                variant="secondary"
                class="w-full justify-start"
                onclick={() => sort("asc")}
            >
                <ArrowDownAZ size={16} class="mr-2" /> Sort A-Z
            </Button>
            <Button
                variant="secondary"
                class="w-full justify-start"
                onclick={() => sort("desc")}
            >
                <ArrowUpZA size={16} class="mr-2" /> Sort Z-A
            </Button>
            <Button
                variant="ghost"
                class="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                onclick={() => (input = "")}
            >
                <Eraser size={16} class="mr-2" /> Clear All
            </Button>
        </div>
    </div>

    <!-- Output -->
    <div class="flex-1 flex flex-col gap-2 relative">
        <label
            for="dedup-output"
            class="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >Cleaned List</label
        >
        <textarea
            id="dedup-output"
            value={output}
            readonly
            class="flex-1 min-h-[300px] p-4 font-mono text-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none resize-none text-slate-700 dark:text-slate-300"
            placeholder="Result will appear here..."
        ></textarea>

        <div class="flex justify-between items-center text-xs text-slate-500">
            <span>Result: {stats.result} lines</span>
            {#if output}
                <button
                    class="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700"
                    onclick={() => navigator.clipboard.writeText(output)}
                >
                    <Copy size={12} /> Copy Result
                </button>
            {/if}
        </div>
    </div>
</div>
