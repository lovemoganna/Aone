<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Clock,
        Copy,
        Play,
        Pause,
        Calendar,
        Globe,
        Sparkles,
        Check
    } from "lucide-svelte";

    let isPaused = $state(false);
    let unitMode = $state<"sec" | "ms">("sec");
    let nowSec = $state(Math.floor(Date.now() / 1000));
    let nowMs = $state(Date.now());
    let input = $state(Math.floor(Date.now() / 1000).toString());
    let copiedKey = $state<string | null>(null);

    // Live clock ticker
    $effect(() => {
        const interval = setInterval(() => {
            if (!isPaused) {
                const cur = Date.now();
                nowMs = cur;
                nowSec = Math.floor(cur / 1000);
            }
        }, 500);
        return () => clearInterval(interval);
    });

    let currentTimestamp = $derived(unitMode === "sec" ? nowSec : nowMs);

    let parsedResult = $derived.by(() => {
        if (!input.trim()) return null;
        const val = input.trim();
        let d: Date | null = null;

        if (/^\d+$/.test(val)) {
            const num = parseInt(val, 10);
            if (val.length > 11) {
                d = new Date(num);
            } else {
                d = new Date(num * 1000);
            }
        } else {
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) {
                d = parsed;
            }
        }

        if (!d || isNaN(d.getTime())) return null;

        const timeMs = d.getTime();
        const timeSec = Math.floor(timeMs / 1000);
        const diffMs = timeMs - Date.now();
        const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);

        let relTime = "刚刚";
        if (absDiffSec >= 86400) {
            const days = Math.floor(absDiffSec / 86400);
            relTime = diffMs > 0 ? `${days} 天后` : `${days} 天前`;
        } else if (absDiffSec >= 3600) {
            const hrs = Math.floor(absDiffSec / 3600);
            relTime = diffMs > 0 ? `${hrs} 小时后` : `${hrs} 小时前`;
        } else if (absDiffSec >= 60) {
            const mins = Math.floor(absDiffSec / 60);
            relTime = diffMs > 0 ? `${mins} 分钟后` : `${mins} 分钟前`;
        } else if (absDiffSec > 0) {
            relTime = diffMs > 0 ? `${absDiffSec} 秒后` : `${absDiffSec} 秒前`;
        }

        const formatZone = (tz: string) => {
            try {
                return d!.toLocaleString("zh-CN", {
                    timeZone: tz,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                });
            } catch {
                return "时区解析错误";
            }
        };

        return {
            sec: timeSec.toString(),
            ms: timeMs.toString(),
            local: d.toLocaleString("zh-CN", { hour12: false }),
            utc: d.toUTCString(),
            iso: d.toISOString(),
            relative: relTime,
            beijing: formatZone("Asia/Shanghai"),
            tokyo: formatZone("Asia/Tokyo"),
            london: formatZone("Europe/London"),
            newYork: formatZone("America/New_York"),
            losAngeles: formatZone("America/Los_Angeles"),
        };
    });

    const PRESETS = [
        { label: "当前时间 (NOW)", val: () => (unitMode === "sec" ? nowSec : nowMs).toString() },
        { label: "今日零点", val: () => { const d = new Date(); d.setHours(0,0,0,0); return (unitMode === "sec" ? Math.floor(d.getTime()/1000) : d.getTime()).toString(); } },
        { label: "昨天此时", val: () => ((unitMode === "sec" ? nowSec : nowMs) - (unitMode === "sec" ? 86400 : 86400000)).toString() },
        { label: "明天此时", val: () => ((unitMode === "sec" ? nowSec : nowMs) + (unitMode === "sec" ? 86400 : 86400000)).toString() },
        { label: "今年元旦", val: () => { const d = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0); return (unitMode === "sec" ? Math.floor(d.getTime()/1000) : d.getTime()).toString(); } },
    ];

    function copyVal(v: string, key: string) {
        copyToClipboard(v, key);
        copiedKey = key;
        toastStore.success(`已复制 ${key}: ${v}`);
        setTimeout(() => {
            if (copiedKey === key) copiedKey = null;
        }, 1500);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Clock size={13} class="text-sky-500" />
                Unix 时间戳与时区转换器
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {unitMode === 'sec' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => { unitMode = "sec"; }}
                >
                    秒 (s · 10位)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {unitMode === 'ms' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => { unitMode = "ms"; }}
                >
                    毫秒 (ms · 13位)
                </button>
            </div>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => (input = p.val())}
                >
                    {p.label}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                onclick={() => (isPaused = !isPaused)}
                title={isPaused ? "继续时间跳动" : "暂停时间跳动"}
            >
                {#if isPaused}
                    <Play size={13} class="text-emerald-500 fill-emerald-500" />
                {:else}
                    <Pause size={13} class="text-amber-500 fill-amber-500" />
                {/if}
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Live Clock HUD & Input Bar (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Big Real-time Epoch Clock Card -->
            <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col items-center justify-center space-y-2 shrink-0">
                <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span class="w-2 h-2 rounded-full {isPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}"></span>
                    当前 UNIX 时间戳 ({unitMode.toUpperCase()})
                </div>
                <div class="font-mono text-2xl md:text-3xl font-bold tracking-wider text-slate-900 dark:text-white tabular-nums select-all">
                    {currentTimestamp}
                </div>
                <div class="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onclick={() => copyVal(currentTimestamp.toString(), "当前时间戳")}
                        class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
                    >
                        <Copy size={11} /> 复制当前值
                    </button>
                    <button
                        type="button"
                        onclick={() => (input = currentTimestamp.toString())}
                        class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                        填入下方转换
                    </button>
                </div>
            </div>

            <!-- Input Box -->
            <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5 shadow-2xs flex-1 min-h-0 flex flex-col justify-between">
                <div class="space-y-2">
                    <label for="ts-main-input" class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar size={12} class="text-sky-500" />
                        待转换时间戳或标准日期字串
                    </label>
                    <div class="flex gap-2">
                        <input
                            id="ts-main-input"
                            type="text"
                            bind:value={input}
                            class="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md font-mono text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="如 1718000000 或 2026-08-26 15:30:00"
                        />
                    </div>
                </div>

                {#if parsedResult}
                    <div class="p-3 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60 space-y-1">
                        <span class="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">相对时间</span>
                        <div class="font-bold text-sm text-slate-900 dark:text-white">{parsedResult.relative}</div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Right: Multi-Format & Global Timezone Grid (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                    <Globe size={13} class="text-sky-500" />
                    多时区与标准化时间对照表
                </span>
                <span class="text-[10px] text-slate-400 font-mono">点击复制</span>
            </div>

            {#if parsedResult}
                <div class="flex-1 overflow-auto p-3.5 space-y-2 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar divide-y divide-slate-100/60 dark:divide-slate-800/40">
                    {#each [
                        { label: "本地时区 (Local)", val: parsedResult.local },
                        { label: "北京时间 (CST · UTC+8)", val: parsedResult.beijing },
                        { label: "东京时间 (JST · UTC+9)", val: parsedResult.tokyo },
                        { label: "伦敦时间 (GMT/BST · UTC+0)", val: parsedResult.london },
                        { label: "纽约时间 (EST/EDT · UTC-5)", val: parsedResult.newYork },
                        { label: "洛杉矶时间 (PST/PDT · UTC-8)", val: parsedResult.losAngeles },
                        { label: "ISO 8601 标准串", val: parsedResult.iso },
                        { label: "UTC 规范串", val: parsedResult.utc },
                        { label: "时间戳 (秒 · 10位)", val: parsedResult.sec },
                        { label: "时间戳 (毫秒 · 13位)", val: parsedResult.ms },
                    ] as item}
                        <div class="pt-2 first:pt-0 flex items-center justify-between gap-3 group">
                            <div class="space-y-0.5 min-w-0 flex-1">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                                <div class="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all font-medium">
                                    {item.val}
                                </div>
                            </div>

                            <button
                                type="button"
                                onclick={() => copyVal(item.val, item.label)}
                                class="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs font-sans"
                            >
                                {#if copiedKey === item.label}
                                    <Check size={11} class="text-emerald-500" />
                                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">已复制</span>
                                {:else}
                                    <Copy size={11} class="text-slate-400" />
                                    <span class="text-[11px]">复制</span>
                                {/if}
                            </button>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                    <Clock size={36} class="opacity-20 text-slate-400" />
                    <p class="text-xs font-medium">请输入有效的时间戳或日期字符串进行转换</p>
                </div>
            {/if}
        </div>
    </div>
</div>
