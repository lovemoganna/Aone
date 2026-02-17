<script lang="ts">
    import { Regex, Flag, Info, AlertTriangle } from "lucide-svelte";

    let pattern = $state("");
    let flags = $state("gm");
    let text = $state("");
    let error = $state("");

    // Flags
    const flagOptions = [
        { char: "g", label: "Global", desc: "Don't return after first match" },
        {
            char: "m",
            label: "Multi line",
            desc: "^ and $ match start/end of line",
        },
        { char: "i", label: "Insensitive", desc: "Case insensitive match" },
        { char: "s", label: "Single line", desc: "Dot matches newline" },
        { char: "u", label: "Unicode", desc: "Match full unicode" },
        { char: "y", label: "Sticky", desc: "Anchor to last match" },
    ];

    let matches = $derived.by(() => {
        if (!pattern) return [];
        try {
            error = "";
            const regex = new RegExp(pattern, flags);
            return Array.from(text.matchAll(regex));
        } catch (e: any) {
            error = e.message;
            return [];
        }
    });

    function toggleFlag(char: string) {
        if (flags.includes(char)) {
            flags = flags.replace(char, "");
        } else {
            flags += char;
        }
    }

    // Highlighting Logic (Simple version: just show list of matches)
    // Full highlighting in textarea is hard without a library like Prism or custom div overlay.
    // For MVP, we'll show a "Matches" list and maybe an overlay if possible.
    // Let's settle for a "Match List / Groups" view.
</script>

<svelte:head>
    <title>Regex Tester</title>
</svelte:head>

<div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 lg:p-8 flex flex-col gap-6"
>
    <!-- Header -->
    <div class="flex items-center gap-3">
        <div
            class="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30"
        >
            <Regex size={24} />
        </div>
        <h1 class="text-2xl font-bold">Regex Tester</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Input Column -->
        <div class="lg:col-span-2 flex flex-col gap-6">
            <!-- Pattern Input -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4"
            >
                <div
                    class="flex items-center gap-2 text-gray-500 text-sm font-medium"
                >
                    <Regex size={16} />
                    Regular Expression
                </div>
                <div
                    class="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-pink-500 transition-all"
                >
                    <span class="text-gray-400 font-mono text-lg select-none"
                        >/</span
                    >
                    <input
                        type="text"
                        bind:value={pattern}
                        class="flex-1 bg-transparent border-none outline-none font-mono text-lg text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="Expression..."
                    />
                    <span class="text-gray-400 font-mono text-lg select-none"
                        >/</span
                    >
                    <input
                        type="text"
                        bind:value={flags}
                        class="w-16 bg-transparent border-none outline-none font-mono text-lg text-gray-500"
                        placeholder="gmi"
                    />
                </div>

                {#if error}
                    <div
                        class="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-2 rounded-lg"
                    >
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                {/if}

                <!-- Flags Toggles -->
                <div class="flex flex-wrap gap-2">
                    {#each flagOptions as opt}
                        <button
                            class="px-2 py-1 flex items-center gap-2 rounded text-xs font-mono border transition-all {flags.includes(
                                opt.char,
                            )
                                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300'
                                : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}"
                            onclick={() => toggleFlag(opt.char)}
                            title={opt.desc}
                        >
                            <Flag size={10} />
                            {opt.char}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Test String -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4 flex-1"
            >
                <div
                    class="flex items-center gap-2 text-gray-500 text-sm font-medium"
                >
                    <Info size={16} />
                    Test String
                </div>
                <textarea
                    bind:value={text}
                    class="flex-1 w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-pink-500 outline-none min-h-[200px]"
                    placeholder="Paste text to test against..."
                ></textarea>
            </div>
        </div>

        <!-- Output Column -->
        <div class="flex flex-col gap-6">
            <div
                class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4 h-full"
            >
                <div
                    class="flex items-center justify-between text-gray-500 text-sm font-medium"
                >
                    <span class="flex items-center gap-2">
                        <Info size={16} />
                        Matches
                    </span>
                    <span
                        class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs"
                    >
                        {matches ? matches.length : 0} found
                    </span>
                </div>

                <div
                    class="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-250px)]"
                >
                    {#if matches.length > 0}
                        {#each matches as match, i}
                            <div
                                class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700/50 text-sm font-mono break-all group relative"
                            >
                                <div
                                    class="absolute top-2 right-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100"
                                >
                                    Idx: {match.index}
                                </div>
                                <div
                                    class="text-pink-600 dark:text-pink-400 font-semibold mb-1"
                                >
                                    Match {i + 1}: "{match[0]}"
                                </div>
                                {#if match.length > 1}
                                    <div
                                        class="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1"
                                    >
                                        {#each Array.from(match).slice(1) as group, gIndex}
                                            <div
                                                class="text-gray-500 text-xs flex gap-2"
                                            >
                                                <span class="text-gray-400"
                                                    >G{gIndex + 1}:</span
                                                >
                                                <span
                                                    class="text-gray-700 dark:text-gray-300"
                                                    >{group}</span
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    {:else if pattern && text}
                        <div class="text-center py-8 text-gray-400 text-sm">
                            No matches found.
                        </div>
                    {:else}
                        <div class="text-center py-8 text-gray-400 text-sm">
                            Enter a pattern and text to see matches.
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
