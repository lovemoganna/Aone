<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, Check, Clock, Calendar, Sparkles, Trash2, ArrowRight, Play, Layers } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let minute = $state("0");
    let hour = $state("2");
    let day = $state("*");
    let month = $state("*");
    let week = $state("*");

    let expression = $derived(`${minute.trim() || "*"} ${hour.trim() || "*"} ${day.trim() || "*"} ${month.trim() || "*"} ${week.trim() || "*"}`);

    const PRESETS = [
        { name: "每天凌晨 2 点", m: "0", h: "2", d: "*", mo: "*", w: "*" },
        { name: "工作日早上 9 点", m: "0", h: "9", d: "*", mo: "*", w: "1-5" },
        { name: "每 15 分钟一次", m: "*/15", h: "*", d: "*", mo: "*", w: "*" },
        { name: "每小时整点", m: "0", h: "*", d: "*", mo: "*", w: "*" },
        { name: "每周一零点", m: "0", h: "0", d: "*", mo: "*", w: "1" },
        { name: "每月 1 号零点", m: "0", h: "0", d: "1", mo: "*", w: "*" },
    ];

    // Human-readable Chinese translation
    let descriptionCn = $derived.by(() => {
        const parts = expression.split(" ");
        if (parts.length !== 5) return "无效的 Cron 表达式";
        const [m, h, d, mo, w] = parts;

        if (expression === "* * * * *") return "每分钟执行一次";
        if (expression === "0 * * * *") return "每小时整点执行一次";
        if (expression === "0 0 * * *") return "每天凌晨 00:00 执行一次";

        let desc = "在 ";
        if (mo !== "*") desc += `每年第 ${mo} 月的 `;
        if (w !== "*") {
            const weekMap: Record<string, string> = { "0": "周日", "1": "周一", "2": "周二", "3": "周三", "4": "周四", "5": "周五", "6": "周六", "7": "周日", "1-5": "工作日 (周一至周五)" };
            desc += `${weekMap[w] || `星期 ${w}`} `;
        }
        if (d !== "*") desc += `每月第 ${d} 号 `;
        if (h !== "*") {
            if (h.includes("*/")) desc += `每隔 ${h.replace("*/", "")} 小时 `;
            else desc += `${h.padStart(2, "0")} 时 `;
        } else {
            desc += "每小时 ";
        }

        if (m !== "*") {
            if (m.includes("*/")) desc += `每隔 ${m.replace("*/", "")} 分钟`;
            else desc += `${m.padStart(2, "0")} 分`;
        } else {
            desc += "每分钟";
        }

        return desc + " 触发任务";
    });

    // Predict next 5 execution timestamps (simplified simulator)
    let nextExecutions = $derived.by(() => {
        const list: string[] = [];
        const now = new Date();
        const base = new Date(now.getTime() + 60000);

        for (let i = 0; i < 5; i++) {
            const nextDate = new Date(base.getTime() + i * 3600000 * (hour === "*" ? 1 : 24));
            list.push(nextDate.toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }));
        }
        return list;
    });

    function applyPreset(p: typeof PRESETS[0]) {
        minute = p.m;
        hour = p.h;
        day = p.d;
        month = p.mo;
        week = p.w;
        toastStore.success(`已应用预设：${p.name}`);
    }

    function handleCopy() {
        copyToClipboard(expression, "Cron 表达式");
        toastStore.success(`已复制 Cron 表达式：${expression}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Clock size={13} class="text-sky-500" />
                Cron 定时表达式生成器
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
                onclick={handleCopy}
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
            >
                <Copy size={12} />
                <span>复制表达式</span>
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: 5 Segment Visual Builder (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Big Banner Display -->
            <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col items-center justify-center space-y-2 shrink-0">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CRON 表达式</span>
                <div class="font-mono text-2xl md:text-3xl font-bold tracking-widest text-sky-600 dark:text-sky-400 select-all">
                    {expression}
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                    <Clock size={12} class="text-sky-500" />
                    <span>{descriptionCn}</span>
                </div>
            </div>

            <!-- 5 Fields Inputs Grid -->
            <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 shadow-2xs flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">字段微调参数</span>

                <div class="grid grid-cols-5 gap-2 text-center">
                    <!-- Minute -->
                    <div class="space-y-1">
                        <label for="cron-min-inp" class="text-[10px] font-bold text-slate-400 uppercase block">分钟 (0-59)</label>
                        <input
                            id="cron-min-inp"
                            type="text"
                            bind:value={minute}
                            class="w-full text-center px-1.5 py-1.5 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="*"
                        />
                    </div>

                    <!-- Hour -->
                    <div class="space-y-1">
                        <label for="cron-hr-inp" class="text-[10px] font-bold text-slate-400 uppercase block">小时 (0-23)</label>
                        <input
                            id="cron-hr-inp"
                            type="text"
                            bind:value={hour}
                            class="w-full text-center px-1.5 py-1.5 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="*"
                        />
                    </div>

                    <!-- Day of Month -->
                    <div class="space-y-1">
                        <label for="cron-dom-inp" class="text-[10px] font-bold text-slate-400 uppercase block">日期 (1-31)</label>
                        <input
                            id="cron-dom-inp"
                            type="text"
                            bind:value={day}
                            class="w-full text-center px-1.5 py-1.5 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="*"
                        />
                    </div>

                    <!-- Month -->
                    <div class="space-y-1">
                        <label for="cron-mon-inp" class="text-[10px] font-bold text-slate-400 uppercase block">月份 (1-12)</label>
                        <input
                            id="cron-mon-inp"
                            type="text"
                            bind:value={month}
                            class="w-full text-center px-1.5 py-1.5 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="*"
                        />
                    </div>

                    <!-- Day of Week -->
                    <div class="space-y-1">
                        <label for="cron-dow-inp" class="text-[10px] font-bold text-slate-400 uppercase block">星期 (0-7)</label>
                        <input
                            id="cron-dow-inp"
                            type="text"
                            bind:value={week}
                            class="w-full text-center px-1.5 py-1.5 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="*"
                        />
                    </div>
                </div>

                <!-- Syntax Hint -->
                <div class="p-2.5 rounded bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                    <div>* : 匹配任意值</div>
                    <div>, : 枚举分割 (如 1,3,5)</div>
                    <div>- : 范围区间 (如 9-17)</div>
                    <div>/ : 间隔步长 (如 */15)</div>
                </div>
            </div>
        </div>

        <!-- Right: Execution Simulation Timeline (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                    <Calendar size={13} class="text-sky-500" />
                    未来执行时间点预览 (Simulation)
                </span>
                <span class="text-[10px] text-slate-400 font-mono">基于当前本地时区</span>
            </div>

            <div class="flex-1 overflow-auto p-3.5 space-y-2.5 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#each nextExecutions as execTime, idx}
                    <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                        <div class="flex items-center gap-2.5">
                            <span class="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-[10px] font-mono font-bold flex items-center justify-center border border-sky-200/60 dark:border-sky-800/60">
                                {idx + 1}
                            </span>
                            <span class="font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold">{execTime}</span>
                        </div>
                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">预计准时触发</span>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
