<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import {
        X,
        Search,
        Replace,
        ChevronDown,
        ChevronUp,
        CaseSensitive,
        Regex,
    } from "lucide-svelte";
    import { Button } from "$lib/components/ui";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        code: string;
        onReplace: (newCode: string) => void;
    }

    let { isOpen, onClose, code, onReplace }: Props = $props();

    let findText = $state("");
    let replaceText = $state("");
    let caseSensitive = $state(false);
    let useRegex = $state(false);
    let currentMatch = $state(0);
    let matchCount = $state(0);

    // Find matches
    $effect(() => {
        if (!findText) {
            matchCount = 0;
            currentMatch = 0;
            return;
        }

        try {
            const flags = caseSensitive ? "g" : "gi";
            const regex = useRegex
                ? new RegExp(findText, flags)
                : new RegExp(escapeRegex(findText), flags);
            const matches = code.match(regex);
            matchCount = matches?.length ?? 0;
            if (currentMatch > matchCount) currentMatch = matchCount;
            if (currentMatch === 0 && matchCount > 0) currentMatch = 1;
        } catch {
            matchCount = 0;
        }
    });

    function escapeRegex(str: string) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function replaceOne() {
        if (!findText || matchCount === 0) return;
        const flags = caseSensitive ? "" : "i";
        const regex = useRegex
            ? new RegExp(findText, flags)
            : new RegExp(escapeRegex(findText), flags);
        onReplace(code.replace(regex, replaceText));
    }

    function replaceAll() {
        if (!findText || matchCount === 0) return;
        const flags = caseSensitive ? "g" : "gi";
        const regex = useRegex
            ? new RegExp(findText, flags)
            : new RegExp(escapeRegex(findText), flags);
        onReplace(code.replace(regex, replaceText));
    }

    function nextMatch() {
        if (currentMatch < matchCount) currentMatch++;
        else currentMatch = 1;
    }

    function prevMatch() {
        if (currentMatch > 1) currentMatch--;
        else currentMatch = matchCount;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm"
        transition:fade={{ duration: 100 }}
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:scale={{ start: 0.98, duration: 150 }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800"
            >
                <div class="flex items-center gap-2">
                    <Search size={16} class="text-slate-500" />
                    <span
                        class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                        >Find & Replace</span
                    >
                </div>
                <button
                    class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    onclick={onClose}
                >
                    <X size={16} class="text-slate-500" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-4">
                <!-- Find Input -->
                <div class="space-y-2">
                    <label
                        for="find-input"
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >Find</label
                    >
                    <div class="flex gap-2">
                        <input
                            id="find-input"
                            type="text"
                            bind:value={findText}
                            class="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Search text..."
                            autofocus
                        />
                        <button
                            class="p-2 rounded-lg border transition-colors {caseSensitive
                                ? 'bg-primary-100 border-primary-300 text-primary-600'
                                : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}"
                            onclick={() => (caseSensitive = !caseSensitive)}
                            title="Case Sensitive"
                        >
                            <CaseSensitive size={16} />
                        </button>
                        <button
                            class="p-2 rounded-lg border transition-colors {useRegex
                                ? 'bg-primary-100 border-primary-300 text-primary-600'
                                : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}"
                            onclick={() => (useRegex = !useRegex)}
                            title="Use Regex"
                        >
                            <Regex size={16} />
                        </button>
                    </div>

                    {#if findText}
                        <div
                            class="flex items-center justify-between text-xs text-slate-500"
                        >
                            <span
                                >{matchCount} match{matchCount !== 1
                                    ? "es"
                                    : ""}</span
                            >
                            {#if matchCount > 0}
                                <div class="flex items-center gap-1">
                                    <button
                                        onclick={prevMatch}
                                        class="p-1 hover:bg-slate-100 rounded"
                                        ><ChevronUp size={14} /></button
                                    >
                                    <span>{currentMatch} of {matchCount}</span>
                                    <button
                                        onclick={nextMatch}
                                        class="p-1 hover:bg-slate-100 rounded"
                                        ><ChevronDown size={14} /></button
                                    >
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- Replace Input -->
                <div class="space-y-2">
                    <label
                        for="replace-input"
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >Replace</label
                    >
                    <input
                        id="replace-input"
                        type="text"
                        bind:value={replaceText}
                        class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Replace with..."
                    />
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={replaceOne}
                        disabled={matchCount === 0}
                    >
                        Replace
                    </Button>
                    <Button
                        size="sm"
                        onclick={replaceAll}
                        disabled={matchCount === 0}
                    >
                        <Replace size={14} class="mr-1" /> Replace All
                    </Button>
                </div>
            </div>
        </div>
    </div>
{/if}
