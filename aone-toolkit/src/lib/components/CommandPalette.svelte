<script lang="ts">
    import { onMount, tick } from "svelte";
    import { goto } from "$app/navigation";
    import {
        Search,
        Home,
        BrainCircuit,
        Code,
        Table,
        FileText,
        Sun,
        Moon,
        Database,
        ArrowRightLeft,
        Regex,
        User,
        Wrench,
        Workflow,
        Clock,
    } from "lucide-svelte";
    import Fuse from "fuse.js";

    let isOpen = $state(false);
    let search = $state("");
    let selectedIndex = $state(0);
    let inputRef = $state<HTMLInputElement>();

    // Search result type
    interface SearchResult {
        id: string;
        title: string;
        description?: string;
        category: "page" | "command" | "agent" | "skill" | "workflow" | "history";
        icon: any;
        action: () => void;
    }

    // All searchable items
    const allItems: SearchResult[] = [
        // Pages
        { id: "nav-home", title: "Home", category: "page", icon: Home, action: () => goto("/") },
        { id: "nav-prompts", title: "Prompt Hub", category: "page", icon: BrainCircuit, action: () => goto("/prompt-hub") },
        { id: "nav-diagrams", title: "Diagram Editor", category: "page", icon: Code, action: () => goto("/diagram-editor") },
        { id: "nav-tables", title: "Table Editor", category: "page", icon: Table, action: () => goto("/table-editor") },
        { id: "nav-yaml", title: "YAML Editor", category: "page", icon: FileText, action: () => goto("/yaml-editor") },
        { id: "nav-agent-studio", title: "Agent Studio", category: "page", icon: User, action: () => goto("/agent-studio") },
        { id: "nav-multi-agent", title: "Multi-Agent", category: "page", icon: Workflow, action: () => goto("/multi-agent") },
        { id: "nav-skills-pool", title: "Skills Pool", category: "page", icon: Wrench, action: () => goto("/skills-pool") },
        // Commands
        { id: "act-theme", title: "Toggle Theme", description: "Switch between light and dark mode", category: "command", icon: Sun, action: () => toggleTheme() },
    ];

    // Fuzzy search instance
    let fuse = $derived(
        new Fuse(allItems, {
            keys: [
                { name: "title", weight: 0.5 },
                { name: "description", weight: 0.3 },
                { name: "category", weight: 0.2 },
            ],
            threshold: 0.4,
            includeScore: true,
        })
    );

    // Filtered results based on search
    let filteredResults = $derived.by(() => {
        if (!search.trim()) {
            // Show all items when no search
            return allItems.slice(0, 8);
        }
        return fuse.search(search).slice(0, 10).map((r) => r.item);
    });

    function toggleTheme() {
        document.documentElement.classList.toggle("dark");
    }

    function handleKeydown(e: KeyboardEvent) {
        // Ctrl+K or Cmd+K to open
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            isOpen = !isOpen;
            if (isOpen) {
                tick().then(() => inputRef?.focus());
            }
        }

        // Ctrl+P for quick jump
        if (e.key === "p" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            isOpen = true;
            tick().then(() => inputRef?.focus());
        }

        if (!isOpen) return;

        if (e.key === "Escape") {
            isOpen = false;
            search = "";
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredResults.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + filteredResults.length) % filteredResults.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            execute(filteredResults[selectedIndex]);
        }
    }

    function execute(result: SearchResult) {
        if (!result) return;
        result.action();
        isOpen = false;
        search = "";
        selectedIndex = 0;
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    });

    $effect(() => {
        // Reset selection when search changes
        if (search || !search) selectedIndex = 0;
    });

    // Category colors
    const categoryColors: Record<string, string> = {
        page: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        command: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        agent: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        skill: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        workflow: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        history: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    };
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
        role="dialog"
        aria-modal="true"
    >
        <button
            class="fixed inset-0 w-full h-full bg-black/50 backdrop-blur-sm transition-opacity border-none cursor-default"
            onclick={() => (isOpen = false)}
            aria-label="Close"
            type="button"
        ></button>

        <div
            class="relative bg-white dark:bg-gray-800 w-full max-w-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[60vh]"
        >
            <div
                class="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 gap-3"
            >
                <Search class="text-gray-400 w-5 h-5 shrink-0" />
                <input
                    bind:this={inputRef}
                    bind:value={search}
                    type="text"
                    placeholder="Type a command or search..."
                    class="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg h-10"
                />
                <kbd
                    class="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
                    >ESC</kbd
                >
            </div>

            <div class="overflow-y-auto p-2 scroll-py-2">
                {#if filteredResults.length === 0}
                    <div class="px-4 py-8 text-center text-gray-500 text-sm">
                        No results found.
                    </div>
                {:else}
                    <div class="space-y-1">
                        {#each filteredResults as result, i}
                            <button
                                class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors {i ===
                                selectedIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
                                onclick={() => execute(result)}
                                onmouseenter={() => (selectedIndex = i)}
                            >
                                <result.icon
                                    size={20}
                                    class={i === selectedIndex
                                        ? "text-indigo-500"
                                        : "text-gray-400"}
                                />
                                <span class="flex-1 font-medium"
                                    >{result.title}</span
                                >
                                <span class="text-xs px-2 py-0.5 rounded {categoryColors[result.category]}">
                                    {result.category}
                                </span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div
                class="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between items-center"
            >
                <span><kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd> to navigate</span>
                <span><kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to select</span>
                <span><kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close</span>
            </div>
        </div>
    </div>
{/if}
