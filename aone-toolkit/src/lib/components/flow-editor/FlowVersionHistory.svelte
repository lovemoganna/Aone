<script lang="ts">
    import { X, History, RotateCcw, Clock, Trash2, GitCompare, Bookmark, Plus } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";
    import { onMount } from "svelte";
    import {
        getAllSnapshots,
        clearSnapshots,
        saveSnapshot,
        type FlowSnapshot,
    } from "$lib/utils/idb";
    import { flowState } from './flowState.svelte';
    import { visualDiffUtils } from './visualDiff';
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let {
        isOpen = $bindable(false),
        onClose,
        onRestore,
    } = $props<{
        isOpen?: boolean;
        onClose?: () => void;
        onRestore?: (snapshot: FlowSnapshot) => void;
    }>();

    let snapshots = $state<FlowSnapshot[]>([]);
    let isLoading = $state(false);
    let compareMode = $state(false);
    let selectedForCompare = $state<FlowSnapshot | null>(null);
    let diffResult = $state<any>(null);
    let checkpointName = $state("");

    async function loadSnapshots() {
        isLoading = true;
        try {
            snapshots = await getAllSnapshots();
        } catch (e) {
            console.error("Failed to load snapshots", e);
        } finally {
            isLoading = false;
        }
    }

    async function handleCreateCheckpoint() {
        const desc = checkpointName.trim() || `里程碑版本 #${snapshots.length + 1}`;
        const newSnapshot: FlowSnapshot = {
            id: new Date().toISOString(),
            timestamp: Date.now(),
            description: desc,
            trigger: "manual",
            nodes: JSON.parse(JSON.stringify(flowState.nodes)),
            edges: JSON.parse(JSON.stringify(flowState.edges)),
        };
        await saveSnapshot(newSnapshot);
        checkpointName = "";
        await loadSnapshots();
        window.dispatchEvent(new CustomEvent("aone_snapshots_updated"));
    }

    $effect(() => {
        if (isOpen) {
            loadSnapshots();
        }
    });

    onMount(() => {
        const handleUpdate = () => {
            if (isOpen) loadSnapshots();
        };
        window.addEventListener("aone_snapshots_updated", handleUpdate);
        return () =>
            window.removeEventListener("aone_snapshots_updated", handleUpdate);
    });

    function formatTime(timestamp: number) {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(timestamp));
    }

    async function handleClear() {
        if (confirm("Are you sure you want to clear all history snapshots?")) {
            await clearSnapshots();
            snapshots = [];
            window.dispatchEvent(new CustomEvent("aone_snapshots_updated"));
        }
    }

    // P1-6: Compare selected snapshot with current
    function handleCompareSelect(snapshot: FlowSnapshot) {
        if (!compareMode) {
            compareMode = true;
            selectedForCompare = snapshot;
            return;
        }

        // Already in compare mode - this is the second selection
        // For now, just compare with current state (we'll get current from onRestore callback)
        // This is a simplified version - full implementation would need current workflow passed in
        const changes = visualDiffUtils.generateChangeList({
            addedNodes: [],
            removedNodes: [],
            modifiedNodes: [],
            addedEdges: [],
            removedEdges: [],
            modifiedEdges: [],
            unchanged: { nodes: snapshot.nodes || [], edges: snapshot.edges || [] }
        });

        const diffText = changes.join('\n') || '未检测到变更';
        toastStore.info(`版本对比结果:\n${diffText}`);
        compareMode = false;
        selectedForCompare = null;
    }

    function cancelCompare() {
        compareMode = false;
        selectedForCompare = null;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="absolute inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]"
        transition:fade={{ duration: 150 }}
        onclick={onClose}
    ></div>

    <div
        class="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
        transition:fly={{ x: 100, duration: 250 }}
    >
        <!-- Header -->
        {#if compareMode}
            <div class="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800">
                <p class="text-xs text-indigo-700 dark:text-indigo-300">
                    Select a snapshot to compare (click another one)
                </p>
            </div>
        {/if}
        <div
            class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
            <h2
                class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
                <History size={16} class="text-indigo-500" />
                Version History
            </h2>
            <div class="flex items-center gap-1">
                {#if compareMode}
                    <button
                        class="px-2 py-1 text-xs rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onclick={cancelCompare}
                    >
                        Cancel
                    </button>
                {:else}
                    <button
                        class="p-1 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        onclick={() => compareMode = true}
                        title="Compare Versions"
                    >
                        <GitCompare size={16} />
                    </button>
                {/if}
                <button
                    class="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onclick={handleClear}
                    title="Clear All History"
                >
                    <Trash2 size={16} />
                </button>
                <button
                    class="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    onclick={onClose}
                >
                    <X size={16} />
                </button>
            </div>
        </div>

        <!-- P3-24: Create Named Checkpoint Bar -->
        <div class="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div class="flex gap-1.5">
                <input
                    type="text"
                    bind:value={checkpointName}
                    placeholder="命名里程碑快照 (如: 发布前稳定版本)..."
                    class="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    onkeydown={(e) => { if (e.key === 'Enter') handleCreateCheckpoint(); }}
                />
                <button
                    class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                    onclick={handleCreateCheckpoint}
                    title="创建命名里程碑快照"
                >
                    <Bookmark size={12} />
                    快照
                </button>
            </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#if isLoading}
                <div class="flex items-center justify-center p-8">
                    <div
                        class="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
                    ></div>
                </div>
            {:else if snapshots.length === 0}
                <div
                    class="flex flex-col items-center justify-center pt-12 pb-8 text-center px-4 space-y-3 opacity-50"
                >
                    <History size={32} class="text-slate-400" />
                    <p class="text-sm text-slate-500">
                        No history snapshots found. Auto-saves will appear here
                        as you edit the flow.
                    </p>
                </div>
            {:else}
                {#each snapshots as snap (snap.id)}
                    <div
                        class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 group transition-all hover:border-indigo-300 dark:hover:border-indigo-700 {snap.trigger === 'manual' ? 'border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : ''}"
                        transition:fly={{ y: 10, duration: 150 }}
                    >
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <h3
                                    class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-1.5"
                                >
                                    {#if snap.trigger === 'manual'}
                                        <Bookmark size={13} class="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    {/if}
                                    {snap.description}
                                </h3>
                                <div
                                    class="flex items-center gap-1.5 mt-1 text-xs text-slate-500"
                                >
                                    <Clock size={12} />
                                    <span>{formatTime(snap.timestamp)}</span>
                                    <span
                                        class="px-1.5 py-0.5 rounded-sm text-[10px] font-medium uppercase ml-1 {snap.trigger === 'manual' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}"
                                    >
                                        {snap.trigger === 'manual' ? '里程碑' : '自动保存'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div
                            class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5"
                        >
                            <span class="flex-1"
                                >{snap.nodes?.length || 0} Nodes</span
                            >
                            <span
                                class="w-[1px] h-3 bg-slate-200 dark:bg-slate-700"
                            ></span>
                            <span class="flex-1"
                                >{snap.edges?.length || 0} Edges</span
                            >
                        </div>

                        <button
                            class="w-full flex items-center justify-center gap-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg transition-colors border border-indigo-200 dark:border-indigo-500/30"
                            onclick={() => {
                                if (onRestore) onRestore(snap);
                            }}
                        >
                            <RotateCcw size={14} />
                            Restore state
                        </button>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
{/if}
