<script lang="ts">
    import { Palette } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let { onSelect } = $props<{ onSelect: (color: string) => void }>();

    let isOpen = $state(false);

    const PRESETS = [
        "#ef4444", // Red 500
        "#f97316", // Orange 500
        "#eab308", // Yellow 500
        "#22c55e", // Green 500
        "#06b6d4", // Cyan 500
        "#3b82f6", // Blue 500
        "#a855f7", // Purple 500
        "#ec4899", // Pink 500
        "#1f2937", // Gray 800
        "#ffffff", // White
    ];

    function handleSelect(color: string) {
        onSelect(color);
        isOpen = false;
    }
</script>

<div class="relative">
    <button
        class="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors {isOpen
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
            : ''}"
        onclick={() => (isOpen = !isOpen)}
        title="Color Picker"
        aria-label="Color Picker"
    >
        <Palette size={14} />
    </button>

    {#if isOpen}
        <div
            transition:fade={{ duration: 100 }}
            class="absolute top-full left-0 mt-1 p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 z-50 flex flex-wrap gap-1 w-32"
        >
            {#each PRESETS as color}
                <button
                    class="w-5 h-5 rounded hover:scale-110 transition-transform border border-black/10 dark:border-white/10"
                    style="background-color: {color}"
                    onclick={() => handleSelect(color)}
                    title={`Select ${color}`}
                    aria-label={`Select ${color}`}
                >
                </button>
            {/each}
        </div>

        <!-- Backdrop -->
        <div
            class="fixed inset-0 z-40"
            onclick={() => (isOpen = false)}
            onkeydown={(event) => {
                if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    isOpen = false;
                }
            }}
            role="button"
            tabindex="0"
            aria-label="Close color picker"
        ></div>
    {/if}
</div>
