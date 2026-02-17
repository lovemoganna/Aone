<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { snippetStore, type Snippet } from "$lib/stores/snippets.svelte";
    import {
        Search,
        Plus,
        Code2,
        Trash2,
        Copy,
        Tag,
        Clock,
        ChevronRight,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    let searchQuery = $state("");
    let selectedId = $state<string | null>(null);
    let editingSnippet = $state<Snippet | null>(null);

    let filteredSnippets = $derived(
        snippetStore.snippets.filter(
            (s) =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.tags.some((t) =>
                    t.toLowerCase().includes(searchQuery.toLowerCase()),
                ) ||
                s.language.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    let activeSnippet = $derived(
        selectedId ? snippetStore.getSnippetById(selectedId) : null,
    );

    function createNew() {
        const newSnippet = snippetStore.addSnippet({
            title: "New Snippet",
            code: "",
            language: "javascript",
            description: "",
            tags: ["Draft"],
        });
        selectedId = newSnippet.id;
        startEditing();
    }

    function startEditing() {
        if (activeSnippet) {
            editingSnippet = { ...activeSnippet };
        }
    }

    function saveEdit() {
        if (editingSnippet) {
            snippetStore.updateSnippet(editingSnippet.id, editingSnippet);
            editingSnippet = null;
        }
    }

    function cancelEdit() {
        editingSnippet = null;
    }

    function handleCopy(code: string) {
        navigator.clipboard.writeText(code);
    }

    const LANGUAGES = [
        "javascript",
        "typescript",
        "html",
        "css",
        "python",
        "java",
        "cpp",
        "go",
        "rust",
        "sql",
        "yaml",
        "json",
        "bash",
    ];

    onMount(() => {
        if (snippetStore.snippets.length > 0 && !selectedId) {
            selectedId = snippetStore.snippets[0].id;
        }
    });
</script>

<svelte:head>
    <title>Snippet Manager - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex gap-4 overflow-hidden">
    <!-- Sidebar List -->
    <div class="w-80 flex flex-col h-full space-y-4">
        <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <h2 class="font-semibold text-slate-900 dark:text-white">
                        Snippets
                    </h2>
                    <Button variant="ghost" size="sm" onclick={createNew}>
                        <Plus size={16} />
                    </Button>
                </div>
            {/snippet}

            <div class="p-3 border-b border-slate-100 dark:border-slate-800">
                <div class="relative">
                    <Search
                        class="absolute left-3 top-2.5 text-slate-400"
                        size={14}
                    />
                    <input
                        type="search"
                        bind:value={searchQuery}
                        placeholder="Search snippets..."
                        class="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                </div>
            </div>

            <div class="flex-1 overflow-y-auto min-h-0">
                {#if filteredSnippets.length > 0}
                    {#each filteredSnippets as snippet (snippet.id)}
                        <button
                            class="w-full p-4 text-left border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 {selectedId ===
                            snippet.id
                                ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-l-primary-500'
                                : 'border-l-4 border-l-transparent'}"
                            onclick={() => {
                                selectedId = snippet.id;
                                cancelEdit();
                            }}
                        >
                            <div class="flex justify-between items-start mb-1">
                                <h3
                                    class="text-sm font-semibold truncate flex-1 pr-2"
                                >
                                    {snippet.title}
                                </h3>
                                <span
                                    class="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-mono uppercase truncate max-w-[80px]"
                                >
                                    {snippet.language}
                                </span>
                            </div>
                            <p class="text-xs text-slate-500 line-clamp-1">
                                {snippet.description || "No description"}
                            </p>
                            <div class="mt-2 flex gap-1 flex-wrap">
                                {#each snippet.tags as tag}
                                    <span
                                        class="text-[9px] text-primary-600 dark:text-primary-400 bg-primary-100/50 dark:bg-primary-900/20 px-1.5 rounded-full"
                                        >#{tag}</span
                                    >
                                {/each}
                            </div>
                        </button>
                    {/each}
                {:else}
                    <div
                        class="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400"
                    >
                        <Code2 size={40} class="mb-2 opacity-20" />
                        <p class="text-sm italic">No snippets found</p>
                    </div>
                {/if}
            </div>
        </Panel>
    </div>

    <!-- Details/Editor View -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
        {#if editingSnippet}
            <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden">
                {#snippet header()}
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <div
                                class="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center"
                            >
                                <Plus size={16} />
                            </div>
                            <h2
                                class="font-semibold text-slate-900 dark:text-white"
                            >
                                Editing Snippet
                            </h2>
                        </div>
                        <div class="flex gap-2">
                            <Button variant="ghost" onclick={cancelEdit}
                                >Cancel</Button
                            >
                            <Button onclick={saveEdit}>Save Snippet</Button>
                        </div>
                    </div>
                {/snippet}

                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <div
                                class="text-xs font-bold text-slate-400 uppercase"
                            >
                                Title
                            </div>
                            <input
                                type="text"
                                bind:value={editingSnippet.title}
                                class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-primary-500 outline-none font-medium"
                            />
                        </div>
                        <div class="space-y-2">
                            <div
                                class="text-xs font-bold text-slate-400 uppercase"
                            >
                                Language
                            </div>
                            <select
                                bind:value={editingSnippet.language}
                                class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-primary-500 outline-none"
                            >
                                {#each LANGUAGES as lang}
                                    <option value={lang}>{lang}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-xs font-bold text-slate-400 uppercase">
                            Description
                        </div>
                        <textarea
                            bind:value={editingSnippet.description}
                            class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-primary-500 outline-none resize-none h-20 text-sm"
                        ></textarea>
                    </div>

                    <div class="space-y-2 flex-1 flex flex-col min-h-0">
                        <div class="text-xs font-bold text-slate-400 uppercase">
                            Code Content
                        </div>
                        <textarea
                            bind:value={editingSnippet.code}
                            class="flex-1 w-full p-4 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-sm focus:ring-1 focus:ring-primary-500 outline-none min-h-[300px]"
                            spellcheck="false"
                        ></textarea>
                    </div>
                </div>
            </Panel>
        {:else if activeSnippet}
            <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden">
                {#snippet header()}
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-4">
                            <h2
                                class="font-semibold text-slate-900 dark:text-white"
                            >
                                {activeSnippet.title}
                            </h2>
                            <div class="flex gap-2">
                                {#each activeSnippet.tags as tag}
                                    <span
                                        class="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800"
                                        >#{tag}</span
                                    >
                                {/each}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={() => handleCopy(activeSnippet!.code)}
                            >
                                <Copy size={16} class="mr-2" /> Copy Code
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={startEditing}>Edit</Button
                            >
                            <Button
                                variant="ghost"
                                size="sm"
                                class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onclick={() => {
                                    if (confirm("Delete snippet?")) {
                                        snippetStore.deleteSnippet(
                                            activeSnippet!.id,
                                        );
                                        selectedId = null;
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                {/snippet}

                <div
                    class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-black/10"
                >
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            class="bg-white dark:bg-slate-800 p-3 rounded-xl border shadow-sm flex items-center gap-3"
                        >
                            <div
                                class="p-2 bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"
                            >
                                <Code2 size={18} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase"
                                >
                                    Language
                                </p>
                                <p
                                    class="text-sm font-semibold capitalize font-mono text-primary-600"
                                >
                                    {activeSnippet.language}
                                </p>
                            </div>
                        </div>
                        <div
                            class="bg-white dark:bg-slate-800 p-3 rounded-xl border shadow-sm flex items-center gap-3"
                        >
                            <div
                                class="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"
                            >
                                <Clock size={18} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase"
                                >
                                    Last Updated
                                </p>
                                <p class="text-sm font-semibold">
                                    {new Date(
                                        activeSnippet.updatedAt,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div
                            class="bg-white dark:bg-slate-800 p-3 rounded-xl border shadow-sm flex items-center gap-3"
                        >
                            <div
                                class="p-2 bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"
                            >
                                <Tag size={18} />
                            </div>
                            <div>
                                <p
                                    class="text-[10px] font-bold text-slate-400 uppercase"
                                >
                                    Tags
                                </p>
                                <p class="text-sm font-semibold">
                                    {activeSnippet.tags.length} Categorized
                                </p>
                            </div>
                        </div>
                    </div>

                    {#if activeSnippet.description}
                        <div class="space-y-2">
                            <p
                                class="text-xs font-bold text-slate-400 uppercase px-1"
                            >
                                Description
                            </p>
                            <p
                                class="text-sm text-slate-600 dark:text-slate-400 px-1 leading-relaxed"
                            >
                                {activeSnippet.description}
                            </p>
                        </div>
                    {/if}

                    <div class="space-y-2 flex-1 flex flex-col min-h-0">
                        <p
                            class="text-xs font-bold text-slate-400 uppercase px-1"
                        >
                            Code Content
                        </p>
                        <div
                            class="flex-1 bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 overflow-auto font-mono text-sm leading-relaxed shadow-xl group relative"
                        >
                            <button
                                class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy code"
                                onclick={() => handleCopy(activeSnippet!.code)}
                            >
                                <Copy size={16} />
                            </button>
                            <pre><code
                                    >{activeSnippet.code ||
                                        "// Empty snippet"}</code
                                ></pre>
                        </div>
                    </div>
                </div>
            </Panel>
        {:else}
            <div
                class="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl m-4 space-y-6"
            >
                <div
                    class="w-32 h-32 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center"
                >
                    <Code2 size={64} class="opacity-10" />
                </div>
                <div>
                    <h2
                        class="text-xl font-bold text-slate-600 dark:text-slate-300"
                    >
                        Snippet Library
                    </h2>
                    <p class="mt-2 max-w-xs text-sm">
                        Organize your frequently used code fragments,
                        configurations, and templates in one place.
                    </p>
                </div>
                <Button onclick={createNew}>
                    <Plus size={18} class="mr-2" /> Create First Snippet
                </Button>
            </div>
        {/if}
    </div>
</div>
