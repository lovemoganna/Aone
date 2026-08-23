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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close theme modal"
        transition:fade={{ duration: 100 }}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-sm overflow-hidden flex flex-col shadow-2xl"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 10, duration: 120 }}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <h3
                    class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"
                >
                    <Palette size={15} class="text-slate-700 dark:text-slate-300" />
                    Theme Selector
                </h3>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                    title="Close theme modal"
                    aria-label="Close theme modal"
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div
                class="p-4 space-y-4 max-h-[60vh] overflow-y-auto"
            >
                <!-- Theme Select -->
                <div>
                    <span
                        class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                    >Base Theme</span>
                    <div class="grid grid-cols-2 gap-1.5">
                        {#each THEMES as theme}
                            <button
                                class="px-2.5 py-1.5 text-xs rounded border text-left flex items-center justify-between transition-colors {selectedTheme ===
                                theme.value
                                    ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'}"
                                onclick={() => (selectedTheme = theme.value)}
                            >
                                <span>{theme.name}</span>
                                {#if selectedTheme === theme.value}
                                    <Check size={12} strokeWidth={2.5} />
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Custom Colors -->
                <div class="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Color Overrides
                    </span>
                    <div class="flex items-center justify-between">
                        <label for="diagram-theme-background" class="text-xs text-slate-600 dark:text-slate-300 font-medium"
                            >Background</label
                        >
                        <input
                            id="diagram-theme-background"
                            type="color"
                            bind:value={bgColor}
                            class="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <label for="diagram-theme-border" class="text-xs text-slate-600 dark:text-slate-300 font-medium"
                            >Border Color</label
                        >
                        <input
                            id="diagram-theme-border"
                            type="color"
                            bind:value={borderColor}
                            class="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <label for="diagram-theme-font" class="text-xs text-slate-600 dark:text-slate-300 font-medium"
                            >Default Font</label
                        >
                        <input
                            id="diagram-theme-font"
                            type="color"
                            bind:value={fontColor}
                            class="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                        />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between gap-2"
            >
                <button
                    class="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onclick={onClose}
                >
                    Cancel
                </button>
                <button
                    class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    onclick={applyTheme}
                >
                    <RefreshCw size={13} />
                    <span>Apply Theme</span>
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
