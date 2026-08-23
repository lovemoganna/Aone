<script lang="ts">
    import { page } from "$app/stores";
    import { base } from "$app/paths";
    import { sidebarCollapsed, theme } from "$lib/stores";
    import { toolGroups, tools, type Tool } from "$lib/config";
    import {
        LayoutDashboard,
        ChevronLeft,
        ChevronRight,
        Menu,
        Search,
        Bot,
        Network,
        MessageSquareCode,
        Braces,
        FileCode2,
        Table2,
        Radio,
        BookOpenCheck,
        DatabaseBackup,
        BarChart3,
        Database,
        Code2,
        Terminal,
        ShieldAlert,
        GitFork,
        PenTool,
        Palette,
        BookmarkCheck,
        GitCompare,
        Regex,
        Wrench,
        Sun,
        Moon
    } from "lucide-svelte";

    // 完整的图标映射字典，保证所有工具与页面具备专属且风格统一的 Lucide 图标
    const iconMap: Record<string, any> = {
        dashboard: LayoutDashboard,
        yaml: FileCode2,
        table: Table2,
        json: Braces,
        diagram: GitFork,
        prompt: MessageSquareCode,
        agent: Bot,
        "multi-agent": Network,
        diff: GitCompare,
        regex: Regex,
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

    // 分组类别视觉徽标定义
    const groupBadgeMap: Record<string, { dotColor: string; tagColor: string }> = {
        "AI 智能中心": {
            dotColor: "bg-indigo-500",
            tagColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
        },
        "数据与架构工作台": {
            dotColor: "bg-amber-500",
            tagColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
        },
        "开发者聚合工作台": {
            dotColor: "bg-emerald-500",
            tagColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
        },
    };

    const groupedTools = toolGroups.map((group) => ({
        ...group,
        badge: groupBadgeMap[group.title] || {
            dotColor: "bg-primary-500",
            tagColor: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50",
        },
        tools: group.items
            .map((href) => tools.find((tool) => tool.href === href))
            .filter((tool): tool is Tool => Boolean(tool)),
    }));

    function toggleSidebar() {
        sidebarCollapsed.toggle();
    }

    function openCommandPalette() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-command-palette"));
        }
    }

    let isDashboardActive = $derived($page.url.pathname === base || $page.url.pathname === `${base}/` || $page.url.pathname === "/");
</script>

<aside
    class="fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col justify-between select-none
    w-16 {$sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'}"
    aria-label="主侧边栏导航"
>
    <!-- 头部区域：品牌与折叠开关 -->
    <div class="shrink-0">
        <div
            class="h-16 flex items-center justify-between px-3.5 border-b border-slate-200/80 dark:border-slate-800/80"
        >
            <a
                href="{base}/"
                class="flex items-center gap-2.5 overflow-hidden whitespace-nowrap group focus:outline-none"
                title="Aone 控制台"
            >
                <div
                    class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200"
                >
                    <span class="text-white font-bold text-lg tracking-wider">A</span>
                </div>
                <div
                    class="flex items-center gap-2 transition-opacity duration-200
                    {$sidebarCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-0 w-0 lg:opacity-100 lg:w-auto'}"
                >
                    <span class="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">
                        Aone
                    </span>
                    <span
                        class="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50"
                    >
                        Studio
                    </span>
                </div>
            </a>

            <button
                onclick={toggleSidebar}
                class="hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors lg:inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={$sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                title={$sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
                {#if $sidebarCollapsed}
                    <ChevronRight size={18} />
                {:else}
                    <ChevronLeft size={18} />
                {/if}
            </button>
        </div>

        <!-- 快速搜索栏 (快捷触发 Ctrl+K) -->
        <div class="px-2.5 pt-3 pb-1">
            <button
                type="button"
                onclick={openCommandPalette}
                class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-150 group relative focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="快速搜索命令和工具"
                title="搜索命令和工具 ({typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K'})"
            >
                <Search size={15} class="shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span
                    class="truncate transition-opacity duration-150 text-left flex-1
                    {$sidebarCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-0 w-0 lg:opacity-100 lg:w-auto'}"
                >
                    快速检索...
                </span>
                <kbd
                    class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 transition-opacity duration-150 shrink-0
                    {$sidebarCollapsed ? 'hidden' : 'hidden lg:inline-block'}"
                >
                    {typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘K" : "Ctrl+K"}
                </kbd>
            </button>
        </div>
    </div>

    <!-- 中部导航列表 -->
    <nav class="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 scrollbar-thin">
        <!-- 仪表盘独立置顶入口 -->
        <div>
            <a
                href="{base}/"
                class="flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative
                {isDashboardActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'}"
                title="工作台首页"
            >
                <div class="shrink-0 {isDashboardActive ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'}">
                    <LayoutDashboard size={18} />
                </div>
                <span
                    class="truncate transition-opacity duration-150
                    {$sidebarCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-0 w-0 lg:opacity-100 lg:w-auto'}"
                >
                    控制台首页
                </span>
                {#if isDashboardActive}
                    <div class="ml-auto h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-950 {$sidebarCollapsed ? 'hidden' : 'hidden lg:block'}"></div>
                {/if}
            </a>
        </div>

        <!-- 分组工具矩阵导航 -->
        {#each groupedTools as group}
            <div class="pt-2.5">
                <!-- 分组标题与 Badge -->
                <div
                    class="px-2 pb-1.5 flex items-center justify-between transition-opacity duration-150
                    {$sidebarCollapsed ? 'hidden' : 'hidden lg:flex'}"
                >
                    <div class="flex items-center gap-1.5 min-w-0">
                        <span class="w-1.5 h-1.5 rounded-full shrink-0 {group.badge.dotColor}"></span>
                        <span class="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase truncate">
                            {group.title}
                        </span>
                    </div>
                    <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium {group.badge.tagColor}">
                        {group.tools.length}
                    </span>
                </div>

                <!-- 折叠态极简分割指示 -->
                <div class="lg:hidden flex justify-center py-1">
                    <div class="h-0.5 w-4 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <!-- 组内工具条目：统一增加层级缩进与微弱导向线 -->
                <div class="space-y-0.5 {$sidebarCollapsed ? '' : 'lg:pl-2 lg:ml-1 lg:border-l lg:border-slate-200/50 dark:lg:border-slate-800/50'}">
                    {#each group.tools as tool}
                        {@const Icon = iconMap[tool.icon] ?? Wrench}
                        {@const targetPath = `${base}${tool.href}`}
                        {@const isHashTool = tool.href.includes("#")}
                        {@const currentFullPath = `${$page.url.pathname}${$page.url.hash || ""}`}
                        {@const isActive = isHashTool
                            ? currentFullPath === targetPath
                            : tool.href === "/developer-utilities"
                                ? $page.url.pathname === targetPath && (!$page.url.hash || $page.url.hash === "#jwt")
                                : $page.url.pathname === targetPath || $page.url.pathname.startsWith(targetPath + "/")}
                        <a
                            href={targetPath}
                            class="flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 group relative
                            {isActive
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border border-slate-300/80 dark:border-slate-700/80'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'}"
                            title={tool.name}
                        >
                            <div class="shrink-0 transition-colors {isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}">
                                <Icon size={17} />
                            </div>
                            <span
                                class="truncate transition-opacity duration-150
                                {$sidebarCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-0 w-0 lg:opacity-100 lg:w-auto'}"
                            >
                                {tool.name}
                            </span>

                            {#if tool.badge}
                                <span
                                    class="ml-auto text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 transition-opacity
                                    {$sidebarCollapsed ? 'hidden' : 'hidden lg:inline-block'}"
                                >
                                    {tool.badge}
                                </span>
                            {/if}

                            <!-- 折叠 Tooltip 浮层 -->
                            {#if $sidebarCollapsed}
                                <div
                                    class="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs rounded-lg shadow-xl border border-slate-700/60 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity flex flex-col gap-0.5"
                                >
                                    <div class="font-semibold text-slate-100">
                                        {tool.name}
                                    </div>
                                    <span class="text-[10px] text-indigo-300 dark:text-indigo-300 font-medium">
                                        {group.title}
                                    </span>
                                </div>
                            {/if}
                        </a>
                    {/each}
                </div>
            </div>
        {/each}

        <div class="h-4"></div>
    </nav>

    <!-- 底部状态与快捷停靠坞 (Footer Dock) -->
    <div
        class="shrink-0 p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40"
    >
        <div class="flex items-center {$sidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-1'}">
            <!-- 切换主题 -->
            <button
                type="button"
                onclick={() => theme.toggle()}
                class="p-2 rounded-lg text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors relative group focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                aria-label="切换浅色/深色主题"
                title="切换主题"
            >
                <div class="hidden dark:block">
                    <Sun size={18} />
                </div>
                <div class="block dark:hidden">
                    <Moon size={18} />
                </div>
            </button>

            <!-- 移动端或展开切换辅助 -->
            <button
                type="button"
                onclick={toggleSidebar}
                class="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors relative group lg:hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                aria-label="切换侧边栏"
                title="切换侧边栏"
            >
                <Menu size={18} />
            </button>
        </div>
    </div>
</aside>
