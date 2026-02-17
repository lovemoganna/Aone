<script lang="ts">
    import { onMount } from "svelte";
    import * as Diff from "diff";
    import { Split, Trash2, ArrowRightLeft, Copy } from "lucide-svelte";

    let oldText = $state("");
    let newText = $state("");
    let diffs = $state<Diff.Change[]>([]);
    let mode = $state<"chars" | "lines">("lines"); // lines, chars

    function compare() {
        if (mode === "lines") {
            diffs = Diff.diffLines(oldText, newText);
        } else {
            diffs = Diff.diffChars(oldText, newText);
        }
    }

    function clear() {
        oldText = "";
        newText = "";
        diffs = [];
    }

    function swap() {
        const temp = oldText;
        oldText = newText;
        newText = temp;
        compare();
    }

    function copyResult() {
        // Copy text representation of diff? Or just new text?
        // Let's copy new text for now or maybe just a summary.
        // Actually, standard diff format would be cool but complex.
        // Let's just copy the diff array as JSON for debug or something simple.
        // User probably wants to copy the visual output... hard.
        // I'll skip complex copy for now.
    }

    // Auto compare on change? Maybe with debounce?
    // Let's stick to manual button for large texts.
</script>

<svelte:head>
    <title>Diff Viewer</title>
</svelte:head>

<div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 lg:p-8 flex flex-col gap-6"
>
    <!-- Header -->
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold flex items-center gap-3">
            <div
                class="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30"
            >
                <Split size={24} />
            </div>
            Diff Viewer
        </h1>
        <div class="flex items-center gap-2">
            <div class="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button
                    class="px-3 py-1.5 rounded-md text-sm font-medium transition-all {mode ===
                    'lines'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
                    onclick={() => {
                        mode = "lines";
                        compare();
                    }}
                >
                    Lines
                </button>
                <button
                    class="px-3 py-1.5 rounded-md text-sm font-medium transition-all {mode ===
                    'chars'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
                    onclick={() => {
                        mode = "chars";
                        compare();
                    }}
                >
                    Chars
                </button>
            </div>
        </div>
    </div>

    <!-- Input Area -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
        <div class="flex flex-col gap-2 h-full">
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400"
                >Original Text</label
            >
            <textarea
                bind:value={oldText}
                class="flex-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Paste original text here..."
            ></textarea>
        </div>
        <div class="flex flex-col gap-2 h-full">
            <label class="text-sm font-medium text-gray-600 dark:text-gray-400"
                >New Text</label
            >
            <textarea
                bind:value={newText}
                class="flex-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Paste new text here..."
            ></textarea>
        </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4">
        <button
            onclick={compare}
            class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
            <Split size={18} />
            Compare
        </button>
        <button
            onclick={swap}
            class="px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
            <ArrowRightLeft size={18} />
            Swap
        </button>
        <button
            onclick={clear}
            class="px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 ml-auto"
        >
            <Trash2 size={18} />
            Clear
        </button>
    </div>

    <!-- Results -->
    {#if diffs.length > 0}
        <div class="flex flex-col gap-2">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Differences
            </h2>
            <div
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden font-mono text-sm"
            >
                {#each diffs as part}
                    <div
                        class="px-4 py-1 whitespace-pre-wrap break-all border-b last:border-0 border-gray-100 dark:border-gray-700/50 {part.added
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : part.removed
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'text-gray-600 dark:text-gray-400'}"
                    >
                        <span class="mr-2 select-none opacity-50 font-bold">
                            {part.added ? "+" : part.removed ? "-" : " "}
                        </span>
                        {part.value}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
