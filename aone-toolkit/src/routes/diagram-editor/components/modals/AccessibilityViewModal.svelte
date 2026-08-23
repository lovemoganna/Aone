<script lang="ts">
    import { X, Table, List } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { diagramStore } from "../../lib/store.svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    // Use AI heuristics/Linter regex to extract nodes/edges for display
    // or diagramStore.definitions. This is rudimentary but helpful.

    // We can use explainer logic client-side? No, let's use simple regex for now.

    let nodes = $derived.by(() => {
        const matches = diagramStore.code.matchAll(
            /^(?:class|interface|component|node|state)\s+(\w+)(?:\s+as\s+(\w+))?/gm,
        );
        return Array.from(matches).map((m) => ({
            type: "Node",
            id: m[1],
            label: m[2] || m[1],
        }));
    });

    let edges = $derived.by(() => {
        // A -> B : Label
        // Simple regex
        const matches = diagramStore.code.matchAll(
            /(\w+)\s*-+>\s*(\w+)(?:\s*:\s*(.+))?/g,
        );
        return Array.from(matches).map((m) => ({
            source: m[1],
            target: m[2],
            label: m[3] || "",
        }));
    });
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        transition:fade={{ duration: 100 }}
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="0"
    >
        <div
            class="bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]"
            transition:slide={{ duration: 120 }}
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Accessibility View"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0"
            >
                <h3
                    class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"
                >
                    <Table size={15} class="text-slate-700 dark:text-slate-300" />
                    Structure View (Accessibility)
                </h3>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
                <!-- Nodes -->
                <div>
                    <h4
                        class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5"
                    >
                        <List size={14} /> Nodes ({nodes.length})
                    </h4>
                    <div
                        class="border border-slate-200 dark:border-slate-800 rounded overflow-hidden"
                    >
                        <table class="w-full text-left">
                            <thead
                                class="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800"
                            >
                                <tr>
                                    <th class="px-3 py-1.5">ID</th>
                                    <th class="px-3 py-1.5">Label</th>
                                    <th class="px-3 py-1.5">Type</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {#each nodes as node}
                                    <tr
                                        class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td
                                            class="px-3 py-1.5 font-mono text-slate-800 dark:text-slate-200 font-medium"
                                            >{node.id}</td
                                        >
                                        <td
                                            class="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                                            >{node.label}</td
                                        >
                                        <td class="px-3 py-1.5 text-slate-400 font-mono text-[11px]"
                                            >{node.type}</td
                                        >
                                    </tr>
                                {/each}
                                {#if nodes.length === 0}
                                    <tr>
                                        <td
                                            colspan="3"
                                            class="px-3 py-4 text-center text-slate-400 italic text-xs"
                                        >
                                            No explicit nodes detected.
                                        </td>
                                    </tr>
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Edges -->
                <div>
                    <h4
                        class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5"
                    >
                        <List size={14} /> Relationships ({edges.length})
                    </h4>
                    <div
                        class="border border-slate-200 dark:border-slate-800 rounded overflow-hidden"
                    >
                        <table class="w-full text-left">
                            <thead
                                class="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800"
                            >
                                <tr>
                                    <th class="px-3 py-1.5">Source</th>
                                    <th class="px-3 py-1.5">Target</th>
                                    <th class="px-3 py-1.5">Label</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {#each edges as edge}
                                    <tr
                                        class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td
                                            class="px-3 py-1.5 font-mono text-slate-800 dark:text-slate-200 font-medium"
                                            >{edge.source}</td
                                        >
                                        <td
                                            class="px-3 py-1.5 font-mono text-slate-800 dark:text-slate-200 font-medium"
                                            >{edge.target}</td
                                        >
                                        <td
                                            class="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                                            >{edge.label || "-"}</td
                                        >
                                    </tr>
                                {/each}
                                {#if edges.length === 0}
                                    <tr>
                                        <td
                                            colspan="3"
                                            class="px-3 py-4 text-center text-slate-400 italic text-xs"
                                        >
                                            No explicit edges detected.
                                        </td>
                                    </tr>
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
