<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { X, Search, FileJson, Trash2, FolderOpen, Layers } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";
    import { allSubWorkflows } from './subWorkflows';

    let {
        isOpen = false,
        onClose,
    } = $props<{
        isOpen?: boolean;
        onClose: () => void;
    }>();

    let templates: any[] = [];
    let snippets: any[] = [];
    let searchQuery = $state("");
    let activeTab = $state<'templates' | 'snippets' | 'subworkflows'>('templates');

    // P1-4: Load snippets from localStorage
    function loadSnippets() {
        if (typeof window !== "undefined") {
            const raw = localStorage.getItem("flow_editor_snippets");
            if (raw) {
                try {
                    snippets = JSON.parse(raw);
                    snippets.sort((a, b) => b.createdAt - a.createdAt);
                } catch (e) {
                    snippets = [];
                }
            } else {
                snippets = [];
            }
        }
    }

    function loadTemplates() {
        if (typeof window !== "undefined") {
            const raw = localStorage.getItem("aone_flow_templates");
            if (raw) {
                try {
                    templates = JSON.parse(raw);
                    // Sort descending by created date
                    templates.sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                    );
                } catch (e) {
                    console.error("Failed to parse templates", e);
                    templates = [];
                }
            } else {
                templates = [];
            }
        }
    }

    onMount(() => {
        loadTemplates();
        loadSnippets();
        window.addEventListener("aone_templates_updated", loadTemplates);
        window.addEventListener("aone_snippets_updated", loadSnippets);
    });

    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("aone_templates_updated", loadTemplates);
            window.removeEventListener("aone_snippets_updated", loadSnippets);
        }
    });

    function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this template?")) {
            templates = templates.filter((t) => t.id !== id);
            localStorage.setItem(
                "aone_flow_templates",
                JSON.stringify(templates),
            );
            window.dispatchEvent(new CustomEvent("aone_templates_updated"));
        }
    }

    // P1-4: Delete snippet
    function handleDeleteSnippet(id: string) {
        if (confirm("Are you sure you want to delete this snippet?")) {
            snippets = snippets.filter((s) => s.id !== id);
            localStorage.setItem("flow_editor_snippets", JSON.stringify(snippets));
            window.dispatchEvent(new CustomEvent("aone_snippets_updated"));
        }
    }

    function handleDragStart(e: DragEvent, template: any) {
        if (e.dataTransfer) {
            e.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    type: "template",
                    payload: template,
                }),
            );
            e.dataTransfer.effectAllowed = "copy";
        }
    }

    // P1-4: Drag start for snippets
    function handleSnippetDragStart(e: DragEvent, snippet: any) {
        if (e.dataTransfer) {
            e.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    type: "snippet",
                    payload: snippet,
                }),
            );
            e.dataTransfer.effectAllowed = "copy";
        }
    }

    // P1-4: Filtered templates
    let filteredTemplates = $derived(templates.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ));

    // P1-4: Filtered snippets
    let filteredSnippets = $derived(snippets.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ));

    // P1-4: Get subworkflows
    let subworkflows = $derived($allSubWorkflows);
</script>

{#if isOpen}
    <!-- Backdrop overlay -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="absolute inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]"
        transition:fade={{ duration: 200 }}
        onclick={onClose}
    ></div>

    <!-- Panel Drawer -->
    <div
        class="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col"
        transition:fly={{ x: -100, duration: 250, opacity: 1 }}
    >
        <div
            class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
        >
            <h3
                class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"
            >
                <FileJson class="w-5 h-5 text-indigo-500" />
                Asset Hub
            </h3>
            <button
                class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                onclick={onClose}
            >
                <X class="w-4 h-4" />
            </button>
        </div>

        <!-- P1-4: Tab Navigation -->
        <div class="flex border-b border-slate-200 dark:border-slate-700">
            <button
                class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'templates' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}"
                onclick={() => activeTab = 'templates'}
            >
                Templates
            </button>
            <button
                class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'snippets' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}"
                onclick={() => activeTab = 'snippets'}
            >
                Snippets
            </button>
            <button
                class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'subworkflows' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}"
                onclick={() => activeTab = 'subworkflows'}
            >
                Subflows
            </button>
        </div>

        <div
            class="p-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
        >
            <div class="relative">
                <Search
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                />
                <input
                    type="text"
                    placeholder="Search..."
                    bind:value={searchQuery}
                    class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#if activeTab === 'templates'}
                {#if filteredTemplates.length === 0}
                    <div class="text-center text-slate-400 text-sm mt-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6">
                        {#if searchQuery}
                            No templates matching "{searchQuery}"
                        {:else}
                            No templates saved yet.<br /><br />
                            Select nodes on the canvas, right-click, and choose "Save as Template".
                        {/if}
                    </div>
                {:else}
                    {#each filteredTemplates as template (template.id)}
                        <div
                            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, template)}
                            role="button"
                            tabindex="0"
                            aria-label={`Drag template ${template.name}`}
                        >
                            <div class="flex items-center justify-between pointer-events-none">
                                <span class="font-medium text-sm text-slate-700 dark:text-slate-200">{template.name}</span>
                                <button
                                    class="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity cursor-pointer pointer-events-auto"
                                    onclick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                                    title="Delete Template"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                            <div class="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium pointer-events-none">
                                <span class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                                    {template.nodes.length} node{template.nodes.length !== 1 ? "s" : ""}
                                </span>
                                <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {template.edges.length} edge{template.edges.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    {/each}
                {/if}
            {:else if activeTab === 'snippets'}
                {#if filteredSnippets.length === 0}
                    <div class="text-center text-slate-400 text-sm mt-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6">
                        {#if searchQuery}
                            No snippets matching "{searchQuery}"
                        {:else}
                            No snippets saved yet.<br /><br />
                            Select nodes on the canvas, right-click, and choose "Save as Snippet".
                        {/if}
                    </div>
                {:else}
                    {#each filteredSnippets as snippet (snippet.id)}
                        <div
                            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                            draggable="true"
                            ondragstart={(e) => handleSnippetDragStart(e, snippet)}
                            role="button"
                            tabindex="0"
                            aria-label={`Drag snippet ${snippet.name}`}
                        >
                            <div class="flex items-center justify-between pointer-events-none">
                                <span class="font-medium text-sm text-slate-700 dark:text-slate-200">{snippet.name}</span>
                                <button
                                    class="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity cursor-pointer pointer-events-auto"
                                    onclick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); }}
                                    title="Delete Snippet"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                            <div class="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium pointer-events-none">
                                <span class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    {snippet.nodeCount || snippet.nodes?.length || 0} nodes
                                </span>
                            </div>
                        </div>
                    {/each}
                {/if}
            {:else if activeTab === 'subworkflows'}
                {#if subworkflows.length === 0}
                    <div class="text-center text-slate-400 text-sm mt-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6">
                        No sub-workflows available.
                    </div>
                {:else}
                    {#each subworkflows as sw (sw.id)}
                        <div
                            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                        >
                            <div class="flex items-center justify-between pointer-events-none">
                                <span class="font-medium text-sm text-slate-700 dark:text-slate-200">{sw.name}</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1 pointer-events-none">{sw.description}</p>
                            <div class="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium pointer-events-none">
                                <span class="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                                    {sw.nodes?.length || 0} nodes
                                </span>
                                <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {sw.category}
                                </span>
                            </div>
                        </div>
                    {/each}
                {/if}
            {/if}
        </div>
    </div>
{/if}
