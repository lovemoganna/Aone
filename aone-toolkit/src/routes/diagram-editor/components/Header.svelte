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
        Share2,
        Zap,
        ZapOff,
        Keyboard,
        Maximize,
        Minimize,
        Cpu,
        ArrowLeftRight,
        Wrench,
        MoreHorizontal,
        PanelLeftClose,
        PanelLeft,
        Settings,
        Users,
        Grid
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let {
        isSidebarOpen = true,
        onToggleSidebar,
        onRender,
        onExport,
        onSettings,
        onShare,
        onShortcuts,
        onIcons,
        onAIGen,
        onCollab,
    } = $props<{
        isSidebarOpen?: boolean;
        onToggleSidebar?: () => void;
        onRender: () => void;
        onExport: () => void;
        onSettings: () => void;
        onShare: () => void;
        onShortcuts: () => void;
        onIcons: () => void;
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
</script>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") isMoreMenuOpen = false; }} />

<header
    class="h-12 min-h-12 px-4 bg-slate-50/70 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0 z-30 select-none text-slate-800 dark:text-slate-200"
>
    <!-- Left: Sidebar Toggle + Brand + Mode Switcher -->
    <div class="flex items-center gap-2.5 min-w-0">
        {#if onToggleSidebar}
            <button
                type="button"
                class="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                onclick={onToggleSidebar}
                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                aria-label="切换侧边栏"
            >
                {#if isSidebarOpen}
                    <PanelLeftClose size={16} />
                {:else}
                    <PanelLeft size={16} />
                {/if}
            </button>
        {/if}

        <!-- Logo -->
        <div class="flex items-center gap-2 pr-2.5 border-r border-slate-200 dark:border-slate-800 shrink-0">
            <div class="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-slate-100 shadow-2xs">
                <Code size={14} strokeWidth={2.2} />
            </div>
            <span class="font-semibold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100">
                架构图编辑器
            </span>
        </div>

        <!-- Mode Switcher -->
        <div class="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs shrink-0 font-medium">
            <button
                type="button"
                class="px-2 py-0.5 rounded transition-colors {diagramStore.mode === 'plantuml'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                onclick={() => setMode("plantuml")}
            >
                PlantUML
            </button>
            <button
                type="button"
                class="px-2 py-0.5 rounded transition-colors {diagramStore.mode === 'graphviz'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                onclick={() => setMode("graphviz")}
            >
                Graphviz
            </button>
        </div>

        {#if autoFixes.length > 0}
            <button
                type="button"
                class="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium flex items-center gap-1 shadow-2xs transition-colors shrink-0"
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
            class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded transition-colors"
            title="Generate with AI"
            aria-label="生成架构图"
            onclick={onAIGen}
        >
            <Cpu size={13} />
            <span class="hidden sm:inline">AI Gen</span>
        </button>

        <!-- Render Button -->
        <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs shadow-2xs transition-colors"
            aria-label="渲染架构图 (Ctrl+Enter)"
            title="Render Diagram (Ctrl+Enter)"
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
            class="p-1.5 rounded transition-colors {diagramStore.autoRender
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
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
                title="More Options"
                aria-label="更多选项"
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
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                        onclick={() => { handleConvertFormat(); isMoreMenuOpen = false; }}
                    >
                        <ArrowLeftRight size={13} />
                        <span>Convert Syntax Format</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                        onclick={() => { onIcons(); isMoreMenuOpen = false; }}
                    >
                        <Grid size={13} />
                        <span>Icon Browser</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                        onclick={() => { onCollab(); isMoreMenuOpen = false; }}
                    >
                        <Users size={13} />
                        <span>Live Collaboration</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                        onclick={() => { onShortcuts(); isMoreMenuOpen = false; }}
                    >
                        <Keyboard size={13} />
                        <span>Keyboard Shortcuts</span>
                    </button>
                    <button
                        type="button"
                        class="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                        onclick={() => { onSettings(); isMoreMenuOpen = false; }}
                    >
                        <Settings size={13} />
                        <span>Settings</span>
                    </button>
                </div>
            {/if}
        </div>

        <!-- UI Theme Toggle -->
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
