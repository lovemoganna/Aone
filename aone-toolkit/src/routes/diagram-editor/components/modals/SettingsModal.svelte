<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { pingPlantUMLServer } from "../../lib/plantuml";
    import { X, Minus, Plus, Monitor, Activity, CheckCircle2, AlertCircle, Loader2 } from "lucide-svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    const FONTS = [
        { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
        { name: "Fira Code", value: "'Fira Code', monospace" },
        { name: "Source Code Pro", value: "'Source Code Pro', monospace" },
        { name: "Consolas", value: "Consolas, monospace" },
    ];

    let isTestingServer = $state(false);
    let pingResult = $state<{ ok: boolean; latencyMs: number; error?: string } | null>(null);

    function increaseFont() {
        if (diagramStore.fontSize < 32) diagramStore.fontSize++;
    }

    function decreaseFont() {
        if (diagramStore.fontSize > 8) diagramStore.fontSize--;
    }

    async function testServerConnection() {
        isTestingServer = true;
        pingResult = null;
        try {
            const res = await pingPlantUMLServer(diagramStore.plantumlServerUrl);
            pingResult = res;
        } catch (e: any) {
            pingResult = { ok: false, latencyMs: 0, error: e?.message || 'Connection failed' };
        } finally {
            isTestingServer = false;
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close editor settings"
    >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <h3
                    class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"
                >
                    <Monitor size={15} class="text-slate-700 dark:text-slate-300" />
                    Editor & Engine Settings
                </h3>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                    title="Close editor settings"
                    aria-label="Close editor settings"
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-4">
                <!-- Font Size -->
                <div>
                    <span
                        class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                        Font Size
                    </span>
                    <div class="flex items-center gap-2">
                        <button
                            class="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            onclick={decreaseFont}
                            title="Decrease font size"
                        >
                            <Minus size={14} />
                        </button>
                        <span class="text-sm font-mono w-12 text-center font-bold text-slate-800 dark:text-slate-200"
                            >{diagramStore.fontSize}px</span
                        >
                        <button
                            class="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            onclick={increaseFont}
                            title="Increase font size"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                <!-- Font Family -->
                <div>
                    <span
                        class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                        Font Family
                    </span>
                    <div class="grid grid-cols-2 gap-1.5">
                        {#each FONTS as font}
                            <button
                                class="w-full text-left px-2.5 py-1.5 rounded border text-xs transition-colors flex items-center justify-between {diagramStore.fontFamily ===
                                font.value
                                    ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-400'}"
                                onclick={() =>
                                    (diagramStore.fontFamily = font.value)}
                            >
                                <span style="font-family: {font.value}"
                                    >{font.name}</span
                                >
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- PlantUML Server & Ping -->
                <div class="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <label
                        for="diagram-plantuml-server"
                        class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                        PlantUML Server Endpoint
                    </label>
                    <div class="flex gap-2">
                        <input
                            id="diagram-plantuml-server"
                            type="text"
                            bind:value={diagramStore.plantumlServerUrl}
                            placeholder="https://www.plantuml.com/plantuml"
                            class="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 outline-none"
                        />
                        <button
                            class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
                            onclick={testServerConnection}
                            disabled={isTestingServer}
                        >
                            {#if isTestingServer}
                                <Loader2 size={13} class="animate-spin text-slate-500" />
                                <span>Testing...</span>
                            {:else}
                                <Activity size={13} class="text-slate-500" />
                                <span>Ping</span>
                            {/if}
                        </button>
                    </div>

                    {#if pingResult}
                        <div class="mt-2 p-2 rounded text-xs flex items-center gap-2 {pingResult.ok ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'}">
                            {#if pingResult.ok}
                                <CheckCircle2 size={14} />
                                <span>Server reachable! Latency: <strong>{pingResult.latencyMs}ms</strong></span>
                            {:else}
                                <AlertCircle size={14} />
                                <span>Unreachable ({pingResult.error})</span>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end"
            >
                <button
                    class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded text-xs font-semibold transition-colors shadow-xs"
                    onclick={() => {
                        diagramStore.saveState();
                        onClose();
                    }}
                >
                    Save & Close
                </button>
            </div>
        </div>
    </div>
{/if}
