<script lang="ts">
    import {
        X,
        Play,
        Copy,
        Check,
        Terminal,
        FileText,
        Code,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { marked } from "marked";
    import type { Prompt } from "../../lib/types";

    let {
        isOpen = false,
        prompt,
        onClose,
    } = $props<{
        isOpen: boolean;
        prompt: Prompt | null;
        onClose: () => void;
    }>();

    let variables = $state<string[]>([]);
    let values = $state<Record<string, string>>({});
    let copied = $state(false);
    let viewMode = $state<"raw" | "preview">("preview");

    let compiledPrompt = $derived.by(() => {
        if (!prompt) return "";
        let text = prompt.content;
        for (const [key, val] of Object.entries(values)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
            if (val) {
                text = text.replace(regex, val);
            }
        }
        return text;
    });

    let renderedHtml = $derived.by(() => {
        try {
            return marked.parse(compiledPrompt) as string;
        } catch (e) {
            return compiledPrompt;
        }
    });

    $effect(() => {
        if (isOpen && prompt) {
            const regex = /\{\{\s*(\w+)\s*\}\}/g;
            const matches = [...prompt.content.matchAll(regex)];
            const newVars = [...new Set(matches.map((m) => m[1]))];

            if (JSON.stringify(newVars) !== JSON.stringify(variables)) {
                variables = newVars;
                const newValues: Record<string, string> = {};
                newVars.forEach((v) => {
                    newValues[v] = values[v] || "";
                });
                values = newValues;
            }
        }
    });

    function copyResult() {
        navigator.clipboard.writeText(compiledPrompt);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && prompt}
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 150 }}
        onclick={onClose}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            transition:scale={{ duration: 150, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    >
                        <Play size={20} />
                    </div>
                    <div>
                        <h3
                            class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            Run Prompt
                        </h3>
                        <p
                            class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-sm"
                        >
                            {prompt.title}
                        </p>
                    </div>
                </div>
                <button
                    onclick={onClose}
                    class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X size={18} class="text-gray-500" />
                </button>
            </div>

            <!-- Body -->
            <div
                class="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700"
            >
                <!-- Inputs Section (Left/Top) -->
                <div
                    class="p-6 bg-gray-50 dark:bg-gray-800/50 w-full md:w-1/3 flex-shrink-0 overflow-y-auto"
                >
                    <h4
                        class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4"
                    >
                        Variables
                    </h4>

                    {#if variables.length > 0}
                        <div class="space-y-4">
                            {#each variables as variable}
                                <div>
                                    <label
                                        for={`run-var-${variable}`}
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >
                                        {variable}
                                    </label>
                                    <textarea
                                        id={`run-var-${variable}`}
                                        rows="2"
                                        bind:value={values[variable]}
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none resize-none text-sm shadow-sm"
                                        placeholder={`Enter value for ${variable}...`}
                                    ></textarea>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div
                            class="flex flex-col items-center justify-center h-40 text-gray-400 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            <Terminal size={32} class="mb-2 opacity-50" />
                            <p class="text-sm">No variables detected.</p>
                            <p class="text-xs mt-1 px-4">
                                Use <code>{`{{variable}}`}</code> syntax in your
                                prompt content.
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- Result Section (Right/Bottom) -->
                <div
                    class="flex-1 flex flex-col min-h-[50vh] bg-white dark:bg-gray-900"
                >
                    <div
                        class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800"
                    >
                        <div
                            class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
                        >
                            <button
                                onclick={() => (viewMode = "preview")}
                                class="px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5"
                                class:bg-white={viewMode === "preview"}
                                class:dark:bg-gray-700={viewMode === "preview"}
                                class:shadow-sm={viewMode === "preview"}
                                class:text-gray-900={viewMode === "preview"}
                                class:dark:text-gray-100={viewMode ===
                                    "preview"}
                                class:text-gray-500={viewMode !== "preview"}
                            >
                                <FileText size={14} /> Preview
                            </button>
                            <button
                                onclick={() => (viewMode = "raw")}
                                class="px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5"
                                class:bg-white={viewMode === "raw"}
                                class:dark:bg-gray-700={viewMode === "raw"}
                                class:shadow-sm={viewMode === "raw"}
                                class:text-gray-900={viewMode === "raw"}
                                class:dark:text-gray-100={viewMode === "raw"}
                                class:text-gray-500={viewMode !== "raw"}
                            >
                                <Code size={14} /> Raw
                            </button>
                        </div>

                        <button
                            onclick={copyResult}
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            class:bg-green-100={copied}
                            class:text-green-700={copied}
                            class:bg-indigo-50={!copied}
                            class:text-indigo-600={!copied}
                            class:hover:bg-indigo-100={!copied}
                        >
                            {#if copied}
                                <Check size={14} /> Copied
                            {:else}
                                <Copy size={14} /> Copy
                            {/if}
                        </button>
                    </div>

                    <div class="flex-1 p-6 overflow-y-auto">
                        {#if viewMode === "preview"}
                            <div
                                class="prose dark:prose-invert max-w-none text-sm"
                            >
                                {@html renderedHtml}
                            </div>
                        {:else}
                            <pre
                                class="font-mono text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{compiledPrompt}</pre>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
