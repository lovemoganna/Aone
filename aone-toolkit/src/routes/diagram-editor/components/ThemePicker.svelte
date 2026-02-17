<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { Palette, X } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";

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
    <div class="absolute top-4 right-4 z-30">
        <!-- Toggle Button -->
        <button
            class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all"
            onclick={() => (isOpen = !isOpen)}
            title="Theme Picker"
        >
            <Palette
                size={18}
                class={diagramStore.pumlTheme ? "text-indigo-500" : ""}
            />
        </button>

        <!-- Theme Panel -->
        {#if isOpen}
            <div
                class="absolute top-12 right-0 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 space-y-4"
                transition:slide={{ duration: 200 }}
            >
                <div class="flex items-center justify-between">
                    <h4
                        class="text-xs font-bold uppercase tracking-widest text-gray-400"
                    >
                        PlantUML Themes
                    </h4>
                    <button
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"
                        onclick={() => (isOpen = false)}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    {#each PLANTUML_THEMES as theme}
                        <button
                            class="p-3 rounded-xl border transition-all flex flex-col items-center gap-2 {diagramStore.pumlTheme ===
                            theme.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-glow-sm'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'}"
                            onclick={() => {
                                diagramStore.setTheme(theme.id);
                                isOpen = false;
                            }}
                        >
                            <!-- Color Preview -->
                            <div class="flex gap-1">
                                {#each theme.colors as color}
                                    <div
                                        class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                        style="background-color: {color}"
                                    ></div>
                                {/each}
                            </div>
                            <span
                                class="text-[10px] font-medium text-gray-600 dark:text-gray-300"
                            >
                                {theme.name}
                            </span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
