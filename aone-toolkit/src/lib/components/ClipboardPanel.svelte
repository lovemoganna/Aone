<script lang="ts">
    import {
        clipboardStore,
        copyToClipboard,
    } from "$lib/stores/clipboard.svelte";
    import { Panel, Button } from "$lib/components/ui";
    import { Clipboard, X, Trash2, Copy, Clock, Search } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";

    let { isOpen = $bindable(false) } = $props();
    let searchQuery = $state("");

    let filteredHistory = $derived(
        clipboardStore.history.filter((item) =>
            item.text.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    function handleCopy(text: string) {
        copyToClipboard(text);
        // Maybe show a toast or feedback
    }

    function formatTime(ts: number) {
        const diff = Date.now() - ts;
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onclick={() => (isOpen = false)}
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Side Panel -->
    <div
        class="fixed right-0 top-0 h-full w-80 md:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[60] flex flex-col border-l border-slate-200 dark:border-slate-800"
        transition:fly={{ x: 400, duration: 300 }}
    >
        <div
            class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-black/20"
        >
            <div class="flex items-center gap-2">
                <div
                    class="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg"
                >
                    <Clipboard size={18} />
                </div>
                <h2 class="font-bold text-slate-900 dark:text-white">
                    Clipboard History
                </h2>
            </div>
            <button
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                onclick={() => (isOpen = false)}
            >
                <X size={20} />
            </button>
        </div>

        <div class="p-4 space-y-4 flex-1 flex flex-col min-h-0">
            <!-- Search -->
            <div class="relative">
                <Search
                    class="absolute left-3 top-2.5 text-slate-400"
                    size={14}
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search history..."
                    class="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3">
                {#if filteredHistory.length > 0}
                    {#each filteredHistory as item (item.id)}
                        <div
                            class="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-all hover:shadow-md hover:border-primary-500/30"
                        >
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                                        >{item.type}</span
                                    >
                                    <span
                                        class="text-[9px] text-slate-400 flex items-center gap-1"
                                    >
                                        <Clock size={10} />
                                        {formatTime(item.timestamp)}
                                    </span>
                                </div>
                                <div
                                    class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <button
                                        class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 hover:text-primary-500"
                                        title="Copy again"
                                        onclick={() => handleCopy(item.text)}
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-slate-400 hover:text-red-500"
                                        onclick={() =>
                                            clipboardStore.remove(item.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p
                                class="text-xs font-mono text-slate-600 dark:text-slate-300 line-clamp-3 break-all whitespace-pre-wrap"
                            >
                                {item.text}
                            </p>
                        </div>
                    {/each}
                {:else}
                    <div
                        class="h-64 flex flex-col items-center justify-center text-slate-400 text-center px-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl"
                    >
                        <Clipboard size={32} class="opacity-10 mb-4" />
                        <p class="text-sm font-medium">History is empty</p>
                        <p class="text-xs mt-1">
                            Copied text from this app will appear here.
                        </p>
                    </div>
                {/if}
            </div>
        </div>

        {#if clipboardStore.history.length > 0}
            <div class="p-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                    variant="ghost"
                    class="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onclick={() => clipboardStore.clear()}
                >
                    <Trash2 size={16} class="mr-2" /> Clear All History
                </Button>
            </div>
        {/if}
    </div>
{/if}
