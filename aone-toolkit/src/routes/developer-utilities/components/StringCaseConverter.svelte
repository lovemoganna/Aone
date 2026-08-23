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
    <div class="flex-1 flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-center">
            <label
                for="str-input"
                class="label-section"
                >Input Text</label
            >
            <span class="text-[11px] text-slate-400 font-mono">{input.length} chars</span>
        </div>
        <textarea
            id="str-input"
            bind:value={input}
            class="textarea-editor flex-1"
            placeholder="Type any text to convert (e.g. helloWorld or user_id)..."
        ></textarea>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each cases as c}
            <div
                class="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-primary-500 transition-colors"
            >
                <div class="flex justify-between items-center">
                    <span
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        >{c.label}</span
                    >
                    <button
                        class="btn btn-secondary text-xs p-1.5 shadow-sm"
                        onclick={() => navigator.clipboard.writeText(c.val)}
                        title="Copy"
                    >
                        <Copy size={12} />
                    </button>
                </div>
                <div
                    class="font-mono text-sm text-slate-700 dark:text-slate-300 break-all select-all flex-1"
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
