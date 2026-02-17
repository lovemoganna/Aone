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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
        onclick={onClose}
        transition:fade={{ duration: 300 }}
    >
        <div
            class="glass-pro rounded-2xl w-full max-w-md overflow-hidden flex flex-col transition-all duration-700"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 20, duration: 400 }}
        >
            <!-- Header -->
            <div
                class="p-6 border-b border-white/10 flex items-center justify-between"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 glow-premium"
                    >
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white">
                            Collaboration
                        </h3>
                        <p class="text-xs text-gray-400">P2P Real-time Sync</p>
                    </div>
                </div>
                <button
                    class="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <div class="p-6 space-y-6">
                {#if diagramStore.isCollaborating}
                    <div class="space-y-4">
                        <div
                            class="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4"
                        >
                            <div class="relative">
                                <Radio
                                    size={24}
                                    class="text-indigo-400 animate-pulse"
                                />
                                <div
                                    class="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20"
                                ></div>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-white">
                                    Live Session Active
                                </p>
                                <p class="text-xs text-gray-400">
                                    Share your ID to let others join.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                                >Session ID</label
                            >
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    readonly
                                    value={diagramStore.sessionID}
                                    class="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 outline-none"
                                />
                                <button
                                    class="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all glow-premium active:scale-95"
                                    onclick={handleCopy}
                                >
                                    {#if copied}<Check size={20} />{:else}<Copy
                                            size={20}
                                        />{/if}
                                </button>
                            </div>
                        </div>

                        <button
                            class="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 transition-all"
                            onclick={() => diagramStore.stopCollaboration()}
                        >
                            End Session
                        </button>
                    </div>
                {:else}
                    <div class="space-y-6">
                        <div class="space-y-3">
                            <p class="text-sm text-gray-400 leading-relaxed">
                                Host a session to collaborate in real-time or
                                join an existing one using a Session ID.
                            </p>
                            <button
                                class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all glow-premium active:scale-95"
                                onclick={handleHost}
                            >
                                Start Hosting
                            </button>
                        </div>

                        <div class="relative flex items-center py-2">
                            <div
                                class="flex-grow border-t border-white/5"
                            ></div>
                            <span
                                class="flex-shrink mx-4 text-xs font-bold text-gray-600 uppercase tracking-widest"
                                >OR</span
                            >
                            <div
                                class="flex-grow border-t border-white/5"
                            ></div>
                        </div>

                        <div class="space-y-3">
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    bind:value={joinID}
                                    placeholder="Enter Session ID..."
                                    class="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <button
                                    class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                                    onclick={handleJoin}
                                    disabled={!joinID.trim()}
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
