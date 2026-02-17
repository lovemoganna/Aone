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
    } from "lucide-svelte";

    let isOpen = $state(false);
    let search = $state("");
    let selectedIndex = $state(0);
    let inputRef = $state<HTMLInputElement>();

    const COMMANDS = [
        { id: "nav-home", title: "Home", icon: Home, action: () => goto("/") },
        {
            id: "nav-prompts",
            title: "Prompt Hub",
            icon: BrainCircuit,
            action: () => goto("/prompt-hub"),
        },
        {
            id: "nav-diagrams",
            title: "Diagram Editor",
            icon: Code,
            action: () => goto("/diagram-editor"),
        },
        {
            id: "nav-tables",
            title: "Table Editor",
            icon: Table,
            action: () => goto("/table-editor"),
        },
        {
            id: "nav-yaml",
            title: "YAML Editor",
            icon: FileText,
            action: () => goto("/yaml-editor"),
        },
        {
            id: "act-theme",
            title: "Toggle Theme",
            icon: Sun,
            action: () => toggleTheme(),
        },
    ];

    let filteredCommands = $derived(
        COMMANDS.filter((c) =>
            c.title.toLowerCase().includes(search.toLowerCase()),
        ),
    );

    function toggleTheme() {
        document.documentElement.classList.toggle("dark");
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            isOpen = !isOpen;
            if (isOpen) {
                tick().then(() => inputRef?.focus());
            }
        }

        if (!isOpen) return;

        if (e.key === "Escape") {
            isOpen = false;
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredCommands.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + filteredCommands.length) %
                filteredCommands.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            execute(filteredCommands[selectedIndex]);
        }
    }

    function execute(command: (typeof COMMANDS)[0]) {
        if (!command) return;
        command.action();
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
                {#if filteredCommands.length === 0}
                    <div class="px-4 py-8 text-center text-gray-500 text-sm">
                        No commands found.
                    </div>
                {:else}
                    <div class="space-y-1">
                        {#each filteredCommands as command, i}
                            <button
                                class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors {i ===
                                selectedIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
                                onclick={() => execute(command)}
                                onmouseenter={() => (selectedIndex = i)}
                            >
                                <command.icon
                                    size={20}
                                    class={i === selectedIndex
                                        ? "text-indigo-500"
                                        : "text-gray-400"}
                                />
                                <span class="flex-1 font-medium"
                                    >{command.title}</span
                                >
                                {#if command.id === "act-theme"}
                                    <span class="text-xs text-gray-400"
                                        >Toggle</span
                                    >
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <div
                class="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between items-center"
            >
                <span><strong>↑↓</strong> to navigate</span>
                <span><strong>Enter</strong> to select</span>
            </div>
        </div>
    </div>
{/if}
