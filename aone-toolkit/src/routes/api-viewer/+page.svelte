<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import JsonTreeView from "../json-editor/components/JsonTreeView.svelte";
    import TypeGenModal from "../json-editor/components/TypeGenModal.svelte";
    import { JSONPath } from "jsonpath-plus";
    import { Search, Code2, Copy, Trash2, Info } from "lucide-svelte";

    let rawInput = $state("");
    let parsedData = $state<any>(null);
    let jsonPath = $state("$");
    let queryResult = $state<any>(null);
    let error = $state<string | null>(null);
    let isTypeGenOpen = $state(false);
    let expandedKeys = $state<Set<string>>(new Set());

    function parseInput() {
        error = null;
        if (!rawInput.trim()) {
            parsedData = null;
            queryResult = null;
            return;
        }

        try {
            parsedData = JSON.parse(rawInput);
            handleQuery();
        } catch (e: any) {
            error = "Invalid JSON: " + e.message;
            parsedData = null;
        }
    }

    function handleQuery() {
        if (!parsedData) return;
        try {
            queryResult = JSONPath({ path: jsonPath, json: parsedData });
            error = null;
        } catch (e: any) {
            error = "JSONPath Error: " + e.message;
        }
    }

    function copyResult() {
        navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2));
    }

    $effect(() => {
        if (jsonPath) handleQuery();
    });
</script>

<svelte:head>
    <title>API Response Viewer - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <!-- Input Section -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                        >
                            <Code2 size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Response Input
                        </h2>
                    </div>
                    <div class="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                                rawInput = "";
                                parseInput();
                            }}
                        >
                            <Trash2 size={14} class="mr-1" /> Clear
                        </Button>
                        <Button size="sm" onclick={parseInput}
                            >Parse JSON</Button
                        >
                    </div>
                </div>
            {/snippet}

            <div class="flex-1 p-0 overflow-hidden relative">
                <textarea
                    bind:value={rawInput}
                    class="w-full h-full p-6 font-mono text-sm bg-transparent resize-none focus:outline-none dark:text-slate-300"
                    placeholder="Paste API JSON response here..."
                    oninput={parseInput}
                ></textarea>

                {#if error && !parsedData}
                    <div
                        class="absolute bottom-4 left-4 right-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm"
                    >
                        {error}
                    </div>
                {/if}
            </div>
        </Panel>

        <!-- Analysis Section -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                        >
                            <Search size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Analysis & Tree View
                        </h2>
                    </div>
                    {#if parsedData}
                        <Button
                            variant="secondary"
                            size="sm"
                            onclick={() => (isTypeGenOpen = true)}
                        >
                            <Code2 size={14} class="mr-1" /> Type Gen
                        </Button>
                    {/if}
                </div>
            {/snippet}

            <div class="flex-1 flex flex-col min-h-0">
                <!-- Search Bar -->
                <div
                    class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/10"
                >
                    <div class="relative">
                        <Search
                            class="absolute left-3 top-2.5 text-slate-400"
                            size={14}
                        />
                        <input
                            type="text"
                            bind:value={jsonPath}
                            placeholder="JSONPath (e.g. $.items[*].name)"
                            class="w-full pl-9 pr-4 py-2 text-xs font-mono bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>
                    {#if jsonPath !== "$" && queryResult !== null}
                        <div
                            class="mt-2 flex items-center justify-between px-1"
                        >
                            <span
                                class="text-[10px] text-slate-400 font-bold uppercase"
                                >Results: {Array.isArray(queryResult)
                                    ? queryResult.length
                                    : 1}</span
                            >
                            <button
                                class="text-[10px] text-emerald-600 font-bold hover:underline"
                                onclick={copyResult}>COPY RESULTS</button
                            >
                        </div>
                    {/if}
                </div>

                <!-- View Switcher / Content -->
                <div class="flex-1 overflow-auto p-4">
                    {#if parsedData}
                        <JsonTreeView
                            data={jsonPath === "$" ? parsedData : queryResult}
                            bind:expandedKeys
                        />
                    {:else}
                        <div
                            class="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4"
                        >
                            <Info
                                size={40}
                                class="text-slate-200 dark:text-slate-800"
                            />
                            <p class="text-sm">
                                Parse JSON to explore the response structure.
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        </Panel>
    </div>
</div>

{#if isTypeGenOpen && parsedData}
    <TypeGenModal
        jsonData={parsedData}
        isOpen={isTypeGenOpen}
        onClose={() => (isTypeGenOpen = false)}
    />
{/if}
