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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
            >
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Diagram Templates
                </h3>
                <button
                    class="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    onclick={() => (isOpen = false)}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Category Chips -->
            <div
                class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
                {#each categories as cat}
                    <button
                        onclick={() => (selectedCategory = cat)}
                        class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border
                        {selectedCategory === cat
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                    >
                        {cat}
                    </button>
                {/each}
            </div>

            <!-- Search -->
            <div
                class="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-4"
            >
                <input
                    type="text"
                    placeholder="Search name, code, or category..."
                    bind:value={searchQuery}
                    class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            <!-- List -->
            <div
                class="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
                {#each filteredTemplates as template}
                    <button
                        class="text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group flex flex-col gap-2"
                        onclick={() => loadTemplate(template)}
                    >
                        <div class="flex items-center justify-between w-full">
                            <span
                                class="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                            >
                                {template.name}
                            </span>
                            <span
                                class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500"
                            >
                                {template.mode}
                            </span>
                        </div>
                        <div
                            class="text-xs text-gray-500 line-clamp-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded font-mono w-full"
                        >
                            {template.code}
                        </div>
                    </button>
                {/each}

                {#if filteredTemplates.length === 0}
                    <div class="col-span-full text-center py-8 text-gray-500">
                        No templates found.
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
