<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import {
        convertPlantUMLToGraphviz,
        convertGraphvizToPlantUML,
    } from "../lib/transformer";
    import { getAutoFixes } from "../lib/autofix";
    import {
        Sun,
        Moon,
        Download,
        Code,
        Play,
        Book,
        Share2,
        Zap,
        ZapOff,
        Search,
        Keyboard,
        Grid,
        Maximize,
        Minimize,
        History,
        Table,
        Cpu,
        ArrowLeftRight,
        Wrench,
        MoreHorizontal,
        FileText,
        Plus,
        X
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let {
        onRender,
        onExport,
        onSettings,
        onHelp,
        onSnippets,
        onTemplates,
        onShare,
        onShortcuts,
        onFindReplace,
        onPresent,
        onIcons,
        onHistory,
        onAccessibility,
        onTheme,
        onAIGen,
    } = $props<{
        onRender: () => void;
        onExport: () => void;
        onSettings: () => void;
        onHelp: () => void;
        onSnippets: () => void;
        onTemplates: () => void;
        onShare: () => void;
        onShortcuts: () => void;
        onFindReplace: () => void;
        onPresent: () => void;
        onIcons: () => void;
        onHistory: () => void;
        onAccessibility: () => void;
        onTheme: () => void;
        onAIGen: () => void;
        onCollab: () => void;
    }>();

    let isMoreMenuOpen = $state(false);

    let autoFixes = $derived(
        diagramStore.error
            ? getAutoFixes(diagramStore.error, diagramStore.code, diagramStore.mode)
            : []
    );

    function setMode(m: "plantuml" | "graphviz") {
        diagramStore.mode = m;
    }

    function handleConvertFormat() {
        diagramStore.takeSnapshot();
        if (diagramStore.mode === "plantuml") {
            diagramStore.code = convertPlantUMLToGraphviz(diagramStore.code);
            diagramStore.mode = "graphviz";
        } else {
            diagramStore.code = convertGraphvizToPlantUML(diagramStore.code);
            diagramStore.mode = "plantuml";
        }
        diagramStore.render();
    }

    function applyFirstAutofix() {
        if (autoFixes.length > 0) {
            diagramStore.takeSnapshot();
            diagramStore.code = autoFixes[0].apply(diagramStore.code);
            diagramStore.render();
        }
    }

    // Tabs Management
    let editingTabId = $state<string | null>(null);
    let editName = $state("");

    function handleTabClick(id: string) {
        diagramStore.switchDocument(id);
    }

    function handleCloseTab(e: MouseEvent, id: string) {
        e.stopPropagation();
        diagramStore.closeDocument(id);
    }

    function handleNewTab() {
        diagramStore.createDocument();
    }

    function startRename(id: string, currentName: string) {
        editingTabId = id;
        editName = currentName;
    }

    function commitRename(id: string) {
        if (editName.trim()) {
            const doc = diagramStore.documents.find((d) => d.id === id);
            if (doc) {
                doc.name = editName.trim();
                diagramStore.saveState();
            }
        }
        editingTabId = null;
    }

    function autofocus(node: HTMLElement) {
        node.focus();
    }
</script>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") isMoreMenuOpen = false; }} />

<header
    class="h-10 px-2.5 bg-white dark:bg-[#0b0f17] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-30 select-none text-slate-800 dark:text-slate-200"
>
    <!-- Left: Brand + Mode Switcher + Integrated Tabs -->
    <div class="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <!-- Logo -->
        <div class="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
            <div class="w-5 h-5 rounded bg-slate-800 dark:bg-slate-200 flex items-center justify-center text-white dark:text-slate-900 shadow-xs">
                <Code size={12} strokeWidth={2.5} />
            </div>
            <span class="font-bold text-xs tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline">
                AONE <span class="text-slate-400 font-normal">Diagram</span>
            </span>
        </div>

        <!-- Mode Switcher -->
        <div class="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 text-xs shrink-0">
            <button
                type="button"
                class="px-2 py-0.5 rounded font-medium transition-colors {diagramStore.mode === 'plantuml'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                onclick={() => setMode("plantuml")}
            >
                PlantUML
            </button>
            <button
                type="button"
                class="px-2 py-0.5 rounded font-medium transition-colors {diagramStore.mode === 'graphviz'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                onclick={() => setMode("graphviz")}
            >
                Graphviz
            </button>
        </div>

        <!-- Integrated Documents Tab Strip -->
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 pl-1">
            {#each diagramStore.documents as doc (doc.id)}
                <div
                    class="flex items-center gap-1 px-2.5 h-7 text-xs rounded-md transition-colors cursor-pointer shrink-0 max-w-[150px] group/tab border
                    {diagramStore.activeDocumentId === doc.id
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium border-slate-300/80 dark:border-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 border-transparent'}"
                    onclick={() => handleTabClick(doc.id)}
                    ondblclick={() => startRename(doc.id, doc.name)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === "Enter" && handleTabClick(doc.id)}
                >
                    <FileText size={11} class="opacity-60 shrink-0" />

                    {#if editingTabId === doc.id}
                        <input
                            bind:value={editName}
                            class="bg-white dark:bg-slate-900 border border-slate-400 outline-none text-xs w-full py-0 px-1 rounded text-slate-900 dark:text-slate-100"
                            use:autofocus
                            onblur={() => commitRename(doc.id)}
                            onkeydown={(e) => {
                                if (e.key === "Enter") commitRename(doc.id);
                                if (e.key === "Escape") editingTabId = null;
                            }}
                            onclick={(e) => e.stopPropagation()}
                        />
                    {:else}
                        <span class="truncate text-[11px]">{doc.name}</span>
                    {/if}

                    {#if diagramStore.documents.length > 1}
                        <button
                            type="button"
                            class="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded opacity-0 group-hover/tab:opacity-100 transition-opacity ml-auto"
                            onclick={(e) => handleCloseTab(e, doc.id)}
                            title="Close Tab"
                            aria-label="关闭标签页"
                        >
                            <X size={10} />
                        </button>
                    {/if}
                </div>
            {/each}

            <button
                type="button"
                class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                onclick={handleNewTab}
                title="New Diagram (Ctrl+N)"
                aria-label="新建图表"
            >
                <Plus size={13} />
            </button>
        </div>

        {#if autoFixes.length > 0}
            <button
                type="button"
                class="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium flex items-center gap-1 shadow-xs transition-colors shrink-0"
                title={autoFixes[0].description || autoFixes[0].label}
                aria-label={`一键修复代码: ${autoFixes[0].label}`}
                onclick={applyFirstAutofix}
            >
                <Wrench size={11} />
                <span>Fix ({autoFixes[0].label})</span>
            </button>
        {/if}
    </div>

    <!-- Right: Primary Actions & Tool Groups -->
    <div class="flex items-center gap-1 shrink-0">
        <!-- Generate Button -->
        <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
            title="Generate Diagram"
            aria-label="生成架构图"
            onclick={onAIGen}
        >
            <Cpu size={13} />
            <span class="hidden sm:inline">Generate</span>
        </button>

        <!-- Render Button -->
        <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-md font-semibold text-xs shadow-xs transition-colors"
            aria-label="渲染架构图"
            onclick={onRender}
            disabled={diagramStore.isRendering}
        >
            <Play
                size={11}
                class={diagramStore.isRendering ? "animate-spin" : "fill-current"}
            />
            <span>Render</span>
        </button>

        <!-- Divider -->
        <div class="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        <!-- Auto-Render Toggle -->
        <button
            type="button"
            class="p-1.5 rounded-md transition-colors {diagramStore.autoRender
                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}"
            title={diagramStore.autoRender ? "Auto-Render: ON" : "Auto-Render: OFF"}
            aria-label="切换实时自动渲染"
            onclick={() => (diagramStore.autoRender = !diagramStore.autoRender)}
        >
            {#if diagramStore.autoRender}
                <Zap size={14} class="fill-current" />
            {:else}
                <ZapOff size={14} />
            {/if}
        </button>

        <!-- Export -->
        <button
            type="button"
            class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Export Diagram"
            aria-label="导出图表"
            onclick={onExport}
        >
            <Download size={14} />
        </button>

        <!-- Share -->
        <button
            type="button"
            class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Share Diagram Link"
            aria-label="分享图表链接"
            onclick={onShare}
        >
            <Share2 size={14} />
        </button>

        <!-- Zen Mode -->
        <button
            type="button"
            class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Toggle Zen Focus Mode"
            aria-label="切换沉浸专注模式"
            onclick={() => (diagramStore.focusMode = !diagramStore.focusMode)}
        >
            {#if diagramStore.focusMode}
                <Minimize size={14} />
            {:else}
                <Maximize size={14} />
            {/if}
        </button>

        <!-- More Tools Popover -->
        <div class="relative">
            <button
                type="button"
                class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors {isMoreMenuOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : ''}"
                title="More Tools"
                aria-label="更多工具"
                onclick={() => (isMoreMenuOpen = !isMoreMenuOpen)}
            >
                <MoreHorizontal size={14} />
            </button>

            {#if isMoreMenuOpen}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="fixed inset-0 z-40"
                    onclick={() => (isMoreMenuOpen = false)}
                ></div>
                <div
                    class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs"
                    transition:slide={{ duration: 100 }}
                >
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { handleConvertFormat(); isMoreMenuOpen = false; }}
                    >
                        <ArrowLeftRight size={13} />
                        <span>Convert Syntax Format</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { onFindReplace(); isMoreMenuOpen = false; }}
                    >
                        <Search size={13} />
                        <span>Find & Replace (Ctrl+F)</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { onHistory(); isMoreMenuOpen = false; }}
                    >
                        <History size={13} />
                        <span>Version History (Ctrl+H)</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { onIcons(); isMoreMenuOpen = false; }}
                    >
                        <Grid size={13} />
                        <span>Icon Browser</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { onPresent(); isMoreMenuOpen = false; }}
                    >
                        <Book size={13} />
                        <span>Presentation Mode</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { onAccessibility(); isMoreMenuOpen = false; }}
                    >
                        <Table size={13} />
                        <span>Accessibility View</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onclick={() => { onShortcuts(); isMoreMenuOpen = false; }}
                    >
                        <Keyboard size={13} />
                        <span>Keyboard Shortcuts</span>
                    </button>
                </div>
            {/if}
        </div>

        <!-- Theme toggles -->
        <div class="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 ml-0.5">
            <button
                type="button"
                class="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                title="Toggle UI Theme"
                aria-label="切换浅色/深色主题"
                onclick={() => document.documentElement.classList.toggle("dark")}
            >
                <Sun size={12} class="hidden dark:block" />
                <Moon size={12} class="block dark:hidden" />
            </button>
        </div>
    </div>
</header>

