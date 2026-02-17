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
    } from "lucide-svelte";
    import LayoutManager from "./LayoutManager.svelte";
    import { RefactorService } from "../lib/refactorService";
    import { lintingService } from "../lib/lintingService.svelte";
    import { fade, slide } from "svelte/transition";

    let { isCollapsed = $bindable(false), onDiff } = $props<{
        isCollapsed?: boolean;
        onDiff?: (code: string) => void;
    }>();

    let activeTab = $state<
        | "templates"
        | "snippets"
        | "ai"
        | "history"
        | "layout"
        | "style"
        | "quality"
        | "refactor"
    >("templates");
    let searchQuery = $state("");
    let newSnippetName = $state(""); // State for new snippet input
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

    // AI Logic (Placeholder for now)
    let aiPrompt = $state("");
    let isGenerating = $state(false);

    async function handleAiGenerate() {
        if (!aiPrompt.trim()) return;
        isGenerating = true;
        await diagramStore.generateFromPrompt(aiPrompt);
        isGenerating = false;
        aiPrompt = ""; // Clear after generation
    }

    let activeDoc = $derived(
        diagramStore.documents.find(
            (d) => d.id === diagramStore.activeDocumentId,
        ),
    );

    function restoreHistory(code: string) {
        diagramStore.code = code;
        diagramStore.render();
    }

    function applyTheme(theme: string) {
        if (diagramStore.mode !== "plantuml") return;
        const code = diagramStore.code;
        const themeMap: Record<string, string> = {
            Sketchy: "sketchy-outline",
            Technical: "bluegray",
            Modern: "mimeograph",
            Minimalist: "plain",
        };
        const themeName = themeMap[theme];
        const themeLine = `!theme ${themeName}\n`;

        let newCode = code;
        if (code.includes("!theme")) {
            newCode = code.replace(/!theme .*\n?/, themeLine);
        } else {
            newCode = code.replace("@startuml\n", `@startuml\n${themeLine}`);
        }
        diagramStore.code = newCode;
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
</script>

<aside
    class="h-[calc(100%-32px)] m-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl flex transition-all duration-300 relative group spatial-tilt border border-white/20 dark:border-gray-700/30 overflow-hidden"
    style="width: {isCollapsed ? '48px' : '300px'}"
>
    <!-- Tab Icons (Collapsed Mode) -->
    <div
        class="w-14 border-r border-gray-100/50 dark:border-gray-700/30 flex flex-col items-center py-4 gap-4 shrink-0 bg-gray-50/30 dark:bg-gray-900/20 z-10"
    >
        <button
            class="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 {activeTab ===
            'templates'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}"
            onclick={() => {
                activeTab = "templates";
                isCollapsed = false;
            }}
            title="Templates"
        >
            <LayoutTemplate size={20} />
        </button>
        <button
            class="p-2 rounded-lg transition-colors {activeTab === 'snippets'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'}"
            onclick={() => {
                activeTab = "snippets";
                isCollapsed = false;
            }}
            title="Snippets"
        >
            <Book size={20} />
        </button>
        <button
            class="p-2 rounded-lg transition-colors {activeTab === 'ai'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'}"
            onclick={() => {
                activeTab = "ai";
                isCollapsed = false;
            }}
            title="AI Assistant"
        >
            <Sparkles size={20} />
        </button>
        <button
            class="p-2 rounded-lg transition-colors {activeTab === 'history'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'}"
            onclick={() => {
                activeTab = "history";
                isCollapsed = false;
            }}
            title="Local History"
        >
            <History size={20} />
        </button>

        {#if diagramStore.mode === "graphviz"}
            <button
                class="p-2 rounded-lg transition-colors {activeTab === 'layout'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                    : 'text-gray-400 hover:text-gray-600'}"
                onclick={() => {
                    activeTab = "layout";
                    isCollapsed = false;
                }}
                title="Layout Parameters"
            >
                <Settings2 size={20} />
            </button>
        {/if}

        <button
            class="p-2 rounded-lg transition-colors {activeTab === 'style'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'}"
            onclick={() => {
                activeTab = "style";
                isCollapsed = false;
            }}
            title="Skins & Themes"
        >
            <Palette size={20} />
        </button>

        <button
            class="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 {activeTab ===
            'quality'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}"
            onclick={() => {
                activeTab = "quality";
                isCollapsed = false;
            }}
            title="Quality & Validation"
        >
            <Activity size={20} />
        </button>

        <button
            class="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 {activeTab ===
            'refactor'
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}"
            onclick={() => {
                activeTab = "refactor";
                isCollapsed = false;
            }}
            title="Expert Refactoring"
        >
            <Wrench size={20} />
        </button>

        <div class="mt-auto">
            <button
                class="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                onclick={() => (isCollapsed = !isCollapsed)}
            >
                {#if isCollapsed}
                    <ChevronRight size={20} />
                {:else}
                    <ChevronLeft size={20} />
                {/if}
            </button>
        </div>
    </div>

    <!-- Content (Expanded Mode) -->
    {#if !isCollapsed}
        <div
            class="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-gray-800/50"
            transition:fade={{ duration: 150 }}
        >
            <div
                class="p-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between"
            >
                <h3
                    class="font-bold text-sm uppercase tracking-wider text-gray-400"
                >
                    {activeTab}
                </h3>
            </div>

            <div class="flex-1 overflow-y-auto">
                {#if activeTab === "templates"}
                    <div class="p-3 space-y-3">
                        <div class="relative">
                            <Search
                                size={14}
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                bind:value={searchQuery}
                                class="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div
                            class="flex gap-1.5 overflow-x-auto no-scrollbar pb-1"
                        >
                            {#each categories as cat}
                                <button
                                    class="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap border transition-all
                                    {selectedCategory === cat
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}"
                                    onclick={() => (selectedCategory = cat)}
                                >
                                    {cat}
                                </button>
                            {/each}
                        </div>

                        <div class="space-y-2">
                            {#each filteredTemplates as t}
                                <div
                                    class="w-full text-left p-2 rounded-lg border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group relative cursor-grab active:cursor-grabbing"
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
                                        class="flex items-center justify-between mb-1"
                                    >
                                        <div
                                            class="flex items-center gap-1.5 overflow-hidden"
                                        >
                                            <GripVertical
                                                size={12}
                                                class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                            <span
                                                class="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 truncate"
                                                >{t.name}</span
                                            >
                                        </div>
                                        <span
                                            class="text-[9px] uppercase px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-400"
                                            >{t.mode}</span
                                        >
                                    </div>
                                    <p
                                        class="text-[10px] text-gray-400 line-clamp-1 font-mono pl-4"
                                    >
                                        {t.code}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else if activeTab === "snippets"}
                    <div class="p-4 h-full flex flex-col">
                        {#if diagramStore.snippets.length === 0}
                            <div
                                class="flex-1 flex flex-col items-center justify-center text-center text-gray-400"
                            >
                                <Book size={32} class="mb-2 opacity-20" />
                                <p class="text-xs">No snippets saved yet.</p>
                                <p class="text-[10px] mt-1 opacity-70">
                                    Save current code as a snippet.
                                </p>
                            </div>
                        {:else}
                            <div class="flex-1 overflow-y-auto space-y-2">
                                {#each diagramStore.snippets as snippet}
                                    <div
                                        class="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                                    >
                                        <div
                                            class="w-full text-left p-2 pr-8 cursor-grab active:cursor-grabbing"
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
                                                class="flex items-center justify-between mb-1"
                                            >
                                                <div
                                                    class="flex items-center gap-1.5 overflow-hidden"
                                                >
                                                    <GripVertical
                                                        size={12}
                                                        class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    />
                                                    <span
                                                        class="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate"
                                                        >{snippet.name}</span
                                                    >
                                                </div>
                                                <span
                                                    class="text-[9px] uppercase px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-400"
                                                    >{snippet.mode}</span
                                                >
                                            </div>
                                            <p
                                                class="text-[10px] text-gray-400 line-clamp-2 font-mono"
                                            ></p>
                                        </div>
                                        <button
                                            class="absolute right-1 top-1 p-1.5 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                diagramStore.deleteSnippet(
                                                    snippet.id,
                                                );
                                            }}
                                            title="Delete Snippet"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <div
                            class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50"
                        >
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    bind:value={newSnippetName}
                                    placeholder="Snippet Name..."
                                    class="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!newSnippetName.trim()}
                                    onclick={() => {
                                        diagramStore.saveSnippet(
                                            newSnippetName,
                                        );
                                        newSnippetName = "";
                                    }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "ai"}
                    <div class="p-4 space-y-4">
                        <div
                            class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30"
                        >
                            <p
                                class="text-[11px] text-indigo-700 dark:text-indigo-300"
                            >
                                Describe the diagram you want to create in
                                natural language.
                            </p>
                        </div>
                        <textarea
                            bind:value={aiPrompt}
                            placeholder="e.g., A sequence diagram of user login with MFA..."
                            class="w-full h-32 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        ></textarea>
                        <button
                            class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            onclick={handleAiGenerate}
                            disabled={isGenerating || !aiPrompt.trim()}
                        >
                            {#if isGenerating}
                                <div
                                    class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                ></div>
                                Generating...
                            {:else}
                                <Sparkles size={14} /> Generate Diagram
                            {/if}
                        </button>
                    </div>
                {:else if activeTab === "history"}
                    <div class="p-4 h-full flex flex-col">
                        {#if !activeDoc || activeDoc.history.length === 0}
                            <div
                                class="flex-1 flex flex-col items-center justify-center text-center text-gray-400"
                            >
                                <History size={32} class="mb-2 opacity-20" />
                                <p class="text-xs">No history snapshots.</p>
                                <p class="text-[10px] mt-1 opacity-70">
                                    Snapshots are taken after each render.
                                </p>
                            </div>
                        {:else}
                            <div class="flex-1 overflow-y-auto space-y-2">
                                {#each [...activeDoc.history].reverse() as item}
                                    <div
                                        class="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
                                    >
                                        <div
                                            class="flex items-center justify-between mb-2"
                                        >
                                            <span
                                                class="text-[10px] font-mono text-gray-500"
                                            >
                                                {new Date(
                                                    item.timestamp,
                                                ).toLocaleTimeString()}
                                            </span>
                                            <button
                                                class="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold py-1 px-2 rounded bg-indigo-50 dark:bg-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onclick={() =>
                                                    restoreHistory(item.code)}
                                            >
                                                Restore
                                            </button>
                                            <button
                                                class="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold py-1 px-2 rounded bg-indigo-50 dark:bg-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                onclick={() =>
                                                    onDiff?.(item.code)}
                                            >
                                                Compare
                                            </button>
                                        </div>
                                        <p
                                            class="text-[10px] text-gray-400 line-clamp-2 font-mono bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded"
                                        >
                                            {item.code}
                                        </p>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if activeTab === "layout"}
                    <LayoutManager />
                {:else if activeTab === "style"}
                    <div class="p-4 space-y-4">
                        <h4
                            class="text-[10px] uppercase font-bold text-slate-400 block tracking-widest"
                        >
                            Global Themes
                        </h4>
                        <div class="grid grid-cols-2 gap-2">
                            {#each ["Sketchy", "Technical", "Modern", "Minimalist"] as theme}
                                <button
                                    class="p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:shadow-md transition-all active:scale-95 group/theme"
                                    onclick={() => applyTheme(theme)}
                                >
                                    <div
                                        class="w-full h-8 bg-slate-100 dark:bg-slate-900 rounded mb-2 overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center"
                                    >
                                        <Palette
                                            size={16}
                                            class="text-slate-300 group-hover/theme:text-indigo-400 transition-colors"
                                        />
                                    </div>
                                    {theme}
                                </button>
                            {/each}
                        </div>
                        <div
                            class="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-900/30"
                        >
                            <p
                                class="text-[10px] text-indigo-600 dark:text-indigo-400"
                            >
                                Themes for PlantUML apply <code>!theme</code> settings
                                automatically. Graphviz uses local layout params
                                instead.
                            </p>
                        </div>
                    </div>
                {:else if activeTab === "quality"}
                    <div class="p-4 space-y-6">
                        {#if lintingService.metrics}
                            <!-- Score Card -->
                            <div class="relative pt-2 flex justify-center">
                                <div
                                    class="relative w-32 h-32 flex items-center justify-center"
                                >
                                    <svg
                                        class="w-full h-full transform -rotate-90"
                                    >
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="8"
                                            class="text-gray-100 dark:text-gray-800"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="8"
                                            stroke-dasharray="351.86"
                                            stroke-dashoffset={351.86 -
                                                (351.86 *
                                                    lintingService.metrics
                                                        .score) /
                                                    100}
                                            class="transition-all duration-1000 ease-out {lintingService
                                                .metrics.score > 80
                                                ? 'text-green-500'
                                                : lintingService.metrics.score >
                                                    50
                                                  ? 'text-yellow-500'
                                                  : 'text-red-500'}"
                                        />
                                    </svg>
                                    <div
                                        class="absolute inset-0 flex flex-col items-center justify-center"
                                    >
                                        <span
                                            class="text-3xl font-bold text-gray-900 dark:text-white"
                                        >
                                            {Math.round(
                                                lintingService.metrics.score,
                                            )}
                                        </span>
                                        <span
                                            class="text-[10px] uppercase tracking-wider text-gray-400"
                                            >Quality</span
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Metrics Grid -->
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div
                                    class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div class="text-xs text-gray-500">
                                        Nodes
                                    </div>
                                    <div class="font-bold">
                                        {lintingService.metrics.nodeCount}
                                    </div>
                                </div>
                                <div
                                    class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div class="text-xs text-gray-500">
                                        Edges
                                    </div>
                                    <div class="font-bold">
                                        {lintingService.metrics.edgeCount}
                                    </div>
                                </div>
                                <div
                                    class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div class="text-xs text-gray-500">
                                        Complex
                                    </div>
                                    <div
                                        class="font-bold capitalize {lintingService
                                            .metrics.complexity === 'high'
                                            ? 'text-red-500'
                                            : 'text-green-500'}"
                                    >
                                        {lintingService.metrics.complexity}
                                    </div>
                                </div>
                            </div>

                            <!-- Advanced Metrics -->
                            <div class="space-y-2">
                                <h4
                                    class="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1"
                                >
                                    Architectural Metrics
                                </h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <div
                                        class="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl"
                                    >
                                        <div
                                            class="flex justify-between items-center mb-1"
                                        >
                                            <span
                                                class="text-[10px] text-gray-400"
                                                >Coupling</span
                                            >
                                            <span
                                                class="text-xs font-bold {lintingService
                                                    .metrics.coupling > 0.5
                                                    ? 'text-red-500'
                                                    : 'text-indigo-500'}"
                                                >{lintingService.metrics
                                                    .coupling}</span
                                            >
                                        </div>
                                        <div
                                            class="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
                                        >
                                            <div
                                                class="h-full bg-indigo-500 transition-all duration-500"
                                                style="width: {lintingService
                                                    .metrics.coupling * 100}%"
                                            ></div>
                                        </div>
                                    </div>
                                    <div
                                        class="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl"
                                    >
                                        <div
                                            class="flex justify-between items-center mb-1"
                                        >
                                            <span
                                                class="text-[10px] text-gray-400"
                                                >Density</span
                                            >
                                            <span
                                                class="text-xs font-bold text-indigo-500"
                                                >{lintingService.metrics
                                                    .density}</span
                                            >
                                        </div>
                                        <div
                                            class="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
                                        >
                                            <div
                                                class="h-full bg-indigo-500 transition-all duration-500"
                                                style="width: {lintingService
                                                    .metrics.density * 100}%"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Issues List -->
                            <div class="space-y-3">
                                <h4
                                    class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                                >
                                    Issues ({lintingService.metrics.issues
                                        .length})
                                </h4>

                                {#if lintingService.metrics.issues.length === 0}
                                    <div
                                        class="flex flex-col items-center py-8 text-gray-400"
                                    >
                                        <CheckCircle
                                            size={32}
                                            class="mb-2 text-green-500"
                                        />
                                        <span class="text-sm"
                                            >No issues found!</span
                                        >
                                    </div>
                                {:else}
                                    {#each lintingService.metrics.issues as issue}
                                        <div
                                            class="p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm
                                            {issue.severity === 'error'
                                                ? 'border-red-200 dark:border-red-900/30'
                                                : issue.severity === 'warning'
                                                  ? 'border-yellow-200 dark:border-yellow-900/30'
                                                  : 'border-blue-200 dark:border-blue-900/30'}"
                                        >
                                            <div
                                                class="flex gap-2 items-start mb-1"
                                            >
                                                {#if issue.severity === "error"}
                                                    <AlertTriangle
                                                        size={14}
                                                        class="text-red-500 mt-0.5 shrink-0"
                                                    />
                                                {:else if issue.severity === "warning"}
                                                    <AlertTriangle
                                                        size={14}
                                                        class="text-yellow-500 mt-0.5 shrink-0"
                                                    />
                                                {:else}
                                                    <Info
                                                        size={14}
                                                        class="text-blue-500 mt-0.5 shrink-0"
                                                    />
                                                {/if}
                                                <span
                                                    class="text-xs font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    {issue.message}
                                                </span>
                                            </div>

                                            {#if issue.suggestion}
                                                <div
                                                    class="text-[10px] text-gray-500 ml-5"
                                                >
                                                    {issue.suggestion}
                                                </div>
                                            {/if}

                                            {#if issue.autoFix}
                                                <button
                                                    class="mt-2 ml-5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                                    onclick={() => {
                                                        if (issue.autoFix) {
                                                            diagramStore.code =
                                                                issue.autoFix(
                                                                    diagramStore.code,
                                                                );
                                                            diagramStore.render();
                                                        }
                                                    }}
                                                >
                                                    <Sparkles size={10} />
                                                    Auto-fix
                                                </button>
                                            {/if}
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center py-20 text-gray-400"
                            >
                                <Activity size={32} class="mb-2 opacity-50" />
                                <span>Analysis pending...</span>
                            </div>
                        {/if}
                    </div>
                {:else if activeTab === "refactor"}
                    <div class="p-4 space-y-6">
                        <div class="space-y-4">
                            <h4
                                class="text-[10px] uppercase font-bold text-slate-400 tracking-widest"
                            >
                                Architectural Refactors
                            </h4>

                            <button
                                class="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group"
                                onclick={() => applyRefactor("wrap")}
                            >
                                <div class="flex items-center gap-3 mb-2">
                                    <div
                                        class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                                    >
                                        <Layers size={18} />
                                    </div>
                                    <div>
                                        <div
                                            class="text-xs font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            Wrap in Container
                                        </div>
                                        <div class="text-[10px] text-slate-400">
                                            Group all nodes into a
                                            Package/Subgraph
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button
                                class="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group"
                                onclick={() => applyRefactor("c4")}
                            >
                                <div class="flex items-center gap-3 mb-2">
                                    <div
                                        class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                                    >
                                        <Layout size={18} />
                                    </div>
                                    <div>
                                        <div
                                            class="text-xs font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            Convert to C4 Model
                                        </div>
                                        <div class="text-[10px] text-slate-400">
                                            Transform to C4 Context architecture
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div
                            class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30"
                        >
                            <div
                                class="flex gap-2 text-amber-600 dark:text-amber-400 mb-1"
                            >
                                <AlertTriangle size={14} />
                                <span
                                    class="text-[10px] font-bold uppercase tracking-wider"
                                    >Destructive Warning</span
                                >
                            </div>
                            <p
                                class="text-[10px] text-amber-700 dark:text-amber-300 opacity-80"
                            >
                                Refactoring manipulates the entire diagram
                                source. It is recommended to save a snapshot in
                                History before applying major structural
                                changes.
                            </p>
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
