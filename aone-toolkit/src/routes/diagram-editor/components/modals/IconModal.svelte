<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Search, X, Grid, Info } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { isOpen = $bindable(false), onSelect } = $props<{
        isOpen: boolean;
        onSelect: (icon: string) => void;
    }>();

    let searchTerm = $state("");

    // PlantUML OpenIconic set (subset)
    const ICONS = [
        "account-login",
        "account-logout",
        "action-redo",
        "action-undo",
        "align-center",
        "align-left",
        "align-right",
        "aperture",
        "arrow-bottom",
        "arrow-circle-bottom",
        "arrow-circle-left",
        "arrow-circle-right",
        "arrow-circle-top",
        "arrow-left",
        "arrow-right",
        "arrow-thick-bottom",
        "arrow-thick-left",
        "arrow-thick-right",
        "arrow-thick-top",
        "arrow-top",
        "audio-spectrum",
        "badge",
        "ban",
        "bar-chart",
        "basket",
        "battery-empty",
        "battery-full",
        "beaker",
        "bell",
        "bluetooth",
        "bold",
        "book",
        "bookmark",
        "box",
        "briefcase",
        "british-pound",
        "browser",
        "brush",
        "bug",
        "bullhorn",
        "calculator",
        "calendar",
        "camera-slr",
        "caret-bottom",
        "caret-left",
        "caret-right",
        "caret-top",
        "cart",
        "chat",
        "check",
        "chevron-bottom",
        "chevron-left",
        "chevron-right",
        "chevron-top",
        "circle-check",
        "circle-x",
        "clipboard",
        "clock",
        "cloud",
        "cloud-download",
        "cloud-upload",
        "code",
        "cog",
        "collapse-down",
        "collapse-left",
        "collapse-right",
        "collapse-up",
        "command",
        "comment-square",
        "compass",
        "contrast",
        "copywriting",
        "credit-card",
        "crop",
        "dashboard",
        "data-transfer-download",
        "data-transfer-upload",
        "delete",
        "dial",
        "document",
        "dollar",
        "double-quote-sans-left",
        "double-quote-sans-right",
        "double-quote-serif-left",
        "double-quote-serif-right",
        "droplet",
        "eject",
        "elevator",
        "ellipses",
        "envelope-closed",
        "envelope-open",
        "euro",
        "excerpt",
        "expand-down",
        "expand-left",
        "expand-right",
        "expand-up",
        "external-link",
        "eye",
        "file",
        "fire",
        "flag",
        "flash",
        "folder",
        "fork",
        "fullscreen-enter",
        "fullscreen-exit",
        "globe",
        "graph",
        "grid-four-up",
        "grid-three-up",
        "grid-two-up",
        "hard-drive",
        "header",
        "headphones",
        "heart",
        "home",
        "image",
        "inbox",
        "infinity",
        "info",
        "italic",
        "justify-center",
        "justify-left",
        "justify-right",
        "key",
        "laptop",
        "layers",
        "lightbulb",
        "link-broken",
        "link-intact",
        "list",
        "list-rich",
        "location",
        "lock-locked",
        "lock-unlocked",
        "loop",
        "loop-circular",
        "magnifying-glass",
        "map",
        "map-marker",
        "media-pause",
        "media-play",
        "media-record",
        "media-skip-backward",
        "media-skip-forward",
        "media-step-backward",
        "media-step-forward",
        "media-stop",
        "medical-cross",
        "menu",
        "microphone",
        "minus",
        "monitor",
        "moon",
        "move",
        "musical-note",
        "paperclip",
        "pencil",
        "people",
        "person",
        "phone",
        "pie-chart",
        "pin",
        "play-circle",
        "plus",
        "power-standby",
        "print",
        "project",
        "pulse",
        "puzzle-piece",
        "question-mark",
        "rain",
        "random",
        "reload",
        "resize-both",
        "resize-height",
        "resize-width",
        "rss",
        "rss-alt",
        "script",
        "share",
        "share-boxed",
        "shield",
        "signal",
        "signpost",
        "spreadsheet",
        "star",
        "sun",
        "tablet",
        "tag",
        "tags",
        "target",
        "task",
        "terminal",
        "text",
        "thumb-down",
        "thumb-up",
        "timer",
        "transfer",
        "trash",
        "underline",
        "vertical-align-bottom",
        "vertical-align-center",
        "vertical-align-top",
        "video",
        "volume-high",
        "volume-low",
        "volume-off",
        "warning",
        "wifi",
        "wrench",
        "x",
        "yen",
        "zoom-in",
        "zoom-out",
    ];

    let filteredIcons = $derived(
        ICONS.filter((icon) =>
            icon.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    function close() {
        isOpen = false;
        searchTerm = "";
    }

    function select(icon: string) {
        onSelect(icon);
        close();
    }

    function autofocus(node: HTMLElement) {
        node.focus();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        transition:fade={{ duration: 150 }}
        onclick={close}
        onkeydown={(e) => e.key === "Escape" && close()}
        role="button"
        tabindex="0"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <!-- Header -->
            <div
                class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
                <div
                    class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
                >
                    <Grid size={20} />
                    <h2 class="font-bold text-lg">Icon Browser</h2>
                </div>
                <button
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                    onclick={close}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Search -->
            <div
                class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
            >
                <div class="relative">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Search icons..."
                        class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        use:autofocus
                    />
                </div>
                <div class="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    <span
                        >Click to insert PlantUML OpenIconic syntax (e.g.,
                        &lt;&wifi&gt;)</span
                    >
                </div>
            </div>

            <!-- Grid -->
            <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div
                    class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2"
                >
                    {#each filteredIcons as icon}
                        <button
                            class="flex flex-col items-center justify-center gap-2 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 group"
                            onclick={() => select(icon)}
                            title={icon}
                        >
                            <!-- We don't render actual OpenIconic svgs here as it requires custom svg paths, 
                                 so we use a placeholder or generic icon for now, 
                                 OR we could map common ones to Lucide. 
                                 For PRO MAX: Just showing the name is safe, or a generic block. -->
                            <div
                                class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-mono text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:text-indigo-600 shadow-sm"
                            >
                                &lt;&&gt;
                            </div>
                            <span
                                class="text-[10px] truncate w-full text-center opacity-70 group-hover:opacity-100"
                                >{icon}</span
                            >
                        </button>
                    {/each}
                </div>

                {#if filteredIcons.length === 0}
                    <div class="text-center py-12 text-gray-400">
                        No icons found for "{searchTerm}"
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 3px;
    }
</style>
