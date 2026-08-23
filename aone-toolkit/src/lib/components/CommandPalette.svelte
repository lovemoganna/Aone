<script lang="ts">
    import { onMount, tick, untrack } from "svelte";
    import { goto } from "$app/navigation";
    import { toolGroups, tools, type Tool } from "$lib/config";
    import { theme } from "$lib/stores";
    import {
        Search,
        Home,
        Table2,
        FileCode2,
        Sun,
        Database,
        GitCompare,
        Regex,
        Wrench,
        MessageSquareCode,
        HardDrive,
        Sparkles,
        Bot,
        Network,
        ShieldAlert,
        ShieldCheck,
        PlayCircle,
        Braces,
        Radio,
        BookOpenCheck,
        DatabaseBackup,
        BarChart3,
        Code2,
        Terminal,
        GitFork,
        PenTool,
        Palette,
        BookmarkCheck
    } from "lucide-svelte";
    import Fuse from "fuse.js";


    let isOpen = $state(false);
    let search = $state("");
    let selectedIndex = $state(0);
    let inputRef = $state<HTMLInputElement>();

    // Search result type
    interface SearchResult {
        id: string;
        title: string;
        description?: string;
        category:
            | "page"
            | "command"
            | "workflow"
            | "data"
            | "api"
            | "analysis"
            | "utility";
        icon: any;
        action: () => void;
    }

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

    const groupCategoryMap: Record<string, SearchResult["category"]> = {
        "AI 工作流核心": "workflow",
        "数据编辑器": "data",
        "API 工具": "api",
        "数据生成与分析": "analysis",
        "开发者工具箱": "utility",
    };

    const groupedTools = toolGroups.map((group) => ({
        ...group,
        tools: group.items
            .map((href) => tools.find((tool) => tool.href === href))
            .filter((tool): tool is Tool => Boolean(tool)),
    }));

    const navigationItems: SearchResult[] = [
        {
            id: "nav-home",
            title: "控制台",
            description: "返回 Aone 概览和推荐路径。",
            category: "page",
            icon: Home,
            action: () => goto("/"),
        },
        ...groupedTools.flatMap((group) =>
            group.tools.map((tool) => ({
                id: `nav-${tool.href.slice(1)}`,
                title: tool.name,
                description: tool.description,
                category: groupCategoryMap[group.title] ?? "page",
                icon: iconMap[tool.icon as keyof typeof iconMap] ?? Wrench,
                action: () => goto(tool.href),
            })),
        ),
    ];

    const commandItems: SearchResult[] = [

        {
            id: "act-theme",

            title: "切换颜色主题",
            description: "在浅色和深色模式之间切换。",
            category: "command",
            icon: Sun,
            action: () => toggleTheme(),
        },
        {
            id: "act-storage",
            title: "工作区存储与备份中心",
            description: "监控 LocalStorage 配额，一键全量导出 JSON 备份或从文件恢复。",
            category: "command",
            icon: HardDrive,
            action: () => {
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("open-storage-manager"));
                }
            },
        },
        {
            id: "act-new-workflow",
            title: "新建可视化流程编排",
            description: "打开画布设计多步骤 Agent 执行流程。",
            category: "workflow",
            icon: Sparkles,
            action: () => goto("/agent-studio/orchestration"),
        },
        {
            id: "act-multi-roundtable",
            title: "启动多 Agent 圆桌研讨",
            description: "在多智能体工作台中运行协同研讨。",
            category: "workflow",
            icon: PlayCircle,
            action: () => goto("/multi-agent"),
        },
        {
            id: "act-secret-scan",
            title: "本地敏感凭据扫描",
            description: "快速检测 API Key、Token 泄漏并一键全量脱敏。",
            category: "utility",
            icon: ShieldCheck,
            action: () => goto("/secret-scanner"),
        },
    ];

    const allItems: SearchResult[] = [...navigationItems, ...commandItems];


    // Static Fuse search instance (avoid recreating index on every keystroke/render)
    const fuse = new Fuse(allItems, {
        keys: [
            { name: "title", weight: 0.5 },
            { name: "description", weight: 0.3 },
            { name: "category", weight: 0.2 },
        ],
        threshold: 0.4,
        includeScore: true,
    });

    // Filtered results based on search
    let filteredResults = $derived.by(() => {
        const query = search.trim();
        if (!query) {
            // Show all items when no search
            return allItems.slice(0, 8);
        }
        return fuse.search(query).slice(0, 10).map((r) => r.item);
    });

    function toggleTheme() {
        theme.toggle();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.defaultPrevented) return;

        // Ctrl+K or Cmd+K to open
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            isOpen = !isOpen;
            if (isOpen) {
                tick().then(() => inputRef?.focus());
            }
        }

        // Ctrl+P for quick jump
        if (e.key === "p" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            isOpen = true;
            tick().then(() => inputRef?.focus());
        }

        if (!isOpen) return;

        if (e.key === "Escape") {
            isOpen = false;
            search = "";
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredResults.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + filteredResults.length) % filteredResults.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            execute(filteredResults[selectedIndex]);
        }
    }

    function execute(result: SearchResult) {
        if (!result) return;
        result.action();
        isOpen = false;
        search = "";
        selectedIndex = 0;
    }

    onMount(() => {
        const handleOpenEvent = () => {
            isOpen = true;
            tick().then(() => inputRef?.focus());
        };
        window.addEventListener("open-command-palette", handleOpenEvent);
        window.addEventListener("keydown", handleKeydown);
        return () => {
            window.removeEventListener("open-command-palette", handleOpenEvent);
            window.removeEventListener("keydown", handleKeydown);
        };
    });

    $effect(() => {
        // Reset selection when search changes
        search;
        untrack(() => {
            selectedIndex = 0;
        });
    });

    const categoryLabels: Record<string, string> = {
        page: "页面",
        command: "命令",
        workflow: "工作流",
        data: "数据",
        api: "接口",
        analysis: "分析",
        utility: "工具",
    };

    // Category colors
    const categoryColors: Record<string, string> = {
        page: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        command: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        workflow: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        data: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        api: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        analysis: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        utility: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    };
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-4 sm:px-4 sm:pt-[15vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
    >
        <button
            class="fixed inset-0 w-full h-full bg-black/50 backdrop-blur-sm transition-opacity border-none cursor-default"
            onclick={() => (isOpen = false)}
            aria-label="关闭"
            type="button"
        ></button>

        <div
            class="relative flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 sm:max-h-[60vh]"
        >
            <div
                class="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 gap-3"
            >
                <h2 id="command-palette-title" class="sr-only">
                    命令面板
                </h2>
                <Search class="text-gray-400 w-5 h-5 shrink-0" />
                <input
                    bind:this={inputRef}
                    bind:value={search}
                    type="text"
                    aria-label="搜索命令和页面"
                    placeholder="输入命令或搜索..."
                    class="h-10 min-w-0 flex-1 border-none bg-transparent text-base text-gray-900 outline-none placeholder-gray-400 dark:text-gray-100 sm:text-lg"
                />
                <kbd
                    class="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
                    >ESC</kbd
                >
            </div>

            <div class="overflow-y-auto p-2 scroll-py-2">
                {#if filteredResults.length === 0}
                    <div class="px-4 py-8 text-center text-gray-500 text-sm">
                        未找到结果。
                    </div>
                {:else}
                    <div class="space-y-1">
                        {#each filteredResults as result, i}
                            <button
                                class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors {i ===
                                selectedIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
                                type="button"
                                aria-label={`打开 ${result.title}`}
                                onclick={() => execute(result)}
                                onmouseenter={() => (selectedIndex = i)}
                            >
                                <result.icon
                                    size={20}
                                    class={i === selectedIndex
                                        ? "text-indigo-500"
                                        : "text-gray-400"}
                                />
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate font-medium">
                                        {result.title}
                                    </span>
                                    {#if result.description}
                                        <span class="mt-0.5 block truncate text-xs opacity-70">
                                            {result.description}
                                        </span>
                                    {/if}
                                </span>
                                <span class="shrink-0 rounded px-2 py-0.5 text-xs {categoryColors[result.category]}">
                                    {categoryLabels[result.category] ?? result.category}
                                </span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div
                class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/50"
            >
                <span>使用 <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑/↓</kbd> 键进行导航</span>
                <span>按 <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> 键进行选择</span>
                <span>按 <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> 键进行关闭</span>
            </div>
        </div>
    </div>
{/if}
