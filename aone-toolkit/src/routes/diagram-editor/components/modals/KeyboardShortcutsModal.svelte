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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        transition:fade={{ duration: 100 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        tabindex="-1"
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:scale={{ start: 0.97, duration: 120 }}
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <div class="flex items-center gap-2">
                    <Keyboard size={15} class="text-slate-700 dark:text-slate-300" />
                    <h2
                        id="shortcuts-modal-title"
                        class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
                    >
                        Keyboard Shortcuts
                    </h2>
                </div>
                <button
                    type="button"
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                    aria-label="关闭快捷键速查"
                    title="关闭"
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 max-h-[60vh] overflow-y-auto">
                <div class="space-y-1.5">
                    {#each shortcuts as shortcut}
                        <div
                            class="flex items-center justify-between p-2 bg-slate-50/60 dark:bg-slate-900/50 rounded border border-slate-200/60 dark:border-slate-800/80"
                        >
                            <span
                                class="text-xs text-slate-700 dark:text-slate-300 font-medium"
                                >{shortcut.action}</span
                            >
                            <div class="flex gap-1">
                                {#each shortcut.keys as key}
                                    <kbd
                                        class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
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
