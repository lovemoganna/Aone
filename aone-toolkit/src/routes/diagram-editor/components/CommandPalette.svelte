<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        Search,
        Zap,
        Code,
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
        Sparkles,
        Database,
        Clock
    } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import { lintingService } from "../lib/lintingService.svelte";
    import { optimizeLayout } from "../lib/optimizer";
    import { transformDataToDiagram } from "../lib/transformer";

    let { isOpen, onClose, onAction } = $props<{
        isOpen: boolean;
        onClose: () => void;
        onAction: (id: string) => void;
    }>();

    let query = $state("");
    let selectedIndex = $state(0);
    let inputRef = $state<HTMLInputElement | null>(null);

    const staticItems = [
        {
            id: "beautify",
            label: "Format & Beautify Layout",
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
            id: "import-json",
            label: "Import from JSON Schema/Data",
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
            label: "Import from SQL DDL",
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
            id: "new",
            label: "New Diagram",
            section: "Actions",
            shortcut: "Cmd+N",
            icon: FilePlus,
        },
        {
            id: "export",
            label: "Export Diagram (PNG/SVG/PDF)",
            section: "Actions",
            shortcut: "Cmd+E",
            icon: Download,
        },
        {
            id: "share",
            label: "Share Diagram Link",
            section: "Actions",
            shortcut: "Cmd+S",
            icon: Share2,
        },
        {
            id: "history",
            label: "Snapshot History",
            section: "Actions",
            shortcut: "Cmd+H",
            icon: History,
        },
        {
            id: "toggle-sidebar",
            label: "Toggle Sidebar",
            section: "Navigation",
            icon: Layout,
        },
        {
            id: "toggle-minimap",
            label: "Toggle Canvas Minimap",
            section: "Navigation",
            icon: Maximize,
        },
        {
            id: "focus-mode",
            label: "Zen / Focus Mode",
            section: "Navigation",
            shortcut: "Esc",
            icon: Code,
        },
        {
            id: "reset-view",
            label: "Reset Zoom & Center View",
            section: "Navigation",
            shortcut: "Cmd+0",
            icon: Clock,
        },
        {
            id: "mode-plantuml",
            label: "Switch Syntax to PlantUML",
            section: "Syntax",
            icon: Languages,
        },
        {
            id: "mode-graphviz",
            label: "Switch Syntax to Graphviz (DOT)",
            section: "Syntax",
            icon: Languages,
        },
        {
            id: "settings",
            label: "Editor Settings",
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
            label: "Diagram Themes",
            section: "System",
            icon: Palette,
        },
        {
            id: "layout-dot",
            label: "Layout: Hierarchical (dot)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setLayoutEngine("dot"),
        },
        {
            id: "layout-neato",
            label: "Layout: Force-Directed (neato)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setLayoutEngine("neato"),
        },
        {
            id: "dir-tb",
            label: "Direction: Top to Bottom (TB)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setDirection("TB"),
        },
        {
            id: "dir-lr",
            label: "Direction: Left to Right (LR)",
            section: "Layout",
            icon: Layout,
            action: () => diagramStore.setDirection("LR"),
        }
    ];

    let items = $derived.by(() => {
        const dynamicItems: any[] = [];

        const lintAnalysis = lintingService.lint(
            diagramStore.code,
            diagramStore.mode,
        );

        if (lintAnalysis.results.length > 0) {
            lintAnalysis.results.forEach((lint, i) => {
                lint.actions?.forEach((action: any, ai: number) => {
                    dynamicItems.push({
                        id: `fix-${i}-${ai}`,
                        label: `Quick Fix: ${action.label}`,
                        section: "Diagnostics",
                        icon: Lightbulb,
                        action: () => {
                            diagramStore.code = action.apply(diagramStore.code);
                            diagramStore.render();
                        },
                    });
                });
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
        const groups: Record<string, typeof items> = {};
        filteredItems.forEach((item) => {
            if (!groups[item.section]) groups[item.section] = [];
            groups[item.section].push(item);
        });
        return groups;
    });

    let flatItems = $derived(Object.values(groupedItems).flat());

    $effect(() => {
        if (isOpen) {
            selectedIndex = 0;
            setTimeout(() => inputRef?.focus(), 50);
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % (flatItems.length || 1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + flatItems.length) % (flatItems.length || 1);
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
            e.preventDefault();
            onClose();
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 bg-black/50 z-[999] flex items-start justify-center pt-[15vh] backdrop-blur-xs"
        role="presentation"
        onclick={onClose}
        transition:fade={{ duration: 100 }}
    >
        <div
            class="w-full max-w-lg bg-white dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-black/5"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
            onkeydown={handleKeydown}
            transition:fly={{ y: 10, duration: 120 }}
        >
            <div class="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/50">
                <Search size={16} class="text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                    bind:this={inputRef}
                    bind:value={query}
                    placeholder="Search actions, commands or layout engines..."
                    class="bg-transparent border-none outline-none flex-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <kbd class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700">ESC</kbd>
            </div>

            <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 p-1" role="listbox">
                {#if flatItems.length === 0}
                    <div class="p-6 text-center text-xs text-slate-400">
                        No commands matching "{query}"
                    </div>
                {:else}
                    {#each Object.entries(groupedItems) as [section, group]}
                        <div class="py-1">
                            <div
                                class="px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
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
                                    class="w-full px-2.5 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors outline-none text-left {isSelected
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}"
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
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <Icon
                                            size={13}
                                            class={isSelected
                                                ? 'text-white dark:text-slate-900 shrink-0'
                                                : 'text-slate-400 dark:text-slate-500 shrink-0'}
                                        />
                                        <span class="text-xs truncate">{item.label}</span>
                                    </div>
                                    {#if item.shortcut}
                                        <span
                                            class="text-[10px] font-mono ml-2 shrink-0 {isSelected
                                                ? 'text-slate-300 dark:text-slate-600'
                                                : 'text-slate-400 dark:text-slate-500'}"
                                        >
                                            {item.shortcut}
                                        </span>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
