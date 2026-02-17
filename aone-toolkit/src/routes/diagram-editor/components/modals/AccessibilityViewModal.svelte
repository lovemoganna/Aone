<script lang="ts">
    import { X, Table, List } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { diagramStore } from "../../lib/store.svelte";
    import { lintDiagram } from "../../lib/linter"; // Re-use logic if helpful, but mainly we need parser

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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        transition:fade
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="0"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]"
            transition:slide={{ duration: 200 }}
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Accessibility View"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <Table size={20} class="text-indigo-500" />
                    Structure View (Accessibility)
                </h3>
                <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Nodes -->
                <div>
                    <h4
                        class="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"
                    >
                        <List size={16} /> Nodes ({nodes.length})
                    </h4>
                    <div
                        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                        <table class="w-full text-sm text-left">
                            <thead
                                class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-700"
                            >
                                <tr>
                                    <th class="px-4 py-2">ID</th>
                                    <th class="px-4 py-2">Label</th>
                                    <th class="px-4 py-2">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each nodes as node}
                                    <tr
                                        class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td
                                            class="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400"
                                            >{node.id}</td
                                        >
                                        <td
                                            class="px-4 py-2 text-gray-700 dark:text-gray-300"
                                            >{node.label}</td
                                        >
                                        <td class="px-4 py-2 text-gray-500"
                                            >{node.type}</td
                                        >
                                    </tr>
                                {/each}
                                {#if nodes.length === 0}
                                    <tr>
                                        <td
                                            colspan="3"
                                            class="px-4 py-4 text-center text-gray-500 text-xs italic"
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
                        class="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"
                    >
                        <List size={16} /> Relationships ({edges.length})
                    </h4>
                    <div
                        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                        <table class="w-full text-sm text-left">
                            <thead
                                class="bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-700"
                            >
                                <tr>
                                    <th class="px-4 py-2">Source</th>
                                    <th class="px-4 py-2">Target</th>
                                    <th class="px-4 py-2">Label</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each edges as edge}
                                    <tr
                                        class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td
                                            class="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400"
                                            >{edge.source}</td
                                        >
                                        <td
                                            class="px-4 py-2 font-mono text-indigo-600 dark:text-indigo-400"
                                            >{edge.target}</td
                                        >
                                        <td
                                            class="px-4 py-2 text-gray-700 dark:text-gray-300"
                                            >{edge.label || "-"}</td
                                        >
                                    </tr>
                                {/each}
                                {#if edges.length === 0}
                                    <tr>
                                        <td
                                            colspan="3"
                                            class="px-4 py-4 text-center text-gray-500 text-xs italic"
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
