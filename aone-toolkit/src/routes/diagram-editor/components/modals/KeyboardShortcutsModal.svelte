<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { X, Keyboard } from "lucide-svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    const shortcuts = [
        { keys: ["Ctrl", "Enter"], action: "Render diagram" },
        { keys: ["Ctrl", "S"], action: "Save snippet" },
        { keys: ["Ctrl", "E"], action: "Export diagram" },
        { keys: ["Ctrl", "T"], action: "Open templates" },
        { keys: ["Ctrl", "F"], action: "Find in code" },
        { keys: ["Ctrl", "H"], action: "Find & Replace" },
        { keys: ["Ctrl", "+"], action: "Zoom in" },
        { keys: ["Ctrl", "-"], action: "Zoom out" },
        { keys: ["Ctrl", "0"], action: "Reset zoom" },
        { keys: ["Escape"], action: "Close modal" },
    ];
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        transition:fade={{ duration: 150 }}
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:scale={{ start: 0.95, duration: 200 }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400"
                    >
                        <Keyboard size={20} />
                    </div>
                    <h2
                        class="text-lg font-bold text-slate-900 dark:text-white"
                    >
                        Keyboard Shortcuts
                    </h2>
                </div>
                <button
                    class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    onclick={onClose}
                >
                    <X size={20} class="text-slate-500" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 max-h-[60vh] overflow-y-auto">
                <div class="space-y-2">
                    {#each shortcuts as shortcut}
                        <div
                            class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                        >
                            <span
                                class="text-sm text-slate-700 dark:text-slate-300"
                                >{shortcut.action}</span
                            >
                            <div class="flex gap-1">
                                {#each shortcut.keys as key}
                                    <kbd
                                        class="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-600 dark:text-slate-400 shadow-sm"
                                    >
                                        {key}
                                    </kbd>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}
