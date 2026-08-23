<script lang="ts">
    import { onMount } from "svelte";

    import {
        Copy,
        Trash2,
        Plus,
        Maximize,
        Minimize,
        AlertTriangle,
        Target,
        Lock,
        Unlock,
    } from "lucide-svelte";

    let {
        x,
        y,
        type, // 'node' | 'edge' | 'canvas'
        targetId,
        onClose,
        onAction,
    } = $props<{
        x: number;
        y: number;
        type: "node" | "edge" | "canvas";
        targetId?: string;
        onClose: () => void;
        onAction: (action: string, targetId?: string) => void;
    }>();

    let menuElement: HTMLDivElement;

    function handleClickOutside(event: MouseEvent) {
        if (menuElement && !menuElement.contains(event.target as Node)) {
            onClose();
        }
    }

    onMount(() => {
        // Slight delay to avoid immediate close if triggered by click
        setTimeout(() => {
            window.addEventListener("mousedown", handleClickOutside);
        }, 0);
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
        };
    });

    const actions = {
        node: [
            { id: "duplicate", label: "Duplicate Node", kbd: "Ctrl+D" },
            { id: "copy", label: "Copy", kbd: "Ctrl+C" },
            { id: "separator" },
            { id: "toggle_breakpoint", label: "Toggle Breakpoint", kbd: "B" },
            {
                id: "toggle_error_handler",
                label: "Toggle Error Handler",
                kbd: "E",
            },
            { id: "trace_execution", label: "Trace Execution", kbd: "T" },
            { id: "separator" },
            { id: "lock", label: "Lock Node", kbd: "L" },
            { id: "unlock", label: "Unlock Node", kbd: "U" },
            { id: "separator" },
            { id: "delete", label: "Delete", kbd: "Del", danger: true },
        ],
        edge: [
            {
                id: "delete",
                label: "Delete Connection",
                kbd: "Del",
                danger: true,
            },
        ],
        canvas: [
            { id: "add_node", label: "Add Node", kbd: "Dbl Click" },
            { id: "paste", label: "Paste", kbd: "Ctrl+V" },
            { id: "fit_view", label: "Fit View", kbd: "Space" },
            { id: "separator" },
            { id: "group_selection", label: "Group Selection", kbd: "Ctrl+G" },
            { id: "save_template", label: "Save as Template", kbd: "Ctrl+S" },
            { id: "save_snippet", label: "Save as Snippet", kbd: "Ctrl+Shift+S" },
            { id: "separator" },
            { id: "batch_edit", label: "Batch Edit Selected", kbd: "Ctrl+B" },
        ],
    };

    let items = $derived((actions as any)[type] || []);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    bind:this={menuElement}
    class="fixed z-[100] min-w-[180px] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 overflow-hidden"
    style="left: {x}px; top: {y}px;"
    role="menu"
>
    {#each items as item}
        {#if item.id === "separator"}
            <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
        {:else}
            <button
                class="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                {item.danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                    : 'text-slate-700 dark:text-slate-200'}"
                onclick={() => {
                    onAction(item.id, targetId);
                    onClose();
                }}
            >
                <span>{item.label}</span>
                {#if item.kbd}
                    <span class="text-xs opacity-40 ml-4 font-mono"
                        >{item.kbd}</span
                    >
                {/if}
            </button>
        {/if}
    {/each}
</div>
