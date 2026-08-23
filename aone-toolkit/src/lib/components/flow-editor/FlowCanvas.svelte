<script lang="ts">
    import { onMount } from "svelte";
    import { cubicInOut } from "svelte/easing";
    import { tweened } from "svelte/motion";
    import type { Viewport } from "./types";

    let {
        viewport = $bindable({ x: 0, y: 0, zoom: 1 }),
        children,
        onBoxSelect,
        onCanvasDoubleClick,
        onDrop,
        gridType = "dots",
        gridColor = "#64748b",
        presence = [],
    } = $props<{
        viewport?: Viewport;
        children?: import("svelte").Snippet;
        onBoxSelect?: (rect: {
            x: number;
            y: number;
            w: number;
            h: number;
        }) => void;
        onCanvasDoubleClick?: (
            base: { x: number; y: number },
            event: MouseEvent,
        ) => void;
        onFitView?: () => void;
        onSearch?: () => void;
        onOpenAssetHub?: () => void;
        onOpenGlobals?: () => void;
        onOpenHistory?: () => void;
        presence?: {
            id: string;
            name: string;
            color: string;
            x: number;
            y: number;
        }[];
        onDrop?: (
            event: DragEvent,
            canvasPos: { x: number; y: number },
        ) => void;
        gridType?: "dots" | "lines";
        gridColor?: string;
    }>();

    // NEW: Ruler and Guide settings
    let showRulers = $state(true);
    let snapToGuides = $state(true);
    let guides = $state<{ x?: number; y?: number; id: string }[]>([]);
    let rulerSize = 24;
    let rulerStep = 100; // pixels between major ruler marks

    let container: HTMLDivElement;
    // Interaction states - using $state where they impact render/reactivity
    let isPanning = false;
    let isBoxSelecting = $state(false);
    let startPos = { x: 0, y: 0 };
    let selectionBox = $state<{
        x: number;
        y: number;
        w: number;
        h: number;
    } | null>(null);

    // Grid Background Pattern
    let bgPosition = $derived(`${viewport.x}px ${viewport.y}px`);
    let bgSize = $derived(`${20 * viewport.zoom}px ${20 * viewport.zoom}`);
    let bgImage = $derived.by(() => {
        if (gridType === "lines") {
            return `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`;
        }
        return `radial-gradient(${gridColor} 1px, transparent 1px)`;
    });

    let isSpacePressed = false;

    function handleKeyDown(e: KeyboardEvent) {
        if (
            e.code === "Space" &&
            !e.repeat &&
            (e.target as HTMLElement).tagName !== "INPUT" &&
            (e.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
            isSpacePressed = true;
            if (!isPanning && !isBoxSelecting)
                document.body.style.cursor = "grab";
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.code === "Space") {
            isSpacePressed = false;
            if (!isPanning) document.body.style.cursor = "";
        }

        // NEW: R key toggles rulers
        if (e.code === "KeyR" && !e.repeat) {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+R: Toggle snap to guides
                e.preventDefault();
                snapToGuides = !snapToGuides;
            } else {
                // R alone: Toggle rulers visibility
                showRulers = !showRulers;
            }
        }

        // NEW: G key adds guide on double-click position context
        if (e.code === "KeyG" && !e.repeat) {
            // This would need canvas position - handled in double click
        }
    }

    // NEW: Add horizontal guide at y position
    function addHorizontalGuide(y: number) {
        const id = `guide_h_${Date.now()}`;
        guides = [...guides, { y: Math.round(y / 20) * 20, id }];
    }

    // NEW: Add vertical guide at x position
    function addVerticalGuide(x: number) {
        const id = `guide_v_${Date.now()}`;
        guides = [...guides, { x: Math.round(x / 20) * 20, id }];
    }

    // NEW: Remove guide by id
    function removeGuide(id: string) {
        guides = guides.filter((g) => g.id !== id);
    }

    // NEW: Calculate ruler marks based on viewport
    let horizontalMarks = $derived.by(() => {
        const marks: { pos: number; label: number; major: boolean }[] = [];
        const startX =
            Math.floor(-viewport.x / viewport.zoom / rulerStep) * rulerStep;
        const endX = startX + 1920 / viewport.zoom + rulerStep * 2;

        for (let x = startX; x <= endX; x += rulerStep / 5) {
            const screenX = x * viewport.zoom + viewport.x;
            const major = x % rulerStep === 0;
            marks.push({ pos: screenX, label: x, major });
        }
        return marks;
    });

    let verticalMarks = $derived.by(() => {
        const marks: { pos: number; label: number; major: boolean }[] = [];
        const startY =
            Math.floor(-viewport.y / viewport.zoom / rulerStep) * rulerStep;
        const endY = startY + 1080 / viewport.zoom + rulerStep * 2;

        for (let y = startY; y <= endY; y += rulerStep / 5) {
            const screenY = y * viewport.zoom + viewport.y;
            const major = y % rulerStep === 0;
            marks.push({ pos: screenY, label: y, major });
        }
        return marks;
    });

    function handleMouseDown(e: MouseEvent) {
        // Middle click or Space+Click -> Pan
        if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
            isPanning = true;
            startPos = { x: e.clientX, y: e.clientY };
            document.body.style.cursor = "grabbing";
            e.preventDefault(); // Prevent text selection
            return;
        }

        // Left Click on Empty Space -> Box Select (if not panning)
        // We ensure we clicked the container itself or the SVG background
        if (
            e.button === 0 &&
            (e.target === container ||
                (e.target as HTMLElement).tagName === "svg")
        ) {
            isBoxSelecting = true;
            startPos = { x: e.clientX, y: e.clientY };
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (isPanning) {
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;
            viewport.x += dx;
            viewport.y += dy;
            startPos = { x: e.clientX, y: e.clientY };
        } else if (isBoxSelecting) {
            const rect = container.getBoundingClientRect();
            // Current mouse relative to container
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            // Start mouse relative to container
            const startX = startPos.x - rect.left;
            const startY = startPos.y - rect.top;

            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const w = Math.abs(currentX - startX);
            const h = Math.abs(currentY - startY);

            selectionBox = { x, y, w, h };
        }
    }

    function handleMouseUp(e: MouseEvent) {
        if (isPanning) {
            isPanning = false;
            document.body.style.cursor = "";
        } else if (isBoxSelecting && selectionBox) {
            if (onBoxSelect) {
                // Convert selection box to Canvas Coordinates
                const canvasRect = {
                    x: (selectionBox.x - viewport.x) / viewport.zoom,
                    y: (selectionBox.y - viewport.y) / viewport.zoom,
                    w: selectionBox.w / viewport.zoom,
                    h: selectionBox.h / viewport.zoom,
                };
                onBoxSelect(canvasRect);
            }
            isBoxSelecting = false;
            selectionBox = null;
        } else if (isBoxSelecting) {
            // Clicked but didn't drag enough to create a box
            isBoxSelecting = false;
            selectionBox = null;
        }
    }

    function handleWheel(e: WheelEvent) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSpeed = 0.001;
            // Limit zoom between 0.1 and 5
            const newZoom = Math.max(
                0.1,
                Math.min(5, viewport.zoom - e.deltaY * zoomSpeed),
            );
            viewport.zoom = newZoom;
        } else {
            // Pan
            viewport.x -= e.deltaX;
            viewport.y -= e.deltaY;
        }
    }

    function handleDoubleClick(e: MouseEvent) {
        if (onCanvasDoubleClick) {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
            const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
            onCanvasDoubleClick({ x, y }, e);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "copy";
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (onDrop) {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
            const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
            onDrop(e, { x, y });
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
    bind:this={container}
    class="w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-950 relative select-none outline-none"
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp}
    onwheel={handleWheel}
    ondblclick={handleDoubleClick}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    role="application"
    aria-label="Flow Editor Canvas"
    tabindex="0"
>
    <!-- NEW: Horizontal Ruler -->
    {#if showRulers}
        <div
            class="absolute top-0 left-0 right-0 h-6 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 z-40 overflow-hidden"
            style="margin-left: {rulerSize}px;"
        >
            <svg class="w-full h-full" preserveAspectRatio="none">
                {#each horizontalMarks as mark}
                    <line
                        x1={mark.pos - rulerSize}
                        y1={mark.major ? 0 : 12}
                        x2={mark.pos - rulerSize}
                        y2="24"
                        stroke="currentColor"
                        stroke-width={mark.major ? 1 : 0.5}
                        class={mark.major
                            ? "text-slate-600 dark:text-slate-400"
                            : "text-slate-400 dark:text-slate-600"}
                    />
                    {#if mark.major}
                        <text
                            x={mark.pos - rulerSize + 2}
                            y="11"
                            class="text-[8px] fill-slate-500 dark:fill-slate-500 font-mono"
                        >
                            {mark.label}
                        </text>
                    {/if}
                {/each}
            </svg>
        </div>

        <!-- NEW: Vertical Ruler -->
        <div
            class="absolute top-0 left-0 bottom-0 w-6 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 z-40 overflow-hidden"
            style="margin-top: {rulerSize}px;"
        >
            <svg class="w-full h-full" preserveAspectRatio="none">
                {#each verticalMarks as mark}
                    <line
                        x1={0}
                        y1={mark.pos - rulerSize}
                        x2="24"
                        y2={mark.pos - rulerSize}
                        stroke="currentColor"
                        stroke-width={mark.major ? 1 : 0.5}
                        class={mark.major
                            ? "text-slate-600 dark:text-slate-400"
                            : "text-slate-400 dark:text-slate-600"}
                    />
                    {#if mark.major}
                        <text
                            x="2"
                            y={mark.pos - rulerSize + 10}
                            class="text-[8px] fill-slate-500 dark:fill-slate-500 font-mono"
                            transform="rotate(90, 2, {mark.pos -
                                rulerSize +
                                10})"
                        >
                            {mark.label}
                        </text>
                    {/if}
                {/each}
            </svg>
        </div>

        <!-- NEW: Corner Square -->
        <div
            class="absolute top-0 left-0 z-50 bg-slate-200 dark:bg-slate-700"
            style="width: {rulerSize}px; height: {rulerSize}px;"
        ></div>
    {/if}

    <!-- Background Grid -->
    <div
        class="absolute pointer-events-none opacity-10 dark:opacity-20"
        style="
            background-image: {bgImage};
            background-size: {bgSize};
            background-position: {bgPosition};
            top: {showRulers ? rulerSize : 0}px;
            left: {showRulers ? rulerSize : 0}px;
            right: 0;
            bottom: 0;
        "
    ></div>

    <!-- Content Layer -->
    <div
        class="absolute origin-top-left will-change-transform transform-gpu"
        style="transform: translate3d({viewport.x +
            (showRulers ? rulerSize : 0)}px, {viewport.y +
            (showRulers ? rulerSize : 0)}px, 0px) scale({viewport.zoom});"
    >
        {@render children?.()}
    </div>

    <!-- Presence Cursors -->
    {#if presence && presence.length > 0}
        <div
            class="absolute inset-0 pointer-events-none overflow-visible transform-gpu"
            style="transform: translate3d({viewport.x +
                (showRulers ? rulerSize : 0)}px, {viewport.y +
                (showRulers
                    ? rulerSize
                    : 0)}px, 0px) scale({viewport.zoom}); z-index: 100;"
        >
            {#each presence as cursor (cursor.id)}
                <div
                    class="absolute transition-all duration-1000 ease-in-out"
                    style="left: {cursor.x}px; top: {cursor.y}px;"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5.65376 12.3822L15.3026 3.10517C16.1225 2.31604 17.5 2.8956 17.5 4.037L17.5 20.0381C17.5 21.3653 15.7533 21.8596 15.0116 20.7594L11.5312 15.6025C11.3323 15.3025 10.9984 15.1221 10.6395 15.1221H6.12461C4.78768 15.1221 4.14571 13.5278 5.12461 12.6148L5.65376 12.3822Z"
                            fill={cursor.color}
                        />
                    </svg>
                    <div
                        class="ml-4 -mt-1 px-2 py-0.5 rounded text-[10px] font-medium text-white shadow-sm whitespace-nowrap"
                        style="background-color: {cursor.color}"
                    >
                        {cursor.name}
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Selection Box Overlay -->
    {#if isBoxSelecting && selectionBox}
        <div
            class="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50"
            style="
                left: {selectionBox.x}px;
                top: {selectionBox.y}px;
                width: {selectionBox.w}px;
                height: {selectionBox.h}px;
            "
        ></div>
    {/if}

    <!-- NEW: Guide Lines -->
    {#if showRulers}
        <svg
            class="absolute inset-0 pointer-events-none z-30"
            style="margin-left: {rulerSize}px; margin-top: {rulerSize}px;"
        >
            {#each guides as guide (guide.id)}
                {#if guide.x !== undefined}
                    <line
                        x1={guide.x * viewport.zoom + viewport.x}
                        y1="-1000"
                        x2={guide.x * viewport.zoom + viewport.x}
                        y2="5000"
                        stroke="#f472b6"
                        stroke-width="1"
                        stroke-dasharray="4,4"
                        class="cursor-pointer"
                        onclick={() => removeGuide(guide.id)}
                    />
                {/if}
                {#if guide.y !== undefined}
                    <line
                        x1="-1000"
                        y1={guide.y * viewport.zoom + viewport.y}
                        x2="5000"
                        y2={guide.y * viewport.zoom + viewport.y}
                        stroke="#f472b6"
                        stroke-width="1"
                        stroke-dasharray="4,4"
                        class="cursor-pointer"
                        onclick={() => removeGuide(guide.id)}
                    />
                {/if}
            {/each}
        </svg>
    {/if}

    <!-- Controls Overlay -->
    <div class="absolute bottom-4 right-4 flex flex-col gap-2">
        <div
            class="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
        >
            Zoom: {Math.round(viewport.zoom * 100)}%
            <br />
            X: {Math.round(viewport.x)} Y: {Math.round(viewport.y)}
        </div>

        <!-- NEW: Ruler/Guide Status -->
        {#if showRulers}
            <div
                class="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-lg border text-xs flex items-center gap-2"
            >
                <span class="text-slate-500">R:</span>
                <span
                    class:text-blue-500={snapToGuides}
                    class:text-slate-400={!snapToGuides}
                >
                    {snapToGuides ? "Snap On" : "Snap Off"}
                </span>
                <span class="text-slate-300">|</span>
                <span class="text-slate-400">{guides.length} guides</span>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Hide scrollbars */
    div {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    div::-webkit-scrollbar {
        display: none;
    }
</style>
