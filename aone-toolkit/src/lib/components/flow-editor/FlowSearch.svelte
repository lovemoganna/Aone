<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import type { FlowNode } from "./types";
    import { Search, X, FileTerminal, Filter } from "lucide-svelte";
    import { tick } from "svelte";

    let {
        isOpen = $bindable(false),
        nodes = [] as FlowNode[],
        onSelect = () => {},
        onClose = () => {}
    } = $props<{
        isOpen?: boolean;
        nodes?: FlowNode[];
        onSelect?: (nodeId: string) => void;
        onClose?: () => void;
    }>();

    let searchQuery = $state("");
    let searchInput: HTMLInputElement | null = $state(null);
    let selectedIndex = $state(0);
    let selectedType = $state("all");

    $effect(() => {
        if (isOpen) {
            tick().then(() => {
                if (searchInput) searchInput.focus();
            });
            searchQuery = "";
            selectedIndex = 0;
        }
    });

    let filteredNodes = $derived.by(() => {
        const query = searchQuery.toLowerCase().trim();
        return (nodes || [])
            .filter((n: FlowNode) => {
                if (selectedType !== "all" && n.type !== selectedType) return false;
                if (!query) return true;

                const labelMatch = (n.data?.label || "").toLowerCase().includes(query);
                const descMatch = (n.data?.description || "").toLowerCase().includes(query);
                const typeMatch = (n.type || "").toLowerCase().includes(query);
                const idMatch = (n.id || "").toLowerCase().includes(query);
                const configMatch = JSON.stringify(n.data?.config || {}).toLowerCase().includes(query);

                return labelMatch || descMatch || typeMatch || idMatch || configMatch;
            })
            .slice(0, 15);
    });

    function handleKeyDown(e: KeyboardEvent) {
        if (!isOpen) return;

        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex + 1) % Math.max(1, filteredNodes.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + filteredNodes.length) %
                Math.max(1, filteredNodes.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredNodes.length > 0 && filteredNodes[selectedIndex]) {
                onSelect(filteredNodes[selectedIndex].id);
                onClose();
            }
        }
    }

    function selectNode(id: string) {
        onSelect(id);
        onClose();
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
    <div
        class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[540px] z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        in:fly={{ y: -20, duration: 200 }}
        out:fade={{ duration: 150 }}
    >
        <!-- Search Input Header -->
        <div
            class="flex items-center p-4 border-b border-slate-100 dark:border-slate-800"
        >
            <Search class="w-5 h-5 text-slate-400 mr-3" />
            <input
                bind:this={searchInput}
                bind:value={searchQuery}
                type="text"
                placeholder="搜索节点名称、描述、类型或配置参数... (Ctrl+F)"
                class="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-base font-medium"
            />
            <button
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onclick={onClose}
                aria-label="关闭搜索"
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Type Filter Pills -->
        <div class="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-xs">
            {#each [
                { id: 'all', label: '全部' },
                { id: 'agent', label: 'Agent' },
                { id: 'skill', label: 'Skill' },
                { id: 'condition', label: 'Condition' },
                { id: 'parallel', label: 'Parallel' },
                { id: 'router', label: 'Router' },
                { id: 'loop', label: 'Loop' },
                { id: 'group', label: 'Group' }
            ] as tab}
                <button
                    class="px-2.5 py-1 rounded-full font-medium transition-all {selectedType === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}"
                    onclick={() => { selectedType = tab.id; selectedIndex = 0; }}
                >
                    {tab.label}
                </button>
            {/each}
        </div>

        <!-- Results List -->
        {#if filteredNodes.length > 0}
            <div class="max-h-[320px] overflow-y-auto py-2">
                {#each filteredNodes as node, i (node.id)}
                    <button
                        type="button"
                        class="w-full px-4 py-2.5 flex items-start cursor-pointer text-left transition-colors {i ===
                        selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}"
                        onclick={() => selectNode(node.id)}
                        onmouseenter={() => (selectedIndex = i)}
                    >
                        <div
                            class="p-2 rounded-md mr-3 flex-shrink-0 {i ===
                            selectedIndex
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}"
                        >
                            <FileTerminal class="w-4 h-4" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold text-sm truncate">{node.data?.label || node.id}</h4>
                                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-mono">
                                    {node.type}
                                </span>
                            </div>
                            {#if node.data?.description}
                                <p
                                    class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5"
                                >
                                    {node.data.description}
                                </p>
                            {/if}
                        </div>
                    </button>
                {/each}
            </div>
        {:else}
            <!-- Empty State -->
            <div class="p-8 text-center text-slate-500">
                <Search class="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p class="text-sm font-medium">未找到匹配 "{searchQuery}" 的节点</p>
                <p class="text-xs mt-1 opacity-60">
                    可尝试按节点名称、描述、类型或配置参数搜索。
                </p>
            </div>
        {/if}

        <!-- Footer -->
        <div
            class="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex justify-between items-center"
        >
            <span>↑↓ 切换选择</span>
            <span>↵ 定位并居中节点</span>
            <span>Esc 关闭</span>
        </div>
    </div>

    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
        onclick={onClose}
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 150 }}
    ></div>
{/if}
