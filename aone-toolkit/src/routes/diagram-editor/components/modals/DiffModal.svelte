<script lang="ts">
    import { X, GitCompare } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import DiffViewer from "../../../developer-utilities/components/DiffViewer.svelte";

    let {
        isOpen = $bindable(false),
        onClose,
        originalCode,
        modifiedCode,
    } = $props<{
        isOpen: boolean;
        onClose: () => void;
        originalCode: string;
        modifiedCode: string;
    }>();
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        transition:fade
        onclick={onClose}
        role="presentation"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            transition:slide={{ duration: 200 }}
            onclick={(e) => e.stopPropagation()}
            role="dialog"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <GitCompare size={20} class="text-indigo-500" />
                    Compare Versions
                </h3>
                <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 p-6 overflow-hidden min-h-0">
                <DiffViewer textA={originalCode} textB={modifiedCode} />
            </div>

            <!-- Footer -->
            <div
                class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end shrink-0"
            >
                <button
                    class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                    onclick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
