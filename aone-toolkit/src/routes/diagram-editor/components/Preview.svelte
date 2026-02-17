<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { validateDiagram } from "../lib/validation";
    import {
        ZoomIn,
        ZoomOut,
        Maximize,
        Loader2,
        Copy,
        Check,
        AlertCircle,
        CheckCircle2,
    } from "lucide-svelte";
    import Minimap from "./Minimap.svelte";

    let { svg, isRendering, onExport, onFileDrop, onNavigate } = $props<{
        svg: string;
        isRendering: boolean;
        onExport: (format: "svg" | "png") => void;
        onFileDrop?: (file: File) => void;
        onNavigate?: (line: number) => void;
    }>();

    let validation = $derived(
        validateDiagram(diagramStore.code, diagramStore.mode),
    );

    let isDragging = $state(false);
    let dragMode = $state<"pan" | "element">("pan");
    let startPan = { x: 0, y: 0 };
    let startDrag = { x: 0, y: 0 }; // Mouse position at start
    let startElementPos = { x: 0, y: 0 }; // Element offset at start

    let container: HTMLElement;
    let svgContainer: HTMLDivElement;
    let copied = $state(false);

    function copyToClipboard() {
        if (!svg) return;
        navigator.clipboard.writeText(svg).then(() => {
            copied = true;
            setTimeout(() => (copied = false), 2000);
        });
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

        // Mouse relative to center
        const mx = e.clientX - cx;
        const my = e.clientY - cy;

        // Current state
        const s = diagramStore.scale;
        const px = diagramStore.pan.x;
        const py = diagramStore.pan.y;

        // Calculate offset in "scene space" (unscaled)
        // mx = px + offset * s  =>  offset = (mx - px) / s
        const offX = (mx - px) / s;
        const offY = (my - py) / s;

        // New Scale
        const delta = e.deltaY > 0 ? 0.9 : 1.1; // Smooth geometric zoom
        const newScale = Math.max(0.1, Math.min(10, s * delta));

        // New Pan to keep offset stable
        // mx = newPx + offset * newScale
        // newPx = mx - offset * newScale
        const newPx = mx - offX * newScale;
        const newPy = my - offY * newScale;

        diagramStore.scale = newScale;
        diagramStore.pan = { x: newPx, y: newPy };
    }

    function handleMouseDown(e: MouseEvent) {
        startDrag = { x: e.clientX, y: e.clientY };

        // Middle click or Alt+Click = Pan
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            isDragging = true;
            dragMode = "pan";
            startPan = { ...diagramStore.pan };
            container.style.cursor = "grabbing";
            return;
        }

        // Left click
        if (e.button === 0) {
            const target = e.target as HTMLElement;
            const nodeElement = target.closest(".node") as SVGGElement;

            // If clicking a node that is ALREADY selected, we might be starting a drag
            // But we also want to allow selecting it.
            // Let's rely on selection logic first.

            if (nodeElement) {
                const id =
                    nodeElement.querySelector("title")?.textContent?.trim() ||
                    nodeElement.id ||
                    "";

                // If we click the selected element, prepare for drag
                if (diagramStore.selectedElementId === id) {
                    isDragging = true;
                    dragMode = "element";
                    // Get current override or 0
                    const override = diagramStore.overrides[id] || {};
                    startElementPos = {
                        x: override.x || 0,
                        y: override.y || 0,
                    };
                    // Don't cursor grab yet, maybe wait for move threshold?
                    // For responsiveness, instant is fine.
                    // Prevent default to avoid text selection inside SVG
                    e.preventDefault();
                    return;
                }
            }

            // Normal selection behavior
            handleSelection(e);
        }
    }

    function handleSelection(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const element = target.closest(".node, .edge, .cluster") as SVGGElement; // Added cluster support intention

        if (element) {
            const id =
                element.querySelector("title")?.textContent?.trim() ||
                element.id ||
                "";

            // Toggle selection
            if (diagramStore.selectedElementId !== id) {
                diagramStore.selectedElementId = id;
            } else {
                // Deselect if clicking again? No, usually keep selected for drag.
                // Only deselect if ctrl click? Simplicity: Keep selected.
                // To deselect, click background.
            }

            // Clear multi-selection if we click a different element
            if (
                diagramStore.selectedElementId &&
                !diagramStore.multiSelection.includes(id)
            ) {
                diagramStore.multiSelection = [];
            }

            // Auto open inspector if we just selected something
            if (diagramStore.selectedElementId) {
                diagramStore.isInspectorOpen = true;
            }
        } else {
            // Clicked background
            diagramStore.selectedElementId = null;
            diagramStore.multiSelection = [];
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
            // Update element override
            // We need to account for scale so drag feels 1:1 with cursor
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
            // Commit the drag to code (or override)
            const dx = e.clientX - startDrag.x;
            const dy = e.clientY - startDrag.y;
            const s = diagramStore.scale;
            const finalX = startElementPos.x + dx / s;
            const finalY = startElementPos.y + dy / s;

            // If dragged significantly
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                diagramStore.updateNodePosition(
                    diagramStore.selectedElementId,
                    finalX,
                    finalY,
                );
            }
        }

        isDragging = false;
        if (container) container.style.cursor = "default"; // or grab/auto
    }

    function handleDoubleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const nodeElement = target.closest(".node") as SVGGElement;

        if (nodeElement) {
            const id =
                nodeElement.querySelector("title")?.textContent?.trim() ||
                nodeElement.id ||
                "";

            if (id) {
                const def = diagramStore.definitions.get(id);
                if (def) {
                    // Dispatch event to parent to scroll (or use store if we add scrollToLine method there?)
                    // Better: emit custom event or use store callback if available?
                    // Let's assume we pass a prop 'onNavigate' or distinct event
                    const event = new CustomEvent("navigate", {
                        detail: { line: def.line },
                    });
                    window.dispatchEvent(event);
                    // Wait, window dispatch is global. A callback prop is better.
                    onNavigate?.(def.line);
                }
            }
        }
    }

    function resetView() {
        diagramStore.scale = 1;
        diagramStore.pan = { x: 0, y: 0 };
    }

    import { analyzeDiagram } from "../lib/linter";
    import { Eye, EyeOff, Target, Layers } from "lucide-svelte";

    // ... imports

    // Run Analysis to get Layers
    $effect(() => {
        if (!diagramStore.code) return;
        const result = analyzeDiagram(diagramStore.code, diagramStore.mode);
        // We only want to update store if layers changed to avoid loops
        // But store.availableLayers is primitive string[], so simple compare
        const newLayers = result.allTags;
        if (
            JSON.stringify(newLayers) !==
            JSON.stringify(diagramStore.availableLayers)
        ) {
            diagramStore.setAvailableLayers(newLayers);
        }
    });

    // ... existing Mouse/Wheel handlers ...

    // Updated Effect for styling
    $effect(() => {
        if (!svg || !svgContainer) return;

        // Re-run analysis for local lookup (or use store if we pushed map there)
        // Store only has list of layers, not map of id->layers.
        // Let's re-run analysis locally for the map, it's fast.
        const { layers } = analyzeDiagram(diagramStore.code, diagramStore.mode);

        const adjMap = new Map<string, Set<string>>();
        // ... (existing adjacency build) ...
        if (
            diagramStore.selectedElementId &&
            diagramStore.mode === "graphviz" &&
            diagramStore.focusMode
        ) {
            // ... (keep existing) ...
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
        }

        const selectedId = diagramStore.selectedElementId;
        const neighbors = selectedId
            ? adjMap.get(selectedId) || new Set()
            : new Set();

        // Check active layers
        const hasActiveLayers = diagramStore.activeLayers.length > 0;

        const nodes = svgContainer.querySelectorAll(".node, .edge, .cluster");
        nodes.forEach((node) => {
            const g = node as SVGGElement;
            const id =
                g.querySelector("title")?.textContent?.trim() || g.id || "";

            const isSelected = id === diagramStore.selectedElementId;
            const isMultiSelected = diagramStore.multiSelection.includes(id);
            const override = diagramStore.overrides[id];

            // Layer Visibility Check
            let isVisible = true;
            if (hasActiveLayers) {
                // If element has tags, must match at least one active layer?
                // Or if ANY tags exist, must match?
                // Logic:
                // 1. If filtering is ON (activeLayers > 0):
                //    - If node has tags: Show if intersection > 0
                //    - If node has NO tags: Show (default) or Hide?
                //    Usually "Show only X" implies hiding untagged?
                //    Let's go with: If activeLayers is set, ONLY show elements in those layers?
                //    But many elements are untagged.
                //    Better: "Highlight Mode". Dim others.

                const nodeTags = layers[id] || [];
                if (nodeTags.length > 0) {
                    // If node is tagged, it MUST be in active set to be fully visible
                    // If it shares NO tags with active set, it is dimmed/hidden.
                    const match = nodeTags.some((t) =>
                        diagramStore.activeLayers.includes(t),
                    );
                    if (!match) isVisible = false;
                } else {
                    // Untagged nodes:
                    // If we are filtering, maybe we hide untagged too?
                    // Let's keep untagged visible for context, unless strictly "Layer Mode".
                    // Let's make untagged = context = dimmed?
                    // Implementation: If tags exist in diagram, and activeLayers is set,
                    // untagged items are dimmed.
                    if (diagramStore.availableLayers.length > 0) {
                        isVisible = false; // "StrictMode" filtering
                    }
                }
            }

            const shapes = g.querySelectorAll(
                "polygon, ellipse, path, circle, text",
            );

            // ... (keep transform logic) ...
            const x = override?.x || 0;
            const y = override?.y || 0;
            const scale = override?.scale || 1;

            g.style.transition =
                isDragging && isSelected
                    ? "none"
                    : "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s";
            g.style.transformOrigin = "center";
            const transformList = [];
            if (x || y) transformList.push(`translate(${x}px, ${y}px)`);
            if (scale !== 1) transformList.push(`scale(${scale})`);
            g.style.transform = transformList.join(" ");

            shapes.forEach((shape) => {
                const s = shape as SVGElement;
                if (s.tagName === "text") return;

                if (isSelected || isMultiSelected) {
                    s.style.stroke = "#6366f1";
                    s.style.strokeWidth = "2px";
                    s.style.filter =
                        "drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))";
                    s.style.opacity = "1";
                    if (isMultiSelected && !isSelected) {
                        s.style.strokeDasharray = "4";
                    } else {
                        s.style.strokeDasharray = "";
                    }
                } else {
                    s.style.stroke = "";
                    s.style.strokeWidth = "";
                    s.style.strokeDasharray = "";
                    s.style.filter = "";

                    // Opacity Logic:
                    // 1. Layer Filter (Strongest)
                    // 2. Focus Mode

                    if (!isVisible) {
                        s.style.opacity = "0.05"; // Almost invisible
                    } else if (selectedId && diagramStore.focusMode) {
                        const isNeighbor = neighbors.has(id);
                        const isConnectedEdge =
                            g.classList.contains("edge") &&
                            id.includes(`${selectedId}`) &&
                            (id.includes("->") || id.includes("--"));

                        if (
                            isNeighbor ||
                            isConnectedEdge ||
                            id === selectedId
                        ) {
                            s.style.opacity = "0.9";
                        } else {
                            s.style.opacity = "0.15"; // Dim background
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
</script>

<div
    class="relative flex-1 h-full overflow-hidden bg-gray-50 dark:bg-gray-900/50 cursor-grab select-none grid-bg transition-colors {diagramStore.previewTheme ===
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
    <!-- Vignette -->
    <div
        class="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.2)_100%)]"
    ></div>

    <!-- Canvas -->
    <div
        class="absolute w-full h-full flex items-center justify-center origin-center transition-transform duration-75"
        style="transform: translate({diagramStore.pan.x}px, {diagramStore.pan
            .y}px) scale({diagramStore.scale}); --preview-font: {diagramStore.fontFamily}"
        bind:this={svgContainer}
    >
        {@html svg}
    </div>

    <!-- Controls -->
    <div
        class="absolute bottom-4 right-4 flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
    >
        <span class="text-xs font-mono flex items-center px-2 text-gray-500">
            {Math.round(diagramStore.scale * 100)}%
        </span>
        <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
            title="Zoom Out"
            onclick={() =>
                (diagramStore.scale = Math.max(0.1, diagramStore.scale - 0.25))}
        >
            <ZoomOut size={16} />
        </button>
        <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
            title="Zoom In"
            onclick={() =>
                (diagramStore.scale = Math.min(10, diagramStore.scale + 0.25))}
        >
            <ZoomIn size={16} />
        </button>
        <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors {copied
                ? 'text-green-500'
                : 'text-gray-500'}"
            title="Copy SVG"
            onclick={copyToClipboard}
        >
            {#if copied}
                <Check size={16} />
            {:else}
                <Copy size={16} />
            {/if}
        </button>
        <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
            title="Reset View"
            onclick={resetView}
        >
            <Maximize size={16} />
        </button>

        <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors {diagramStore.focusMode
                ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'text-gray-500'}"
            title="Focus Mode (Highlight Connections)"
            onclick={() => (diagramStore.focusMode = !diagramStore.focusMode)}
        >
            <Target size={16} />
        </button>

        <!-- Layers Dropdown (Simple) -->
        {#if diagramStore.availableLayers.length > 0}
            <div class="relative group">
                <button
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 flex items-center gap-1"
                    title="Filter Layers"
                >
                    <Layers
                        size={16}
                        class={diagramStore.activeLayers.length > 0
                            ? "text-indigo-500"
                            : ""}
                    />
                </button>

                <!-- Dropdown -->
                <div
                    class="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 hidden group-hover:block z-50"
                >
                    <div
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2"
                    >
                        Visible Layers
                    </div>
                    {#each diagramStore.availableLayers as layer}
                        <button
                            class="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between {diagramStore.activeLayers.includes(
                                layer,
                            )
                                ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400'}"
                            onclick={() => diagramStore.toggleLayer(layer)}
                        >
                            <span>{layer}</span>
                            {#if diagramStore.activeLayers.includes(layer)}
                                <Eye size={12} />
                            {:else}
                                <EyeOff size={12} class="opacity-50" />
                            {/if}
                        </button>
                    {/each}
                    <div
                        class="border-t border-slate-100 dark:border-slate-700 mt-2 pt-1"
                    >
                        <button
                            class="w-full text-center text-[10px] text-slate-400 hover:text-indigo-500 p-1"
                            onclick={() => (diagramStore.activeLayers = [])}
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Loading Overlay -->
    {#if isRendering}
        <div
            class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity"
        >
            <Loader2 class="animate-spin text-indigo-500 mb-2" size={32} />
            <span class="text-sm text-gray-500">Rendering...</span>
        </div>
    {/if}

    <!-- Minimap -->
    {#if svg && !isRendering}
        <Minimap />
    {/if}

    <!-- Empty State -->
    {#if !svg && !isRendering}
        <div
            class="absolute inset-0 flex items-center justify-center text-gray-400"
        >
            <div class="text-center">
                <p class="text-lg">No Diagram Rendered</p>
                <p class="text-sm">Press Ctrl+Enter to render</p>
            </div>
        </div>
    {/if}

    <!-- Validation Overlay -->
    {#if diagramStore.code.trim() && !isRendering}
        <div
            class="absolute bottom-4 left-4 flex flex-col gap-2 items-start z-20 pointer-events-none"
        >
            {#if !validation.isValid}
                {#each validation.errors as error}
                    <div
                        class="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-2 shadow-sm"
                    >
                        <AlertCircle size={14} />
                        <span>L{error.line}: {error.message}</span>
                    </div>
                {/each}
            {:else if validation.warnings.length > 0}
                <div
                    class="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2 shadow-sm"
                >
                    <AlertCircle size={14} />
                    <span>{validation.warnings.length} warning(s)</span>
                </div>
            {:else}
                <div
                    class="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 shadow-sm"
                >
                    <CheckCircle2 size={14} />
                    <span>Syntax OK</span>
                </div>
            {/if}
        </div>
    {/if}
</div>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<style>
    .grid-bg {
        background-image: linear-gradient(
                rgba(99, 102, 241, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(99, 102, 241, 0.05) 1px,
                transparent 1px
            );
        background-size: 20px 20px;
    }
    .dark-preview {
        background-color: #1a1b26 !important;
    }

    .dark-preview :global(svg) {
        filter: invert(0.9) hue-rotate(180deg);
    }

    .dark-preview :global(svg [fill="#ffffff"]),
    .dark-preview :global(svg [fill="white"]) {
        fill: #1a1b26 !important;
    }

    .dark-preview :global(svg [stroke="#000000"]),
    .dark-preview :global(svg [stroke="black"]) {
        stroke: #a9b1d6 !important;
    }

    .dark-preview :global(svg text) {
        fill: #c0caf5 !important;
    }

    :global(.node:hover),
    :global(.edge:hover) {
        cursor: pointer;
        filter: brightness(1.1);
    }

    /* Selection Pulse */
    :global(.node [style*="stroke: #6366f1"]) {
        filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.4));
    }

    /* Font Override */
    :global(svg text) {
        font-family: var(--preview-font, sans-serif) !important;
    }
</style>
