<script lang="ts">
    import { TEMPLATES } from "../lib/templates";
    import { diagramStore } from "../lib/store.svelte";
    import {
        LayoutTemplate,
        Book,
        Sparkles,
        ChevronLeft,
        ChevronRight,
        Search,
        Plus,
        Trash2,
        X,
        GripVertical,
        History,
        RotateCcw,
        Settings2,
        Palette,
        Activity,
        CheckCircle,
        AlertTriangle,
        Info,
        Wrench,
        Layers,
        Layout,
        FolderTree,
        Folder,
        Box as BoxIcon
    } from "lucide-svelte";
    import { parseHierarchicalTree, type TreeNode } from "../lib/parser";
    import LayoutManager from "./LayoutManager.svelte";
    import { RefactorService } from "../lib/refactorService";
    import { lintingService } from "../lib/lintingService.svelte";
    import { fade, slide } from "svelte/transition";

    let {
        isCollapsed = $bindable(true),
        onToggle,
        onDiff
    } = $props<{
        isCollapsed?: boolean;
        onToggle?: (collapsed: boolean) => void;
        onDiff?: (code: string) => void;
    }>();

    function setCollapsed(val: boolean) {
        isCollapsed = val;
        onToggle?.(val);
    }

    let activeTab = $state<
        "outline" | "templates" | "snippets" | "diagnostics" | "refactor"
    >("outline");

    let outlineTree = $derived(
        parseHierarchicalTree(diagramStore.code, diagramStore.mode)
    );
    let searchQuery = $state("");
    let newSnippetName = $state("");
    let selectedCategory = $state("All");

    function handleDragStart(e: DragEvent, code: string) {
        if (e.dataTransfer) {
            e.dataTransfer.setData("text/plain", code);
            e.dataTransfer.effectAllowed = "copy";
        }
    }

    const categories = [
        "All",
        ...Array.from(new Set(TEMPLATES.map((t) => t.category || "Other"))),
    ];

    let filteredTemplates = $derived(
        TEMPLATES.filter((t) => {
            const matchesCategory =
                selectedCategory === "All" || t.category === selectedCategory;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                t.name.toLowerCase().includes(searchLower) ||
                t.code.toLowerCase().includes(searchLower) ||
                (t.category && t.category.toLowerCase().includes(searchLower));
            return matchesCategory && matchesSearch;
        }),
    );

    function loadTemplate(template: any) {
        diagramStore.code = template.code;
        diagramStore.mode = template.mode;
        diagramStore.render();
    }

    function applyRefactor(type: "wrap" | "c4") {
        if (type === "wrap") {
            const name = prompt("Enter container name:", "NewContainer");
            if (name) {
                diagramStore.code = RefactorService.wrapInContainer(
                    diagramStore.code,
                    diagramStore.mode,
                    name,
                );
                diagramStore.render();
            }
        } else if (type === "c4") {
            diagramStore.code = RefactorService.convertToC4(diagramStore.code);
            diagramStore.render();
        }
    }

    let lintData = $derived(
        lintingService.lint(diagramStore.code, diagramStore.mode)
    );
</script>

<aside
    class="h-full flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f17] flex select-none overflow-hidden transition-[width] duration-200 z-10"
    style="width: {isCollapsed ? 48 : 288}px;"
>
    <!-- Tab Icons (Docked Activity Bar) -->
    <div
        class="w-11 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-2.5 gap-1.5 shrink-0 bg-slate-50/60 dark:bg-slate-900/60 z-10"
    >
        <button
            type="button"
            class="p-2 rounded-md transition-colors {activeTab === 'outline' && !isCollapsed
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'}"
            onclick={() => {
                if (activeTab === 'outline' && !isCollapsed) {
                    setCollapsed(true);
                } else {
                    activeTab = 'outline';
                    setCollapsed(false);
                }
            }}
            title="Component Outline Tree"
            aria-label="Component Outline Tree"
        >
            <FolderTree size={15} />
        </button>

        <button
            type="button"
            class="p-2 rounded-md transition-colors {activeTab === 'templates' && !isCollapsed
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'}"
            onclick={() => {
                if (activeTab === 'templates' && !isCollapsed) {
                    setCollapsed(true);
                } else {
                    activeTab = 'templates';
                    setCollapsed(false);
                }
            }}
            title="Architecture Templates"
            aria-label="Architecture Templates"
        >
            <LayoutTemplate size={15} />
        </button>

        <button
            type="button"
            class="p-2 rounded-md transition-colors {activeTab === 'snippets' && !isCollapsed
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'}"
            onclick={() => {
                if (activeTab === 'snippets' && !isCollapsed) {
                    setCollapsed(true);
                } else {
                    activeTab = 'snippets';
                    setCollapsed(false);
                }
            }}
            title="Code Snippets"
            aria-label="Code Snippets"
        >
            <Book size={15} />
        </button>

        <button
            type="button"
            class="p-2 rounded-md transition-colors {activeTab === 'diagnostics' && !isCollapsed
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'}"
            onclick={() => {
                if (activeTab === 'diagnostics' && !isCollapsed) {
                    setCollapsed(true);
                } else {
                    activeTab = 'diagnostics';
                    setCollapsed(false);
                }
            }}
            title="Syntax & Lint Diagnostics"
            aria-label="Syntax & Lint Diagnostics"
        >
            <Activity size={15} />
        </button>

        <button
            type="button"
            class="p-2 rounded-md transition-colors {activeTab === 'refactor' && !isCollapsed
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'}"
            onclick={() => {
                if (activeTab === 'refactor' && !isCollapsed) {
                    setCollapsed(true);
                } else {
                    activeTab = 'refactor';
                    setCollapsed(false);
                }
            }}
            title="Refactoring Tools"
            aria-label="Refactoring Tools"
        >
            <Wrench size={15} />
        </button>

        <div class="mt-auto pt-2 border-t border-slate-200 dark:border-slate-800 w-full flex justify-center">
            <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                onclick={() => setCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
                aria-label={isCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
            >
                {#if isCollapsed}
                    <ChevronRight size={14} />
                {:else}
                    <ChevronLeft size={14} />
                {/if}
            </button>
        </div>
    </div>

    <!-- Content (Expanded Mode) -->
    {#if !isCollapsed}
        <div
            class="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0b0f17]"
        >
            <div
                class="h-9 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/30"
            >
                <span
                    class="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400"
                >
                    {activeTab}
                </span>
                <button
                    type="button"
                    class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
                    onclick={() => setCollapsed(true)}
                    title="Hide Sidebar"
                    aria-label="Hide Sidebar"
                >
                    <ChevronLeft size={14} />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto">
                {#if activeTab === "templates"}
                    <div class="p-2.5 space-y-2.5">
                        <div class="relative">
                            <Search
                                size={13}
                                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                placeholder="Filter templates..."
                                bind:value={searchQuery}
                                class="w-full pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs focus:ring-1 focus:ring-slate-400 outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div
                            class="flex gap-1 overflow-x-auto no-scrollbar pb-0.5"
                        >
                            {#each categories as cat}
                                <button
                                    class="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap border transition-colors
                                    {selectedCategory === cat
                                        ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 font-semibold'
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                                    onclick={() => (selectedCategory = cat)}
                                >
                                    {cat}
                                </button>
                            {/each}
                        </div>

                        <div class="space-y-1">
                            {#each filteredTemplates as t}
                                <div
                                    class="w-full text-left p-2 rounded border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative cursor-pointer"
                                    role="button"
                                    tabindex="0"
                                    draggable="true"
                                    ondragstart={(e) =>
                                        handleDragStart(e, t.code)}
                                    onclick={() => loadTemplate(t)}
                                    onkeydown={(e) =>
                                        e.key === "Enter" && loadTemplate(t)}
                                >
                                    <div
                                        class="flex items-center justify-between mb-0.5"
                                    >
                                        <span
                                            class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                                            >{t.name}</span
                                        >
                                        <span
                                            class="text-[9px] uppercase px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                                            >{t.mode}</span
                                        >
                                    </div>
                                    <p
                                        class="text-[10px] text-slate-400 line-clamp-1 font-mono opacity-80"
                                    >
                                        {t.code}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else if activeTab === "snippets"}
                    <div class="p-2.5 h-full flex flex-col">
                        <div class="flex items-center justify-between mb-2 px-0.5">
                            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Saved Snippets
                            </span>
                            <span class="text-[10px] font-mono text-slate-400">
                                {diagramStore.snippets.length}
                            </span>
                        </div>

                        {#if diagramStore.snippets.length === 0}
                            <div
                                class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10"
                            >
                                <Book size={24} class="mb-1.5 opacity-20" />
                                <p class="text-xs">No snippets saved.</p>
                                <p class="text-[10px] text-slate-400 mt-0.5 opacity-70">
                                    Save current code below for quick reuse.
                                </p>
                            </div>
                        {:else}
                            <div class="flex-1 overflow-y-auto space-y-1">
                                {#each diagramStore.snippets as snippet}
                                    <div
                                        class="group relative rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                                    >
                                        <div
                                            class="w-full text-left p-2 pr-7 cursor-pointer"
                                            role="button"
                                            tabindex="0"
                                            draggable="true"
                                            ondragstart={(e) =>
                                                handleDragStart(
                                                    e,
                                                    snippet.code,
                                                )}
                                            onclick={() => {
                                                diagramStore.code =
                                                    snippet.code;
                                                diagramStore.mode =
                                                    snippet.mode;
                                            }}
                                            onkeydown={(e) => {
                                                if (e.key === "Enter") {
                                                    diagramStore.code =
                                                        snippet.code;
                                                    diagramStore.mode =
                                                        snippet.mode;
                                                }
                                            }}
                                        >
                                            <div
                                                class="flex items-center justify-between mb-0.5"
                                            >
                                                <span
                                                    class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                                                    >{snippet.name}</span
                                                >
                                                <span
                                                    class="text-[9px] uppercase px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono"
                                                    >{snippet.mode}</span
                                                >
                                            </div>
                                        </div>
                                        <button
                                            class="absolute right-1 top-1.5 p-1 text-slate-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                diagramStore.deleteSnippet(
                                                    snippet.id,
                                                );
                                            }}
                                            title="Delete Snippet"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <div
                            class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800"
                        >
                            <div class="flex gap-1.5">
                                <input
                                    type="text"
                                    bind:value={newSnippetName}
                                    placeholder="New snippet name..."
                                    class="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs focus:ring-1 focus:ring-slate-400 outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
                                />
                                <button
                                    class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    disabled={!newSnippetName.trim()}
                                    onclick={() => {
                                        diagramStore.saveSnippet(
                                            newSnippetName,
                                        );
                                        newSnippetName = "";
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "outline"}
                    <div class="p-2.5 space-y-2.5">
                        <div class="flex items-center justify-between px-0.5">
                            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Architecture Tree
                            </span>
                            <span class="text-[10px] font-mono text-slate-400">
                                {outlineTree.length} Top-level
                            </span>
                        </div>

                        {#if outlineTree.length === 0}
                            <div class="p-8 text-center text-slate-400 text-xs">
                                <FolderTree size={24} class="mx-auto mb-1.5 opacity-30" />
                                No components detected.
                            </div>
                        {:else}
                            <div class="space-y-1 bg-slate-50/50 dark:bg-slate-900/30 rounded p-1.5 border border-slate-200/60 dark:border-slate-800">
                                {#each outlineTree as node}
                                    <button
                                        class="w-full text-left p-1.5 rounded text-xs flex items-center gap-2 hover:bg-white dark:hover:bg-slate-800 transition-colors {diagramStore.selectedElementId === node.id ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-700 dark:text-slate-300'}"
                                        onclick={() => {
                                            diagramStore.selectedElementId = node.id;
                                            diagramStore.isInspectorOpen = true;
                                        }}
                                    >
                                        {#if node.type === 'container' || node.type === 'cluster'}
                                            <Folder size={13} class="text-amber-500 shrink-0" />
                                        {:else}
                                            <BoxIcon size={13} class="text-slate-400 shrink-0" />
                                        {/if}
                                        <span class="truncate">{node.name}</span>
                                    </button>
                                    {#if node.children && node.children.length > 0}
                                        <div class="pl-3 border-l border-slate-200 dark:border-slate-700 space-y-1 ml-2.5 my-1">
                                            {#each node.children as child}
                                                <button
                                                    class="w-full text-left p-1 rounded text-xs flex items-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 transition-colors {diagramStore.selectedElementId === child.id ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400'}"
                                                    onclick={() => {
                                                        diagramStore.selectedElementId = child.id;
                                                        diagramStore.isInspectorOpen = true;
                                                    }}
                                                >
                                                    <BoxIcon size={11} class="text-slate-400 shrink-0" />
                                                    <span class="truncate">{child.name}</span>
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if activeTab === "diagnostics"}
                    <div class="p-2.5 space-y-3 h-full flex flex-col">
                        <div class="flex items-center justify-between px-0.5">
                            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Health & Quality
                            </span>
                            {#if lintData.metrics}
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {lintData.metrics.score > 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : lintData.metrics.score > 50 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'}">
                                    Score: {lintData.metrics.score}/100
                                </span>
                            {/if}
                        </div>

                        {#if lintData.metrics}
                            <!-- Radar & Core Metrics Grid -->
                            <div class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                                <div class="grid grid-cols-3 gap-1.5 text-center">
                                    <div class="p-1.5 rounded bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                        <div class="text-[9px] text-slate-400 font-medium">Nodes</div>
                                        <div class="text-xs font-bold text-slate-700 dark:text-slate-200">{lintData.metrics.nodeCount}</div>
                                    </div>
                                    <div class="p-1.5 rounded bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                        <div class="text-[9px] text-slate-400 font-medium">Edges</div>
                                        <div class="text-xs font-bold text-slate-700 dark:text-slate-200">{lintData.metrics.edgeCount}</div>
                                    </div>
                                    <div class="p-1.5 rounded bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                        <div class="text-[9px] text-slate-400 font-medium">Complexity</div>
                                        <div class="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">{lintData.metrics.complexity}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Issues List -->
                            <div class="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                                {#if lintData.metrics.issues.length === 0}
                                    <div class="p-6 text-center text-slate-400 text-xs">
                                        <CheckCircle size={20} class="mx-auto mb-1.5 text-emerald-500 opacity-80" />
                                        Clean syntax & valid architecture
                                    </div>
                                {:else}
                                    {#each lintData.metrics.issues as issue}
                                        <div class="p-2 rounded border transition-colors {issue.severity === 'error' ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20' : issue.severity === 'warning' ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20' : 'border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/30'}">
                                            <div class="flex items-start gap-1.5">
                                                {#if issue.severity === 'error'}
                                                    <AlertTriangle size={13} class="text-rose-500 shrink-0 mt-0.5" />
                                                {:else if issue.severity === 'warning'}
                                                    <AlertTriangle size={13} class="text-amber-500 shrink-0 mt-0.5" />
                                                {:else}
                                                    <Info size={13} class="text-sky-500 shrink-0 mt-0.5" />
                                                {/if}
                                                <div class="flex-1 min-w-0">
                                                    <div class="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                                        <span>{issue.message}</span>
                                                        {#if issue.line}
                                                            <span class="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">L{issue.line}</span>
                                                        {/if}
                                                    </div>
                                                    {#if issue.suggestion}
                                                        <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{issue.suggestion}</p>
                                                    {/if}
                                                    {#if issue.autoFix}
                                                        <button
                                                            class="mt-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                                                            onclick={() => {
                                                                if (issue.autoFix) {
                                                                    diagramStore.code = issue.autoFix(diagramStore.code);
                                                                    diagramStore.render();
                                                                }
                                                            }}
                                                        >
                                                            <Sparkles size={10} />
                                                            Auto-fix
                                                        </button>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        {:else}
                            <div class="p-6 text-center text-slate-400 text-xs">
                                <Activity size={20} class="mx-auto mb-1.5 opacity-30" />
                                Analyzing syntax...
                            </div>
                        {/if}
                    </div>
                {:else if activeTab === "refactor"}
                    <div class="p-2.5 space-y-3">
                        <div class="space-y-2">
                            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Structural Refactors
                            </span>

                            <button
                                class="w-full p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-left group"
                                onclick={() => applyRefactor("wrap")}
                            >
                                <div class="flex items-center gap-2 mb-1">
                                    <Layers size={14} class="text-slate-700 dark:text-slate-300" />
                                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        Wrap in Container
                                    </div>
                                </div>
                                <p class="text-[10px] text-slate-400">
                                    Group all nodes into a Package/Subgraph
                                </p>
                            </button>

                            <button
                                class="w-full p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-left group"
                                onclick={() => applyRefactor("c4")}
                            >
                                <div class="flex items-center gap-2 mb-1">
                                    <Layout size={14} class="text-slate-700 dark:text-slate-300" />
                                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        Convert to C4 Architecture
                                    </div>
                                </div>
                                <p class="text-[10px] text-slate-400">
                                    Transform diagram syntax to C4 Context model
                                </p>
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</aside>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
