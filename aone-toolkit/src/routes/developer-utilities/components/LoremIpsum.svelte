<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw } from "lucide-svelte";

    const LOREM =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    const WORDS = LOREM.replace(/[.,]/g, "").toLowerCase().split(/\s+/);

    let paragraphs = $state(3);
    let wordsPerPara = $state(50);
    let output = $state("");

    function generate() {
        const paras: string[] = [];
        for (let p = 0; p < paragraphs; p++) {
            const words: string[] = [];
            for (let w = 0; w < wordsPerPara; w++) {
                words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
            }
            // Capitalize first word
            words[0] = words[0][0].toUpperCase() + words[0].slice(1);
            paras.push(words.join(" ") + ".");
        }
        output = paras.join("\n\n");
    }

    // Auto generate on init
    $effect(() => {
        generate();
    });
</script>

<div class="space-y-6 py-8 w-full">
    <!-- Controls -->
    <div
        class="flex flex-wrap gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
    >
        <div class="space-y-2">
            <label
                for="lorem-para"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Paragraphs</label
            >
            <input
                id="lorem-para"
                type="number"
                min="1"
                max="20"
                bind:value={paragraphs}
                class="input text-sm w-24"
            />
        </div>
        <div class="space-y-2">
            <label
                for="lorem-words"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Words per Paragraph</label
            >
            <input
                id="lorem-words"
                type="number"
                min="10"
                max="200"
                bind:value={wordsPerPara}
                class="input text-sm w-24"
            />
        </div>
        <Button onclick={generate} class="btn btn-ghost text-sm">
            <RefreshCw size={16} /> Generate
        </Button>
    </div>

    <!-- Output -->
    <div class="relative">
        <textarea
            value={output}
            readonly
            class="textarea-editor shadow-inner bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 w-full"
        ></textarea>

        {#if output}
            <div class="absolute top-3 right-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => navigator.clipboard.writeText(output)}
                >
                    <Copy size={14} class="mr-1" /> Copy
                </Button>
            </div>
        {/if}
    </div>

    <div class="text-sm text-slate-500 text-center">
        {output.split(/\s+/).length} words · {paragraphs} paragraphs
    </div>
</div>
