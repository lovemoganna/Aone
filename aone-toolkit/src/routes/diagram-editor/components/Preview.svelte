<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { validateDiagram } from "../lib/validation";
    import { sanitizeSvg } from "../lib/sanitize";
    import { exportToBlob } from "../lib/export";
    import { analyzeDiagram } from "../lib/linter";
    import {
        ZoomIn,
        ZoomOut,
        Loader2,
        Copy,
        Check,
        AlertCircle,
        Image as ImageIcon,
        Crosshair,
        ArrowRight
    } from "lucide-svelte";


    let { svg, isRendering, onExport, onFileDrop, onNavigate } = $props<{
        svg: string;
        isRendering: boolean;
        onExport: (format: "svg" | "png") => void;
        onFileDrop?: (file: File) => void;
        onNavigate?: (line: number) => void;
    }>();

    let safeSvg = $derived(svg ? sanitizeSvg(svg) : "");

    let validation = $derived(
        validateDiagram(diagramStore.code, diagramStore.mode)
    );

    let isDragging = $state(false);
    let isSpacePressed = $state(false);
    let dragMode = $state<"pan" | "element">("pan");
    let startPan = { x: 0, y: 0 };
    let startDrag = { x: 0, y: 0 };
    let startElementPos = { x: 0, y: 0 };

    let container = $state<HTMLElement>();
    let svgContainer = $state<HTMLDivElement>();
    let copied = $state(false);
    let copiedImage = $state(false);

    // In-place text edit overlay state
    let editingText = $state<{
        elementId: string;
        initialText: string;
        currentText: string;
        x: number;
        y: number;
    } | null>(null);

    let inlineInputRef = $state<HTMLInputElement>();

    function copyToClipboard() {
        if (!safeSvg) return;
        navigator.clipboard.writeText(safeSvg).then(() => {
            copied = true;
            setTimeout(() => (copied = false), 2000);
        });
    }

    async function copyImageToClipboard() {
        if (!safeSvg) return;
        try {
            const blob = await exportToBlob(safeSvg, "png", 2);
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                ]);
                copiedImage = true;
                setTimeout(() => (copiedImage = false), 2000);
            }
        } catch (e) {
            console.error("Failed to copy image to clipboard", e);
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (file && onFileDrop) {
            onFileDrop(file);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const mx = e.clientX - cx;
        const my = e.clientY - cy;

        const s = diagramStore.scale;
        const px = diagramStore.pan.x;
        const py = diagramStore.pan.y;

        const offX = (mx - px) / s;
        const offY = (my - py) / s;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(10, s * delta));

        const newPx = mx - offX * newScale;
        const newPy = my - offY * newScale;

        diagramStore.scale = newScale;
        diagramStore.pan = { x: newPx, y: newPy };
    }

    function handleMouseDown(e: MouseEvent) {
        startDrag = { x: e.clientX, y: e.clientY };

        // Space + Left Click, Middle click or Alt+Click = Pan
        if (e.button === 1 || (e.button === 0 && (e.altKey || isSpacePressed))) {
            e.preventDefault();
            isDragging = true;
            dragMode = "pan";
            startPan = { ...diagramStore.pan };
            if (container) container.style.cursor = "grabbing";
            return;
        }

        // Left click
        if (e.button === 0) {
            const target = e.target as HTMLElement;
            if (target.closest("button, input, [role='button'], a")) {
                return;
            }

            const nodeElement = target.closest(".node") as SVGGElement;

            if (nodeElement) {
                const id =
                    nodeElement.querySelector("title")?.textContent?.trim() ||
                    nodeElement.id ||
                    "";

                if (e.shiftKey) {
                    // Shift + Click: toggle multi-selection
                    if (diagramStore.multiSelection.includes(id)) {
                        diagramStore.multiSelection =
                            diagramStore.multiSelection.filter((x) => x !== id);
                    } else {
                        diagramStore.multiSelection = [
                            ...diagramStore.multiSelection,
                            id,
                        ];
                    }
                    diagramStore.selectedElementId = id;
                    diagramStore.isInspectorOpen = true;
                    return;
                }

                diagramStore.selectedElementId = id;
                if (!diagramStore.multiSelection.includes(id)) {
                    diagramStore.multiSelection = [id];
                }
                diagramStore.isInspectorOpen = true;

                isDragging = true;
                dragMode = "element";
                const override = diagramStore.overrides[id] || {};
                startElementPos = {
                    x: override.x || 0,
                    y: override.y || 0,
                };
                e.preventDefault();
                return;
            }

            // Clicked on canvas background / non-node diagram area -> Pan canvas freely
            handleSelection(e);
            isDragging = true;
            dragMode = "pan";
            startPan = { ...diagramStore.pan };
            if (container) container.style.cursor = "grabbing";
        }
    }

    function handleSelection(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const element = target.closest(".node, .edge, .cluster") as SVGGElement;

        if (element) {
            const id =
                element.querySelector("title")?.textContent?.trim() ||
                element.id ||
                "";

            diagramStore.selectedElementId = id;
            if (!diagramStore.multiSelection.includes(id)) {
                diagramStore.multiSelection = [id];
            }
            diagramStore.isInspectorOpen = true;
        } else {
            diagramStore.selectedElementId = null;
            diagramStore.multiSelection = [];
            editingText = null;
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;

        const dx = e.clientX - startDrag.x;
        const dy = e.clientY - startDrag.y;

        if (dragMode === "pan") {
            diagramStore.pan.x = startPan.x + dx;
            diagramStore.pan.y = startPan.y + dy;
        } else if (dragMode === "element" && diagramStore.selectedElementId) {
            const s = diagramStore.scale;
            const newX = startElementPos.x + dx / s;
            const newY = startElementPos.y + dy / s;

            diagramStore.setOverride(diagramStore.selectedElementId, {
                x: newX,
                y: newY,
            });
        }
    }

    function handleMouseUp(e: MouseEvent) {
        if (!isDragging) return;

        if (dragMode === "element" && diagramStore.selectedElementId) {
            const dx = e.clientX - startDrag.x;
            const dy = e.clientY - startDrag.y;
            const s = diagramStore.scale;
            const finalX = startElementPos.x + dx / s;
            const finalY = startElementPos.y + dy / s;

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                diagramStore.updateNodePosition(
                    diagramStore.selectedElementId,
                    finalX,
                    finalY
                );
            }
        }

        isDragging = false;
        if (container) container.style.cursor = isSpacePressed ? "grab" : "";
    }

    function handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement;
        const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
        if (isInput) return;

        if (e.code === "Space") {
            isSpacePressed = true;
            if (container && !isDragging) container.style.cursor = "grab";
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.code === "Space") {
            isSpacePressed = false;
            if (container && !isDragging) container.style.cursor = "";
        }
    }

    function handleDoubleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const nodeElement = target.closest(".node, .edge, .cluster") as SVGGElement;

        if (nodeElement) {
            const id =
                nodeElement.querySelector("title")?.textContent?.trim() ||
                nodeElement.id ||
                "";

            if (id) {
                diagramStore.selectedElementId = id;
                diagramStore.isInspectorOpen = true;
                const def = diagramStore.definitions.get(id);
                if (def && onNavigate) {
                    onNavigate(def.line);
                }
            }
        }
    }

    function commitInlineTextEdit() {
        if (!editingText) return;
        const { elementId, currentText, initialText } = editingText;
        if (currentText.trim() && currentText !== initialText) {
            diagramStore.selectedElementId = elementId;
            diagramStore.updateElementProperty("label", currentText.trim());
        }
        editingText = null;
    }

    function fitToScreen() {
        if (!svgContainer || !container) return;
        const svgEl = svgContainer.querySelector("svg");
        if (svgEl) {
            const bbox = svgEl.getBBox();
            diagramStore.fitToContent(
                container.clientWidth,
                container.clientHeight,
                bbox
            );
        } else {
            diagramStore.resetView();
        }
    }

    // Run Analysis for layers
    $effect(() => {
        if (!diagramStore.code) return;
        const result = analyzeDiagram(diagramStore.code, diagramStore.mode);
        const newLayers = result.allTags;
        if (
            JSON.stringify(newLayers) !==
            JSON.stringify(diagramStore.availableLayers)
        ) {
            diagramStore.setAvailableLayers(newLayers);
        }
    });

    // Style and Trace Highlighting Effect
    $effect(() => {
        if (!safeSvg || !svgContainer) return;

        const { layers } = analyzeDiagram(diagramStore.code, diagramStore.mode);
        const adjMap = new Map<string, Set<string>>();

        const edges = svgContainer.querySelectorAll(".edge");
        edges.forEach((edge) => {
            const title = edge.querySelector("title")?.textContent || "";
            const [src, dst] = title.includes("->")
                ? title.split("->")
                : title.split("--");
            if (src && dst) {
                const s = src.trim(),
                    d = dst.trim();
                if (!adjMap.has(s)) adjMap.set(s, new Set());
                if (!adjMap.has(d)) adjMap.set(d, new Set());
                adjMap.get(s)!.add(d);
                adjMap.get(d)!.add(s);
            }
        });

        const selectedId = diagramStore.selectedElementId;
        const neighbors: Set<string> = selectedId
            ? adjMap.get(selectedId) || new Set<string>()
            : new Set<string>();
        const hasActiveLayers = diagramStore.activeLayers.length > 0;

        const elements = svgContainer.querySelectorAll(".node, .edge, .cluster");
        elements.forEach((node) => {
            const g = node as SVGGElement;
            const id =
                g.querySelector("title")?.textContent?.trim() || g.id || "";

            const isSelected = id === selectedId;
            const isMultiSelected = diagramStore.multiSelection.includes(id);
            const override = diagramStore.overrides[id];

            let isVisible = true;
            if (hasActiveLayers) {
                const nodeTags = layers[id] || [];
                if (nodeTags.length > 0) {
                    isVisible = nodeTags.some((t) =>
                        diagramStore.activeLayers.includes(t)
                    );
                } else if (diagramStore.availableLayers.length > 0) {
                    isVisible = false;
                }
            }

            const isConnectedEdge =
                g.classList.contains("edge") &&
                Boolean(selectedId) &&
                (id.startsWith(`${selectedId}->`) ||
                    id.endsWith(`->${selectedId}`) ||
                    id.includes(`--${selectedId}`));

            const isConnectedNode = neighbors.has(id);

            // Active trace classes
            if (selectedId && (isSelected || isConnectedNode || isConnectedEdge)) {
                g.classList.add("active-trace");
                g.classList.remove("dimmed-trace");
            } else if (selectedId && !isSelected) {
                g.classList.add("dimmed-trace");
                g.classList.remove("active-trace");
            } else {
                g.classList.remove("active-trace", "dimmed-trace");
            }

            const shapes = g.querySelectorAll(
                "polygon, ellipse, path, circle, text"
            );
            const x = override?.x || 0;
            const y = override?.y || 0;
            const scale = override?.scale || 1;

            g.style.transition =
                isDragging && isSelected
                    ? "none"
                    : "transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s";
            g.style.transformOrigin = "center";
            const transformList = [];
            if (x || y) transformList.push(`translate(${x}px, ${y}px)`);
            if (scale !== 1) transformList.push(`scale(${scale})`);
            g.style.transform = transformList.join(" ");

            shapes.forEach((shape) => {
                const s = shape as SVGElement;
                if (s.tagName === "text") return;

                if (isSelected || isMultiSelected) {
                    s.style.stroke = "#2563eb";
                    s.style.strokeWidth = "2px";
                    s.style.opacity = "1";
                } else {
                    s.style.stroke = "";
                    s.style.strokeWidth = "";
                    s.style.filter = "";

                    if (!isVisible) {
                        s.style.opacity = "0.08";
                    } else if (selectedId && diagramStore.focusMode) {
                        if (isNeighbor(id, neighbors) || isConnectedEdge) {
                            s.style.opacity = "0.95";
                        } else {
                            s.style.opacity = "0.15";
                        }
                    } else {
                        s.style.opacity = "1";
                    }
                }

                if (override?.color) {
                    if (
                        s.tagName !== "path" ||
                        s.getAttribute("fill") !== "none"
                    ) {
                        s.setAttribute("fill", override.color);
                    }
                }
            });
        });
    });

    function isNeighbor(id: string, neighbors: Set<string>) {
        return neighbors.has(id);
    }

    let errorLineNo = $derived.by(() => {
        if (!diagramStore.error) return null;
        const lineMatch =
            diagramStore.error.match(/line (\d+)/i) ||
            diagramStore.error.match(/:(\d+):/);
        return lineMatch ? parseInt(lineMatch[1], 10) - 1 : null;
    });
</script>

<div
    class="relative flex-1 h-full overflow-hidden bg-slate-50/50 dark:bg-[#0b0f17] cursor-grab select-none grid-bg transition-colors {diagramStore.previewTheme ===
    'dark'
        ? 'dark-preview'
        : ''}"
    bind:this={container}
    onwheel={handleWheel}
    onmousedown={handleMouseDown}
    ondblclick={handleDoubleClick}
    ondrop={handleDrop}
    ondragover={handleDragOver}
    role="presentation"
>
    <!-- Canvas -->
    <div
        class="absolute w-full h-full flex items-center justify-center origin-center transition-transform duration-75"
        style="transform: translate({diagramStore.pan.x}px, {diagramStore.pan
            .y}px) scale({diagramStore.scale}); --preview-font: {diagramStore.fontFamily}"
        bind:this={svgContainer}
    >
        {@html safeSvg}
    </div>

    <!-- Inline Text Editing Overlay -->
    {#if editingText}
        <div
            class="absolute z-30"
            style="left: {editingText.x - 4}px; top: {editingText.y - 4}px;"
        >
            <input
                bind:this={inlineInputRef}
                type="text"
                bind:value={editingText.currentText}
                onkeydown={(e) => {
                    if (e.key === 'Enter') commitInlineTextEdit();
                    if (e.key === 'Escape') editingText = null;
                }}
                onblur={commitInlineTextEdit}
                class="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-500 rounded shadow-md text-slate-900 dark:text-slate-100 outline-none min-w-[120px]"
            />
        </div>
    {/if}

    <!-- Canvas Controls Toolbar (Bottom Right) -->
    <div
        class="absolute bottom-3 right-3 flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-1.5 py-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 z-20 text-slate-600 dark:text-slate-300"
    >
        <span class="text-[11px] font-mono px-1.5 text-slate-500 dark:text-slate-400">
            {Math.round(diagramStore.scale * 100)}%
        </span>
        <button
            class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            title="Zoom Out"
            aria-label="缩小画布"
            onclick={() =>
                (diagramStore.scale = Math.max(0.1, diagramStore.scale - 0.25))}
        >
            <ZoomOut size={14} />
        </button>
        <button
            class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            title="Zoom In"
            aria-label="放大画布"
            onclick={() =>
                (diagramStore.scale = Math.min(10, diagramStore.scale + 0.25))}
        >
            <ZoomIn size={14} />
        </button>

        <button
            class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            title="Fit to Screen"
            aria-label="适应画布"
            onclick={fitToScreen}
        >
            <Crosshair size={14} />
        </button>

        <div class="w-px h-3.5 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        <button
            class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors {copiedImage
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}"
            title="Copy PNG Image"
            aria-label="复制PNG图片"
            onclick={copyImageToClipboard}
        >
            {#if copiedImage}
                <Check size={14} />
            {:else}
                <ImageIcon size={14} />
            {/if}
        </button>

        <button
            class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors {copied
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}"
            title="Copy SVG Vector"
            aria-label="复制SVG矢量代码"
            onclick={copyToClipboard}
        >
            {#if copied}
                <Check size={14} />
            {:else}
                <Copy size={14} />
            {/if}
        </button>
    </div>



    <!-- Loading Overlay -->
    {#if isRendering}
        <div
            class="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center z-10 transition-opacity"
        >
            <Loader2 class="animate-spin text-slate-700 dark:text-slate-300 mb-2" size={24} />
            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
                {diagramStore.renderLabel || "Rendering..."}
            </span>
        </div>
    {/if}

    <!-- Empty State -->
    {#if !safeSvg && !isRendering && !diagramStore.error}
        <div
            class="absolute inset-0 flex items-center justify-center text-slate-400"
        >
            <div class="text-center">
                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">No Diagram Rendered</p>
                <p class="text-[11px] text-slate-400 mt-1 font-mono">Press Ctrl+Enter to render</p>
            </div>
        </div>
    {/if}

    <!-- Error Banner (Bottom-Left Unobtrusive) -->
    {#if diagramStore.error && !isRendering}
        <div
            class="absolute bottom-12 left-3 z-20 max-w-md rounded-lg border border-rose-200 bg-rose-50/95 px-3 py-2 text-xs text-rose-700 shadow-md dark:border-rose-900/60 dark:bg-rose-950/90 dark:text-rose-300 backdrop-blur-sm"
        >
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-1.5 min-w-0">
                    <AlertCircle size={14} class="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div class="min-w-0">
                        <div class="font-semibold text-[11px]">Render Notice</div>
                        <div class="mt-0.5 leading-snug opacity-90 truncate max-w-[280px]">
                            {diagramStore.error}
                        </div>
                    </div>
                </div>

                {#if errorLineNo !== null && onNavigate}
                    <button
                        type="button"
                        class="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors"
                        onclick={() => onNavigate(errorLineNo)}
                    >
                        <span>Line {errorLineNo + 1}</span>
                        <ArrowRight size={10} />
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<svelte:window
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onkeydown={handleKeyDown}
    onkeyup={handleKeyUp}
/>

<style>
    .grid-bg {
        background-image: linear-gradient(
                rgba(148, 163, 184, 0.08) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(148, 163, 184, 0.08) 1px,
                transparent 1px
            );
        background-size: 20px 20px;
    }
    :global(.dark) .grid-bg {
        background-image: linear-gradient(
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px
            );
    }
    .dark-preview {
        background-color: #070a0f !important;
    }

    :global(.node:hover),
    :global(.edge:hover) {
        cursor: pointer;
    }

    :global(.active-trace) {
        opacity: 1 !important;
    }

    :global(.dimmed-trace) {
        opacity: 0.2 !important;
        transition: opacity 0.15s ease;
    }

    :global(svg text) {
        font-family: var(--preview-font, sans-serif) !important;
    }
</style>
