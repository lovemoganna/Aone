<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        MonitorSmartphone,
        Copy,
        RefreshCw,
        Sparkles,
        Globe,
        Cpu,
        Laptop,
        Smartphone,
        Tablet,
        Bot,
        Trash2,
        Check
    } from "lucide-svelte";
    import { CodeEditor } from "$lib/components/ui";

    let userAgent = $state(
        typeof navigator !== "undefined"
            ? navigator.userAgent
            : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    );

    const PRESETS = [
        {
            name: "Chrome (Win 11)",
            ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        {
            name: "Safari (iPhone 15)",
            ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1"
        },
        {
            name: "Chrome (Android 14)",
            ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36"
        },
        {
            name: "Edge (Mac M3)",
            ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.67"
        },
        {
            name: "Googlebot (爬虫)",
            ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        }
    ];

    function firstMatch(patterns: Array<[RegExp, string | ((match: RegExpMatchArray) => string)]>) {
        for (const [pattern, resolver] of patterns) {
            const match = userAgent.match(pattern);
            if (match) {
                return typeof resolver === "function" ? resolver(match) : resolver;
            }
        }
        return "未知";
    }

    const parsed = $derived.by(() => {
        const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent);

        const browser = firstMatch([
            [/Edg\/([\d.]+)/, (m) => `Microsoft Edge ${m[1]}`],
            [/OPR\/([\d.]+)/, (m) => `Opera ${m[1]}`],
            [/Chrome\/([\d.]+)/, (m) => `Chrome ${m[1]}`],
            [/Firefox\/([\d.]+)/, (m) => `Firefox ${m[1]}`],
            [/Version\/([\d.]+).*Safari\//, (m) => `Safari ${m[1]}`],
            [/Googlebot\/([\d.]+)/, (m) => `Googlebot ${m[1]}`],
        ]);

        const engine = firstMatch([
            [/AppleWebKit\/([\d.]+)/, (m) => `WebKit (${m[1]})`],
            [/Gecko\/([\d.]+)/, (m) => `Gecko / SpiderMonkey`],
            [/Trident\/([\d.]+)/, (m) => `Trident (${m[1]})`],
            [/Blink/i, "Blink (Chromium)"]
        ]);

        const os = firstMatch([
            [/Windows NT 10\.0/, "Windows 10 / 11"],
            [/Windows NT 6\.3/, "Windows 8.1"],
            [/Windows NT 6\.1/, "Windows 7"],
            [/Mac OS X ([\d_]+)/, (m) => `macOS ${m[1].replace(/_/g, ".")}`],
            [/Android ([\d.]+)/, (m) => `Android ${m[1]}`],
            [/(iPhone|iPad).*OS ([\d_]+)/, (m) => `iOS ${m[2].replace(/_/g, ".")}`],
            [/Linux/, "Linux"],
        ]);

        let deviceType = "Desktop (桌面端)";
        if (isBot) {
            deviceType = "Bot / Spider (搜索引擎爬虫)";
        } else if (/iPad|Tablet/i.test(userAgent)) {
            deviceType = "Tablet (平板设备)";
        } else if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
            deviceType = "Mobile (移动智能手机)";
        }

        const architecture = firstMatch([
            [/Win64|x64|x86_64|amd64/i, "x86_64 (64-bit)"],
            [/WOW64/i, "WOW64 (32-bit on 64-bit)"],
            [/arm64|aarch64/i, "ARM64 (Apple Silicon / ARM)"],
            [/arm/i, "ARM 32-bit"],
        ]);

        return { browser, engine, os, deviceType, architecture, isBot };
    });

    function loadCurrentUA() {
        if (typeof navigator !== "undefined") {
            userAgent = navigator.userAgent;
            toastStore.success("已读取当前浏览器 User-Agent");
        }
    }

    function applyPreset(p: typeof PRESETS[0]) {
        userAgent = p.ua;
        toastStore.info(`已应用预设：${p.name}`);
    }

    function copyVal(val: string, label: string) {
        copyToClipboard(val, label);
        toastStore.success(`已复制 ${label}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <MonitorSmartphone size={13} class="text-sky-500" />
                User-Agent 客户端分析器
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => applyPreset(p)}
                >
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={loadCurrentUA}
                title="读取当前浏览器 UA"
            >
                <RefreshCw size={12} />
                <span>我的 UA</span>
            </button>
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                onclick={() => (userAgent = "")}
                title="清空"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Raw User-Agent Input (5 cols) -->
        <div class="lg:col-span-5 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <span class="flex items-center gap-1.5">
                    <Globe size={13} class="text-slate-500" />
                    原始 User-Agent 字符串
                </span>
                <span class="text-[10px] text-slate-400 font-mono">{userAgent.length} 字符</span>
            </div>
            <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                <CodeEditor
                    bind:value={userAgent}
                    placeholder="在此粘贴 HTTP 请求头中的 User-Agent 字符串..."
                />
            </div>
        </div>

        <!-- Right: Structured Visual Analysis Cards (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">结构化解析诊断</span>
                <button
                    type="button"
                    onclick={() => copyVal(JSON.stringify(parsed, null, 2), "解析结果 JSON")}
                    class="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium"
                >
                    <Copy size={11} /> 导出 JSON
                </button>
            </div>

            <!-- Analysis Grid -->
            <div class="flex-1 overflow-auto p-3.5 space-y-3 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                <!-- Device & System Summary Card -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <!-- Browser Card -->
                    <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Globe size={12} class="text-sky-500" /> 浏览器 (Browser)
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{parsed.browser}</span>
                            <button onclick={() => copyVal(parsed.browser, "浏览器名称")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                <Copy size={12} />
                            </button>
                        </div>
                    </div>

                    <!-- OS Card -->
                    <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Laptop size={12} class="text-indigo-500" /> 操作系统 (OS)
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{parsed.os}</span>
                            <button onclick={() => copyVal(parsed.os, "操作系统")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                <Copy size={12} />
                            </button>
                        </div>
                    </div>

                    <!-- Device Type Card -->
                    <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Smartphone size={12} class="text-emerald-500" /> 设备形态 (Device)
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{parsed.deviceType}</span>
                            <button onclick={() => copyVal(parsed.deviceType, "设备类型")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                <Copy size={12} />
                            </button>
                        </div>
                    </div>

                    <!-- Architecture Card -->
                    <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Cpu size={12} class="text-amber-500" /> 处理器架构 (CPU Arch)
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{parsed.architecture}</span>
                            <button onclick={() => copyVal(parsed.architecture, "CPU 架构")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                <Copy size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Rendering Engine & Meta Breakdown Table -->
                <div class="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs font-sans text-xs">
                    <div class="p-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        详细特征指标
                    </div>
                    <div class="divide-y divide-slate-100 dark:divide-slate-800/60">
                        <div class="grid grid-cols-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/40">
                            <span class="text-slate-400 font-medium">渲染内核 (Engine)</span>
                            <span class="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-semibold">{parsed.engine}</span>
                        </div>
                        <div class="grid grid-cols-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/40">
                            <span class="text-slate-400 font-medium">爬虫/机器人 (Bot Flag)</span>
                            <span class="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                                {#if parsed.isBot}
                                    <span class="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                                        检测到爬虫标识
                                    </span>
                                {:else}
                                    <span class="text-emerald-600 dark:text-emerald-400">常规用户客户端 (Non-bot)</span>
                                {/if}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

