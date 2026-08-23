<script lang="ts">
    import type { FlowNode, Viewport } from "./types";

    let {
        nodes,
        viewport = $bindable(),
        width = 200,
        height = 150,
        nodeColor = "#64748b",
        viewportW = 1000,
        viewportH = 800,
    } = $props<{
        nodes: FlowNode[];
        viewport: Viewport;
        width?: number;
        height?: number;
        nodeColor?: string;
        viewportW?: number;
        viewportH?: number;
    }>();

    // Map node types to colors for the radar
    const typeColors: Record<string, string> = {
        start: "#94a3b8", // slate-400
        end: "#94a3b8",
        agent: "#8b5cf6", // violet-500
        skill: "#10b981", // emerald-500
        router: "#3b82f6", // blue-500
        parallel: "#f59e0b", // amber-500
        condition: "#f43f5e", // rose-500
        broadcast: "#a855f7", // purple-500
        listen: "#a855f7", // purple-500
        group: "#cbd5e1", // slate-300
        loop: "#fcd34d", // amber-300
    };

    // Minimap state
    let container: HTMLDivElement;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let startViewport = { x: 0, y: 0 };

    // Computed bounds of the flow
    let bounds = $derived.by(() => {
        if (nodes.length === 0) return { x: 0, y: 0, w: 100, h: 100 };

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        nodes.forEach((n: FlowNode) => {
            if (n.position.x < minX) minX = n.position.x;
            if (n.position.y < minY) minY = n.position.y;
            if (n.position.x > maxX) maxX = n.position.x;
            if (n.position.y > maxY) maxY = n.position.y;
        });

        const padding = 200;
        return {
            x: minX - padding,
            y: minY - padding,
            w: Math.max(maxX - minX + padding * 2 + 256, 100),
            h: Math.max(maxY - minY + padding * 2 + 100, 100),
        };
    });

    // Scale to fit nodes in minimap
    let scale = $derived(Math.min(width / bounds.w, height / bounds.h));

    // Helper to map world pos to minimap pos
    function mapX(x: number) {
        return (x - bounds.x) * scale;
    }
    function mapY(y: number) {
        return (y - bounds.y) * scale;
    }
    // Helper to unmap minimap pos to world pos
    function unmapX(mx: number) {
        return mx / scale + bounds.x;
    }
    function unmapY(my: number) {
        return my / scale + bounds.y;
    }

    // Viewport Indicator
    let indicator = $derived({
        x: mapX(-viewport.x / viewport.zoom),
        y: mapY(-viewport.y / viewport.zoom),
        w: (viewportW / viewport.zoom) * scale,
        h: (viewportH / viewport.zoom) * scale,
    });

    function handleMinimapClick(e: MouseEvent) {
        if (isDragging) return;
        const rect = container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Target World Center
        const targetWx = unmapX(clickX);
        const targetWy = unmapY(clickY);

        // Center Viewport there
        viewport.x = viewportW / 2 - targetWx * viewport.zoom;
        viewport.y = viewportH / 2 - targetWy * viewport.zoom;
    }

    function handleIndicatorMouseDown(e: MouseEvent) {
        e.stopPropagation(); // Don't trigger background click
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        startViewport = { ...viewport };

        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    function handleGlobalMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        // Convert delta screen pixels -> delta minimap pixels -> delta world units
        // actually dx onscreen is same as dx on minimap if we drag the indicator?
        // Yes, if we drag indicator 10px, we want it to move 10px.

        // Minimap Delta = dx
        // World Delta = dx / scale
        // Viewport Delta (inverted) = -(dx / scale) * zoom

        viewport.x = startViewport.x - (dx / scale) * viewport.zoom;
        viewport.y = startViewport.y - (dy / scale) * viewport.zoom;
    }

    function handleGlobalMouseUp() {
        isDragging = false;
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    bind:this={container}
    class="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden pointer-events-auto cursor-pointer relative"
    style="width: {width}px; height: {height}px;"
    role="complementary"
    aria-label="Minimap"
    onmousedown={handleMinimapClick}
>
    <!-- Background Content -->
    <div class="absolute inset-0 w-full h-full opacity-60 pointer-events-none">
        {#each nodes as node (node.id)}
            <div
                class="absolute rounded-[2px]"
                style="
                    left: {mapX(node.position.x)}px;
                    top: {mapY(node.position.y)}px;
                    width: {node.style?.width
                    ? node.style.width * scale
                    : 250 * scale}px; 
                    height: {node.style?.height
                    ? node.style.height * scale
                    : (node.collapsed ? 40 : 100) * scale}px;
                    background-color: {typeColors[node.type] || nodeColor};
                    border-radius: {4 * scale}px;
                "
            ></div>
        {/each}
    </div>

    <!-- Viewport Indicator -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move hover:bg-blue-500/20 transition-colors pointer-events-auto"
        style="
            left: {indicator.x}px;
            top: {indicator.y}px;
            width: {indicator.w}px;
            height: {indicator.h}px;
        "
        onmousedown={handleIndicatorMouseDown}
    ></div>
</div>
