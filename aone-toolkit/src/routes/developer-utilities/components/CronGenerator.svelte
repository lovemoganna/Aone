<script lang="ts">
    import { Button, Input } from "$lib/components/ui";
    import { Copy, Check, Clock } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let minute = $state("*");
    let hour = $state("*");
    let day = $state("*");
    let month = $state("*");
    let week = $state("*");
    let copied = $state(false);

    let expression = $derived(`${minute} ${hour} ${day} ${month} ${week}`);

    // Basic human readable description (Simplified)
    let description = $derived.by(() => {
        try {
            if (expression === "* * * * *") return "Every minute";
            if (expression === "0 * * * *") return "At the start of every hour";
            if (expression === "0 0 * * *") return "At midnight every day";

            const parts = expression.split(" ");
            if (parts.length !== 5) return "Invalid expression";

            let desc = "Runs ";
            if (parts[0] !== "*") desc += `at minute ${parts[0]} `;
            if (parts[1] !== "*") desc += `past hour ${parts[1]} `;
            if (parts[2] !== "*") desc += `on day-of-month ${parts[2]} `;
            if (parts[3] !== "*") desc += `in month ${parts[3]} `;
            if (parts[4] !== "*") desc += `on day-of-week ${parts[4]}`;

            if (expression.includes("*/")) desc += " (interval)";
            if (desc === "Runs ") desc = "Every minute"; // Fallback

            return desc;
        } catch {
            return "Invalid expression";
        }
    });

    async function copyOutput() {
        await navigator.clipboard.writeText(expression);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    const fields = [
        {
            label: "Minute",
            value: () => minute,
            set: (v: string) => (minute = v),
            placeholder: "0-59",
            hint: "*",
        },
        {
            label: "Hour",
            value: () => hour,
            set: (v: string) => (hour = v),
            placeholder: "0-23",
            hint: "*",
        },
        {
            label: "Day (Month)",
            value: () => day,
            set: (v: string) => (day = v),
            placeholder: "1-31",
            hint: "*",
        },
        {
            label: "Month",
            value: () => month,
            set: (v: string) => (month = v),
            placeholder: "1-12",
            hint: "*",
        },
        {
            label: "Day (Week)",
            value: () => week,
            set: (v: string) => (week = v),
            placeholder: "0-6 (Sun-Sat)",
            hint: "*",
        },
    ];
</script>

<div class="h-full flex flex-col gap-6">
    <!-- Result Display -->
    <div
        class="bg-slate-900 border border-slate-800 text-white p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden group"
    >
        <div
            class="hidden"
        ></div>

        <div
            class="text-xs font-bold text-slate-400 uppercase tracking-widest"
        >
            Cron Expression
        </div>
        <div
            class="text-4xl md:text-5xl font-mono font-bold tracking-wider text-center break-all z-10"
        >
            {expression}
        </div>

        <div
            class="flex items-center gap-2 text-slate-400 bg-slate-800/40 px-4 py-2 rounded-full z-10 text-xs font-semibold"
        >
            <Clock size={14} />
            <span>{description}</span>
        </div>

        <button
            class="btn btn-secondary text-sm shadow-sm"
            onclick={copyOutput}
            title="Copy Expression"
        >
            {#if copied}
                <Check size={18} class="text-emerald-400" />
            {:else}
                <Copy size={18} class="text-white" />
            {/if}
        </button>
    </div>

    <!-- Inputs -->
    <div class="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
        <div class="label-section">Expression Fields</div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            {#each fields as field}
                <div class="space-y-2">
                    <label
                        for="cron-field-{field.label.toLowerCase().replace(/[^a-z0-9]/g, '')}"
                        class="block text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center"
                    >
                        {field.label}
                    </label>
                    <div class="relative">
                        <input
                            id="cron-field-{field.label.toLowerCase().replace(/[^a-z0-9]/g, '')}"
                            type="text"
                            value={field.value()}
                            oninput={(e) => field.set(e.currentTarget.value)}
                            class="input text-sm text-center"
                            placeholder={field.hint}
                        />
                        <div class="text-[10px] text-center text-slate-500 mt-1">
                            {field.placeholder}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Quick Presets -->
    <div class="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
        <h3
            class="label-section"
        >
            Common Presets
        </h3>
        <div class="flex flex-wrap gap-2">
            {#each [{ l: "Every Minute", v: ["*", "*", "*", "*", "*"] }, { l: "Hourly", v: ["0", "*", "*", "*", "*"] }, { l: "Daily (Midnight)", v: ["0", "0", "*", "*", "*"] }, { l: "Weekly (Sunday)", v: ["0", "0", "*", "*", "0"] }, { l: "Monthly (1st)", v: ["0", "0", "1", "*", "*"] }] as preset}
                <button
                    class="btn btn-secondary text-sm shadow-sm"
                    onclick={() => {
                        minute = preset.v[0];
                        hour = preset.v[1];
                        day = preset.v[2];
                        month = preset.v[3];
                        week = preset.v[4];
                    }}
                >
                    {preset.l}
                </button>
            {/each}
        </div>
    </div>
</div>
