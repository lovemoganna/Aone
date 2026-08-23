<script lang="ts">
    import { X, Check } from "lucide-svelte";
    import { TEMPLATES, type Template } from "../../lib/templates";
    import { diagramStore } from "../../lib/store.svelte";

    let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

    let selectedCategory = $state("All");
    let searchQuery = $state("");

    const categories = [
        "All",
        ...Array.from(new Set(TEMPLATES.map((t) => t.category || "Other"))),
    ];

    let filteredTemplates = $derived(
        TEMPLATES.filter((t) => {
            const matchesCategory =
                selectedCategory === "All" || t.category === selectedCategory;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                t.name.toLowerCase().includes(searchLower) ||
                t.code.toLowerCase().includes(searchLower) ||
                (t.category && t.category.toLowerCase().includes(searchLower));
            return matchesCategory && matchesSearch;
        }),
    );

    function loadTemplate(template: Template) {
        diagramStore.code = template.code;
        diagramStore.mode = template.mode;
        if (template.engine) {
            diagramStore.engine = template.engine;
        } else {
            // Default to 'dot' if Graphviz, otherwise irrelevant but safe to reset
            if (template.mode === "graphviz") diagramStore.engine = "dot";
        }
        // Trigger auto render?
        diagramStore.render();
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-all"
    >
        <div
            class="bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-800"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Diagram Templates
                </h3>
                <button
                    class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
                    onclick={() => (isOpen = false)}
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Category Chips -->
            <div
                class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto"
            >
                {#each categories as cat}
                    <button
                        onclick={() => (selectedCategory = cat)}
                        class="px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors border
                        {selectedCategory === cat
                            ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        {cat}
                    </button>
                {/each}
            </div>

            <!-- Search -->
            <div
                class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800"
            >
                <input
                    type="text"
                    placeholder="Search name, code, or category..."
                    bind:value={searchQuery}
                    class="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
            </div>

            <!-- List -->
            <div
                class="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
                {#each filteredTemplates as template}
                    <button
                        class="text-left p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all flex flex-col gap-1.5"
                        onclick={() => loadTemplate(template)}
                    >
                        <div class="flex items-center justify-between w-full">
                            <span
                                class="text-xs font-semibold text-slate-900 dark:text-white"
                            >
                                {template.name}
                            </span>
                            <span
                                class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                                {template.mode}
                            </span>
                        </div>
                        <div
                            class="text-[11px] text-slate-500 line-clamp-3 bg-white dark:bg-slate-950 p-2 rounded border border-slate-200/60 dark:border-slate-800 font-mono w-full"
                        >
                            {template.code}
                        </div>
                    </button>
                {/each}

                {#if filteredTemplates.length === 0}
                    <div class="col-span-full text-center py-8 text-slate-500">
                        No templates found.
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
