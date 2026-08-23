<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import {
        DIRECTION_OPTIONS,
        type Direction,
        type DiagramMode,
    } from "../lib/arrows";
    import {
        ArrowRight,
        ArrowLeft,
        ArrowUp,
        ArrowDown,
        Circle,
        Info,
    } from "lucide-svelte";

    let {
        x,
        y,
        mode,
        arrowCount = 1,
        onSelect,
        onClose,
    } = $props<{
        x: number;
        y: number;
        mode: DiagramMode;
        arrowCount?: number;
        onSelect: (direction: Direction) => void;
        onClose: () => void;
    }>();

    function handleSelect(direction: Direction) {
        onSelect(direction);
        onClose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<div
    class="fixed inset-0 z-50"
    onclick={onClose}
    onkeydown={(event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClose();
        }
    }}
    transition:fade={{ duration: 100 }}
    role="button"
    tabindex="0"
    aria-label="Close direction menu"
></div>

<!-- Menu -->
<div
    class="fixed z-50 bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden min-w-[180px]"
    style="left: {x}px; top: {y}px;"
    transition:scale={{ duration: 100, start: 0.95 }}
    role="menu"
>
    <!-- Header -->
    <div
        class="px-3 py-1.5 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800"
    >
        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Arrow Direction
        </div>
        {#if arrowCount > 1}
            <div class="text-[10px] text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                {arrowCount} arrows selected
            </div>
        {/if}
    </div>

    <!-- Options -->
    <div class="py-1">
        {#each DIRECTION_OPTIONS as option}
            <button
                class="w-full px-3 py-1.5 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group text-xs"
                onclick={() => handleSelect(option.id)}
                role="menuitem"
            >
                <span
                    class="w-4 h-4 flex items-center justify-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                >
                    {#if option.id === "right"}
                        <ArrowRight size={14} />
                    {:else if option.id === "left"}
                        <ArrowLeft size={14} />
                    {:else if option.id === "up"}
                        <ArrowUp size={14} />
                    {:else if option.id === "down"}
                        <ArrowDown size={14} />
                    {:else}
                        <Circle size={8} />
                    {/if}
                </span>
                <span
                    class="flex-1 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                >
                    {option.label}
                </span>
                <code
                    class="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-mono"
                >
                    {option.syntax}
                </code>
            </button>
        {/each}
    </div>

    <!-- Graphviz Note -->
    {#if mode === "graphviz"}
        <div
            class="px-3 py-1.5 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200/60 dark:border-amber-900/40"
        >
            <div class="flex items-start gap-1.5">
                <Info size={12} class="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p class="text-[10px] text-amber-800 dark:text-amber-300">
                    Graphviz uses <code class="font-mono">rankdir</code> for layout orientation.
                </p>
            </div>
        </div>
    {/if}
</div>