<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        Search,
        Plus,
        Users,
        Wrench,
        GitBranch,
        Zap,
        Play,
        Radio,
        Ear,
    } from "lucide-svelte";
    import type { NodeType } from "./types";

    let {
        visible = false,
        position = { x: 0, y: 0 },
        sourceNodeType = undefined,
        onSelect = (type: NodeType) => {},
        onClose = () => {},
    } = $props<{
        visible: boolean;
        position: { x: number; y: number };
        sourceNodeType?: string;
        onSelect: (type: NodeType) => void;
        onClose: () => void;
    }>();

    let searchInput: HTMLInputElement | undefined = $state();
    let searchQuery = $state("");
    let selectedIndex = $state(0);

    const options: {
        type: NodeType;
        label: string;
        icon: any;
        desc: string;
    }[] = [
        {
            type: "agent",
            label: "Agent Node",
            icon: Users,
            desc: "Add an agent to the flow",
        },
        {
            type: "skill",
            label: "Skill Node",
            icon: Wrench,
            desc: "Add a tool or utility",
        },
        {
            type: "condition",
            label: "Router / Condition",
            icon: GitBranch,
            desc: "Branching logic",
        },
        {
            type: "broadcast",
            label: "Broadcast (Wormhole)",
            icon: Radio,
            desc: "Emit a context variable without visual edges.",
        },
        {
            type: "listen",
            label: "Listen (Wormhole)",
            icon: Ear,
            desc: "Receive a context variable from a Broadcast node.",
        },
        // { type: "parallel", label: "Parallel Group", icon: Zap, desc: "Execute in parallel" },
    ];

    let filteredOptions = $derived(
        options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    let recommendedOptions = $derived.by(() => {
        if (!sourceNodeType || searchQuery) return [];
        // Top-3 heuristic routing based on data protocol context
        if (sourceNodeType === "start")
            return options.filter(
                (o) => o.type === "agent" || o.type === "skill",
            );
        if (sourceNodeType === "agent")
            return options.filter(
                (o) =>
                    o.type === "condition" ||
                    o.type === "skill" ||
                    o.type === "agent",
            );
        if (sourceNodeType === "skill")
            return options.filter(
                (o) => o.type === "agent" || o.type === "condition",
            );
        if (sourceNodeType === "condition")
            return options.filter(
                (o) => o.type === "agent" || o.type === "skill",
            );
        return [];
    });

    $effect(() => {
        if (visible) {
            searchQuery = "";
            selectedIndex = 0;
            tick().then(() => searchInput?.focus());
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (!visible) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredOptions.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + filteredOptions.length) %
                filteredOptions.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredOptions[selectedIndex]) {
                select(filteredOptions[selectedIndex].type);
            }
        } else if (e.key === "Escape") {
            onClose();
        }
    }

    function select(type: NodeType) {
        onSelect(type);
        onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
    <!-- Backdrop to close on click outside -->
    <div
        class="fixed inset-0 z-50 bg-transparent"
        onclick={onClose}
        role="presentation"
    ></div>

    <div
        class="fixed z-50 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        style="left: {position.x}px; top: {position.y}px;"
    >
        <div
            class="flex items-center px-3 py-2 border-b border-slate-100 dark:border-slate-700 gap-2"
        >
            <Search class="w-4 h-4 text-slate-400" />
            <input
                bind:this={searchInput}
                bind:value={searchQuery}
                type="text"
                placeholder="Type to search..."
                class="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
        </div>

        <div class="max-h-64 overflow-y-auto p-1">
            {#if recommendedOptions.length > 0 && !searchQuery}
                <div
                    class="px-3 py-1 mb-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"
                >
                    <Zap class="w-3 h-3 text-amber-500" /> Recommended Contexts
                </div>
                {#each recommendedOptions.slice(0, 3) as opt, i}
                    <button
                        class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors {i ===
                        selectedIndex
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-700/50'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent'}"
                        onclick={() => select(opt.type)}
                        onmousemove={() => (selectedIndex = i)}
                    >
                        <div
                            class="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                        >
                            <opt.icon class="w-4 h-4" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs font-semibold"
                                >{opt.label}</span
                            >
                            <span class="text-[10px] opacity-70"
                                >Highly relevant downstream node</span
                            >
                        </div>
                    </button>
                {/each}
                <div
                    class="px-3 py-1 mt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                    All Nodes
                </div>
            {/if}

            {#if filteredOptions.length === 0}
                <div class="px-3 py-2 text-xs text-slate-400 text-center">
                    No matching nodes found
                </div>
            {:else}
                {#each filteredOptions as opt, i}
                    {@const actualIndex =
                        recommendedOptions.length > 0 && !searchQuery
                            ? i + recommendedOptions.length
                            : i}
                    <button
                        class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors {actualIndex ===
                        selectedIndex
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}"
                        onclick={() => select(opt.type)}
                        onmousemove={() => (selectedIndex = actualIndex)}
                    >
                        <div
                            class="p-1.5 rounded-md {actualIndex ===
                            selectedIndex
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}"
                        >
                            <opt.icon class="w-4 h-4" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs font-semibold"
                                >{opt.label}</span
                            >
                            <span class="text-[10px] opacity-70"
                                >{opt.desc}</span
                            >
                        </div>
                    </button>
                {/each}
            {/if}
        </div>
    </div>
{/if}
