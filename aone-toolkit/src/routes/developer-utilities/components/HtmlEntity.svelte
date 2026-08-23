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

<div class="h-full flex flex-col md:flex-row gap-4">
    <!-- Input Column -->
    <div class="flex-1 flex flex-col gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-2xs">
        <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {mode === "encode" ? "纯文本 (Plain Text)" : "HTML 实体字符串 (Entity String)"}
            </span>
            <span class="text-[11px] text-slate-400 font-mono">{input.length} 字符</span>
        </div>
        <textarea
            bind:value={input}
            aria-label={mode === "encode" ? "Plain Text" : "HTML Entity String"}
            class="flex-1 min-h-[350px] w-full text-xs font-mono p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-200 resize-none"
            placeholder={mode === "encode"
                ? "<div class='foo'>Bar</div>"
                : "&lt;div class=&#39;foo&#39;&gt;Bar&lt;/div&gt;"}
        ></textarea>
    </div>

    <!-- Switcher -->
    <div
        class="flex md:flex-col items-center justify-center gap-3 py-2 md:py-0"
    >
        <button
            class="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            onclick={() => (mode = mode === "encode" ? "decode" : "encode")}
            title="切换模式 (Encode / Decode)"
        >
            <ArrowRightLeft
                size={16}
            />
        </button>
        <div
            class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden md:block rotate-90 whitespace-nowrap"
        >
            {mode}
        </div>
    </div>

    <!-- Output Column -->
    <div class="flex-1 flex flex-col gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-2xs">
        <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">处理结果 (Result)</span>
            <span class="text-[11px] text-slate-400 font-mono">{output.length} 字符</span>
        </div>
        <div class="relative flex-1 min-h-[350px] flex flex-col">
            <textarea
                value={output}
                readonly
                aria-label="Result"
                class="flex-1 w-full text-xs font-mono p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                placeholder="结果将在此显示..."
            ></textarea>
            {#if output}
                <div class="absolute top-2.5 right-2.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => navigator.clipboard.writeText(output)}
                        class="text-xs py-1 px-2.5 bg-white dark:bg-slate-800 shadow-2xs"
                    >
                        <Copy size={12} class="mr-1" /> 复制
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</div>
