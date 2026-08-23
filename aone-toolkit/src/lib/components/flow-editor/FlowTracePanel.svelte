<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { X, Code, Braces } from "lucide-svelte";
    import type { FlowNode } from "./types";

    // P0 #3: Migrated to Svelte 5 $props() syntax
    let {
        isOpen = false,
        node = null,
        onClose = () => {},
        executionLog = null,
    } = $props<{
        isOpen?: boolean;
        node?: FlowNode | null;
        onClose?: () => void;
        executionLog?: {
            input?: any;
            output?: any;
            metrics?: any;
        } | null;
    }>();

    // Use real execution data when available; enforce explicit unexecuted notice when unavailable
    let inputPayload = $derived(
        executionLog?.input ??
            (node
                ? {
                      nodeId: node.id,
                      nodeType: node.type,
                      label: node.data.label,
                      parameters: node.data.parameters ?? node.data.config ?? node.data,
                      _status: executionLog ? "RECORDED" : "UNEXECUTED_NO_LOG"
                  }
                : null),
    );

    let outputPayload = $derived(
        executionLog?.output ??
            (node
                ? {
                      status: node.executionState === "error" ? 500 : (node.executionState === "completed" ? 200 : "NOT_RUN"),
                      result: node.executionState === "completed" ? "Completed" : null,
                      error: node.executionState === "error" ? node.errorMessage : null,
                      metrics: executionLog?.metrics ?? {
                          status: node.executionState === "completed" ? "EXECUTED" : "NOT_EXECUTED",
                          durationMs: executionLog?.metrics?.durationMs ?? null,
                          tokens: executionLog?.metrics?.tokens ?? null
                      },
                  }
                : null),
    );

</script>

{#if isOpen && node}
    <!-- Backdrop overlay -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="absolute inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]"
        transition:fade={{ duration: 200 }}
        onclick={onClose}
    ></div>

    <!-- Panel Drawer -->
    <div
        class="absolute top-0 right-0 bottom-0 w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col"
        transition:fly={{ x: 100, duration: 250, opacity: 1 }}
    >
        <div
            class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
        >
            <div class="flex items-center gap-2">
                <Code class="w-5 h-5 text-blue-500" />
                <h3 class="font-bold text-slate-800 dark:text-slate-100">
                    Trace: {node.data.label}
                </h3>
            </div>
            <button
                class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                onclick={onClose}
            >
                <X class="w-4 h-4" />
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Details Section -->
            <section>
                <h4
                    class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
                >
                    Execution Details
                </h4>
                <div
                    class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm space-y-2 border border-slate-100 dark:border-slate-800"
                >
                    <div class="flex justify-between">
                        <span class="text-slate-500">Status</span>
                        <span
                            class="font-medium {node.executionState === 'error'
                                ? 'text-red-500'
                                : 'text-emerald-500'}"
                        >
                            {node.executionState
                                ? node.executionState.toUpperCase()
                                : "UNKNOWN"}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Node ID</span>
                        <span
                            class="font-mono text-xs truncate max-w-[150px]"
                            title={node.id}>{node.id}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Type</span>
                        <span class="font-medium capitalize">{node.type}</span>
                    </div>
                    {#if node.errorMessage}
                        <div
                            class="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700"
                        >
                            <span
                                class="text-red-500 block text-xs font-semibold mb-1"
                                >Error Message</span
                            >
                            <span class="text-red-400 text-xs"
                                >{node.errorMessage}</span
                            >
                        </div>
                    {/if}
                </div>
            </section>

            <!-- Input Payload Section -->
            <section>
                <div class="flex items-center gap-2 mb-2">
                    <Braces class="w-4 h-4 text-slate-400" />
                    <h4
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                        Input Payload
                    </h4>
                </div>
                <div
                    class="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-inner"
                >
                    <pre
                        class="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(
                            inputPayload,
                            null,
                            2,
                        )}</pre>
                </div>
            </section>

            <!-- Output Payload Section -->
            <section>
                <div class="flex items-center gap-2 mb-2">
                    <Braces class="w-4 h-4 text-slate-400" />
                    <h4
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                        Output / Result
                    </h4>
                </div>
                <div
                    class="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-inner"
                >
                    <pre
                        class="p-4 text-xs font-mono text-blue-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(
                            outputPayload,
                            null,
                            2,
                        )}</pre>
                </div>
            </section>
        </div>
    </div>
{/if}
