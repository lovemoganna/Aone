<script lang="ts">
    import { type Snippet, onMount } from "svelte";
    import { Panel } from "$lib/components/ui";
    import { Menu, X } from "lucide-svelte";

    interface Props {
        header?: Snippet;
        sidebar?: Snippet;
        children?: Snippet;
        sidebarPosition?: "left" | "right";
        sidebarOpen?: boolean;
        class?: string;
        enableResize?: boolean;
        resizeKey?: string;
    }

    let {
        header,
        sidebar,
        children,
        sidebarPosition = "left",
        sidebarOpen = $bindable(false),
        class: className = "",
        enableResize = false,
        resizeKey = "",
    }: Props = $props();

    let customHeight = $state<number | null>(null);
    let isDragging = $state(false);
    let startY = 0;
    let startHeight = 0;

    // Load initial custom height from localStorage if persistent key provided
    onMount(() => {
        if (enableResize && resizeKey) {
            const saved = localStorage.getItem(resizeKey);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 400 && parsed <= 3000) {
                    customHeight = parsed;
                }
            }
        }
    });

    function handleMouseDown(e: MouseEvent) {
        if (!enableResize) return;
        isDragging = true;
        startY = e.clientY;

        const containerId = resizeKey || "tool-workspace-container";
        const element = document.getElementById(containerId);
        if (element) {
            startHeight = element.getBoundingClientRect().height;
        } else {
            startHeight = customHeight || 750;
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "ns-resize";
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        // Limit height between 400px and 2500px for reasonable ergonomics
        const newHeight = Math.max(400, Math.min(2500, startHeight + deltaY));
        customHeight = newHeight;
    }

    function handleMouseUp() {
        if (isDragging) {
            isDragging = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";

            if (enableResize && resizeKey && customHeight !== null) {
                localStorage.setItem(resizeKey, customHeight.toString());
            }
        }
    }

    function handleDoubleClick() {
        if (!enableResize) return;
        customHeight = null;
        if (resizeKey) {
            localStorage.removeItem(resizeKey);
        }
    }
</script>

<div
    id={resizeKey || "tool-workspace-container"}
    class="{className.includes('h-') ? '' : (customHeight ? '' : `h-[calc(100vh-3rem)] ${enableResize ? 'min-h-[700px]' : ''}`)} p-2 sm:p-4 flex flex-col space-y-4 mx-auto {className.includes('max-w-') ? '' : 'max-w-[1600px]'} {className}"
    style={customHeight ? `height: ${customHeight}px;` : ""}
>
    <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl border-slate-200/60 dark:border-slate-800/60" padding="none">
        {#if header}
            <div class="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                <!-- Mobile sidebar toggle -->
                {#if sidebar}
                    <button
                        onclick={() => sidebarOpen = !sidebarOpen}
                        class="lg:hidden mr-3 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={18} />
                    </button>
                {/if}
                {@render header()}
            </div>
        {/if}

        <div class="flex-1 flex min-h-0 relative">
            {#if sidebar && sidebarPosition === "left"}
                <!-- Desktop sidebar -->
                <div class="hidden lg:flex w-72 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    {@render sidebar()}
                </div>
                <!-- Mobile sidebar overlay -->
                {#if sidebarOpen}
                    <!-- Backdrop -->
                    <button
                        class="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        onclick={() => sidebarOpen = false}
                        aria-label="Close sidebar"
                    ></button>
                    <!-- Drawer -->
                    <div class="lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-in">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Menu</span>
                            <button
                                onclick={() => sidebarOpen = false}
                                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Close sidebar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto">
                            {@render sidebar()}
                        </div>
                    </div>
                {/if}
            {/if}

            <div class="flex-1 flex flex-col min-h-0 relative bg-transparent">
                {@render children?.()}
            </div>

            {#if sidebar && sidebarPosition === "right"}
                <!-- Desktop sidebar -->
                <div class="hidden lg:flex w-72 flex-shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    {@render sidebar()}
                </div>
                <!-- Mobile sidebar overlay (right) -->
                {#if sidebarOpen}
                    <button
                        class="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        onclick={() => sidebarOpen = false}
                        aria-label="Close sidebar"
                    ></button>
                    <div class="lg:hidden fixed inset-y-0 right-0 z-50 w-72 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-in">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">Panel</span>
                            <button
                                onclick={() => sidebarOpen = false}
                                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Close sidebar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto">
                            {@render sidebar()}
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </Panel>

    {#if enableResize}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="hidden md:flex items-center justify-center h-4 w-full cursor-ns-resize group relative select-none mt-2"
            onmousedown={handleMouseDown}
            ondblclick={handleDoubleClick}
        >
            <div class="w-full h-1 bg-slate-200 dark:bg-slate-800/80 rounded group-hover:bg-blue-500/80 transition-colors flex items-center justify-center">
                <div class="flex gap-1 py-0.5 px-3 bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-500 rounded border border-slate-300 dark:border-slate-700 group-hover:border-blue-400/50 shadow-sm transition-colors duration-150">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-white scale-75"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-white scale-75"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 group-hover:bg-white scale-75"></span>
                </div>
            </div>
            <span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 dark:bg-slate-900 text-slate-300 dark:text-slate-400 px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                拖动以调整页面高度 / 双击重置
            </span>
        </div>
    {/if}
</div>

<style>
    @keyframes slide-in-left {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
    }
    :global(.animate-slide-in) {
        animation: slide-in-left 0.2s ease-out;
    }
</style>
