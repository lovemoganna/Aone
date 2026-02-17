<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Clock, Info, Calendar } from "lucide-svelte";

    let cron = $state("0 0 * * *");
    let explanation = $state("At 00:00 every day");

    // Basic Cron logic for explanation (simplified)
    function explainCron(exp: string) {
        const parts = exp.trim().split(/\s+/);
        if (parts.length !== 5) return "Invalid Cron (must be 5 parts)";

        const [m, h, d, mo, w] = parts;

        let msg = "Repeats at ";

        if (m === "*" && h === "*") msg = "Every minute";
        else if (m === "0" && h === "*") msg = "At the start of every hour";
        else if (h === "*") msg = `At minute ${m} of every hour`;
        else msg = `At ${h.padStart(2, "0")}:${m.padStart(2, "0")}`;

        if (d === "*" && mo === "*" && w === "*") msg += " every day";
        else if (w !== "*") {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            msg += ` only on ${w
                .split(",")
                .map((i) => days[parseInt(i)] || i)
                .join(", ")}`;
        } else if (d !== "*") {
            msg += ` on day ${d} of the month`;
        }

        return msg;
    }

    $effect(() => {
        explanation = explainCron(cron);
    });

    const PRESETS = [
        { label: "Every Minute", val: "* * * * *" },
        { label: "Every Hour", val: "0 * * * *" },
        { label: "Daily at Midnight", val: "0 0 * * *" },
        { label: "Weekly (Monday)", val: "0 0 * * 1" },
        { label: "Monthly (1st)", val: "0 0 1 * *" },
    ];
</script>

<div class="space-y-6 pb-8">
    <div class="space-y-4">
        <div class="space-y-2">
            <div class="text-sm font-medium">Cron Expression</div>
            <div class="flex gap-2">
                <input
                    type="text"
                    bind:value={cron}
                    class="flex-1 p-3 font-mono text-lg bg-white dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-center tracking-widest"
                />
            </div>
        </div>

        <div
            class="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-start gap-3"
        >
            <div
                class="p-2 bg-white dark:bg-slate-800 rounded-lg text-indigo-500 shadow-sm mt-0.5"
            >
                <Info size={18} />
            </div>
            <div>
                <p
                    class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider"
                >
                    Human Readable
                </p>
                <p
                    class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                    {explanation}
                </p>
            </div>
        </div>

        <div class="space-y-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase px-1">
                Common Presets
            </div>
            <div class="flex flex-wrap gap-2">
                {#each PRESETS as preset}
                    <button
                        class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all {cron ===
                        preset.val
                            ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500 text-primary-600'
                            : ''}"
                        onclick={() => (cron = preset.val)}
                    >
                        {preset.label}
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <!-- Visual Guide -->
    <div
        class="grid grid-cols-5 gap-2 pt-4 bg-slate-50/50 dark:bg-black/20 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
    >
        <div class="text-center">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">
                Min
            </p>
            <p
                class="text-xs font-mono p-1 bg-white dark:bg-slate-800 rounded border"
            >
                0-59
            </p>
        </div>
        <div class="text-center">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">
                Hour
            </p>
            <p
                class="text-xs font-mono p-1 bg-white dark:bg-slate-800 rounded border"
            >
                0-23
            </p>
        </div>
        <div class="text-center">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">
                Day
            </p>
            <p
                class="text-xs font-mono p-1 bg-white dark:bg-slate-800 rounded border"
            >
                1-31
            </p>
        </div>
        <div class="text-center">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">
                Month
            </p>
            <p
                class="text-xs font-mono p-1 bg-white dark:bg-slate-800 rounded border"
            >
                1-12
            </p>
        </div>
        <div class="text-center">
            <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">
                Week
            </p>
            <p
                class="text-xs font-mono p-1 bg-white dark:bg-slate-800 rounded border"
            >
                0-6
            </p>
        </div>
    </div>
</div>
