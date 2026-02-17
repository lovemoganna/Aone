<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, ArrowRightLeft, Check, AlertCircle } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let input = $state("");
    let mode = $state<"encode" | "decode">("encode");
    let output = $state("");
    let error = $state<string | null>(null);
    let copied = $state(false);

    function processBase64() {
        error = null;
        if (!input) {
            output = "";
            return;
        }

        try {
            if (mode === "encode") {
                output = btoa(input);
            } else {
                output = atob(input);
            }
        } catch (e) {
            output = "";
            error = "Invalid Input";
        }
    }

    $effect(() => {
        // Trigger processing when input or mode changes
        processBase64();
        // Just referencing input and mode to track dependencies
        // (Svelte 5 runest automatically track dependency, so simple call is enough)
        if (input || mode) {
        }
    });

    function toggleMode() {
        mode = mode === "encode" ? "decode" : "encode";
        // Swap input and output if valid (optional UX enhancement, maybe confusing)
        // Let's keep it simple: just switch mode
    }

    async function copyOutput() {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }
</script>

<div class="h-full flex flex-col md:flex-row gap-6">
    <!-- Input Column -->
    <div class="flex-1 flex flex-col gap-2">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {mode === "encode" ? "Text Input" : "Base64 Input"}
        </label>
        <textarea
            bind:value={input}
            class="flex-1 min-h-[300px] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
            placeholder={mode === "encode"
                ? "Paste text to encode..."
                : "Paste Base64 to decode..."}
            spellcheck="false"
        ></textarea>
        <div class="flex justify-between text-xs text-slate-500">
            <span>{input.length} chars</span>
        </div>
    </div>

    <!-- Controls Column (Middle) -->
    <div
        class="flex md:flex-col items-center justify-center gap-4 py-4 md:py-0"
    >
        <button
            class="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95 group"
            onclick={toggleMode}
            title="Switch Mode"
        >
            <ArrowRightLeft
                size={20}
                class="group-hover:rotate-180 transition-transform duration-300"
            />
        </button>

        <div
            class="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:block rotate-90 whitespace-nowrap"
        >
            {mode}
        </div>
    </div>

    <!-- Output Column -->
    <div class="flex-1 flex flex-col gap-2">
        <div class="flex justify-between items-center">
            <label
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
                {mode === "encode" ? "Base64 Output" : "Text Output"}
            </label>
            {#if error}
                <span
                    transition:fade
                    class="text-xs text-rose-500 font-medium flex items-center gap-1"
                >
                    <AlertCircle size={12} />
                    {error}
                </span>
            {/if}
        </div>

        <div class="relative flex-1 min-h-[300px]">
            <textarea
                value={output}
                readonly
                class="w-full h-full p-4 font-mono text-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 focus:outline-none resize-none"
                placeholder="Result will appear here..."
            ></textarea>

            {#if output}
                <div class="absolute top-2 right-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={copyOutput}
                        class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 hover:bg-white hover:border-slate-300"
                    >
                        {#if copied}
                            <Check size={14} class="mr-1 text-emerald-500" />
                            <span class="text-emerald-500">Copied</span>
                        {:else}
                            <Copy size={14} class="mr-1" /> Copy
                        {/if}
                    </Button>
                </div>
            {/if}
        </div>
        <div class="flex justify-between text-xs text-slate-500">
            <span>{output.length} chars</span>
            {#if mode === "encode" && output.length > 0}
                <span
                    >Size increase: {Math.round(
                        (output.length / (input.length || 1) - 1) * 100,
                    )}%</span
                >
            {/if}
        </div>
    </div>
</div>
