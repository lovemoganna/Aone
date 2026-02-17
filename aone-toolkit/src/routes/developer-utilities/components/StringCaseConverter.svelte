<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy } from "lucide-svelte";

    let input = $state("");

    // Utilities
    const toWords = (s: string) =>
        s
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .split(/[^a-zA-Z0-9]+/)
            .filter((x) => x);

    let cases = $derived.by(() => {
        if (!input) return [];
        const words = toWords(input);
        const lowerWords = words.map((w) => w.toLowerCase());

        return [
            {
                label: "camelCase",
                val: lowerWords
                    .map((w, i) =>
                        i === 0 ? w : w[0].toUpperCase() + w.slice(1),
                    )
                    .join(""),
            },
            {
                label: "PascalCase",
                val: lowerWords
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(""),
            },
            { label: "snake_case", val: lowerWords.join("_") },
            { label: "kebab-case", val: lowerWords.join("-") },
            { label: "CONSTANT_CASE", val: lowerWords.join("_").toUpperCase() },
            {
                label: "Title Case",
                val: lowerWords
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" "),
            },
            {
                label: "Sentence case",
                val: lowerWords
                    .map((w, i) =>
                        i === 0 ? w[0].toUpperCase() + w.slice(1) : w,
                    )
                    .join(" "),
            },
            { label: "dot.notation", val: lowerWords.join(".") },
            { label: "path/case", val: lowerWords.join("/") },
        ];
    });
</script>

<div class="h-full flex flex-col gap-6">
    <div class="flex-1 flex flex-col gap-2">
        <label
            for="str-input"
            class="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >Input Text</label
        >
        <textarea
            id="str-input"
            bind:value={input}
            class="w-full h-32 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400"
            placeholder="Type any text to convert (e.g. helloWorld or user_id)..."
        ></textarea>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each cases as c}
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col gap-2 group hover:border-primary-200 dark:hover:border-primary-900 transition-colors"
            >
                <div class="flex justify-between items-center">
                    <span
                        class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >{c.label}</span
                    >
                    <button
                        class="p-1 text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all"
                        onclick={() => navigator.clipboard.writeText(c.val)}
                        title="Copy"
                    >
                        <Copy size={14} />
                    </button>
                </div>
                <div
                    class="font-mono text-sm text-slate-700 dark:text-slate-300 break-all select-all"
                >
                    {c.val}
                </div>
            </div>
        {/each}

        {#if cases.length === 0}
            <div class="col-span-full py-8 text-center text-slate-400 italic">
                Start typing to see conversions...
            </div>
        {/if}
    </div>
</div>
