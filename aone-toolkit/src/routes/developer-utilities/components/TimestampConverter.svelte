<script lang="ts">
    import { Button } from "$lib/components/ui";
    import {
        Copy,
        Clock,
        Play,
        Pause,
        Calendar,
        Globe,
        History,
    } from "lucide-svelte";

    let now = $state(Math.floor(Date.now() / 1000));
    let isPaused = $state(false);
    let input = $state("");
    let parsedDate = $state<Date | null>(null);

    // Clock ticker
    $effect(() => {
        const interval = setInterval(() => {
            if (!isPaused) {
                now = Math.floor(Date.now() / 1000);
            }
        }, 1000);
        return () => clearInterval(interval);
    });

    // Auto-convert logic
    function convert() {
        if (!input.trim()) {
            parsedDate = null;
            return;
        }

        let date: Date | null = null;
        const val = input.trim();

        // 1. Try numeric timestamp
        if (/^\d+$/.test(val)) {
            const num = parseInt(val);
            // Guess ms vs seconds (year 2286 is 10 digits, so >11 digits is likely ms)
            if (val.length > 11) {
                date = new Date(num);
            } else {
                date = new Date(num * 1000);
            }
        }
        // 2. Try ISO or regular date string
        else {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                date = d;
            }
        }

        parsedDate = date;
    }

    $effect(() => {
        convert();
    });

    function getRelativeTime(d: Date) {
        const diff = d.getTime() - Date.now();
        const absDiff = Math.abs(diff);
        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (absDiff < 1000) return "just now";
        if (Math.abs(seconds) < 60) return rtf.format(seconds, "seconds");
        if (Math.abs(minutes) < 60) return rtf.format(minutes, "minutes");
        if (Math.abs(hours) < 24) return rtf.format(hours, "hours");
        return rtf.format(days, "days");
    }

    function formatZone(d: Date, zone: string) {
        try {
            return d.toLocaleString("en-US", {
                timeZone: zone,
                dateStyle: "medium",
                timeStyle: "medium",
                hour12: false,
            });
        } catch (e) {
            return "Invalid Zone";
        }
    }
</script>

<div class="space-y-8 max-w-4xl mx-auto">
    <!-- Hero Clock -->
    <div
        class="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-6 relative overflow-hidden group"
    >
        <!-- Background Decor -->
        <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"
        ></div>

        <div
            class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 z-10"
        >
            <Clock size={16} /> Current Unix Time
        </div>

        <div class="flex flex-col items-center z-10">
            <div
                class="text-6xl md:text-8xl font-mono font-bold tracking-tighter tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 transition-all duration-300"
            >
                {now}
            </div>
            <div class="text-slate-400 font-mono text-sm mt-2 opacity-60">
                seconds since epoch
            </div>
        </div>

        <div
            class="flex gap-3 z-10 transition-opacity duration-300 opacity-80 group-hover:opacity-100"
        >
            <button
                class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider backdrop-blur-sm"
                onclick={() => (isPaused = !isPaused)}
            >
                {#if isPaused}
                    <Play size={14} class="fill-current" /> Resume
                {:else}
                    <Pause size={14} class="fill-current" /> Pause
                {/if}
            </button>
            <button
                class="px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                onclick={() => navigator.clipboard.writeText(now.toString())}
            >
                <Copy size={14} /> Copy
            </button>
        </div>
    </div>

    <!-- Converter Section -->
    <div class="grid lg:grid-cols-2 gap-8">
        <!-- Input -->
        <div class="space-y-4">
            <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
                <Calendar size={20} class="text-indigo-500" />
                Time Converter
            </h3>

            <div
                class="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
            >
                <div class="space-y-2">
                    <label
                        for="ts-input"
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                        Input (Timestamp, ISO, Date)
                    </label>
                    <div class="flex gap-2">
                        <input
                            id="ts-input"
                            type="text"
                            bind:value={input}
                            class="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-all"
                            placeholder="e.g. 1672531200 or 2023-01-01"
                        />
                        <button
                            class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                            onclick={() => (input = now.toString())}
                        >
                            NOW
                        </button>
                    </div>
                </div>

                <div class="space-y-2">
                    <label
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >Presets</label
                    >
                    <div class="flex flex-wrap gap-2">
                        {#each [{ l: "Start of Year", v: new Date(new Date().getFullYear(), 0, 1).getTime() / 1000 }, { l: "Yesterday", v: Math.floor(Date.now() / 1000) - 86400 }, { l: "+1 Hour", v: Math.floor(Date.now() / 1000) + 3600 }] as preset}
                            <button
                                class="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-md text-xs hover:border-indigo-500 transition-colors"
                                onclick={() => (input = preset.v.toString())}
                            >
                                {preset.l}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <!-- Result -->
        <div class="space-y-4">
            <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
                <Globe size={20} class="text-emerald-500" />
                Result Details
            </h3>

            {#if parsedDate}
                <div
                    class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
                >
                    <!-- Main Result -->
                    <div
                        class="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                    >
                        <div
                            class="flex items-center gap-2 text-slate-500 text-sm mb-1"
                        >
                            <History size={16} /> Relative Time
                        </div>
                        <div
                            class="text-2xl font-bold text-slate-900 dark:text-white"
                        >
                            {getRelativeTime(parsedDate)}
                        </div>
                    </div>

                    <!-- Details Grid -->
                    <div
                        class="divide-y divide-slate-100 dark:divide-slate-700"
                    >
                        <div
                            class="grid grid-cols-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                            <div class="text-sm font-medium text-slate-500">
                                Local
                            </div>
                            <div
                                class="col-span-2 font-mono text-sm text-right select-all"
                            >
                                {parsedDate.toLocaleString()}
                            </div>
                        </div>
                        <div
                            class="grid grid-cols-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                            <div class="text-sm font-medium text-slate-500">
                                UTC
                            </div>
                            <div
                                class="col-span-2 font-mono text-sm text-right select-all"
                            >
                                {parsedDate.toUTCString()}
                            </div>
                        </div>
                        <div
                            class="grid grid-cols-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                            <div class="text-sm font-medium text-slate-500">
                                ISO 8601
                            </div>
                            <div
                                class="col-span-2 font-mono text-sm text-right select-all truncate"
                                title={parsedDate.toISOString()}
                            >
                                {parsedDate.toISOString()}
                            </div>
                        </div>
                        <div
                            class="grid grid-cols-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                            <div class="text-sm font-medium text-slate-500">
                                New York
                            </div>
                            <div
                                class="col-span-2 font-mono text-sm text-right select-all"
                            >
                                {formatZone(parsedDate, "America/New_York")}
                            </div>
                        </div>
                        <div
                            class="grid grid-cols-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                            <div class="text-sm font-medium text-slate-500">
                                Tokyo
                            </div>
                            <div
                                class="col-span-2 font-mono text-sm text-right select-all"
                            >
                                {formatZone(parsedDate, "Asia/Tokyo")}
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div
                    class="h-full min-h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-4"
                >
                    <Clock size={48} class="opacity-20" />
                    <p class="text-sm font-medium">
                        Enter a timestamp to see details
                    </p>
                </div>
            {/if}
        </div>
    </div>
</div>
