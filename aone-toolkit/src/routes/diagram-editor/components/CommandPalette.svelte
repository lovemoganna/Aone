<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        Search,
        Zap,
        Code,
        AlertTriangle,
        Lightbulb,
        FilePlus,
        Download,
        Share2,
        History,
        Layout,
        Maximize,
        Settings,
        Keyboard,
        Palette,
        Languages,
        Trash2,
        Clock,
        Sparkles,
        Database,
    } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import { lintingService } from "../lib/lintingService.svelte";

    import { optimizeLayout } from "../lib/optimizer";

    import { transformDataToDiagram } from "../lib/transformer";

    let { isOpen, onClose, onAction } = $props();

    let query = $state("");
    let selectedIndex = $state(0);
    let inputRef = $state<HTMLInputElement | null>(null);

    const staticItems = [
        {
            id: "import-json",
            label: "Import from JSON",
            section: "Actions",
            icon: FilePlus,
            action: () => {
                const input = window.prompt("Paste JSON object here:");
                if (input) {
                    const code = transformDataToDiagram(input, "json");
                    diagramStore.code = code;
                    diagramStore.render();
                }
            },
        },
        {
            id: "import-sql",
            label: "Import from SQL",
            section: "Actions",
            icon: Database,
            action: () => {
                const input = window.prompt(
                    "Paste SQL CREATE statements here:",
                );
                if (input) {
                    const code = transformDataToDiagram(input, "sql");
                    diagramStore.code = code;
                    diagramStore.render();
                }
            },
        },
        {
            id: "beautify",
            label: "Beautify Layout",
            section: "Actions",
            icon: Sparkles,
            action: () => {
                diagramStore.code = optimizeLayout(
                    diagramStore.code,
                    diagramStore.mode,
                );
                diagramStore.render();
            },
        },
        {
            id: "render",
            label: "Force Render",
            section: "Actions",
            shortcut: "Cmd+Enter",
            icon: Zap,
        },
        {
            id: "new",
            label: "New Diagram",
            section: "Actions",
            shortcut: "Cmd+N",
            icon: FilePlus,
        },
        {
            id: "export",
            label: "Export Diagram",
            section: "Actions",
            shortcut: "Cmd+E",
            icon: Download,
        },
        {
            id: "share",
            label: "Share Diagram",
            section: "Actions",
            shortcut: "Cmd+S",
            icon: Share2,
        },
        {
            id: "history",
            label: "History Hub",
            section: "Actions",
            shortcut: "Cmd+H",
            icon: History,
        },
        {
            id: "ai-gen",
            label: "AI Generation",
            section: "Actions",
            shortcut: "Cmd+G",
            icon: Lightbulb,
        },

        {
            id: "toggle-sidebar",
            label: "Toggle Sidebar",
            section: "Navigation",
            shortcut: "Cmd+\\",
            icon: Layout,
        },
        {
            id: "toggle-minimap",
            label: "Toggle Minimap",
            section: "Navigation",
            shortcut: "Cmd+M",
            icon: Maximize,
        },
        {
            id: "focus-mode",
            label: "Zen Mode",
            section: "Navigation",
            shortcut: "Esc",
            icon: Code,
        },
        {
            id: "reset-view",
            label: "Reset Viewport",
            section: "Navigation",
            icon: Clock,
        },

        {
            id: "mode-plantuml",
            label: "Switch to PlantUML",
            section: "Language",
            icon: Languages,
        },
        {
            id: "mode-graphviz",
            label: "Switch to Graphviz",
            section: "Language",
            icon: Languages,
        },

        {
            id: "settings",
            label: "Global Settings",
            section: "System",
            icon: Settings,
        },
        {
            id: "shortcuts",
            label: "Keyboard Shortcuts",
            section: "System",
            shortcut: "Cmd+/",
            icon: Keyboard,
        },
        {
            id: "theme",
            label: "Theme Engine",
            section: "System",
            icon: Palette,
        },
        // Layout Engine Actions (Graphviz)
        {
            id: "layout-dot",
            label: "Layout: Hierarchical (dot)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setLayoutEngine("dot"),
        },
        {
            id: "layout-neato",
            label: "Layout: Network (neato)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setLayoutEngine("neato"),
        },
        {
            id: "layout-fdp",
            label: "Layout: Cluster (fdp)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setLayoutEngine("fdp"),
        },
        {
            id: "layout-twopi",
            label: "Layout: Radial (twopi)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setLayoutEngine("twopi"),
        },
        // Direction Actions
        {
            id: "dir-tb",
            label: "Direction: Top-to-Bottom",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setDirection("TB"),
        },
        {
            id: "dir-lr",
            label: "Direction: Left-to-Right",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setDirection("LR"),
        },
        {
            id: "dir-bt",
            label: "Direction: Bottom-to-Top",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setDirection("BT"),
        },
        {
            id: "dir-rl",
            label: "Direction: Right-to-Left",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setDirection("RL"),
        },
    ];

    let items = $derived.by(() => {
        const dynamicItems = [];

        // Add Quick Fixes from Linting
        if (lintingService.results.length > 0) {
            lintingService.results.forEach((lint, i) => {
                lint.actions?.forEach((action: any, ai: number) => {
                    dynamicItems.push({
                        id: `fix-${i}-${ai}`,
                        label: `Fix: ${action.label}`,
                        section: "Quick Fixes",
                        icon: Lightbulb,
                        color: "text-amber-400",
                        action: () => {
                            diagramStore.code = action.apply(diagramStore.code);
                        },
                    });
                });
            });
        }

        // Potential AI smart actions (Placeholder for Linear intelligence)
        if (diagramStore.code.includes("Alice")) {
            dynamicItems.push({
                id: "smart-actor",
                label: "Add Response Actor",
                section: "Intelligence",
                icon: Lightbulb,
                color: "text-indigo-400",
                action: () => {
                    diagramStore.code += "\nBob -> Alice: Response";
                },
            });
        }

        return [...dynamicItems, ...staticItems];
    });

    let filteredItems = $derived.by(() => {
        if (!query) return items;
        const q = query.toLowerCase();
        return items.filter(
            (i) =>
                i.label.toLowerCase().includes(q) ||
                i.section.toLowerCase().includes(q),
        );
    });

    let groupedItems = $derived.by(() => {
        const groups: Record<string, any[]> = {};
        filteredItems.forEach((item) => {
            if (!groups[item.section]) groups[item.section] = [];
            groups[item.section].push(item);
        });
        return groups;
    });

    // Flattened items for keyboard navigation index
    let flatItems = $derived(Object.values(groupedItems).flat());

    $effect(() => {
        if (isOpen) {
            selectedIndex = 0;
            inputRef?.focus();
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % flatItems.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + flatItems.length) % flatItems.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = flatItems[selectedIndex];
            if (item) {
                if (item.action) {
                    item.action();
                } else {
                    onAction(item.id);
                }
                onClose();
            }
        } else if (e.key === "Escape") {
            onClose();
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 bg-black/40 z-[1000] flex items-start justify-center pt-[15vh] backdrop-blur-[2px]"
        role="presentation"
        onclick={onClose}
        transition:fade
    >
        <div
            class="w-full max-w-lg glass-dark text-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={handleKeydown}
            transition:fly={{ y: 20 }}
        >
            <div class="p-4 border-b border-white/10 flex items-center gap-3">
                <Search size={18} class="text-white/40" />
                <input
                    bind:this={inputRef}
                    bind:value={query}
                    placeholder="Type a command or search..."
                    class="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-white/20"
                />
            </div>

            <div class="max-h-96 overflow-y-auto" role="listbox">
                {#each Object.entries(groupedItems) as [section, group]}
                    <div
                        class="px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-wider bg-white/5"
                    >
                        {section}
                    </div>
                    {#each group as item}
                        {@const isSelected =
                            flatItems[selectedIndex]?.id === item.id}
                        {@const Icon = item.icon || Zap}
                        <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            class="w-full px-4 py-2.5 cursor-pointer flex items-center justify-between group outline-none {isSelected
                                ? 'bg-indigo-600'
                                : 'hover:bg-white/5'}"
                            onclick={() => {
                                if (item.action) {
                                    item.action();
                                } else {
                                    onAction(item.id);
                                }
                                onClose();
                            }}
                            onmouseenter={() => {
                                selectedIndex = flatItems.findIndex(
                                    (f) => f.id === item.id,
                                );
                            }}
                        >
                            <div
                                class="flex items-center gap-3 pointer-events-none"
                            >
                                <Icon
                                    size={14}
                                    class={isSelected
                                        ? "text-white"
                                        : "text-indigo-400"}
                                />
                                <span
                                    class="text-sm {isSelected
                                        ? 'text-white'
                                        : 'text-gray-200'}">{item.label}</span
                                >
                            </div>
                            {#if item.shortcut}
                                <span
                                    class="text-[10px] {isSelected
                                        ? 'text-white/60'
                                        : 'text-white/20'} font-mono pointer-events-none"
                                    >{item.shortcut}</span
                                >
                            {/if}
                        </button>
                    {/each}
                {/each}
            </div>
        </div>
    </div>
{/if}
