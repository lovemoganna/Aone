<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Scale, Ruler, HardDrive, Thermometer } from "lucide-svelte";

    let category = $state<"length" | "mass" | "digital" | "temp">("digital");
    let inputVal = $state(1);
    let fromUnit = $state("GB");
    let toUnit = $state("MB");

    const UNITS = {
        digital: {
            B: 1,
            KB: 1024,
            MB: 1024 ** 2,
            GB: 1024 ** 3,
            TB: 1024 ** 4,
        },
        length: {
            mm: 0.001,
            cm: 0.01,
            m: 1,
            km: 1000,
            inch: 0.0254,
            ft: 0.3048,
            mile: 1609.34,
        },
        mass: {
            g: 0.001,
            kg: 1,
            lb: 0.453592,
            oz: 0.0283495,
        },
    };

    let result = $derived.by(() => {
        if (category === "temp") {
            if (fromUnit === toUnit) return inputVal;
            if (fromUnit === "C" && toUnit === "F")
                return (inputVal * 9) / 5 + 32;
            if (fromUnit === "F" && toUnit === "C")
                return ((inputVal - 32) * 5) / 9;
            return inputVal;
        }

        const units = (UNITS as any)[category];
        const baseVal = inputVal * units[fromUnit];
        return baseVal / units[toUnit];
    });

    const categories = [
        { id: "digital", label: "Digital Data", icon: HardDrive },
        { id: "length", label: "Length", icon: Ruler },
        { id: "mass", label: "Mass", icon: Scale },
        { id: "temp", label: "Temperature", icon: Thermometer },
    ];

    $effect(() => {
        // Reset units when category changes
        if (category === "digital") {
            fromUnit = "GB";
            toUnit = "MB";
        } else if (category === "length") {
            fromUnit = "km";
            toUnit = "m";
        } else if (category === "mass") {
            fromUnit = "kg";
            toUnit = "g";
        } else if (category === "temp") {
            fromUnit = "C";
            toUnit = "F";
        }
    });
</script>

<div class="space-y-6 pb-8">
    <div
        class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto"
    >
        {#each categories as cat}
            <button
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all {category ===
                cat.id
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600'
                    : 'text-slate-500 hover:text-slate-700'}"
                onclick={() => (category = cat.id as any)}
            >
                <cat.icon size={14} />
                {cat.label}
            </button>
        {/each}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
        <div class="space-y-4">
            <div class="space-y-2">
                <label
                    class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                    >From</label
                >
                <div class="flex gap-2">
                    <input
                        type="number"
                        bind:value={inputVal}
                        class="w-full p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xl font-bold focus:border-primary-500 outline-none"
                    />
                    <select
                        bind:value={fromUnit}
                        class="p-4 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl font-bold"
                    >
                        {#if category === "temp"}
                            <option value="C">°C</option>
                            <option value="F">°F</option>
                        {:else}
                            {#each Object.keys((UNITS as any)[category]) as u}
                                <option value={u}>{u}</option>
                            {/each}
                        {/if}
                    </select>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="space-y-2">
                <label
                    class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                    >To</label
                >
                <div class="flex gap-2">
                    <div
                        class="w-full p-4 bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-100 dark:border-primary-900/30 rounded-2xl text-xl font-black text-primary-600 dark:text-primary-400"
                    >
                        {result.toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                        })}
                    </div>
                    <select
                        bind:value={toUnit}
                        class="p-4 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl font-bold"
                    >
                        {#if category === "temp"}
                            <option value="C">°C</option>
                            <option value="F">°F</option>
                        {:else}
                            {#each Object.keys((UNITS as any)[category]) as u}
                                <option value={u}>{u}</option>
                            {/each}
                        {/if}
                    </select>
                </div>
            </div>
        </div>
    </div>
</div>
