<script lang="ts">
    import { X, AlertTriangle } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let {
        isOpen = false,
        title = "Confirm Action",
        message = "Are you sure you want to proceed?",
        confirmText = "Confirm",
        cancelText = "Cancel",
        variant = "danger",
        onConfirm,
        onCancel,
    } = $props<{
        isOpen: boolean;
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "danger" | "warning" | "info";
        onConfirm: () => void;
        onCancel: () => void;
    }>();

    const variantStyles: Record<
        "danger" | "warning" | "info",
        { icon: string; button: string }
    > = {
        danger: {
            icon: "text-red-500",
            button: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: "text-amber-500",
            button: "bg-amber-600 hover:bg-amber-700",
        },
        info: {
            icon: "text-blue-500",
            button: "bg-blue-600 hover:bg-blue-700",
        },
    };

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onCancel();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        transition:fade={{ duration: 150 }}
        onclick={onCancel}
        role="dialog"
        aria-modal="true"
    >
        <!-- Modal -->
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            transition:scale={{ duration: 150, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
            role="alertdialog"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${variantStyles[variant as keyof typeof variantStyles].icon}`}
                    >
                        <AlertTriangle size={20} />
                    </div>
                    <h3
                        class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        {title}
                    </h3>
                </div>
                <button
                    onclick={onCancel}
                    class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X size={18} class="text-gray-500" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-5">
                <p class="text-gray-600 dark:text-gray-300">{message}</p>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 p-5 pt-0">
                <button
                    onclick={onCancel}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                    {cancelText}
                </button>
                <button
                    onclick={onConfirm}
                    class={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${variantStyles[variant as keyof typeof variantStyles].button}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}
