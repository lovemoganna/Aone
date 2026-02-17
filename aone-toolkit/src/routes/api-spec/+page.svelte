<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { FileJson, Globe, Search, ChevronRight, Info } from "lucide-svelte";

    let specInput = $state("");
    let parsedSpec = $state<any>(null);
    let selectedPath = $state<string | null>(null);

    function parseSpec() {
        try {
            parsedSpec = JSON.parse(specInput);
            selectedPath = Object.keys(parsedSpec.paths || {})[0];
        } catch (e) {
            alert("Invalid OpenAPI JSON");
        }
    }

    let paths = $derived(
        parsedSpec?.paths ? Object.keys(parsedSpec.paths) : [],
    );
</script>

<svelte:head>
    <title>OpenAPI Explorer - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <!-- Input -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center gap-2">
                    <FileJson size={16} class="text-blue-500" />
                    <h2 class="font-semibold">Spec Source</h2>
                </div>
            {/snippet}
            <div class="flex-1 flex flex-col p-4 space-y-4">
                <textarea
                    bind:value={specInput}
                    class="flex-1 p-4 font-mono text-[10px] bg-slate-50 dark:bg-black/20 border rounded-xl resize-none outline-none"
                    placeholder="Paste OpenAPI 3.0 JSON here..."
                ></textarea>
                <Button class="w-full" onclick={parseSpec}
                    >Parse Specification</Button
                >
            </div>
        </Panel>

        <!-- Paths List -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center gap-2">
                    <Globe size={16} class="text-emerald-500" />
                    <h2 class="font-semibold">Endpoints ({paths.length})</h2>
                </div>
            {/snippet}
            <div class="flex-1 overflow-y-auto p-2">
                {#each paths as path}
                    <button
                        class="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 {selectedPath ===
                        path
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                            : ''}"
                        onclick={() => (selectedPath = path)}
                    >
                        <ChevronRight size={14} class="opacity-30" />
                        <span class="text-xs font-mono truncate">{path}</span>
                    </button>
                {/each}
            </div>
        </Panel>

        <!-- Details -->
        <Panel class="flex flex-col min-h-0 overflow-y-auto">
            {#snippet header()}
                <div class="flex items-center gap-2">
                    <Info size={16} class="text-indigo-500" />
                    <h2 class="font-semibold">Details</h2>
                </div>
            {/snippet}
            <div class="p-6 space-y-6">
                {#if selectedPath && parsedSpec.paths[selectedPath]}
                    {@const methods = Object.keys(
                        parsedSpec.paths[selectedPath],
                    )}
                    {#each methods as method}
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <span
                                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-100 text-primary-600"
                                    >{method}</span
                                >
                                <span class="text-sm font-semibold"
                                    >{parsedSpec.paths[selectedPath][method]
                                        .summary || "No summary"}</span
                                >
                            </div>
                            <p class="text-xs text-slate-500 leading-relaxed">
                                {parsedSpec.paths[selectedPath][method]
                                    .description || ""}
                            </p>

                            {#if parsedSpec.paths[selectedPath][method].parameters}
                                <div class="space-y-2">
                                    <div
                                        class="text-[9px] font-bold text-slate-400 uppercase"
                                    >
                                        Parameters
                                    </div>
                                    <div class="space-y-1">
                                        {#each parsedSpec.paths[selectedPath][method].parameters as param}
                                            <div
                                                class="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded border text-[10px]"
                                            >
                                                <span
                                                    class="font-mono font-bold text-indigo-600"
                                                    >{param.name}
                                                    <span
                                                        class="text-slate-400 font-normal"
                                                        >({param.in})</span
                                                    ></span
                                                >
                                                <span class="text-slate-400"
                                                    >{param.required
                                                        ? "Required"
                                                        : "Optional"}</span
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {:else}
                    <div
                        class="h-full flex flex-col items-center justify-center opacity-20 text-center"
                    >
                        <Search size={48} />
                        <p class="mt-4 text-sm font-bold">Select an endpoint</p>
                    </div>
                {/if}
            </div>
        </Panel>
    </div>
</div>
