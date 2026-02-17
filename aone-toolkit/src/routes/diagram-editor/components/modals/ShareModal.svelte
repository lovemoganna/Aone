<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { X, Share2, Link, Code, Copy, Check } from "lucide-svelte";
    import lzString from "lz-string";
    import { fade, slide } from "svelte/transition";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let shareUrl = $state("");
    let embedCode = $state("");
    let activeTab = $state<"link" | "embed">("link");
    let copied = $state(false);

    function generateLinks() {
        if (!diagramStore.code) return;

        // Compress code to URL params
        const compressed = lzString.compressToEncodedURIComponent(
            diagramStore.code,
        );
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set("code", compressed);
        params.set("mode", diagramStore.mode);

        const fullUrl = `${baseUrl}?${params.toString()}`;

        shareUrl = fullUrl;
        embedCode = `<iframe src="${fullUrl}&embed=true" width="800" height="600" frameborder="0"></iframe>`;
    }

    $effect(() => {
        if (isOpen) {
            generateLinks();
        } else {
            copied = false;
        }
    });

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        transition:fade
        onclick={onClose}
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            transition:slide={{ duration: 200 }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <Share2 size={20} class="text-indigo-500" />
                    Share Diagram
                </h3>
                <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6">
                <!-- Tabs -->
                <div
                    class="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6"
                >
                    <button
                        class="pb-2 text-sm font-medium transition-colors relative {activeTab ===
                        'link'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700'}"
                        onclick={() => (activeTab = "link")}
                    >
                        <div class="flex items-center gap-2">
                            <Link size={16} /> Share Link
                        </div>
                        {#if activeTab === "link"}
                            <div
                                class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400"
                                transition:fade
                            ></div>
                        {/if}
                    </button>
                    <button
                        class="pb-2 text-sm font-medium transition-colors relative {activeTab ===
                        'embed'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700'}"
                        onclick={() => (activeTab = "embed")}
                    >
                        <div class="flex items-center gap-2">
                            <Code size={16} /> Embed Code
                        </div>
                        {#if activeTab === "embed"}
                            <div
                                class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400"
                                transition:fade
                            ></div>
                        {/if}
                    </button>
                </div>

                <!-- Content -->
                <div class="space-y-4">
                    {#if activeTab === "link"}
                        <div class="space-y-2">
                            <label
                                class="block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                                Direct Link (Read Only)
                            </label>
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    readonly
                                    value={shareUrl}
                                    class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-indigo-500 select-all"
                                />
                                <button
                                    class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
                                    onclick={() => copyToClipboard(shareUrl)}
                                >
                                    {#if copied}
                                        <Check size={16} />
                                    {:else}
                                        <Copy size={16} />
                                        <span class="ml-1 text-xs">Copy</span>
                                    {/if}
                                </button>
                            </div>
                            <p class="text-[10px] text-gray-500">
                                This link contains the entire diagram source
                                code. It works entirely client-side.
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-2">
                            <label
                                class="block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                                Iframe Embed
                            </label>
                            <div class="relative">
                                <textarea
                                    readonly
                                    value={embedCode}
                                    class="w-full h-24 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-indigo-500 resize-none select-all"
                                ></textarea>
                                <button
                                    class="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
                                    title="Copy Code"
                                    onclick={() => copyToClipboard(embedCode)}
                                >
                                    {#if copied}
                                        <Check
                                            size={14}
                                            class="text-green-500"
                                        />
                                    {:else}
                                        <Copy size={14} />
                                    {/if}
                                </button>
                            </div>
                            <p class="text-[10px] text-gray-500">
                                Paste this code into your website, notion, or
                                blog to embed a live preview.
                            </p>
                        </div>

                        <div
                            class="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700"
                        >
                            <label
                                class="block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                                Markdown Link
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    readonly
                                    value={`[View Diagram](${shareUrl})`}
                                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-indigo-500 select-all pr-10"
                                />
                                <button
                                    class="absolute top-1 right-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
                                    title="Copy Markdown"
                                    onclick={() =>
                                        copyToClipboard(
                                            `[View Diagram](${shareUrl})`,
                                        )}
                                >
                                    {#if copied}
                                        <Check
                                            size={14}
                                            class="text-green-500"
                                        />
                                    {:else}
                                        <Copy size={14} />
                                    {/if}
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
