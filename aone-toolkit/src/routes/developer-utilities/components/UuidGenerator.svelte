<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw, ListPlus } from "lucide-svelte";

    let count = $state(1);
    let uuids = $state<string[]>([]);

    function generateUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            },
        );
    }

    function generate() {
        // Sanity check
        const N = Math.min(Math.max(1, count), 100);
        const newUuids = [];
        for (let i = 0; i < N; i++) {
            newUuids.push(generateUUID());
        }
        uuids = newUuids;
    }

    $effect(() => {
        // Init
        if (uuids.length === 0) generate();
    });

    async function copyAll() {
        await navigator.clipboard.writeText(uuids.join("\n"));
    }
</script>

<div class="space-y-6">
    <!-- Controls -->
    <div
        class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
    >
        <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400"
                >Generate</span
            >
            <input
                type="number"
                bind:value={count}
                min="1"
                max="100"
                class="w-16 px-2 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-primary-500"
            />
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400"
                >UUIDs</span
            >
        </div>

        <Button
            onclick={generate}
            class="bg-primary-600 hover:bg-primary-700 text-white gap-2"
        >
            <RefreshCw size={16} /> Generate
        </Button>

        <div class="flex-1"></div>

        <Button variant="outline" onclick={copyAll} class="gap-2">
            <Copy size={16} /> Copy List
        </Button>
    </div>

    <!-- Output -->
    <div
        class="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50"
    >
        {#each uuids as uuid, i}
            <div
                class="p-3 font-mono text-sm text-slate-600 dark:text-slate-300 flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
                <span
                    class="select-all opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]"
                    style="animation-delay: {i * 30}ms">{uuid}</span
                >
                <button
                    onclick={() => navigator.clipboard.writeText(uuid)}
                    class="p-1 rounded text-slate-400 hover:text-primary-500 hover:bg-white dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                    title="Copy"
                >
                    <Copy size={14} />
                </button>
            </div>
        {/each}
    </div>
</div>

<style>
    @keyframes fadeIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
