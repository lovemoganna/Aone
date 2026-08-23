<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { Palette, X } from "lucide-svelte";
    import { slide } from "svelte/transition";

    const PLANTUML_THEMES = [
        { id: "", name: "Default", colors: ["#FEFECE", "#A80036", "#FFF4E7"] },
        {
            id: "spacelab",
            name: "Spacelab",
            colors: ["#4D82C5", "#E5E5E5", "#333333"],
        },
        {
            id: "united",
            name: "United",
            colors: ["#DD4814", "#F8F8F8", "#333333"],
        },
        {
            id: "plain",
            name: "Plain",
            colors: ["#FFFFFF", "#888888", "#000000"],
        },
        { id: "mars", name: "Mars", colors: ["#E74C3C", "#2C3E50", "#ECF0F1"] },
        {
            id: "cerulean",
            name: "Cerulean",
            colors: ["#2FA4E7", "#EEEEEE", "#333333"],
        },
        {
            id: "superhero",
            name: "Superhero",
            colors: ["#DF691A", "#2B3E50", "#EBEBEB"],
        },
        {
            id: "cyborg",
            name: "Cyborg",
            colors: ["#2A9FD6", "#060606", "#ADAFAE"],
        },
        {
            id: "minty",
            name: "Minty",
            colors: ["#78C2AD", "#F3969A", "#6CC3D5"],
        },
        {
            id: "sketchy",
            name: "Sketchy",
            colors: ["#EEEEEE", "#333333", "#333333"],
        },
    ];

    let isOpen = $state(false);
</script>

{#if diagramStore.mode === "plantuml"}
    <div class="absolute top-3 left-[138px] z-30">
        <!-- Toggle Button -->
        <button
            type="button"
            class="px-2.5 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-md shadow-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onclick={() => (isOpen = !isOpen)}
            title="PlantUML Themes"
        >
            <Palette
                size={13}
                class={diagramStore.pumlTheme ? "text-slate-900 dark:text-white" : "text-slate-400"}
            />
            <span>Theme</span>
        </button>

        <!-- Theme Panel -->
        {#if isOpen}
            <div
                class="absolute top-8 left-0 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3"
                transition:slide={{ duration: 150 }}
            >
                <div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        PlantUML Themes
                    </span>
                    <button
                        type="button"
                        class="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        onclick={() => (isOpen = false)}
                    >
                        <X size={13} />
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-1.5">
                    {#each PLANTUML_THEMES as theme}
                        <button
                            type="button"
                            class="p-2 rounded border transition-colors flex flex-col items-center gap-1.5 {diagramStore.pumlTheme ===
                            theme.id
                                ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400 text-slate-700 dark:text-slate-300'}"
                            onclick={() => {
                                diagramStore.setTheme(theme.id);
                                isOpen = false;
                            }}
                        >
                            <!-- Color Preview -->
                            <div class="flex gap-1">
                                {#each theme.colors as color}
                                    <div
                                        class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10"
                                        style="background-color: {color}"
                                    ></div>
                                {/each}
                            </div>
                            <span class="text-[10px]">
                                {theme.name}
                            </span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
