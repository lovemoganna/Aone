<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, ArrowRightLeft } from "lucide-svelte";

    let input = $state("");
    let mode = $state<"encode" | "decode">("encode");
    let output = $state("");

    function process() {
        if (!input) {
            output = "";
            return;
        }

        if (mode === "encode") {
            output = input.replace(/[\u00A0-\u9999<>\&]/g, (i) => {
                return "&#" + i.charCodeAt(0) + ";";
            });
        } else {
            const txt = document.createElement("textarea");
            txt.innerHTML = input;
            output = txt.value;
        }
    }

    $effect(() => {
        process();
        if (input || mode) {
        }
    });
</script>

<div class="h-full flex flex-col md:flex-row gap-6">
    <div class="flex-1 flex flex-col gap-2">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {mode === "encode" ? "Plain Text" : "HTML Entity String"}
        </label>
        <textarea
            bind:value={input}
            class="flex-1 min-h-[300px] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            placeholder={mode === "encode"
                ? "<div class='foo'>Bar</div>"
                : "&lt;div class=&#39;foo&#39;&gt;Bar&lt;/div&gt;"}
        ></textarea>
    </div>

    <!-- Switcher -->
    <div
        class="flex md:flex-col items-center justify-center gap-4 py-4 md:py-0"
    >
        <button
            class="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95 group"
            onclick={() => (mode = mode === "encode" ? "decode" : "encode")}
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

    <div class="flex-1 flex flex-col gap-2 relative">
        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >Result</label
        >
        <textarea
            value={output}
            readonly
            class="flex-1 min-h-[300px] p-4 font-mono text-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none resize-none text-slate-700 dark:text-slate-300"
            placeholder="Result..."
        ></textarea>
        {#if output}
            <button
                class="absolute top-8 right-2 p-1.5 bg-white/50 dark:bg-slate-900/50 rounded-md hover:bg-white text-slate-500 hover:text-primary-600 border border-transparent hover:border-slate-200 transition-all"
                onclick={() => navigator.clipboard.writeText(output)}
                title="Copy"
            >
                <Copy size={16} />
            </button>
        {/if}
    </div>
</div>
