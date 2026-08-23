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
        class="flex items-center gap-4 p-5 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm"
    >
        <div class="flex items-center gap-2">
            <span class="label-section"
                >Generate</span
            >
            <input
                type="number"
                bind:value={count}
                min="1"
                max="100"
                class="input text-sm w-20"
            />
            <span class="label-section"
                >UUIDs</span
            >
        </div>

        <Button
            onclick={generate}
            class="btn btn-primary text-sm shadow-sm hover:shadow-md"
        >
            <RefreshCw size={16} /> Generate
        </Button>

        <div class="flex-1"></div>

        <Button variant="outline" onclick={copyAll} class="btn btn-secondary text-sm">
            <Copy size={16} class="mr-1" /> Copy List
        </Button>
    </div>

    <!-- Output -->
    <div
        class="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden"
    >
        {#each uuids as uuid, i}
            <div
                class="px-5 py-3.5 font-mono text-sm text-slate-700 dark:text-slate-300 flex justify-between items-center group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
            >
                <span
                    class="select-all opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]"
                    style="animation-delay: {i * 20}ms">{uuid}</span
                >
                <button
                    onclick={() => navigator.clipboard.writeText(uuid)}
                    class="btn btn-secondary text-xs p-1.5 shadow-sm"
                    title="Copy"
                >
                    <Copy size={12} />
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
