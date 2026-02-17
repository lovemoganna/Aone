<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import {
        Sun,
        Moon,
        Download,
        Settings,
        HelpCircle,
        Code,
        Play,
        Book,
        Share2,
        Zap,
        ZapOff,
        Search,
        Keyboard,
        Image,
        ImageIcon,
        Maximize,
        Minimize,
        History,
        Table,
        Palette,
        Sparkles,
        Users,
        Cpu,
    } from "lucide-svelte";

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

    function setMode(m: "plantuml" | "graphviz") {
        diagramStore.mode = m;
    }

    // Share logic moved to ShareModal
</script>

<header
    class="flex items-center justify-between px-6 py-3 m-6 mb-2 rounded-2xl glass-pro transition-all duration-500 z-50 shrink-0 shadow-premium group/header hover:shadow-glow"
>
    <!-- Logo -->
    <div
        class="flex items-center gap-3 group cursor-pointer"
        onclick={() => window.location.reload()}
    >
        <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 flex items-center justify-center text-white glow-premium group-hover:scale-110 transition-transform duration-500"
        >
            <Code size={20} strokeWidth={2.5} />
        </div>
        <div class="flex flex-col">
            <h1
                class="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"
            >
                AONE
            </h1>
            <span
                class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
                >Toolkit</span
            >
        </div>
    </div>

    <!-- Mode Switcher -->
    <div
        class="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
    >
        <button
            class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 {diagramStore.mode ===
            'plantuml'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 scale-105'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}"
            onclick={() => setMode("plantuml")}
        >
            PlantUML
        </button>
        <button
            class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 {diagramStore.mode ===
            'graphviz'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 scale-105'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}"
            onclick={() => setMode("graphviz")}
        >
            Graphviz
        </button>
    </div>

    <!-- Collaborators -->
    {#if diagramStore.collaborators.length > 0}
        <div
            class="flex items-center gap-4 ml-6 pl-6 border-l border-gray-200/50 dark:border-gray-700/50"
        >
            <div class="flex -space-x-2 overflow-hidden">
                {#each diagramStore.collaborators as user}
                    <div
                        class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform hover:-translate-y-1 cursor-help"
                        style="background-color: {user.color}"
                        title={user.name}
                    >
                        {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </div>
                {/each}
            </div>
            <div class="hidden lg:flex items-center gap-2">
                <span class="relative flex h-2 w-2">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                    ></span>
                    <span
                        class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
                    ></span>
                </span>
                <span
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                >
                    {diagramStore.collaborators.length} Online
                </span>
            </div>
        </div>
    {/if}

    {#if diagramStore.mode === "graphviz"}
        <div class="ml-4 flex items-center gap-2 animate-fade-in">
            <span
                class="text-[10px] font-bold uppercase tracking-wider text-gray-400"
                >Engine</span
            >
            <div class="relative group">
                <select
                    bind:value={diagramStore.engine}
                    class="appearance-none bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                    {#each ["dot", "circo", "fdp", "neato", "osage", "twopi"] as e}
                        <option value={e}>{e}</option>
                    {/each}
                </select>
                <!-- Custom Arrow -->
                <div
                    class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- Toolbar -->
    <div
        class="flex items-center gap-1.5 pl-4 border-l border-gray-200/50 dark:border-gray-700/50 ml-4"
    >
        <button
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 font-semibold text-sm group"
            onclick={onAIGen}
        >
            <Sparkles
                size={16}
                class="group-hover:rotate-12 transition-transform"
            />
            AI Gen
        </button>

        <button
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 font-semibold text-sm"
            onclick={onRender}
            disabled={diagramStore.isRendering}
        >
            <Play
                size={16}
                class={diagramStore.isRendering
                    ? "animate-spin"
                    : "fill-current"}
            />
            Render
        </button>

        <!-- Divider -->
        <div class="w-px h-6 bg-gray-200/50 dark:bg-gray-700/50 mx-1"></div>

        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Export Image"
            onclick={onExport}
        >
            <Download size={20} />
        </button>
        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Find & Replace (Ctrl+H)"
            onclick={onFindReplace}
        >
            <Search size={20} />
        </button>
        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Local History"
            onclick={onHistory}
        >
            <History size={20} />
        </button>
        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Accessibility View"
            onclick={onAccessibility}
        >
            <Table size={20} />
        </button>
        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Keyboard Shortcuts (Ctrl+/)"
            onclick={onShortcuts}
        >
            <Keyboard size={20} />
        </button>

        <!-- Divider -->
        <div class="w-px h-6 bg-gray-200/50 dark:bg-gray-700/50 mx-1"></div>

        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Theme Engine"
            onclick={onTheme}
        >
            <Palette size={20} />
        </button>
        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Icon Browser"
            onclick={onIcons}
        >
            <Image size={20} />
        </button>
        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Presentation Mode"
            onclick={onPresent}
        >
            <Book size={20} />
        </button>
        <button
            class="p-2 {diagramStore.focusMode
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500/30'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'} rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Toggle Zen Mode"
            onclick={() => (diagramStore.focusMode = !diagramStore.focusMode)}
        >
            {#if diagramStore.focusMode}
                <Minimize size={20} />
            {:else}
                <Maximize size={20} />
            {/if}
        </button>

        <button
            class="p-2 transition-all duration-200 hover:-translate-y-0.5 rounded-lg {diagramStore.autoRender
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/30 shadow-glow-sm'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
            title={diagramStore.autoRender
                ? "Auto-Render On"
                : "Auto-Render Off"}
            onclick={() => (diagramStore.autoRender = !diagramStore.autoRender)}
        >
            {#if diagramStore.autoRender}
                <Zap size={20} class="fill-current" />
            {:else}
                <ZapOff size={20} />
            {/if}
        </button>

        <button
            class="p-2 transition-all duration-200 hover:-translate-y-0.5 rounded-lg flex items-center gap-1.5 {diagramStore.qualityLevel ===
            'high'
                ? 'text-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-glow-sm'
                : diagramStore.qualityLevel === 'balanced'
                  ? 'text-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}"
            title="Quality: {diagramStore.qualityLevel.toUpperCase()}"
            onclick={() => {
                const levels: ("performance" | "balanced" | "high")[] = [
                    "performance",
                    "balanced",
                    "high",
                ];
                const next =
                    levels[
                        (levels.indexOf(diagramStore.qualityLevel) + 1) %
                            levels.length
                    ];
                diagramStore.qualityLevel = next;
                diagramStore.saveState();
            }}
        >
            <Cpu size={20} />
            <span class="text-[10px] font-bold uppercase hidden xl:block"
                >{diagramStore.qualityLevel === "high"
                    ? "Ultra"
                    : diagramStore.qualityLevel === "balanced"
                      ? "Bal"
                      : "Perf"}</span
            >
        </button>

        <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            title="Share Diagram"
            onclick={onShare}
        >
            <Share2 size={20} />
        </button>

        <!-- Theme & More -->
        <div
            class="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-lg ml-2"
        >
            <button
                class="p-1.5 transition-all duration-200 rounded-md {diagramStore.previewTheme ===
                'dark'
                    ? 'text-indigo-500 bg-white dark:bg-gray-700 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'}"
                title="Toggle Preview Theme"
                onclick={() =>
                    (diagramStore.previewTheme =
                        diagramStore.previewTheme === "light"
                            ? "dark"
                            : "light")}
            >
                {#if diagramStore.previewTheme === "light"}
                    <Image size={16} />
                {:else}
                    <ImageIcon size={16} />
                {/if}
            </button>

            <button
                class="p-1.5 text-gray-400 hover:text-indigo-500 transition-all duration-200 rounded-md"
                onclick={() =>
                    document.documentElement.classList.toggle("dark")}
            >
                <Sun size={16} class="hidden dark:block" />
                <Moon size={16} class="block dark:hidden" />
            </button>
        </div>
    </div>
</header>
