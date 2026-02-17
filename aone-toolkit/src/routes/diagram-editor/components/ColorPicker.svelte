<script lang="ts">
    import { Palette, Check } from "lucide-svelte";
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
        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors {isOpen
            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
            : ''}"
        onclick={() => (isOpen = !isOpen)}
        title="Color Picker"
    >
        <Palette size={18} />
    </button>

    {#if isOpen}
        <div
            transition:fade={{ duration: 100 }}
            class="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-wrap gap-1 w-32"
        >
            {#each PRESETS as color}
                <button
                    class="w-6 h-6 rounded-md hover:scale-110 transition-transform shadow-sm border border-black/10 dark:border-white/10"
                    style="background-color: {color}"
                    onclick={() => handleSelect(color)}
                >
                </button>
            {/each}
        </div>

        <!-- Backdrop -->
        <div class="fixed inset-0 z-40" onclick={() => (isOpen = false)}></div>
    {/if}
</div>
