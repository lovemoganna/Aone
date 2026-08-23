<script lang="ts">
import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { EmptyState } from '$lib/components/ui';
    import JwtDecoder from "./components/JwtDecoder.svelte";

    import Base64Converter from "./components/Base64Converter.svelte";
    import UrlConverter from "./components/UrlConverter.svelte";
    import CronGenerator from "./components/CronGenerator.svelte";
    import HashCalculator from "./components/HashCalculator.svelte";
    import UuidGenerator from "./components/UuidGenerator.svelte";
    import JsonConverter from "./components/JsonConverter.svelte";
    import SqlFormatter from "./components/SqlFormatter.svelte";
    import HtmlEntity from "./components/HtmlEntity.svelte";
    import ColorConverter from "./components/ColorConverter.svelte";
    import TimestampConverter from "./components/TimestampConverter.svelte";
    import ChmodCalculator from "./components/ChmodCalculator.svelte";
    import PxConverter from "./components/PxConverter.svelte";
    import PasswordGenerator from "./components/PasswordGenerator.svelte";
    import HmacGenerator from "./components/HmacGenerator.svelte";
    import StringCaseConverter from "./components/StringCaseConverter.svelte";
    import TextDedup from "./components/TextDedup.svelte";
    import LoremIpsum from "./components/LoremIpsum.svelte";
    import RegexTester from "./components/RegexTester.svelte";
    import DiffViewer from "./components/DiffViewer.svelte";
    import QrCodeGenerator from "./components/QrCodeGenerator.svelte";
    import KeycodeVisualizer from "./components/KeycodeVisualizer.svelte";
    import CidrCalculator from "./components/CidrCalculator.svelte";
    import UserAgentParser from "./components/UserAgentParser.svelte";
    import CurlConverter from "./components/CurlConverter.svelte";
    import SecretScanner from "./components/SecretScanner.svelte";
    import ApiViewer from "./components/ApiViewer.svelte";
    import SvgStudio from "./components/SvgStudio.svelte";
    import CssLab from "./components/CssLab.svelte";
    import ApiSpec from "./components/ApiSpec.svelte";
    import CodeFormatter from "./components/CodeFormatter.svelte";
    import MockGenerator from "./components/MockGenerator.svelte";
    import ChartsViewer from "./components/ChartsViewer.svelte";
    import YamlEditor from "../yaml-editor/components/YamlEditor.svelte";

    import {
        Shield,
        Type,
        Globe,
        Database,
        Settings,
        Hash,
        Key,
        FileJson,
        Calendar,
        Link,
        Code,
        Search,
        X,
        Clock,
        ChevronRight,
        ChevronDown,
        Menu,
        Palette,
        BarChart3,
        FileSpreadsheet,
        Layers,
    } from "lucide-svelte";

    type TabId =
        | "jwt"
        | "base64"
        | "url"
        | "cron"
        | "hash"
        | "uuid"
        | "password"
        | "hmac"
        | "json-ts"
        | "sql-fmt"
        | "color"
        | "px-rem"
        | "qrcode"
        | "keycode"
        | "chmod"
        | "timestamp"
        | "cidr"
        | "ua-parser"
        | "string-case"
        | "html-entity"
        | "lorem"
        | "text-dedup"
        | "regex"
        | "diff"
        | "curl"
        | "secret-scan"
        | "api-viewer"
        | "svg-studio"
        | "css-lab"
        | "api-spec"
        | "code-formatter"
        | "mock-generator"
        | "charts"
        | "yaml-editor";

    type UtilityItem = {
        id: TabId;
        label: string;
        description: string;
        icon: any;
        fullPageHref?: string;
    };

    type UtilityCategory = {
        name: string;
        description: string;
        icon: any;
        items: UtilityItem[];
    };

    // --- Component map ---
    const componentMap: Record<string, any> = {
        'jwt': JwtDecoder,
        'base64': Base64Converter,
        'url': UrlConverter,
        'cron': CronGenerator,
        'hash': HashCalculator,
        'uuid': UuidGenerator,
        'password': PasswordGenerator,
        'hmac': HmacGenerator,
        'json-ts': JsonConverter,
        'sql-fmt': SqlFormatter,
        'html-entity': HtmlEntity,
        'color': ColorConverter,
        'timestamp': TimestampConverter,
        'chmod': ChmodCalculator,
        'px-rem': PxConverter,
        'string-case': StringCaseConverter,
        'text-dedup': TextDedup,
        'lorem': LoremIpsum,
        'regex': RegexTester,
        'diff': DiffViewer,
        'qrcode': QrCodeGenerator,
        'keycode': KeycodeVisualizer,
        'cidr': CidrCalculator,
        'ua-parser': UserAgentParser,
        'curl': CurlConverter,
        'secret-scan': SecretScanner,
        'api-viewer': ApiViewer,
        'svg-studio': SvgStudio,
        'css-lab': CssLab,
        'api-spec': ApiSpec,
        'code-formatter': CodeFormatter,
        'mock-generator': MockGenerator,
        'charts': ChartsViewer,
        'yaml-editor': YamlEditor,
    };

    // --- Valid tab IDs set for URL hash validation ---
    const validTabs = new Set<string>(Object.keys(componentMap));

    // --- URL Hash sync: restore activeTab from hash on load ---
    function getInitialTab(): TabId {
        if (!browser) return "jwt";
        const hash = window.location.hash.replace("#", "");
        return validTabs.has(hash) ? (hash as TabId) : "jwt";
    }

    let activeTab = $state<TabId>(getInitialTab());
    let searchQuery = $state("");

    // --- Mobile sidebar control (bindable with ToolWorkspace) ---
    let mobileSidebarOpen = $state(false);

    // --- Search input ref for keyboard shortcut ---
    let searchInputEl: HTMLInputElement | undefined = $state();

    // --- Recently Used (localStorage-backed, max 5) ---
    const RECENT_KEY = "dev-utils-recent";

    function loadRecent(): TabId[] {
        if (!browser) return [];
        try {
            const raw = localStorage.getItem(RECENT_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveRecent(list: TabId[]) {
        if (!browser) return;
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(list));
        } catch { /* quota exceeded */ }
    }

    let recentTools = $state<TabId[]>(loadRecent());

    function trackRecent(id: TabId) {
        const updated = [id, ...recentTools.filter((t) => t !== id)].slice(0, 5);
        recentTools = updated;
        saveRecent(updated);
    }

    // --- Collapsed categories (localStorage-backed) ---
    const COLLAPSED_KEY = "dev-utils-collapsed";

    function loadCollapsed(): Set<string> {
        if (!browser) return new Set();
        try {
            const raw = localStorage.getItem(COLLAPSED_KEY);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
            return new Set();
        }
    }

    function saveCollapsed(set: Set<string>) {
        if (!browser) return;
        try {
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]));
        } catch { /* quota exceeded */ }
    }

    let collapsedCategories = $state<Set<string>>(loadCollapsed());

    function toggleCategory(name: string) {
        const next = new Set(collapsedCategories);
        if (next.has(name)) {
            next.delete(name);
        } else {
            next.add(name);
        }
        collapsedCategories = next;
        saveCollapsed(next);
    }

    // --- URL hash sync: set hash if not set on load ---
    onMount(() => {
        const handoff = dataBridge.consume("/developer-utilities");
        if (handoff && handoff.payload) {
            if (handoff.payload.startsWith("eyJ")) {
                selectTool("jwt");
            } else if (handoff.dataType === "sql") {
                selectTool("sql-fmt");
            } else if (handoff.dataType === "json") {
                selectTool("json-ts");
            } else if ((handoff.dataType as string) === "regex") {
                selectTool("regex");
            } else {
                selectTool("base64");
            }
        } else if (browser && !window.location.hash) {
            goto(`#${activeTab}`, { replaceState: true, noScroll: true, keepFocus: true });
        }
    });


    function selectTool(id: TabId) {
        activeTab = id;
        trackRecent(id);
        if (browser) {
            goto(`#${id}`, { replaceState: true, noScroll: true, keepFocus: true });
        }
    }

    // --- Keyboard navigation ---
    function handleKeydown(e: KeyboardEvent) {
        // Ctrl+K / Cmd+K → focus search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            searchInputEl?.focus();
            return;
        }

        // Esc → clear search and blur
        if (e.key === "Escape") {
            if (searchQuery) {
                searchQuery = "";
                searchInputEl?.blur();
                return;
            }
            searchInputEl?.blur();
            return;
        }

        // ↑/↓ arrow navigation — only when not typing in an input/textarea
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const activeEl = document.activeElement;
            const isTyping =
                activeEl instanceof HTMLInputElement ||
                activeEl instanceof HTMLTextAreaElement;
            if (isTyping) return;

            e.preventDefault();
            const flatItems = filteredCategories.flatMap((c) => c.items);
            const currentIndex = flatItems.findIndex((item) => item.id === activeTab);
            let nextIndex: number;

            if (e.key === "ArrowUp") {
                nextIndex = currentIndex <= 0 ? flatItems.length - 1 : currentIndex - 1;
            } else {
                nextIndex = currentIndex >= flatItems.length - 1 ? 0 : currentIndex + 1;
            }

            if (flatItems[nextIndex]) {
                selectTool(flatItems[nextIndex].id);
            }
        }
    }

    // --- Search highlighting helper ---
    function highlightMatch(text: string, query: string): string {
        if (!query) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery || !lowerText.includes(lowerQuery)) return text;

        const startIdx = lowerText.indexOf(lowerQuery);
        const before = text.slice(0, startIdx);
        const match = text.slice(startIdx, startIdx + lowerQuery.length);
        const after = text.slice(startIdx + lowerQuery.length);
        return `${before}<mark class="bg-amber-100 dark:bg-amber-900/40 text-inherit rounded px-0.5">${match}</mark>${after}`;
    }

    const categories: UtilityCategory[] = [
        {
            name: "安全与凭据 (Security & Auth)",
            description: "Token 调试、敏感凭据扫描、哈希与加解密签名计算。",
            icon: Shield,
            items: [
                {
                    id: "jwt",
                    label: "JWT Decoder",
                    description: "JWT 调试：Token 解码、标准 Claims 语义与 HMAC 验签。",
                    icon: Shield,
                },
                {
                    id: "secret-scan",
                    label: "Secret Scanner",
                    description: "敏感信息扫描：检测明文 API 密钥、Token 并一键环境变量脱敏。",
                    icon: Shield,
                },
                {
                    id: "hash",
                    label: "Hash Calculator",
                    description: "哈希计算：MD5, SHA-1, SHA-256, SHA-512 校验。",
                    icon: Hash,
                },
                {
                    id: "hmac",
                    label: "HMAC Generator",
                    description: "HMAC 签名：Webhook 与 API 消息签名计算。",
                    icon: Shield,
                },
                {
                    id: "password",
                    label: "Password Generator",
                    description: "密码生成：高强度随机密码与字符集规则定制。",
                    icon: Key,
                },
                {
                    id: "uuid",
                    label: "UUID Generator",
                    description: "UUID 生成：v4/v1 唯一标识符批量生成。",
                    icon: Key,
                },
            ],
        },
        {
            name: "网络与接口 (Network & API)",
            description: "cURL 转换、API 响应与契约规范、URL 编解码与网络计算。",
            icon: Globe,
            items: [
                {
                    id: "curl",
                    label: "cURL Converter",
                    description: "cURL 转换：快速转为 Fetch、Axios、Python、Go 代码。",
                    icon: Code,
                },
                {
                    id: "api-viewer",
                    label: "API Response / Types",
                    description: "API 响应分析：JSONPath 提取与 TypeScript 接口自动推导。",
                    icon: FileJson,
                },
                {
                    id: "api-spec",
                    label: "API Spec Designer",
                    description: "API 规范：OpenAPI 3.0 多端点树、契约设计与文档预览。",
                    icon: FileJson,
                },
                {
                    id: "url",
                    label: "URL Encoder & Parser",
                    description: "URL 编解码：百分号转义处理与 Query 参数解析。",
                    icon: Link,
                },
                {
                    id: "ua-parser",
                    label: "User Agent Parser",
                    description: "UA 分析：提取浏览器内核、操作系统与设备型号。",
                    icon: Search,
                },
                {
                    id: "cidr",
                    label: "CIDR Calculator",
                    description: "子网计算：IP 段掩码、广播地址与主机容量换算。",
                    icon: Globe,
                },
            ],
        },
        {
            name: "代码与转换 (Code & Transform)",
            description: "代码美化、类型推导、SQL 格式化、正则调试与 Diff 比对。",
            icon: Database,
            items: [
                {
                    id: "code-formatter",
                    label: "Code Formatter",
                    description: "代码格式化：Prettier 多语言美化、对齐与语法修复。",
                    icon: Code,
                },
                {
                    id: "diff",
                    label: "Diff Viewer",
                    description: "文本比对：双栏/单栏差异分析与 Git Patch 补丁生成。",
                    icon: Code,
                },
                {
                    id: "regex",
                    label: "Regex Tester",
                    description: "正则表达式：语法测试、修饰符与捕获组明细。",
                    icon: Search,
                },
                {
                    id: "json-ts",
                    label: "JSON to TS / Go",
                    description: "类型推导：根据 JSON 样本自动生成 TypeScript / Go 类型定义。",
                    icon: FileJson,
                },
                {
                    id: "sql-fmt",
                    label: "SQL Formatter",
                    description: "SQL 格式化：美化 SQL 查询并统一关键字大小写。",
                    icon: Database,
                },
                {
                    id: "base64",
                    label: "Base64 Converter",
                    description: "Base64 编解码：UTF-8 安全转码与 URL-Safe 转换。",
                    icon: FileJson,
                },
                {
                    id: "string-case",
                    label: "String Format",
                    description: "命名转换：camelCase、snake_case、PascalCase 快速互转。",
                    icon: Type,
                },
                {
                    id: "html-entity",
                    label: "HTML Entity",
                    description: "HTML 实体：特殊字符转义与还原。",
                    icon: Code,
                },
            ],
        },
        {
            name: "数据生成与分析 (Data & Analysis)",
            description: "结构化 Mock 数据模拟、多维图表可视化与 YAML 配置编辑。",
            icon: Database,
            items: [
                {
                    id: "mock-generator",
                    label: "Mock Generator",
                    description: "模拟数据：企业级 Schema 模板、JSON/SQL/CSV 真实数据生成。",
                    icon: FileSpreadsheet,
                },
                {
                    id: "charts",
                    label: "Data Charts",
                    description: "数据洞察：JSON/CSV 数据秒级渲染柱状图、折线图与热力图。",
                    icon: BarChart3,
                },
                {
                    id: "yaml-editor",
                    label: "YAML Editor",
                    description: "YAML 编辑：多文档可视化树形节点、语法校验与路径检索。",
                    icon: Layers,
                },
            ],
        },
        {
            name: "前端与界面 (Frontend & UI)",
            description: "色彩换算、像素单位、二维码与按键可视化调试。",
            icon: Type,
            items: [
                {
                    id: "color",
                    label: "Color Converter",
                    description: "颜色转换：HEX、RGB、HSL 色值互转与取色调配。",
                    icon: Globe,
                },
                {
                    id: "svg-studio",
                    label: "SVG Studio",
                    description: "SVG 编辑：图元 DOM 树、颜色替换、代码优化与组件导出。",
                    icon: Globe,
                },
                {
                    id: "css-lab",
                    label: "CSS Lab",
                    description: "CSS 实验：现代动效、磨砂玻璃与交互式样式沙箱。",
                    icon: Palette,
                },
                {
                    id: "px-rem",
                    label: "PX to REM",
                    description: "单位换算：CSS 像素与相对单位 REM / EM 计算。",
                    icon: Type,
                },
                {
                    id: "qrcode",
                    label: "QR Code Generator",
                    description: "二维码生成：URL 与文本一键生成二维码图像。",
                    icon: Code,
                },
                {
                    id: "keycode",
                    label: "Keycode Visualizer",
                    description: "按键可视化：JavaScript 键盘事件 KeyCode 实时捕获。",
                    icon: Code,
                },
                {
                    id: "lorem",
                    label: "Lorem Ipsum",
                    description: "占位文本：快速生成 UI 布局段落与模拟数据。",
                    icon: FileJson,
                },
            ],
        },
        {
            name: "系统与时间 (System & Time)",
            description: "时间戳转换、定时任务表达式、权限计算与文本清洗。",
            icon: Settings,
            items: [
                {
                    id: "timestamp",
                    label: "Unix Timestamp",
                    description: "Unix 时间戳：秒/毫秒时间戳与本地时间双向转换。",
                    icon: Calendar,
                },
                {
                    id: "cron",
                    label: "Cron Generator",
                    description: "Cron 表达式：定时任务调度规则生成与语义解析。",
                    icon: Calendar,
                },
                {
                    id: "chmod",
                    label: "Chmod Calculator",
                    description: "Linux 权限：八进制数值（如 755）与符号权限转换。",
                    icon: Shield,
                },
                {
                    id: "text-dedup",
                    label: "Text Dedup",
                    description: "文本去重：列表按行去重、空格裁剪与数据清洗。",
                    icon: FileJson,
                },
            ],
        },
    ];

    const totalToolCount = categories.reduce(
        (count, category) => count + category.items.length,
        0,
    );

    let filteredCategories = $derived.by(() => {
        const lowerQ = searchQuery.trim().toLowerCase();
        if (!lowerQ) return categories;

        return categories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter((item) => {
                    const searchableText = [
                        cat.name,
                        cat.description,
                        item.label,
                        item.description,
                    ]
                        .join(" ")
                        .toLowerCase();

                    return searchableText.includes(lowerQ);
                }),
            }))
            .filter((cat) => cat.items.length > 0);
    });

    let allItems = $derived(categories.flatMap((category) => category.items));
    let activeItem = $derived(
        allItems.find((item) => item.id === activeTab) ?? allItems[0],
    );
    let activeCategory = $derived(
        categories.find((category) =>
            category.items.some((item) => item.id === activeTab),
        ) ?? categories[0],
    );
    let visibleToolCount = $derived(
        filteredCategories.reduce(
            (count, category) => count + category.items.length,
            0,
        ),
    );

    // Derive recent items with full metadata
    let recentItems = $derived(
        recentTools
            .map((id) => allItems.find((item) => item.id === id))
            .filter((item): item is UtilityItem => !!item),
    );
</script>

<svelte:head>
    <title>Developer Utilities - Aone Toolkit</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<ToolWorkspace class="max-w-none w-full !px-2 !py-1 h-full" bind:sidebarOpen={mobileSidebarOpen}>
    {#snippet sidebar()}
    <aside
        class="w-full shrink-0 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-hidden lg:w-72"
    >
        <!-- Search -->
        <div class="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
            <div class="relative">
                <Search
                    size={14}
                    class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    type="text"
                    bind:this={searchInputEl}
                    bind:value={searchQuery}
                    placeholder="搜索工具…  ⌘K"
                    aria-label="Search developer utilities"
                    aria-describedby="developer-utilities-search-help"
                    class="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
                {#if searchQuery}
                    <button
                        type="button"
                        class="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Clear utility search"
                        onclick={() => (searchQuery = "")}
                    >
                        <X size={12} />
                    </button>
                {/if}
            </div>
            <div
                id="developer-utilities-search-help"
                class="mt-1.5 text-[11px] text-slate-400"
                aria-live="polite"
            >
                共 {visibleToolCount} / {totalToolCount} 款工具
            </div>
        </div>

        <!-- Navigation -->
        <nav
            aria-label="Developer utility categories"
            class="flex-1 overflow-y-auto px-2 py-2.5 space-y-2.5 custom-scrollbar"
        >
            <!-- Recently Used -->
            {#if recentItems.length > 0 && !searchQuery}
                <div class="space-y-0.5">
                    <div
                        class="px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <Clock size={11} />
                        最近使用
                    </div>
                    {#each recentItems as item}
                        <button
                            type="button"
                            aria-current={activeTab === item.id ? "page" : undefined}
                            class="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors group cursor-pointer
                            {activeTab === item.id
                                ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}"
                            onclick={() => selectTool(item.id)}
                        >
                            <item.icon
                                size={14}
                                class={activeTab === item.id
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}
                            />
                            <span class="truncate">{item.label}</span>
                        </button>
                    {/each}
                </div>
                <div class="border-b border-slate-200 dark:border-slate-800 mx-2"></div>
            {/if}

            {#each filteredCategories as category}
                <div class="space-y-0.5">
                    <!-- Collapsible category header -->
                    <button
                        type="button"
                        class="w-full px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-pointer"
                        title={category.description}
                        onclick={() => toggleCategory(category.name)}
                        aria-expanded={!collapsedCategories.has(category.name)}
                    >
                        {#if collapsedCategories.has(category.name)}
                            <ChevronRight size={11} class="shrink-0" />
                        {:else}
                            <ChevronDown size={11} class="shrink-0" />
                        {/if}
                        <category.icon size={12} class="shrink-0 text-slate-400" />
                        <span class="truncate">{category.name}</span>
                        <span class="badge badge-slate ml-auto text-[9px] tabular-nums">
                            {category.items.length}
                        </span>
                    </button>

                    {#if !collapsedCategories.has(category.name)}
                        <div transition:slide={{ duration: 120 }} class="space-y-0.5 pt-0.5">
                            {#each category.items as item}
                                <button
                                    type="button"
                                    aria-current={activeTab === item.id ? "page" : undefined}
                                    class="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors group cursor-pointer
                                    {activeTab === item.id
                                        ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}"
                                    onclick={() => selectTool(item.id)}
                                >
                                    <item.icon
                                        size={14}
                                        class={activeTab === item.id
                                            ? "text-slate-900 dark:text-white"
                                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}
                                    />
                                    {#if searchQuery}
                                        <span class="truncate">{@html highlightMatch(item.label, searchQuery)}</span>
                                    {:else}
                                        <span class="truncate">{item.label}</span>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}

            {#if filteredCategories.length === 0}
                <EmptyState
                    icon={Search}
                    title="未找到匹配工具"
                    description={`未搜索到匹配 "${searchQuery.trim()}" 的工具`}
                    actionLabel="清空搜索"
                    onAction={() => (searchQuery = '')}
                    compact={true}
                />
            {/if}
        </nav>
    </aside>
    {/snippet}

    <!-- Main Content -->
    <main
        class="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden bg-white dark:bg-slate-900"
    >
        <header
            class="shrink-0 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900 z-20"
        >
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div class="flex min-w-0 items-center gap-3">
                    <!-- Mobile sidebar toggle -->
                    <button
                        type="button"
                        class="lg:hidden shrink-0 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle sidebar"
                        onclick={() => (mobileSidebarOpen = !mobileSidebarOpen)}
                    >
                        <Menu size={18} />
                    </button>
                    <div
                        class="shrink-0 p-1.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs"
                    >
                        <activeItem.icon size={16} />
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>开发者工具箱</span>
                            <span>/</span>
                            <span class="font-medium text-slate-600 dark:text-slate-300">{activeCategory.name}</span>
                        </div>
                        <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {activeItem.label}
                        </h2>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <HandoffDropdown
                        sourceTool={`开发者工具箱 - ${activeItem.label}`}
                        dataType="text"
                        getData={() => window.location.href}
                    />
                    <button
                        type="button"
                        onclick={() => copyToClipboard(window.location.href, activeItem.label + " link")}
                        class="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                    >
                        <Link size={12} class="mr-1" /> 复制链接
                    </button>

                    {#if activeItem.fullPageHref}
                        <a
                            href={`${base}${activeItem.fullPageHref}`}
                            class="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            独立页面
                        </a>
                    {/if}
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
            <div class="max-w-[1500px] mx-auto w-full h-full">
                {#if componentMap[activeTab]}
                    {@const ActiveComponent = componentMap[activeTab]}
                    <ActiveComponent />
                {/if}
            </div>
        </div>
    </main>
</ToolWorkspace>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.5);
    }
</style>
