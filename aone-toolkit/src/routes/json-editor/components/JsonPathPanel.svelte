<script lang="ts">
    import { Input } from "$lib/components/ui";
    import { JSONPath } from "jsonpath-plus";

    interface Props {
        data: any;
        isHidden: boolean;
        onClose: () => void;
    }

    let { data, isHidden, onClose }: Props = $props();

    let query = $state("");
    let results = $state<any[]>([]);
    let error = $state("");

    function executeQuery() {
        error = "";
        results = [];
        if (!query.trim()) return;

        try {
            const res = JSONPath({ path: query, json: data, wrap: true });
            results = res;
        } catch (e: any) {
            error = e.message;
        }
    }

    function handleExample(ex: string) {
        query = ex;
        executeQuery();
    }
</script>

{#if !isHidden}
    <div
        class="absolute bottom-4 right-4 z-40 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[500px]"
    >
        <div
            class="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-t-lg"
        >
            <h3 class="font-medium text-sm text-slate-700 dark:text-slate-200">
                JSONPath Query
            </h3>
            <button
                onclick={onClose}
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close query panel"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-x"
                    ><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg
                >
            </button>
        </div>

        <div class="p-3 space-y-3 flex-1 overflow-hidden flex flex-col">
            <div class="relative">
                <Input
                    placeholder="$.store.book[*].author"
                    bind:value={query}
                    onkeydown={(e) => e.key === "Enter" && executeQuery()}
                />
                <button
                    onclick={executeQuery}
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500"
                    aria-label="Execute query"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-play"
                        ><polygon points="5 3 19 12 5 21 5 3" /></svg
                    >
                </button>
            </div>

            <div class="text-xs text-slate-500 space-x-2">
                <button
                    class="hover:underline"
                    onclick={() => handleExample("$")}>$</button
                >
                <button
                    class="hover:underline"
                    onclick={() => handleExample("$..*")}>$..*</button
                >
            </div>

            {#if error}
                <div
                    class="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                >
                    {error}
                </div>
            {/if}

            <div
                class="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 rounded p-2 border border-slate-100 dark:border-slate-800 font-mono text-xs"
            >
                {#if results.length > 0}
                    <div class="space-y-1">
                        {#each results as res, i}
                            <div
                                class="border-b border-slate-200 dark:border-slate-800 last:border-0 pb-1 mb-1"
                            >
                                <span class="text-slate-400 select-none mr-2"
                                    >[{i}]</span
                                >
                                <span
                                    class="text-slate-700 dark:text-slate-300 break-all"
                                >
                                    {typeof res === "object"
                                        ? JSON.stringify(res)
                                        : String(res)}
                                </span>
                            </div>
                        {/each}
                    </div>
                {:else if query && !error}
                    <div class="text-slate-400 italic text-center mt-4">
                        No matches
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
