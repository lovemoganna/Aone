<script lang="ts">
    import { Panel, Input, Button } from "$lib/components/ui";
    import { Copy, AlertCircle, CheckCircle } from "lucide-svelte";
    import { fade } from "svelte/transition";

    let token = $state("");
    let header = $state<object | null>(null);
    let payload = $state<object | null>(null);
    let signature = $state<string | null>(null);
    let error = $state<string | null>(null);
    let isValid = $derived(header !== null && payload !== null && !error);

    function decodeJwt(input: string) {
        error = null;
        header = null;
        payload = null;
        signature = null;

        if (!input.trim()) return;

        try {
            const parts = input.split(".");
            if (parts.length !== 3) {
                throw new Error(
                    "Invalid JWT format: Token must have 3 parts (Header.Payload.Signature)",
                );
            }

            const decodePart = (part: string) => {
                try {
                    return JSON.parse(
                        atob(part.replace(/-/g, "+").replace(/_/g, "/")),
                    );
                } catch (e) {
                    throw new Error("Failed to decode Base64 content");
                }
            };

            header = decodePart(parts[0]);
            payload = decodePart(parts[1]);
            signature = parts[2];
        } catch (e: any) {
            error = e.message;
        }
    }

    $effect(() => {
        decodeJwt(token);
    });

    function formatJson(obj: object | null): string {
        return obj ? JSON.stringify(obj, null, 2) : "";
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
    <!-- Input Section -->
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h3
                class="text-lg font-semibold text-slate-800 dark:text-slate-100"
            >
                Encoded Token
            </h3>
            {#if token}
                <div class="flex items-center gap-2 text-sm" transition:fade>
                    {#if isValid}
                        <span
                            class="text-emerald-500 font-medium flex items-center gap-1"
                        >
                            <CheckCircle size={14} /> Valid Format
                        </span>
                    {:else if error}
                        <span
                            class="text-rose-500 font-medium flex items-center gap-1"
                        >
                            <AlertCircle size={14} />
                            {error}
                        </span>
                    {/if}
                    <button
                        class="text-slate-400 hover:text-primary-500 transition-colors"
                        onclick={() => (token = "")}
                        title="Clear"
                    >
                        Clear
                    </button>
                </div>
            {/if}
        </div>

        <textarea
            bind:value={token}
            class="w-full h-[400px] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
            placeholder="Paste your JWT here (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
            spellcheck="false"
        ></textarea>

        <div class="text-xs text-slate-500 dark:text-slate-500 px-1">
            <p>
                <strong>Note:</strong> Tokens are decoded locally in your browser.
                No data is sent to any server.
            </p>
        </div>
    </div>

    <!-- Output Section -->
    <div
        class="space-y-4 flex flex-col h-[400px] overflow-y-auto pr-1 custom-scrollbar"
    >
        <!-- Header -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0"
        >
            <div
                class="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"
            >
                <span
                    class="text-xs font-bold text-rose-500 uppercase tracking-wide"
                    >Header</span
                >
                <span class="text-[10px] text-slate-400"
                    >Algorithm & Token Type</span
                >
            </div>
            <pre
                class="p-3 text-sm font-mono text-rose-600 dark:text-rose-400 overflow-x-auto">{formatJson(
                    header,
                )}</pre>
        </div>

        <!-- Payload -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0"
        >
            <div
                class="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"
            >
                <span
                    class="text-xs font-bold text-indigo-500 uppercase tracking-wide"
                    >Payload</span
                >
                <span class="text-[10px] text-slate-400">Data & Claims</span>
            </div>
            <pre
                class="p-3 text-sm font-mono text-indigo-600 dark:text-indigo-400 overflow-x-auto">{formatJson(
                    payload,
                )}</pre>
        </div>

        <!-- Signature -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0"
        >
            <div
                class="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"
            >
                <span
                    class="text-xs font-bold text-cyan-500 uppercase tracking-wide"
                    >Signature</span
                >
                <span class="text-[10px] text-slate-400">Verification Hash</span
                >
            </div>
            <div
                class="p-3 text-sm font-mono text-cyan-600 dark:text-cyan-400 break-all"
            >
                {signature || ""}
            </div>
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 9999px;
    }
</style>
