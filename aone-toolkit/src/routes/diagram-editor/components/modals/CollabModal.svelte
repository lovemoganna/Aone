<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { X, Users, Copy, Check, Radio } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let joinID = $state("");
    let copied = $state(false);

    async function handleHost() {
        await diagramStore.startCollaboration();
    }

    async function handleJoin() {
        if (!joinID.trim()) return;
        await diagramStore.joinCollaboration(joinID);
        onClose();
    }

    function handleCopy() {
        if (diagramStore.sessionID) {
            navigator.clipboard.writeText(diagramStore.sessionID);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close collaboration modal"
        transition:fade={{ duration: 100 }}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 10, duration: 120 }}
        >
            <!-- Header -->
            <div
                class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40"
            >
                <div class="flex items-center gap-2">
                    <Users size={15} class="text-slate-700 dark:text-slate-300" />
                    <div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Real-time Collaboration
                        </h3>
                    </div>
                </div>
                <button
                    type="button"
                    class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
                    onclick={onClose}
                    title="Close modal"
                    aria-label="Close modal"
                >
                    <X size={15} />
                </button>
            </div>

            <div class="p-4 space-y-4 text-xs">
                {#if diagramStore.isCollaborating}
                    <div class="space-y-3">
                        <div
                            class="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded p-2.5 flex items-center gap-2.5"
                        >
                            <Radio size={16} class="text-emerald-500 animate-pulse shrink-0" />
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-slate-900 dark:text-slate-100">
                                    Live Session Active
                                </p>
                                <p class="text-slate-500 dark:text-slate-400 text-[11px]">
                                    Share session ID with peers to edit together.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label
                                for="diagram-session-id"
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                            >
                                Session ID
                            </label>
                            <div class="flex gap-2">
                                <input
                                    id="diagram-session-id"
                                    type="text"
                                    readonly
                                    value={diagramStore.sessionID}
                                    class="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-800 dark:text-slate-200 outline-none text-xs"
                                />
                                <button
                                    type="button"
                                    class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                                    onclick={handleCopy}
                                    title="Copy session ID"
                                >
                                    {#if copied}
                                        <Check size={14} class="text-emerald-400 dark:text-emerald-600" />
                                        <span>Copied</span>
                                    {:else}
                                        <Copy size={14} />
                                        <span>Copy</span>
                                    {/if}
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            class="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded font-semibold text-xs transition-colors"
                            onclick={() => diagramStore.stopCollaboration()}
                        >
                            End Collaboration Session
                        </button>
                    </div>
                {:else}
                    <div class="space-y-3">
                        <button
                            type="button"
                            class="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs transition-colors shadow-xs"
                            onclick={handleHost}
                        >
                            Start New Collaboration Host
                        </button>

                        <div class="flex items-center gap-2">
                            <div class="flex-1 h-px bg-slate-200 dark:border-slate-800"></div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">or join</span>
                            <div class="flex-1 h-px bg-slate-200 dark:border-slate-800"></div>
                        </div>

                        <div class="space-y-2">
                            <input
                                type="text"
                                bind:value={joinID}
                                placeholder="Paste peer session ID..."
                                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 outline-none text-xs font-mono"
                            />
                            <button
                                type="button"
                                class="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                                disabled={!joinID.trim()}
                                onclick={handleJoin}
                            >
                                Join Existing Session
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
