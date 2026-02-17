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

    const iconMap: Record<Direction, any> = {
        right: ArrowRight,
        left: ArrowLeft,
        up: ArrowUp,
        down: ArrowDown,
        default: Circle,
    };
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
    class="fixed inset-0 z-50"
    onclick={onClose}
    transition:fade={{ duration: 100 }}
></div>

<!-- Menu -->
<div
    class="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[180px]"
    style="left: {x}px; top: {y}px;"
    transition:scale={{ duration: 150, start: 0.95 }}
    role="menu"
>
    <!-- Header -->
    <div
        class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700"
    >
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">
            调整连线方向
        </div>
        {#if arrowCount > 1}
            <div class="text-[10px] text-indigo-500 mt-0.5">
                将修改 {arrowCount} 个箭头
            </div>
        {/if}
    </div>

    <!-- Options -->
    <div class="py-1">
        {#each DIRECTION_OPTIONS as option}
            <button
                class="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group"
                onclick={() => handleSelect(option.id)}
                role="menuitem"
            >
                <span
                    class="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-indigo-500"
                >
                    {#if option.id === "right"}
                        <ArrowRight size={16} />
                    {:else if option.id === "left"}
                        <ArrowLeft size={16} />
                    {:else if option.id === "up"}
                        <ArrowUp size={16} />
                    {:else if option.id === "down"}
                        <ArrowDown size={16} />
                    {:else}
                        <Circle size={16} />
                    {/if}
                </span>
                <span
                    class="flex-1 text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600"
                >
                    {option.label}
                </span>
                <code
                    class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono"
                >
                    {option.syntax}
                </code>
            </button>
        {/each}
    </div>

    <!-- Graphviz Note -->
    {#if mode === "graphviz"}
        <div
            class="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30"
        >
            <div class="flex items-start gap-2">
                <Info size={12} class="text-amber-500 mt-0.5 shrink-0" />
                <p class="text-[10px] text-amber-700 dark:text-amber-300">
                    Graphviz 使用 <code class="font-mono">rankdir</code> 控制全局方向，单条边方向由布局自动决定。
                </p>
            </div>
        </div>
    {/if}
</div>
