<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { fade, fly } from "svelte/transition";
    import { X, Palette, Check, RefreshCw } from "lucide-svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    const THEMES = [
        { name: "None", value: "" },
        { name: "Materia", value: "!theme materia" },
        { name: "C4 (Classic)", value: "!theme C4_v1 from <C4/C4>" },
        { name: "Blueprint", value: "!theme blueprint" },
        { name: "Sandvik", value: "!theme sandvik" },
        { name: "Silver", value: "!theme silver" },
        { name: "Cerulean", value: "!theme cerulean" },
    ];

    let selectedTheme = $state(THEMES[0].value);
    let bgColor = $state("#ffffff");
    let borderColor = $state("#333333");
    let fontColor = $state("#000000");

    function applyTheme() {
        let code = diagramStore.code;

        // Remove existing theme/skinparam blocks if any (simplified heuristic)
        code = code.replace(/!theme\s+[^\n]+\n/g, "");
        code = code.replace(/skinparam\s+backgroundColor\s+[^\n]+\n/g, "");
        code = code.replace(/skinparam\s+defaultFontColor\s+[^\n]+\n/g, "");
        code = code.replace(/skinparam\s+defaultBorderColor\s+[^\n]+\n/g, "");

        let injection = "";
        if (selectedTheme) injection += `${selectedTheme}\n`;
        if (bgColor !== "#ffffff")
            injection += `skinparam backgroundColor ${bgColor}\n`;
        if (fontColor !== "#000000")
            injection += `skinparam defaultFontColor ${fontColor}\n`;
        if (borderColor !== "#333333")
            injection += `skinparam defaultBorderColor ${borderColor}\n`;

        if (injection) {
            // Inject after @startuml
            const startMatch = code.match(/@startuml/);
            if (startMatch) {
                const pos = startMatch.index! + startMatch[0].length;
                code = code.slice(0, pos) + "\n" + injection + code.slice(pos);
            } else {
                code = injection + code;
            }
        }

        diagramStore.code = code;
        diagramStore.render();
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
        onclick={onClose}
        transition:fade={{ duration: 300 }}
    >
        <div
            class="glass-pro rounded-2xl w-full max-w-sm overflow-hidden flex flex-col transition-all duration-700"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 20, duration: 400 }}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-white/10"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <div class="p-1.5 bg-indigo-500/20 rounded-lg glow-premium">
                        <Palette size={18} class="text-indigo-400" />
                    </div>
                    Theme Engine
                </h3>
                <button
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div
                class="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar"
            >
                <!-- Theme Select -->
                <div>
                    <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >Base Theme</label
                    >
                    <div class="grid grid-cols-2 gap-2">
                        {#each THEMES as theme}
                            <button
                                class="px-3 py-2 text-xs rounded-lg border text-left flex items-center justify-between {selectedTheme ===
                                theme.value
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-400'}"
                                onclick={() => (selectedTheme = theme.value)}
                            >
                                {theme.name}
                                {#if selectedTheme === theme.value}<Check
                                        size={12}
                                    />{/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Custom Colors -->
                <div class="space-y-4 pt-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-medium text-gray-500"
                            >Background</label
                        >
                        <input
                            type="color"
                            bind:value={bgColor}
                            class="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-medium text-gray-500"
                            >Border Color</label
                        >
                        <input
                            type="color"
                            bind:value={borderColor}
                            class="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-medium text-gray-500"
                            >Default Font</label
                        >
                        <input
                            type="color"
                            bind:value={fontColor}
                            class="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                        />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between gap-3"
            >
                <button
                    class="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onclick={onClose}
                >
                    Cancel
                </button>
                <button
                    class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all glow-premium active:scale-95"
                    onclick={applyTheme}
                >
                    <RefreshCw size={16} />
                    Apply Changes
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
</style>
