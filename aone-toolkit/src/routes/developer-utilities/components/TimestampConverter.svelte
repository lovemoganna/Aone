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

<div class="space-y-8 w-full">
    <!-- Hero Clock -->
    <div
        class="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-6 relative overflow-hidden group"
    >
        <!-- Background Decor -->
        <div
            class="hidden"
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
                class="btn btn-secondary text-sm shadow-sm"
                onclick={() => (isPaused = !isPaused)}
            >
                {#if isPaused}
                    <Play size={14} class="fill-current" /> Resume
                {:else}
                    <Pause size={14} class="fill-current" /> Pause
                {/if}
            </button>
            <button
                class="btn btn-primary text-sm shadow-sm hover:shadow-md"
                onclick={() => navigator.clipboard.writeText(now.toString())}
            >
                <Copy size={14} /> Copy
            </button>
        </div>
    </div>

    <!-- Converter Section -->
    <div class="grid lg:grid-cols-2 gap-8">
        <!-- Input -->
        <div class="space-y-4 clean-panel p-6 justify-start">
            <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
                <Calendar size={20} class="text-slate-500" />
                Time Converter
            </h3>

            <div class="space-y-4 pt-4">
                <div class="space-y-2">
                    <label
                        for="ts-input"
                        class="label-section"
                    >
                        Input (Timestamp, ISO, Date)
                    </label>
                    <div class="flex gap-2">
                        <input
                            id="ts-input"
                            type="text"
                            bind:value={input}
                            class="input text-sm flex-1"
                            placeholder="e.g. 1672531200 or 2023-01-01"
                        />
                        <button
                            class="btn btn-secondary text-sm shadow-sm"
                            onclick={() => (input = now.toString())}
                        >
                            NOW
                        </button>
                    </div>
                </div>

                <div class="space-y-2 pt-2">
                    <span class="label-section block">Presets</span>
                    <div class="flex flex-wrap gap-2">
                        {#each [{ l: "Start of Year", v: new Date(new Date().getFullYear(), 0, 1).getTime() / 1000 }, { l: "Yesterday", v: Math.floor(Date.now() / 1000) - 86400 }, { l: "+1 Hour", v: Math.floor(Date.now() / 1000) + 3600 }] as preset}
                            <button
                                class="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-md text-xs hover:border-slate-400 transition-colors"
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
        <div class="space-y-4 clean-panel p-6 justify-start">
            <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
                <Globe size={20} class="text-emerald-500" />
                Result Details
            </h3>

            {#if parsedDate}
                <div
                    class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm mt-4"
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
                    class="flex-1 mt-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-4 p-8 min-h-[300px]"
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
