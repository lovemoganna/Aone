<script lang="ts">
    import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { page } from "$app/stores";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { dataBridge } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { EmptyState } from "$lib/components/ui";

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
        Palette,
        BarChart3,
        FileSpreadsheet,
        Layers,
        Trash2,
        ExternalLink,
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
        badge?: string;
        fullPageHref?: string;
    };

    type UtilityCategory = {
        key: string;
        name: string;
        shortName: string;
        description: string;
        icon: any;
        theme: {
            text: string;
            bg: string;
            border: string;
            dot: string;
        };
        items: UtilityItem[];
    };

    // --- Component map ---
    const componentMap: Record<string, any> = {
        "jwt": JwtDecoder,
        "base64": Base64Converter,
        "url": UrlConverter,
        "cron": CronGenerator,
        "hash": HashCalculator,
        "uuid": UuidGenerator,
        "password": PasswordGenerator,
        "hmac": HmacGenerator,
        "json-ts": JsonConverter,
        "sql-fmt": SqlFormatter,
        "html-entity": HtmlEntity,
        "color": ColorConverter,
        "timestamp": TimestampConverter,
        "chmod": ChmodCalculator,
        "px-rem": PxConverter,
        "string-case": StringCaseConverter,
        "text-dedup": TextDedup,
        "lorem": LoremIpsum,
        "regex": RegexTester,
        "diff": DiffViewer,
        "qrcode": QrCodeGenerator,
        "keycode": KeycodeVisualizer,
        "cidr": CidrCalculator,
        "ua-parser": UserAgentParser,
        "curl": CurlConverter,
        "secret-scan": SecretScanner,
        "api-viewer": ApiViewer,
        "svg-studio": SvgStudio,
        "css-lab": CssLab,
        "api-spec": ApiSpec,
        "code-formatter": CodeFormatter,
        "mock-generator": MockGenerator,
        "charts": ChartsViewer,
        "yaml-editor": YamlEditor,
    };

    // --- Valid tab IDs set for URL hash validation ---
    const validTabs = new Set<string>(Object.keys(componentMap));

    // --- Categories with refined visual themes ---
    const categories: UtilityCategory[] = [
        {
            key: "security",
            name: "安全与凭据 (Security & Auth)",
            shortName: "安全",
            description: "Token 调试、敏感凭据扫描、哈希与加解密签名计算。",
            icon: Shield,
            theme: {
                text: "text-indigo-600 dark:text-indigo-400",
                bg: "bg-indigo-50 dark:bg-indigo-950/40",
                border: "border-indigo-200/60 dark:border-indigo-800/60",
                dot: "bg-indigo-500",
            },
            items: [
                {
                    id: "jwt",
                    label: "JWT Decoder",
                    description: "JWT 调试：Token 解码、标准 Claims 语义与 HMAC 验签。",
                    icon: Shield,
                    badge: "Auth",
                },
                {
                    id: "secret-scan",
                    label: "Secret Scanner",
                    description: "敏感信息扫描：检测明文 API 密钥、Token 并一键环境变量脱敏。",
                    icon: Shield,
                    badge: "Security",
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
            key: "network",
            name: "网络与接口 (Network & API)",
            shortName: "网络",
            description: "cURL 转换、API 响应与契约规范、URL 编解码与网络计算。",
            icon: Globe,
            theme: {
                text: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-50 dark:bg-sky-950/40",
                border: "border-sky-200/60 dark:border-sky-800/60",
                dot: "bg-sky-500",
            },
            items: [
                {
                    id: "curl",
                    label: "cURL Converter",
                    description: "cURL 转换：快速转为 Fetch、Axios、Python、Go 代码。",
                    icon: Code,
                    badge: "cURL",
                },
                {
                    id: "api-viewer",
                    label: "API Response / Types",
                    description: "API 响应分析：JSONPath 提取与 TypeScript 接口自动推导。",
                    icon: FileJson,
                    badge: "Types",
                },
                {
                    id: "api-spec",
                    label: "API Spec Designer",
                    description: "API 规范：OpenAPI 3.0 多端点树、契约设计与文档预览。",
                    icon: FileJson,
                    badge: "OpenAPI",
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
            key: "code",
            name: "代码与转换 (Code & Transform)",
            shortName: "代码",
            description: "代码美化、类型推导、SQL 格式化、正则调试与 Diff 比对。",
            icon: Code,
            theme: {
                text: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
                border: "border-emerald-200/60 dark:border-emerald-800/60",
                dot: "bg-emerald-500",
            },
            items: [
                {
                    id: "code-formatter",
                    label: "Code Formatter",
                    description: "代码格式化：Prettier 多语言美化、对齐与语法修复。",
                    icon: Code,
                    badge: "Prettier",
                },
                {
                    id: "diff",
                    label: "Diff Viewer",
                    description: "文本比对：双栏/单栏差异分析与 Git Patch 补丁生成。",
                    icon: Code,
                    badge: "Diff",
                },
                {
                    id: "regex",
                    label: "Regex Tester",
                    description: "正则表达式：语法测试、修饰符与捕获组明细。",
                    icon: Search,
                    badge: "Regex",
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
            key: "data",
            name: "数据生成与分析 (Data & Analysis)",
            shortName: "数据",
            description: "结构化 Mock 数据模拟、多维图表可视化与 YAML 配置编辑。",
            icon: Database,
            theme: {
                text: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-950/40",
                border: "border-amber-200/60 dark:border-amber-800/60",
                dot: "bg-amber-500",
            },
            items: [
                {
                    id: "mock-generator",
                    label: "Mock Generator",
                    description: "模拟数据：企业级 Schema 模板、JSON/SQL/CSV 真实数据生成。",
                    icon: FileSpreadsheet,
                    badge: "Mock",
                },
                {
                    id: "charts",
                    label: "Data Charts",
                    description: "数据洞察：JSON/CSV 数据秒级渲染柱状图、折线图与热力图。",
                    icon: BarChart3,
                    badge: "Charts",
                },
                {
                    id: "yaml-editor",
                    label: "YAML Editor",
                    description: "YAML 编辑：多文档可视化树形节点、语法校验与路径检索。",
                    icon: Layers,
                    badge: "YAML",
                },
            ],
        },
        {
            key: "frontend",
            name: "前端与界面 (Frontend & UI)",
            shortName: "界面",
            description: "色彩换算、像素单位、SVG编辑、二维码与按键可视化调试。",
            icon: Palette,
            theme: {
                text: "text-rose-600 dark:text-rose-400",
                bg: "bg-rose-50 dark:bg-rose-950/40",
                border: "border-rose-200/60 dark:border-rose-800/60",
                dot: "bg-rose-500",
            },
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
                    badge: "SVG",
                },
                {
                    id: "css-lab",
                    label: "CSS Lab",
                    description: "CSS 实验：现代动效、磨砂玻璃与交互式样式沙箱。",
                    icon: Palette,
                    badge: "CSS",
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
            key: "system",
            name: "系统与时间 (System & Time)",
            shortName: "系统",
            description: "时间戳转换、定时任务表达式、权限计算与文本清洗。",
            icon: Settings,
            theme: {
                text: "text-slate-600 dark:text-slate-400",
                bg: "bg-slate-100 dark:bg-slate-800/60",
                border: "border-slate-300/60 dark:border-slate-700/60",
                dot: "bg-slate-500",
            },
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
                    badge: "Cron",
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

    // --- URL Hash sync: restore activeTab from hash on load ---
    function getInitialTab(): TabId {
        if (!browser) return "jwt";
        const hash = window.location.hash.replace("#", "");
        return validTabs.has(hash) ? (hash as TabId) : "jwt";
    }

    let activeTab = $state<TabId>(getInitialTab());
    let searchQuery = $state("");
    let selectedCategoryFilter = $state<string>("all");
    let sidebarOpen = $state(true);
    let searchInputEl: HTMLInputElement | undefined = $state();

    // --- Recently Used (localStorage-backed, max 6) ---
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
        const updated = [id, ...recentTools.filter((t) => t !== id)].slice(0, 6);
        recentTools = updated;
        saveRecent(updated);
    }

    function clearRecent() {
        recentTools = [];
        saveRecent([]);
        toastStore.info("已清空最近使用记录");
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

    // --- Tool selection handler ---
    function selectTool(id: TabId) {
        if (activeTab === id) return;
        activeTab = id;
        trackRecent(id);
        if (browser) {
            goto(`${base}/developer-utilities#${id}`, { replaceState: false, noScroll: true, keepFocus: true });
        }
    }

    // --- Synchronize active tab from current URL hash reactively ---
    $effect(() => {
        const rawHash = ($page.url.hash || "").replace("#", "");
        if (rawHash && validTabs.has(rawHash) && rawHash !== activeTab) {
            activeTab = rawHash as TabId;
            trackRecent(rawHash as TabId);
        }
    });

    function syncFromLocation() {
        if (!browser) return;
        const hash = window.location.hash.replace("#", "");
        if (hash && validTabs.has(hash) && hash !== activeTab) {
            activeTab = hash as TabId;
            trackRecent(hash as TabId);
        }
    }

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
        } else if (browser) {
            const hash = window.location.hash.replace("#", "");
            if (validTabs.has(hash)) {
                activeTab = hash as TabId;
                trackRecent(hash as TabId);
            } else if (!window.location.hash) {
                goto(`${base}/developer-utilities#${activeTab}`, { replaceState: true, noScroll: true, keepFocus: true });
            }
        }

        window.addEventListener("hashchange", syncFromLocation);
        window.addEventListener("popstate", syncFromLocation);

        return () => {
            window.removeEventListener("hashchange", syncFromLocation);
            window.removeEventListener("popstate", syncFromLocation);
        };
    });

    // --- Keyboard navigation ---
    function handleKeydown(e: KeyboardEvent) {
        // Ctrl+K / Cmd+K → focus search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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
        return `${before}<mark class="bg-amber-200/80 dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 rounded px-0.5 font-semibold">${match}</mark>${after}`;
    }

    const totalToolCount = categories.reduce(
        (count, category) => count + category.items.length,
        0,
    );

    let filteredCategories = $derived.by(() => {
        const lowerQ = searchQuery.trim().toLowerCase();
        let list = categories;

        if (selectedCategoryFilter !== "all") {
            list = list.filter((cat) => cat.key === selectedCategoryFilter);
        }

        if (!lowerQ) return list;

        return list
            .map((cat) => ({
                ...cat,
                items: cat.items.filter((item) => {
                    const searchableText = [
                        cat.name,
                        cat.shortName,
                        cat.description,
                        item.label,
                        item.description,
                        item.badge ?? "",
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

    let recentItems = $derived(
        recentTools
            .map((id) => allItems.find((item) => item.id === id))
            .filter((item): item is UtilityItem => !!item),
    );

    function handleCopyLink() {
        const url = `${window.location.origin}${base}/developer-utilities#${activeTab}`;
        copyToClipboard(url, `${activeItem.label} 链接`);
        toastStore.success(`已复制 ${activeItem.label} 直达链接`);
    }
</script>

<svelte:head>
    <title>{activeItem.label} - 开发者工具箱 - Aone Toolkit</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<ToolWorkspace
    class="max-w-none w-full !px-2 !py-1 h-full"
    bind:sidebarOpen={sidebarOpen}
>
    {#snippet header()}
        <div class="flex items-center justify-between w-full min-w-0 select-none text-xs gap-3">
            <!-- Left Info Cluster -->
            <div class="flex items-center gap-2.5 min-w-0">
                <div
                    class="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs transition-colors {activeCategory.theme.bg} {activeCategory.theme.border} {activeCategory.theme.text}"
                >
                    <activeItem.icon size={15} />
                </div>
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-slate-400 dark:text-slate-500 hidden sm:inline">开发者工具箱</span>
                    <span class="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
                    <span class="font-medium text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                        {activeCategory.name.split(" ")[0]}
                    </span>
                    <span class="text-slate-300 dark:text-slate-600 hidden md:inline">/</span>
                    <h1 class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight truncate">
                        {activeItem.label}
                    </h1>
                    {#if activeItem.badge}
                        <span class="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium {activeCategory.theme.bg} {activeCategory.theme.text} border {activeCategory.theme.border}">
                            {activeItem.badge}
                        </span>
                    {/if}
                </div>
            </div>

            <!-- Right Action Cluster -->
            <div class="flex items-center gap-1.5 shrink-0">
                <HandoffDropdown
                    sourceTool={`开发者工具箱 - ${activeItem.label}`}
                    dataType="text"
                    getData={() => window.location.href}
                />

                <button
                    type="button"
                    onclick={handleCopyLink}
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition shadow-2xs cursor-pointer"
                    title="复制当前微工具的直接访问链接"
                >
                    <Link size={12} class="text-slate-400 group-hover:text-slate-600" />
                    <span class="hidden sm:inline">复制直达链接</span>
                </button>

                {#if activeItem.fullPageHref}
                    <a
                        href={`${base}${activeItem.fullPageHref}`}
                        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 transition shadow-2xs"
                        title="打开全屏独立工作台页面"
                    >
                        <ExternalLink size={12} />
                        <span class="hidden sm:inline">独立页面</span>
                    </a>
                {/if}
            </div>
        </div>
    {/snippet}

    {#snippet sidebar()}
        <aside class="flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden select-none">
            <!-- Search & Filter Bar -->
            <div class="p-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm space-y-2">
                <div class="relative">
                    <Search
                        size={13}
                        class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        bind:this={searchInputEl}
                        bind:value={searchQuery}
                        placeholder="搜索 34+ 款微工具… ⌘K"
                        aria-label="搜索开发者工具箱"
                        class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
                    />
                    {#if searchQuery}
                        <button
                            type="button"
                            class="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                            aria-label="清空搜索"
                            onclick={() => (searchQuery = "")}
                        >
                            <X size={12} />
                        </button>
                    {/if}
                </div>

                <!-- Quick Category Filter Chips -->
                <div class="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar text-[11px]">
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer {selectedCategoryFilter === 'all'
                            ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'}"
                        onclick={() => (selectedCategoryFilter = "all")}
                    >
                        全部 ({totalToolCount})
                    </button>
                    {#each categories as cat}
                        <button
                            type="button"
                            class="px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer {selectedCategoryFilter === cat.key
                                ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'}"
                            onclick={() => (selectedCategoryFilter = cat.key)}
                        >
                            {cat.shortName}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Navigation Tree -->
            <nav
                aria-label="开发者工具分类导航"
                class="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar"
            >
                <!-- Recently Used Section -->
                {#if recentItems.length > 0 && !searchQuery && selectedCategoryFilter === 'all'}
                    <div class="space-y-1">
                        <div class="px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            <span class="flex items-center gap-1.5">
                                <Clock size={11} />
                                最近使用
                            </span>
                            <button
                                type="button"
                                onclick={clearRecent}
                                class="hover:text-rose-500 transition cursor-pointer p-0.5 rounded"
                                title="清空最近记录"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                        <div class="grid grid-cols-2 gap-1">
                            {#each recentItems as item}
                                <button
                                    type="button"
                                    aria-current={activeTab === item.id ? "page" : undefined}
                                    class="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-lg transition-all group cursor-pointer text-left truncate {activeTab === item.id
                                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                                        : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}"
                                    onclick={() => selectTool(item.id)}
                                    title={item.description}
                                >
                                    <item.icon
                                        size={13}
                                        class="shrink-0 {activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}"
                                    />
                                    <span class="truncate text-[11px]">{item.label}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                    <div class="border-b border-slate-200/70 dark:border-slate-800/70 mx-1"></div>
                {/if}

                <!-- Category Tool List -->
                {#each filteredCategories as category}
                    <div class="space-y-0.5">
                        <!-- Category Header -->
                        <button
                            type="button"
                            class="w-full px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/50 cursor-pointer group"
                            title={category.description}
                            onclick={() => toggleCategory(category.name)}
                            aria-expanded={!collapsedCategories.has(category.name)}
                        >
                            {#if collapsedCategories.has(category.name)}
                                <ChevronRight size={12} class="shrink-0 text-slate-400 group-hover:text-slate-600 transition" />
                            {:else}
                                <ChevronDown size={12} class="shrink-0 text-slate-400 group-hover:text-slate-600 transition" />
                            {/if}
                            <div class="w-4 h-4 rounded flex items-center justify-center {category.theme.bg} {category.theme.text}">
                                <category.icon size={11} class="shrink-0" />
                            </div>
                            <span class="truncate font-semibold tracking-normal text-slate-700 dark:text-slate-300">
                                {category.name}
                            </span>
                            <span class="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full {category.theme.bg} {category.theme.text} tabular-nums">
                                {category.items.length}
                            </span>
                        </button>

                        <!-- Category Items -->
                        {#if !collapsedCategories.has(category.name)}
                            <div transition:slide={{ duration: 120 }} class="space-y-0.5 ml-2.5 pl-2 border-l border-slate-200/80 dark:border-slate-800/80 pt-0.5">
                                {#each category.items as item}
                                    {@const isCurrent = activeTab === item.id}
                                    <button
                                        type="button"
                                        aria-current={isCurrent ? "page" : undefined}
                                        class="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all group cursor-pointer text-left {isCurrent
                                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold border-l-2 border-indigo-600 dark:border-indigo-400 shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}"
                                        onclick={() => selectTool(item.id)}
                                        title={item.description}
                                    >
                                        <item.icon
                                            size={14}
                                            class="shrink-0 transition-colors {isCurrent
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}"
                                        />
                                        <div class="flex-1 min-w-0">
                                            <div class="truncate text-xs">
                                                {#if searchQuery}
                                                    {@html highlightMatch(item.label, searchQuery)}
                                                {:else}
                                                    {item.label}
                                                {/if}
                                            </div>
                                        </div>
                                        {#if item.badge}
                                            <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 shrink-0">
                                                {item.badge}
                                            </span>
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}

                <!-- Empty Search State -->
                {#if filteredCategories.length === 0}
                    <div class="py-8 px-3">
                        <EmptyState
                            icon={Search}
                            title="未找到匹配微工具"
                            description={`未搜索到匹配 "${searchQuery.trim()}" 的工具项目`}
                            actionLabel="清空搜索条件"
                            onAction={() => {
                                searchQuery = "";
                                selectedCategoryFilter = "all";
                            }}
                            compact={true}
                        />
                    </div>
                {/if}
            </nav>

            <!-- Sidebar Footer Tips -->
            <div class="p-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] text-slate-400 flex items-center justify-between">
                <span>共 {visibleToolCount} / {totalToolCount} 款工具</span>
                <span class="font-mono">⌘K 搜索 · ↑↓ 切换</span>
            </div>
        </aside>
    {/snippet}

    <!-- Main Workspace Content -->
    <main class="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
        <div class="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar">
            <div class="max-w-[1500px] mx-auto w-full h-full">
                {#key activeTab}
                    <div in:fade={{ duration: 120 }} class="h-full">
                        {#if componentMap[activeTab]}
                            {@const ActiveComponent = componentMap[activeTab]}
                            <ActiveComponent />
                        {/if}
                    </div>
                {/key}
            </div>
        </div>
    </main>
</ToolWorkspace>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.25);
        border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.45);
    }
</style>
