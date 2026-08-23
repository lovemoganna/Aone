<script lang="ts">
    import { X, AlertTriangle, AlertCircle, Info } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let {
        isOpen = false,
        title = "确认操作",
        message = "确定要继续执行此操作吗？",
        confirmText = "确认",
        cancelText = "取消",
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
        { iconColor: string; button: string }
    > = {
        danger: {
            iconColor: "text-rose-500",
            button: "bg-rose-600 hover:bg-rose-700 text-white",
        },
        warning: {
            iconColor: "text-amber-500",
            button: "bg-amber-600 hover:bg-amber-700 text-white",
        },
        info: {
            iconColor: "text-indigo-500",
            button: "bg-indigo-600 hover:bg-indigo-700 text-white",
        },
    };

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onCancel();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 120 }}
        onclick={onCancel}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
            }
        }}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:scale={{ duration: 150, start: 0.97 }}
            onclick={(e) => e.stopPropagation()}
            role="alertdialog"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80"
            >
                <div class="flex items-center gap-2.5">
                    <div
                        class={`p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 ${variantStyles[variant as keyof typeof variantStyles].iconColor}`}
                    >
                        <AlertTriangle size={16} />
                    </div>
                    <h3
                        class="text-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                        {title}
                    </h3>
                </div>
                <button
                    type="button"
                    onclick={onCancel}
                    class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="关闭"
                    aria-label="关闭"
                >
                    <X size={16} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-5">
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                <button
                    type="button"
                    onclick={onCancel}
                    class="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors font-medium border border-slate-200 dark:border-slate-700"
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onclick={onConfirm}
                    class={`px-3.5 py-1.5 text-xs rounded-md transition-colors font-semibold shadow-2xs ${variantStyles[variant as keyof typeof variantStyles].button}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}
