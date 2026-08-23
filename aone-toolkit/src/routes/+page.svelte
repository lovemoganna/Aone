<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { tools, type Tool } from "$lib/config";
    import { dataBridge, type HandoffDataType } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Bot,
        Braces,
        Code2,
        Database,
        FileCode2,
        GitCompare,
        MessageSquareCode,
        Search,
        Table2,
        Wrench,
        Network,
        Radio,
        BookOpenCheck,
        DatabaseBackup,
        BarChart3,
        Terminal,
        ShieldAlert,
        GitFork,
        PenTool,
        Palette,
        BookmarkCheck,
        Regex,
        Star,
        LayoutGrid,
        List,
        Command,
        CornerDownLeft,
        HardDrive,
        Sparkles,
        Boxes,
    } from "lucide-svelte";

    const iconMap: Record<string, any> = {
        agent: Bot,
        "multi-agent": Network,
        diagram: GitFork,
        diff: GitCompare,
        json: Braces,
        prompt: MessageSquareCode,
        regex: Regex,
        table: Table2,
        yaml: FileCode2,
        mock: DatabaseBackup,
        formatter: Code2,
        "api-viewer": Radio,
        snippets: BookmarkCheck,
        svg: PenTool,
        css: Palette,
        curl: Terminal,
        secret: ShieldAlert,
        sql: Database,
        interpreter: Terminal,
        "api-spec": BookOpenCheck,
        charts: BarChart3,
        utilities: Wrench,
    };

    const categories = [
        { id: "all", label: "全部" },
        { id: "favorites", label: "已收藏" },
        { id: "AI 智能中心", label: "AI 协作" },
        { id: "数据与架构工作台", label: "数据与架构" },
        { id: "开发者聚合工作台", label: "开发工具" },
    ];

    let selectedCategory = $state("all");
    let searchQuery = $state("");
    let viewMode = $state<"grid" | "compact">("grid");
    let favorites = $state<string[]>([
        "/agent-studio",
        "/multi-agent",
        "/prompt-hub",
        "/json-editor",
        "/diagram-editor",
        "/developer-utilities",
    ]);

    let isMac = $state(false);

    onMount(() => {
        try {
            isMac = typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent);
            const savedFavs = localStorage.getItem("aone_favorite_tools");
            if (savedFavs) {
                favorites = JSON.parse(savedFavs);
            }
            const savedView = localStorage.getItem("aone_home_view_mode") as "grid" | "compact";
            if (savedView === "grid" || savedView === "compact") {
                viewMode = savedView;
            }
        } catch (e) {}
    });

    function toggleFavorite(e: MouseEvent, href: string) {
        e.preventDefault();
        e.stopPropagation();
        if (favorites.includes(href)) {
            favorites = favorites.filter((item) => item !== href);
        } else {
            favorites = [...favorites, href];
        }
        try {
            localStorage.setItem("aone_favorite_tools", JSON.stringify(favorites));
        } catch (e) {}
    }

    function setViewMode(mode: "grid" | "compact") {
        viewMode = mode;
        try {
            localStorage.setItem("aone_home_view_mode", mode);
        } catch (e) {}
    }

    // Payload detection for quick navigation when pasting data
    let detectedTarget = $derived.by<{
        toolName: string;
        href: string;
        dataType: HandoffDataType;
        label: string;
    } | null>(() => {
        const raw = searchQuery.trim();
        if (!raw || raw.length < 5) return null;

        // 1. cURL
        if (raw.startsWith("curl ") || raw.includes(" -H ") || raw.includes(" --header ")) {
            return { toolName: "Curl 转换器", href: "/developer-utilities#curl", dataType: "curl", label: "识别为 cURL 命令" };
        }
        // 2. JSON
        if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
            return { toolName: "JSON 编辑器", href: "/json-editor", dataType: "json", label: "识别为 JSON 数据" };
        }
        // 3. SQL
        if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(raw)) {
            return { toolName: "SQL 查询分析器", href: "/sql-architect", dataType: "sql", label: "识别为 SQL 查询" };
        }
        // 4. Secret
        if (raw.includes("sk-") || raw.includes("ghp_") || raw.startsWith("eyJh") || /AKIA[0-9A-Z]{16}/.test(raw)) {
            return { toolName: "敏感信息扫描器", href: "/developer-utilities#secret-scan", dataType: "text", label: "检测到敏感凭据" };
        }
        // 5. Diagram
        if (raw.includes("@startuml") || raw.startsWith("graph ") || raw.startsWith("digraph ")) {
            return { toolName: "架构图编辑器", href: "/diagram-editor", dataType: "text", label: "识别为架构图脚本" };
        }
        // 6. YAML
        if (raw.startsWith("---\n") || (raw.includes(":\n") && raw.includes("  "))) {
            return { toolName: "YAML 编辑器", href: "/developer-utilities#yaml-editor", dataType: "yaml", label: "识别为 YAML 配置" };
        }

        return null;
    });

    function handleSearchSubmit(e: SubmitEvent | KeyboardEvent) {
        e.preventDefault();
        if (detectedTarget && searchQuery.trim()) {
            dataBridge.send("首页智能流转", detectedTarget.href, {
                dataType: detectedTarget.dataType,
                payload: searchQuery.trim(),
                title: detectedTarget.label,
            });
            toastStore.success(`已载入 ${detectedTarget.toolName}`);
            goto(detectedTarget.href);
            return;
        }

        if (filteredTools.length > 0) {
            goto(filteredTools[0].href);
        }
    }

    function openCommandPalette() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
    }

    function openStorageManager() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-storage-manager"));
        }
    }

    // Tools categorization for Tiered Layout
    const coreWorkspaceTools = $derived(
        tools.filter(
            (t) =>
                t.category === "AI 智能中心" ||
                t.category === "数据与架构工作台" ||
                t.href === "/developer-utilities"
        )
    );

    const microUtilityTools = $derived(
        tools.filter(
            (t) =>
                t.category === "开发者聚合工作台" &&
                t.href !== "/developer-utilities"
        )
    );

    // Filter tools
    let filteredTools = $derived.by(() => {
        let list = tools;

        if (selectedCategory === "favorites") {
            list = list.filter((tool) => favorites.includes(tool.href));
        } else if (selectedCategory !== "all") {
            list = list.filter((tool) => tool.category === selectedCategory);
        }

        const q = searchQuery.trim().toLowerCase();
        if (!q) return list;

        return list.filter((tool) => {
            const inName = tool.name.toLowerCase().includes(q);
            const inDesc = tool.description.toLowerCase().includes(q);
            const inKeywords = tool.keywords.some((k) => k.toLowerCase().includes(q));
            const inCategory = tool.category.toLowerCase().includes(q);
            return inName || inDesc || inKeywords || inCategory;
        });
    });

    function getCategoryCount(catId: string): number {
        if (catId === "all") return tools.length;
        if (catId === "favorites") return favorites.length;
        return tools.filter((t) => t.category === catId).length;
    }
</script>

<svelte:head>
    <title>Aone 工作台</title>
</svelte:head>

<div class="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mx-auto max-w-5xl space-y-8">
        <!-- Top Header & Quick Commands -->
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Aone 工作台
                </h1>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    研发效能工具与 AI 协同环境
                </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onclick={openStorageManager}
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                    <HardDrive class="h-3.5 w-3.5 text-slate-400" />
                    <span>存储管理</span>
                </button>
                <button
                    type="button"
                    onclick={openCommandPalette}
                    class="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                    <Command class="h-3.5 w-3.5 text-slate-400" />
                    <span>命令面板</span>
                    <kbd class="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {isMac ? '⌘K' : 'Ctrl+K'}
                    </kbd>
                </button>
            </div>
        </header>

        <!-- Search & Quick Navigation Input (Raycast/Spotlight Style) -->
        <section class="relative">
            <form onsubmit={handleSearchSubmit}>
                <div class="relative flex items-center">
                    <Search class="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="搜索工具、场景，或直接粘贴 JSON / cURL / SQL / 凭据直达..."
                        class="w-full pl-10 pr-28 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none transition-all shadow-2xs"
                    />
                    {#if searchQuery}
                        <div class="absolute right-2.5 flex items-center gap-1.5">
                            {#if detectedTarget}
                                <button
                                    type="submit"
                                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                                >
                                    <span>在 {detectedTarget.toolName} 中打开</span>
                                    <CornerDownLeft class="h-3 w-3" />
                                </button>
                            {:else}
                                <button
                                    type="button"
                                    onclick={() => (searchQuery = "")}
                                    class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 cursor-pointer"
                                >
                                    清除
                                </button>
                            {/if}
                        </div>
                    {/if}
                </div>
            </form>
        </section>

        <!-- Category Tabs & View Switcher -->
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <!-- Filter Tabs -->
            <nav class="flex items-center gap-1 overflow-x-auto" aria-label="工具分类">
                {#each categories as cat}
                    {@const count = getCategoryCount(cat.id)}
                    <button
                        type="button"
                        onclick={() => (selectedCategory = cat.id)}
                        class="px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap {selectedCategory ===
                        cat.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'}"
                    >
                        <span>{cat.label}</span>
                        <span class="text-[10px] opacity-60 font-mono">({count})</span>
                    </button>
                {/each}
            </nav>

            <!-- View Switcher (for search/filtered view) -->
            <div class="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md shrink-0">
                <button
                    type="button"
                    onclick={() => setViewMode("grid")}
                    class="p-1 rounded transition-colors cursor-pointer {viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}"
                    title="网格视图"
                    aria-label="网格视图"
                >
                    <LayoutGrid class="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onclick={() => setViewMode("compact")}
                    class="p-1 rounded transition-colors cursor-pointer {viewMode === 'compact'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}"
                    title="列表视图"
                    aria-label="列表视图"
                >
                    <List class="h-3.5 w-3.5" />
                </button>
            </div>
        </div>

        <!-- MAIN CONTENT AREA -->
        {#if filteredTools.length === 0}
            <!-- Empty State -->
            <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <p class="text-sm text-slate-500 dark:text-slate-400">未找到匹配的工具</p>
                <button
                    type="button"
                    onclick={() => {
                        selectedCategory = "all";
                        searchQuery = "";
                    }}
                    class="mt-2 text-xs text-slate-700 dark:text-slate-300 underline underline-offset-4 cursor-pointer hover:opacity-80"
                >
                    重置筛选
                </button>
            </div>
        {:else if searchQuery.trim() || selectedCategory !== "all"}
            <!-- SEARCH / FILTERED MODE: Unified Flat List/Grid -->
            <div class={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "divide-y divide-slate-100 dark:divide-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"}>
                {#each filteredTools as tool}
                    {@const Icon = iconMap[tool.icon as keyof typeof iconMap] ?? Wrench}
                    {@const isFav = favorites.includes(tool.href)}

                    {#if viewMode === "grid"}
                        <a
                            href={tool.href}
                            class="group relative flex flex-col justify-between rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                        >
                            <div>
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2.5">
                                        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700/70 transition-colors">
                                            <Icon class="h-3.5 w-3.5" />
                                        </div>
                                        <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white">
                                            {tool.name}
                                        </span>
                                    </div>

                                    <div class="flex items-center gap-1.5">
                                        {#if tool.badge}
                                            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {tool.badge}
                                            </span>
                                        {/if}
                                        <button
                                            type="button"
                                            onclick={(e) => toggleFavorite(e, tool.href)}
                                            class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors {isFav ? 'text-amber-400! dark:text-amber-400!' : ''}"
                                            title={isFav ? "取消收藏" : "加入收藏"}
                                            aria-label={isFav ? "取消收藏" : "加入收藏"}
                                        >
                                            <Star class="h-3.5 w-3.5 {isFav ? 'fill-current' : ''}" />
                                        </button>
                                    </div>
                                </div>

                                <p class="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    {tool.description}
                                </p>
                            </div>

                            <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{tool.category}</span>
                            </div>
                        </a>
                    {:else}
                        <!-- Compact List Item -->
                        <a
                            href={tool.href}
                            class="group flex items-center justify-between p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                            <div class="flex items-center gap-3 min-w-0 flex-1">
                                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    <Icon class="h-3.5 w-3.5" />
                                </div>
                                <div class="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                    <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                                        {tool.name}
                                    </span>
                                    <span class="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {tool.description}
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-center gap-3 shrink-0 ml-4">
                                <span class="hidden sm:inline-block text-[11px] text-slate-400">
                                    {tool.category}
                                </span>
                                <button
                                    type="button"
                                    onclick={(e) => toggleFavorite(e, tool.href)}
                                    class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors {isFav ? 'text-amber-400! dark:text-amber-400!' : ''}"
                                    title={isFav ? "取消收藏" : "加入收藏"}
                                >
                                    <Star class="h-3.5 w-3.5 {isFav ? 'fill-current' : ''}" />
                                </button>
                            </div>
                        </a>
                    {/if}
                {/each}
            </div>
        {:else}
            <!-- DEFAULT TIERED WORKBENCH VIEW (Calm, structured, restrained) -->
            <div class="space-y-9">
                <!-- TIER 1: 核心生产力工作台 (Core Workspaces) -->
                <section class="space-y-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Sparkles class="h-4 w-4 text-slate-400" />
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                核心生产力工作台
                            </h2>
                        </div>
                        <span class="text-[11px] text-slate-400">
                            {coreWorkspaceTools.length} 款工作流套件
                        </span>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {#each coreWorkspaceTools as tool}
                            {@const Icon = iconMap[tool.icon as keyof typeof iconMap] ?? Wrench}
                            {@const isFav = favorites.includes(tool.href)}
                            <a
                                href={tool.href}
                                class="group relative flex flex-col justify-between rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                            >
                                <div>
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2.5">
                                            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700/70 transition-colors">
                                                <Icon class="h-3.5 w-3.5" />
                                            </div>
                                            <h3 class="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white">
                                                {tool.name}
                                            </h3>
                                        </div>

                                        <div class="flex items-center gap-1.5">
                                            {#if tool.badge}
                                                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    {tool.badge}
                                                </span>
                                            {/if}
                                            <button
                                                type="button"
                                                onclick={(e) => toggleFavorite(e, tool.href)}
                                                class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors {isFav ? 'text-amber-400! dark:text-amber-400!' : ''}"
                                                title={isFav ? "取消收藏" : "加入收藏"}
                                                aria-label={isFav ? "取消收藏" : "加入收藏"}
                                            >
                                                <Star class="h-3.5 w-3.5 {isFav ? 'fill-current' : ''}" />
                                            </button>
                                        </div>
                                    </div>

                                    <p class="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        {tool.description}
                                    </p>
                                </div>

                                <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                    <span>{tool.category}</span>
                                </div>
                            </a>
                        {/each}
                    </div>
                </section>

                <!-- TIER 2: 常用开发微工具 (Developer Micro-Tools Matrix) -->
                <section class="space-y-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Boxes class="h-4 w-4 text-slate-400" />
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                常用开发微工具
                            </h2>
                        </div>
                        <a
                            href="/developer-utilities"
                            class="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            进入工具箱全部 30+ 工具 &rarr;
                        </a>
                    </div>

                    <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {#each microUtilityTools as tool}
                            {@const Icon = iconMap[tool.icon as keyof typeof iconMap] ?? Wrench}
                            {@const isFav = favorites.includes(tool.href)}
                            <a
                                href={tool.href}
                                class="group flex items-start gap-3 rounded-lg border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 p-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            >
                                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors mt-0.5">
                                    <Icon class="h-3.5 w-3.5" />
                                </div>

                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-1">
                                        <span class="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white">
                                            {tool.name}
                                        </span>
                                        <button
                                            type="button"
                                            onclick={(e) => toggleFavorite(e, tool.href)}
                                            class="p-0.5 rounded text-slate-300 hover:text-amber-400 dark:text-slate-700 dark:hover:text-amber-400 transition-colors {isFav ? 'text-amber-400! dark:text-amber-400!' : ''}"
                                            title={isFav ? "取消收藏" : "加入收藏"}
                                        >
                                            <Star class="h-3 w-3 {isFav ? 'fill-current' : ''}" />
                                        </button>
                                    </div>
                                    <p class="text-[11px] leading-snug text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                                        {tool.description}
                                    </p>
                                </div>
                            </a>
                        {/each}
                    </div>
                </section>
            </div>
        {/if}
    </div>
</div>

