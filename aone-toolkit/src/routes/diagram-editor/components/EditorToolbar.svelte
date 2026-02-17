<script lang="ts">
    import {
        ArrowRight,
        ArrowLeft,
        ArrowUp,
        ArrowDown,
        Move,
        Info,
        Share2,
        Check,
        Link,
    } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";
    import { generateShareUrl } from "../lib/share";
    import { diagramStore } from "../lib/store.svelte";
    import type { Direction, DiagramMode } from "../lib/arrows";
    import ColorPicker from "./ColorPicker.svelte";

    let {
        mode,
        activeDirection = null,
        onDirectionChange,
        hasArrows = false,
    } = $props<{
        mode: DiagramMode;
        activeDirection?: Direction | null;
        onDirectionChange: (dir: Direction) => void;
        hasArrows?: boolean;
    }>();

    const buttons = [
        { id: "left" as const, icon: ArrowLeft, label: "Left" },
        { id: "right" as const, icon: ArrowRight, label: "Right" },
        { id: "up" as const, icon: ArrowUp, label: "Up" },
        { id: "down" as const, icon: ArrowDown, label: "Down" },
        { id: "default" as const, icon: Move, label: "Auto" },
    ];
</script>

<div
    class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 overflow-hidden"
    style:height={hasArrows ? "40px" : "0px"}
    style:opacity={hasArrows ? "1" : "0"}
>
    <div class="h-10 flex items-center px-4 gap-4">
        <div
            class="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-2"
        >
            <span>Connection</span>
            <div class="h-3 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {#if mode === "plantuml"}
            <div class="flex items-center gap-1">
                {#each buttons as btn}
                    <button
                        class="p-1.5 rounded-md transition-all duration-200 relative group
                        {activeDirection === btn.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
                        onclick={() => onDirectionChange(btn.id)}
                        title={btn.label}
                    >
                        {#if btn.id === "left"}
                            <ArrowLeft size={14} strokeWidth={2.5} />
                        {:else if btn.id === "right"}
                            <ArrowRight size={14} strokeWidth={2.5} />
                        {:else if btn.id === "up"}
                            <ArrowUp size={14} strokeWidth={2.5} />
                        {:else if btn.id === "down"}
                            <ArrowDown size={14} strokeWidth={2.5} />
                        {:else}
                            <Move size={14} strokeWidth={2.5} />
                        {/if}
                    </button>
                {/each}
            </div>
        {:else}
            <!-- Graphviz Notice -->
            <div
                class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30"
            >
                <Info size={12} />
                <span>Graphviz uses global rankdir</span>
            </div>
        {/if}
    </div>

    <!-- Right Side Tools -->
    <!-- Right Side Tools -->
    <div
        class="h-10 flex items-center px-4 gap-2 border-l border-gray-200 dark:border-gray-800"
    >
        <!-- Layout Toggle -->
        <div
            class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mr-2"
        >
            <button
                class="p-1 px-2 text-[10px] font-bold rounded transition-all {diagramStore.code.includes(
                    'left to right direction',
                ) || diagramStore.layoutParams.rankdir === 'LR'
                    ? 'text-gray-500'
                    : 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'}"
                onclick={() => {
                    // Switch to TB
                    let code = diagramStore.code;
                    if (diagramStore.mode === "plantuml") {
                        code = code.replace(
                            /left to right direction\s*\n?/g,
                            "",
                        );
                    } else {
                        // For Graphviz, we update layoutParams override
                        diagramStore.layoutParams.rankdir = "TB";
                    }
                    diagramStore.code = code;
                    diagramStore.render();
                }}
                title="Top-Down Layout"
            >
                TB
            </button>
            <button
                class="p-1 px-2 text-[10px] font-bold rounded transition-all {diagramStore.code.includes(
                    'left to right direction',
                ) || diagramStore.layoutParams.rankdir === 'LR'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                    : 'text-gray-500'}"
                onclick={() => {
                    // Switch to LR
                    let code = diagramStore.code;
                    if (diagramStore.mode === "plantuml") {
                        if (!code.includes("left to right direction")) {
                            // Insert after @startuml
                            code = code.replace(
                                /@startuml/i,
                                "@startuml\nleft to right direction",
                            );
                        }
                    } else {
                        diagramStore.layoutParams.rankdir = "LR";
                    }
                    diagramStore.code = code;
                    diagramStore.render();
                }}
                title="Left-Right Layout"
            >
                LR
            </button>
        </div>

        <ColorPicker
            onSelect={(color) => {
                if (diagramStore.selectedElementId) {
                    diagramStore.updateElementProperty("color", color);
                } else {
                    // Insert at cursor or fallback logic (simplest is alert user or append)
                    // For now, let's just append to end or log it. Ideally we insert at cursor.
                    // But store doesn't track cursor pos exactly for insertion yet without Editor ref.
                    // We'll trust the store selection logic or just notify.
                }
            }}
        />

        <button
            class="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors relative group"
            onclick={() => {
                const url = generateShareUrl(diagramStore.code);
                navigator.clipboard.writeText(url);
                // Simple toast feedback could go here, or changing icon temporarily
                const btn = document.getElementById("share-btn-icon");
                if (btn) btn.style.color = "#10b981"; // green
                setTimeout(() => {
                    if (btn) btn.style.color = "";
                }, 2000);
            }}
            title="Copy Live Share URL"
        >
            <div id="share-btn-icon" class="transition-colors duration-300">
                <Link size={16} strokeWidth={2} />
            </div>

            <span
                class="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity"
            >
                Copy Link
            </span>
        </button>
    </div>
</div>
