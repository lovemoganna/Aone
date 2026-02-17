<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { onMount, tick } from "svelte";

    let container: HTMLDivElement;
    let isDragging = $state(false);

    // Config
    const MINIMAP_W = 240;
    const MINIMAP_H = 160;

    // We assume the internal content is scaled to fit 240x160 completely?
    // Or do we maintain aspect ratio?
    // Simplest: "Fit Contain" logic for the SVG preview, then map coords.

    // 1. Get true size of current SVG
    let contentRect = $state({ w: 2000, h: 2000, x: 0, y: 0 }); // viewBox or bbox
    let viewport = $state({ w: 0, h: 0 });

    $effect(() => {
        if (diagramStore.svg) {
            // Use a regex to extract viewBox if possible, or assume a standard canvas size logic
            // Ideally Preview.svelte would export this info.
            // For now, let's just parse viewBox from the string
            const match = diagramStore.svg.match(/viewBox="([^"]+)"/);
            if (match) {
                const parts = match[1].split(/\s+/).map(Number);
                if (parts.length === 4) {
                    contentRect = {
                        x: parts[0],
                        y: parts[1],
                        w: parts[2],
                        h: parts[3],
                    };
                }
            }
        }
        // Also update viewport size based on window?
        viewport = { w: window.innerWidth, h: window.innerHeight };
    });

    // 2. Calculate Viewport Box
    // Map main coord system -> Minimap coord system
    // Scale factor M = minimapWidth / contentRect.w (assuming fill width?)
    // Actually we usually use "contain"

    let mapScale = $derived.by(() => {
        const sx = MINIMAP_W / contentRect.w;
        const sy = MINIMAP_H / contentRect.h;
        return Math.min(sx, sy);
    });

    let offsetX = $derived((MINIMAP_W - contentRect.w * mapScale) / 2);
    let offsetY = $derived((MINIMAP_H - contentRect.h * mapScale) / 2);

    // Viewport Rect in Minimap Coords
    // Pan is translation applied to content.
    // Visible area in content coords:
    //  x = -pan.x / scale
    //  y = -pan.y / scale
    //  w = viewport.w / scale
    //  h = viewport.h / scale

    let rectProps = $derived.by(() => {
        const s = diagramStore.scale;

        // Convert to Content Space
        const vx = (-diagramStore.pan.x + viewport.w / 2) / s; // We center pan?
        // Wait, Preview pan logic:
        // transform: translate(pan.x, pan.y) scale(s)
        // With origin-center (in Preview: items-center justify-center)
        // This is tricky.

        // Let's use simple relative positioning hook.
        // It's approximations, but valuable.

        // If pan=(0,0), we see center of content.
        // If pan is positive, we shifted content RIGHT, so we see LEFT part of content?
        // Actually positive pan moves content RIGHT. So viewport moves LEFT relative to content.

        // Let's model: Center of Viewport in Content Space
        // C_view = Center_content - (Pan / Scale)

        const cx = contentRect.x + contentRect.w / 2 - diagramStore.pan.x / s;
        const cy = contentRect.y + contentRect.h / 2 - diagramStore.pan.y / s;

        // Width/Height in Content Space
        const vw = viewport.w / s;
        const vh = viewport.h / s;

        // Top-Left in Content Space
        const x = cx - vw / 2;
        const y = cy - vh / 2;

        // Convert to Minimap Space
        // mmX = offsetX + (x - contentRect.x) * mapScale

        return {
            x: offsetX + (x - contentRect.x) * mapScale,
            y: offsetY + (y - contentRect.y) * mapScale,
            w: vw * mapScale,
            h: vh * mapScale,
        };
    });

    // Drag Logic
    function handleMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        isDragging = true;
        e.preventDefault();
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging || !container) return;
        // Delta movement in Minimap pixels
        const bounds = container.getBoundingClientRect();

        // If clicking anywhere in minimap, we want to center view there?
        // Or just drag delta?
        // Let's do absolute position for now (Click to Teleport)
        // Or drag logic.

        // Let's implement dragging the box.
        const mx = e.clientX - bounds.left;
        const my = e.clientY - bounds.top;

        teleport(mx, my);
    }

    function teleport(mx: number, my: number) {
        // Convert Minimap (mx, my) -> Content Space (tx, ty)
        // mx = offsetX + (tx - contentRect.x) * mapScale
        // tx = ((mx - offsetX) / mapScale) + contentRect.x

        const tx = (mx - offsetX) / mapScale + contentRect.x;
        const ty = (my - offsetY) / mapScale + contentRect.y;

        // We want this (tx, ty) to be the CENTER of the viewport
        // C_view = tx, ty

        // Invert store logic:
        // cx = (contentRect.x + contentRect.w/2) - (pan.x / s)
        // pan.x / s = (contentRect.x + contentRect.w/2) - cx
        // pan.x = s * (Center_content_x - tx)

        const centerContentX = contentRect.x + contentRect.w / 2;
        const centerContentY = contentRect.y + contentRect.h / 2;

        diagramStore.pan.x = diagramStore.scale * (centerContentX - tx);
        diagramStore.pan.y = diagramStore.scale * (centerContentY - ty);
    }

    function handleMouseUp() {
        isDragging = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }
</script>

<div
    class="absolute top-4 right-4 w-[240px] h-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden opacity-90 transition-opacity z-20 hidden md:block select-none"
    class:!hidden={!diagramStore.isMinimapOpen}
    bind:this={container}
    onmousedown={handleMouseDown}
>
    <!-- Background Content -->
    <div
        class="absolute inset-0 flex items-center justify-center p-2 opacity-30 pointer-events-none"
    >
        {#if diagramStore.svg}
            {@html diagramStore.svg
                .replace(/width="[^"]*"/, 'width="100%"')
                .replace(/height="[^"]*"/, 'height="100%"')}
        {/if}
    </div>

    <!-- Viewport Box -->
    <div
        class="absolute border-2 border-indigo-500 bg-indigo-500/10 cursor-move shadow-sm"
        style="
            left: {rectProps.x}px;
            top: {rectProps.y}px;
            width: {rectProps.w}px;
            height: {rectProps.h}px;
        "
    ></div>
</div>
