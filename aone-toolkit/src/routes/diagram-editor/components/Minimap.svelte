<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { sanitizeSvg } from "../lib/sanitize";
    import { X } from "lucide-svelte";

    let container = $state<HTMLDivElement>();
    let isDragging = $state(false);

    // Config
    const MINIMAP_W = 200;
    const MINIMAP_H = 130;

    let contentRect = $state({ w: 2000, h: 2000, x: 0, y: 0 });
    let viewport = $state({ w: 0, h: 0 });

    let sanitizedSvg = $derived(
        diagramStore.svg
            ? sanitizeSvg(diagramStore.svg)
                  .replace(/width="[^"]*"/, 'width="100%"')
                  .replace(/height="[^"]*"/, 'height="100%"')
            : ""
    );

    $effect(() => {
        if (diagramStore.svg) {
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
        if (typeof window !== "undefined") {
            viewport = { w: window.innerWidth, h: window.innerHeight };
        }
    });

    let mapScale = $derived.by(() => {
        const sx = MINIMAP_W / (contentRect.w || 2000);
        const sy = MINIMAP_H / (contentRect.h || 2000);
        return Math.min(sx, sy);
    });

    let offsetX = $derived((MINIMAP_W - (contentRect.w || 2000) * mapScale) / 2);
    let offsetY = $derived((MINIMAP_H - (contentRect.h || 2000) * mapScale) / 2);

    let rectProps = $derived.by(() => {
        const s = diagramStore.scale;
        const cx = contentRect.x + contentRect.w / 2 - diagramStore.pan.x / s;
        const cy = contentRect.y + contentRect.h / 2 - diagramStore.pan.y / s;
        const vw = (viewport.w || 1000) / s;
        const vh = (viewport.h || 800) / s;
        const x = cx - vw / 2;
        const y = cy - vh / 2;

        return {
            x: offsetX + (x - contentRect.x) * mapScale,
            y: offsetY + (y - contentRect.y) * mapScale,
            w: Math.max(8, vw * mapScale),
            h: Math.max(8, vh * mapScale),
        };
    });

    function handleMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        isDragging = true;
        e.preventDefault();
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging || !container) return;
        const bounds = container.getBoundingClientRect();
        const mx = e.clientX - bounds.left;
        const my = e.clientY - bounds.top;
        teleport(mx, my);
    }

    function teleport(mx: number, my: number) {
        const tx = (mx - offsetX) / mapScale + contentRect.x;
        const ty = (my - offsetY) / mapScale + contentRect.y;
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

{#if diagramStore.isMinimapOpen}
    <div
        class="absolute bottom-12 right-3 w-[200px] h-[130px] bg-white/95 dark:bg-[#0b0f17]/95 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden z-20 hidden md:block select-none backdrop-blur-xs"
        bind:this={container}
        onmousedown={handleMouseDown}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
        role="button"
        tabindex="0"
        aria-label="Diagram minimap"
    >
        <!-- Header / Close button -->
        <div class="absolute top-1 right-1 z-30">
            <button
                type="button"
                class="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onclick={(e) => {
                    e.stopPropagation();
                    diagramStore.isMinimapOpen = false;
                }}
                title="Close Minimap"
                aria-label="关闭鹰眼图"
            >
                <X size={11} />
            </button>
        </div>

        <!-- Background Content -->
        <div
            class="absolute inset-0 flex items-center justify-center p-1.5 opacity-25 pointer-events-none"
        >
            {#if sanitizedSvg}
                {@html sanitizedSvg}
            {/if}
        </div>

        <!-- Viewport Box -->
        <div
            class="absolute border border-slate-800 dark:border-slate-200 bg-slate-900/10 dark:bg-white/10 cursor-move"
            style="
                left: {rectProps.x}px;
                top: {rectProps.y}px;
                width: {rectProps.w}px;
                height: {rectProps.h}px;
            "
        ></div>
    </div>
{/if}
