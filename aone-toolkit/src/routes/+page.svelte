<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
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
        ArrowRight,
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

    // 核心一级独立工作台（收敛展示，其余微工具收拢至工具箱）
    const primaryToolHrefs = [
        "/agent-studio",
        "/multi-agent",
        "/prompt-hub",
        "/code-interpreter",
        "/json-editor",
        "/table-editor",
        "/diagram-editor",
        "/sql-architect",
        "/developer-utilities",
        "/snippets",
    ];

    // 开发者工具箱的快速直达常用小标签
    const quickUtilityTags = [
        { label: "cURL 转换", hash: "#curl" },
        { label: "正则测试", hash: "#regex" },
        { label: "敏感词扫描", hash: "#secret-scan" },
        { label: "差异对比", hash: "#diff" },
        { label: "JWT / 散列", hash: "#hash" },
        { label: "YAML 校验", hash: "#yaml-editor" },
        { label: "Mock 数据", hash: "#mock-generator" },
        { label: "API 诊断", hash: "#api-viewer" },
    ];

    const categories = [
        { id: "all", label: "全部工作台" },
        { id: "favorites", label: "我的收藏" },
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

    // 智能流转识别：当搜索框粘贴特定结构数据时提供快捷跳转
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
            return { toolName: "Curl 转换器", href: "/developer-utilities#curl", dataType: "curl", label: "识别为 cURL" };
        }
        // 2. JSON
        if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
            return { toolName: "JSON 编辑器", href: "/json-editor", dataType: "json", label: "识别为 JSON" };
        }
        // 3. SQL
        if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(raw)) {
            return { toolName: "SQL 查询分析器", href: "/sql-architect", dataType: "sql", label: "识别为 SQL" };
        }
        // 4. Secret
        if (raw.includes("sk-") || raw.includes("ghp_") || raw.startsWith("eyJh") || /AKIA[0-9A-Z]{16}/.test(raw)) {
            return { toolName: "敏感信息扫描器", href: "/developer-utilities#secret-scan", dataType: "text", label: "检测到敏感凭据" };
        }
        // 5. Diagram
        if (raw.includes("@startuml") || raw.startsWith("graph ") || raw.startsWith("digraph ")) {
            return { toolName: "架构图编辑器", href: "/diagram-editor", dataType: "text", label: "识别为架构图" };
        }
        // 6. YAML
        if (raw.startsWith("---\n") || (raw.includes(":\n") && raw.includes("  "))) {
            return { toolName: "YAML 编辑器", href: "/developer-utilities#yaml-editor", dataType: "yaml", label: "识别为 YAML" };
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
            goto(`${base}${detectedTarget.href}`);
            return;
        }

        if (filteredTools.length > 0) {
            goto(`${base}${filteredTools[0].href}`);
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

    // 核心独立工作台列表（按预设顺序排序）
    const primaryWorkspaces = $derived(
        primaryToolHrefs
            .map((href) => tools.find((t) => t.href === href))
            .filter((t): t is Tool => Boolean(t))
    );

    // 搜索过滤与分类筛选
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

    const isSearchingOrFiltering = $derived(Boolean(searchQuery.trim()) || selectedCategory !== "all");

    function getCategoryCount(catId: string): number {
        if (catId === "all") return primaryWorkspaces.length;
        if (catId === "favorites") return favorites.length;
        return tools.filter((t) => t.category === catId).length;
    }
</script>

<svelte:head>
    <title>Aone 工作台</title>
</svelte:head>

<div class="h-full overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 scrollbar-thin">
    <div class="mx-auto max-w-5xl space-y-8">
        <!-- 头部与快捷操作 -->
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Aone 工作台
                </h1>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    研发效能工具与 AI 协同环境
                </p>
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    onclick={openStorageManager}
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors cursor-pointer border border-transparent"
                    title="本地存储与数据管理"
                >
                    <HardDrive class="h-3.5 w-3.5 text-slate-400" />
                    <span>存储管理</span>
                </button>
                <button
                    type="button"
                    onclick={openCommandPalette}
                    class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors cursor-pointer border border-transparent"
                    title="打开全局命令面板"
                >
                    <Command class="h-3.5 w-3.5 text-slate-400" />
                    <span>命令面板</span>
                    <kbd class="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {isMac ? '⌘K' : 'Ctrl+K'}
                    </kbd>
                </button>
            </div>
        </header>

        <!-- 居中聚合搜索框（Spotlight 风格） -->
        <section>
            <form onsubmit={handleSearchSubmit}>
                <div class="relative flex items-center">
                    <Search class="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="搜索工具、功能，或直接粘贴 JSON / cURL / SQL 快捷直达..."
                        class="w-full pl-10 pr-32 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none transition-all shadow-xs"
                    />
                    {#if searchQuery}
                        <div class="absolute right-2.5 flex items-center gap-1.5">
                            {#if detectedTarget}
                                <button
                                    type="submit"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
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

        <!-- 分类切换与视图控制 -->
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <nav class="flex items-center gap-1 overflow-x-auto scrollbar-none" aria-label="工具分类">
                {#each categories as cat}
                    {@const count = getCategoryCount(cat.id)}
                    <button
                        type="button"
                        onclick={() => (selectedCategory = cat.id)}
                        class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap {selectedCategory ===
                        cat.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'}"
                    >
                        <span>{cat.label}</span>
                        {#if count > 0}
                            <span class="text-[10px] opacity-60 font-mono">({count})</span>
                        {/if}
                    </button>
                {/each}
            </nav>

            {#if isSearchingOrFiltering}
                <div class="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                    <button
                        type="button"
                        onclick={() => setViewMode("grid")}
                        class="p-1 rounded-md transition-colors cursor-pointer {viewMode === 'grid'
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
                        class="p-1 rounded-md transition-colors cursor-pointer {viewMode === 'compact'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}"
                        title="列表视图"
                        aria-label="列表视图"
                    >
                        <List class="h-3.5 w-3.5" />
                    </button>
                </div>
            {/if}
        </div>

        <!-- 主内容区 -->
        {#if filteredTools.length === 0}
            <!-- 搜索无结果空状态 -->
            <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <p class="text-sm text-slate-500 dark:text-slate-400">未找到匹配的工具</p>
                <button
                    type="button"
                    onclick={() => {
                        selectedCategory = "all";
                        searchQuery = "";
                    }}
                    class="mt-2 text-xs text-slate-700 dark:text-slate-300 underline underline-offset-4 cursor-pointer hover:opacity-80"
                >
                    重置搜索
                </button>
            </div>
        {:else if isSearchingOrFiltering}
            <!-- 搜索 / 分类过滤展示模式 -->
            <div class={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"}>
                {#each filteredTools as tool}
                    {@const Icon = iconMap[tool.icon as keyof typeof iconMap] ?? Wrench}
                    {@const isFav = favorites.includes(tool.href)}

                    {#if viewMode === "grid"}
                        <a
                            href="{base}{tool.href}"
                            class="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        >
                            <div>
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2.5">
                                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700/80 transition-colors">
                                            <Icon class="h-4 w-4" />
                                        </div>
                                        <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white">
                                            {tool.name}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onclick={(e) => toggleFavorite(e, tool.href)}
                                        class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors {isFav ? 'text-amber-400! dark:text-amber-400!' : 'opacity-0 group-hover:opacity-100'}"
                                        title={isFav ? "取消收藏" : "加入收藏"}
                                        aria-label={isFav ? "取消收藏" : "加入收藏"}
                                    >
                                        <Star class="h-3.5 w-3.5 {isFav ? 'fill-current' : ''}" />
                                    </button>
                                </div>

                                <p class="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    {tool.description}
                                </p>
                            </div>
                        </a>
                    {:else}
                        <a
                            href="{base}{tool.href}"
                            class="group flex items-center justify-between p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
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

                            <button
                                type="button"
                                onclick={(e) => toggleFavorite(e, tool.href)}
                                class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors shrink-0 ml-3 {isFav ? 'text-amber-400! dark:text-amber-400!' : ''}"
                                title={isFav ? "取消收藏" : "加入收藏"}
                            >
                                <Star class="h-3.5 w-3.5 {isFav ? 'fill-current' : ''}" />
                            </button>
                        </a>
                    {/if}
                {/each}
            </div>
        {:else}
            <!-- 默认视图（方案 A：聚焦核心生产力工作台，克制、整洁、呼吸感强） -->
            <div class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {#each primaryWorkspaces as tool}
                    {@const Icon = iconMap[tool.icon as keyof typeof iconMap] ?? Wrench}
                    {@const isFav = favorites.includes(tool.href)}
                    {@const isDevUtility = tool.href === "/developer-utilities"}

                    <div
                        class="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 sm:p-5 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 {isDevUtility ? 'sm:col-span-2 lg:col-span-2' : ''}"
                    >
                        <div>
                            <div class="flex items-center justify-between gap-2">
                                <a
                                    href="{base}{tool.href}"
                                    class="flex items-center gap-3 group-hover:opacity-90 focus:outline-none"
                                >
                                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700/80 transition-colors">
                                        <Icon class="h-4 w-4" />
                                    </div>
                                    <h2 class="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white">
                                        {tool.name}
                                    </h2>
                                </a>

                                <button
                                    type="button"
                                    onclick={(e) => toggleFavorite(e, tool.href)}
                                    class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors {isFav ? 'text-amber-400! dark:text-amber-400!' : 'opacity-0 group-hover:opacity-100'}"
                                    title={isFav ? "取消收藏" : "加入收藏"}
                                    aria-label={isFav ? "取消收藏" : "加入收藏"}
                                >
                                    <Star class="h-3.5 w-3.5 {isFav ? 'fill-current' : ''}" />
                                </button>
                            </div>

                            <a href="{base}{tool.href}" class="block mt-2.5 focus:outline-none">
                                <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    {tool.description}
                                </p>
                            </a>
                        </div>

                        {#if isDevUtility}
                            <!-- 开发者工具箱的微工具快速直达标签，让用户秒级跳转到常用子功能 -->
                            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
                                {#each quickUtilityTags as tag}
                                    <a
                                        href="{base}/developer-utilities{tag.hash}"
                                        class="inline-flex items-center px-2 py-0.5 text-[11px] rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 transition-colors"
                                    >
                                        {tag.label}
                                    </a>
                                {/each}
                                <a
                                    href="{base}/developer-utilities"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors ml-auto"
                                >
                                    <span>全部 30+ 工具</span>
                                    <ArrowRight class="h-3 w-3" />
                                </a>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
