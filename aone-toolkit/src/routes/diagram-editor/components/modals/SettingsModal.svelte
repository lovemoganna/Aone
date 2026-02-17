<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { X, Type, Minus, Plus, Monitor } from "lucide-svelte";

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

    function increaseFont() {
        if (diagramStore.fontSize < 32) diagramStore.fontSize++;
    }

    function decreaseFont() {
        if (diagramStore.fontSize > 8) diagramStore.fontSize--;
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onclick={onClose}
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <Monitor size={20} class="text-indigo-500" />
                    Editor Settings
                </h3>
                <button
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6">
                <!-- Font Size -->
                <div>
                    <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                        >Font Size</label
                    >
                    <div class="flex items-center gap-4">
                        <button
                            class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onclick={decreaseFont}
                        >
                            <Minus size={18} />
                        </button>
                        <span class="text-xl font-mono w-12 text-center"
                            >{diagramStore.fontSize}px</span
                        >
                        <button
                            class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onclick={increaseFont}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <!-- Font Family -->
                <div>
                    <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                        >Font Family</label
                    >
                    <div class="space-y-2">
                        {#each FONTS as font}
                            <button
                                class="w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between {diagramStore.fontFamily ===
                                font.value
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}"
                                onclick={() =>
                                    (diagramStore.fontFamily = font.value)}
                            >
                                <span style="font-family: {font.value}"
                                    >{font.name}</span
                                >
                                {#if diagramStore.fontFamily === font.value}
                                    <div
                                        class="w-2 h-2 rounded-full bg-indigo-500"
                                    ></div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- PlantUML Server -->
                <div>
                    <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                        >PlantUML Server URL</label
                    >
                    <input
                        type="text"
                        bind:value={diagramStore.plantumlServerUrl}
                        placeholder="https://www.plantuml.com/plantuml"
                        class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p class="mt-1 text-xs text-gray-500">
                        Use a custom server or invalid proxy if you have privacy
                        concerns.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end"
            >
                <button
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    onclick={() => {
                        diagramStore.saveState();
                        onClose();
                    }}
                >
                    Done
                </button>
            </div>
        </div>
    </div>
{/if}
