<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { AlertCircle, Copy, Check } from "lucide-svelte";

    let pattern = $state("");
    let flags = $state("g");
    let testString = $state("Hello World! Hello Universe!");
    let matches = $state<string[]>([]);
    let error = $state<string | null>(null);
    let highlightedText = $state("");

    function test() {
        error = null;
        matches = [];
        highlightedText = testString;

        if (!pattern) return;

        try {
            const regex = new RegExp(pattern, flags);
            const allMatches = [...testString.matchAll(regex)];
            matches = allMatches.map((m) => m[0]);

            // Highlight matches in text
            if (matches.length > 0) {
                highlightedText = testString.replace(
                    regex,
                    '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$&</mark>',
                );
            }
        } catch (e: any) {
            error = e.message;
        }
    }

    $effect(() => {
        test();
        if (pattern || flags || testString) {
        }
    });

    const COMMON_PATTERNS = [
        {
            label: "Email",
            pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        },
        { label: "URL", pattern: "https?://[^\\s]+" },
        {
            label: "Phone",
            pattern:
                "\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}",
        },
        { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
        { label: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}" },
    ];
</script>

<div class="h-full flex flex-col gap-6">
    <!-- Pattern Input -->
    <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 space-y-2">
            <label
                for="regex-pattern"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Pattern</label
            >
            <div class="flex gap-2">
                <span
                    class="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-l-lg text-slate-500 font-mono"
                    >/</span
                >
                <input
                    id="regex-pattern"
                    type="text"
                    bind:value={pattern}
                    class="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 outline-none font-mono text-sm focus:bg-slate-50 dark:focus:bg-slate-800 transition-colors"
                    placeholder="Enter regex pattern..."
                />
                <input
                    type="text"
                    bind:value={flags}
                    class="w-16 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-r-lg outline-none font-mono text-sm text-center"
                    placeholder="gi"
                    aria-label="Regex flags"
                />
            </div>

            {#if error}
                <div class="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                </div>
            {/if}
        </div>
    </div>

    <!-- Common Patterns -->
    <div class="flex flex-wrap gap-2">
        {#each COMMON_PATTERNS as p}
            <button
                class="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                onclick={() => (pattern = p.pattern)}
            >
                {p.label}
            </button>
        {/each}
    </div>

    <!-- Test String -->
    <div class="flex-1 flex flex-col md:flex-row gap-4 min-h-[200px]">
        <div class="flex-1 flex flex-col gap-2">
            <label
                for="regex-test"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Test String</label
            >
            <textarea
                id="regex-test"
                bind:value={testString}
                class="flex-1 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="Enter text to test..."
            ></textarea>
        </div>

        <div class="flex-1 flex flex-col gap-2">
            <div class="flex justify-between">
                <span
                    class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >Result</span
                >
                <span class="text-xs text-slate-500"
                    >{matches.length} matches</span
                >
            </div>
            <div
                class="flex-1 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-auto"
            >
                <div
                    class="font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                >
                    {@html highlightedText}
                </div>
            </div>
        </div>
    </div>

    <!-- Matches List -->
    {#if matches.length > 0}
        <div
            class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800"
        >
            <div
                class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
                Matches
            </div>
            <div class="flex flex-wrap gap-2">
                {#each matches as match, i}
                    <code
                        class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded text-xs"
                    >
                        [{i}] {match}
                    </code>
                {/each}
            </div>
        </div>
    {/if}
</div>
