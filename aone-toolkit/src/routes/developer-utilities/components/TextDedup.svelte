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
    <div class="flex-1 flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-center">
            <label
                for="dedup-input"
                class="label-section"
                >Original List</label
            >
            <span class="text-[11px] text-slate-400 font-mono">Lines: {input ? input.split("\n").length : 0}</span>
        </div>
        <textarea
            id="dedup-input"
            bind:value={input}
            class="textarea-editor flex-1"
            placeholder="Paste list here..."
        ></textarea>
    </div>

    <!-- Controls -->
    <div
        class="flex md:flex-col items-center justify-center gap-4 py-4 md:py-0 w-full md:w-48 shrink-0"
    >
        <div
            class="space-y-3 w-full p-4 bg-slate-50/80 dark:bg-[#111113]/80 border border-slate-100 dark:border-slate-800/60 rounded-xl shadow-sm"
        >
            <div
                class="label-section mb-2"
            >
                Filters
            </div>

            <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    bind:checked={config.dedup}
                    class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
                <span class="text-xs font-medium text-slate-600 dark:text-slate-300">Remove Duplicates</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    bind:checked={config.trim}
                    class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
                <span class="text-xs font-medium text-slate-600 dark:text-slate-300">Trim Whitespace</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    bind:checked={config.empty}
                    class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
                <span class="text-xs font-medium text-slate-600 dark:text-slate-300">Remove Empty</span>
            </label>
        </div>

        <div class="w-full space-y-2">
            <Button
                variant="secondary"
                class="btn btn-secondary text-sm w-full"
                onclick={() => sort("asc")}
            >
                <ArrowDownAZ size={16} class="mr-2" /> Sort A-Z
            </Button>
            <Button
                variant="secondary"
                class="btn btn-secondary text-sm w-full"
                onclick={() => sort("desc")}
            >
                <ArrowUpZA size={16} class="mr-2" /> Sort Z-A
            </Button>
            <Button
                variant="ghost"
                class="btn btn-ghost text-sm w-full hover:text-rose-500"
                onclick={() => (input = "")}
            >
                <Eraser size={16} class="mr-2" /> Clear All
            </Button>
        </div>
    </div>

    <!-- Output -->
    <div class="flex-1 flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-center">
            <label
                for="dedup-output"
                class="label-section"
                >Cleaned List</label
            >
            <span class="text-[11px] text-slate-400 font-mono">Lines: {stats.result}</span>
        </div>
        <div class="relative flex-1 min-h-[350px]">
            <textarea
                id="dedup-output"
                value={output}
                readonly
                class="textarea-editor w-full"
                placeholder="Result will appear here..."
            ></textarea>

            {#if output}
                <div class="absolute top-3 right-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => navigator.clipboard.writeText(output)}
                        class="btn btn-secondary text-sm shadow-sm"
                    >
                        <Copy size={14} class="mr-1" /> Copy
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</div>
