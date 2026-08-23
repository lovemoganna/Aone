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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        transition:fade={{ duration: 100 }}
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close share modal"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:slide={{ duration: 120 }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <h3
                    class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"
                >
                    <Share2 size={15} class="text-slate-700 dark:text-slate-300" />
                    Share Diagram
                </h3>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                    title="Close share modal"
                    aria-label="Close share modal"
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-4">
                <!-- Tabs -->
                <div
                    class="flex gap-4 border-b border-slate-200 dark:border-slate-800"
                >
                    <button
                        class="pb-2 text-xs font-semibold transition-colors relative {activeTab ===
                        'link'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                        onclick={() => (activeTab = "link")}
                    >
                        <div class="flex items-center gap-1.5">
                            <Link size={14} /> Share Link
                        </div>
                        {#if activeTab === "link"}
                            <div
                                class="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-slate-100"
                                transition:fade
                            ></div>
                        {/if}
                    </button>
                    <button
                        class="pb-2 text-xs font-semibold transition-colors relative {activeTab ===
                        'embed'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                        onclick={() => (activeTab = "embed")}
                    >
                        <div class="flex items-center gap-1.5">
                            <Code size={14} /> Embed Code
                        </div>
                        {#if activeTab === "embed"}
                            <div
                                class="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-slate-100"
                                transition:fade
                            ></div>
                        {/if}
                    </button>
                </div>

                <!-- Content -->
                <div class="space-y-3">
                    {#if activeTab === "link"}
                        <div class="space-y-1.5">
                            <label
                                for="diagram-share-url"
                                class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                            >
                                Direct Link (Read Only)
                            </label>
                            <div class="flex gap-2">
                                <input
                                    id="diagram-share-url"
                                    type="text"
                                    readonly
                                    value={shareUrl}
                                    class="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300 outline-none select-all"
                                />
                                <button
                                    class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                                    onclick={() => copyToClipboard(shareUrl)}
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
                            <p class="text-[10px] text-slate-400">
                                This link contains the entire diagram source code and loads client-side.
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-1.5">
                            <label
                                for="diagram-embed-code"
                                class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                            >
                                HTML Embed Snippet
                            </label>
                            <div class="flex gap-2">
                                <textarea
                                    id="diagram-embed-code"
                                    readonly
                                    rows="3"
                                    value={embedCode}
                                    class="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300 outline-none select-all resize-none"
                                ></textarea>
                                <button
                                    class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 self-start shadow-xs"
                                    onclick={() => copyToClipboard(embedCode)}
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
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
