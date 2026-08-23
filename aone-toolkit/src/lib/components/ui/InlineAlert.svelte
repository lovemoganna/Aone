<script lang="ts">
    import type { ComponentType } from "svelte";
    import { AlertCircle, AlertTriangle, Info, CheckCircle2, Loader2, X } from "lucide-svelte";

    type AlertType = "error" | "warning" | "info" | "success" | "loading";

    interface Props {
        type: AlertType;
        message: string;
        dismissable?: boolean;
        onDismiss?: () => void;
        class?: string;
    }

    let {
        type,
        message,
        dismissable = true,
        onDismiss,
        class: className = "",
    }: Props = $props();

    const config: Record<AlertType, { icon: ComponentType; classes: string }> = {
        error: {
            icon: AlertCircle,
            classes: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300",
        },
        warning: {
            icon: AlertTriangle,
            classes: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300",
        },
        info: {
            icon: Info,
            classes: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300",
        },
        success: {
            icon: CheckCircle2,
            classes: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300",
        },
        loading: {
            icon: Loader2,
            classes: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300",
        },
    };

    let current = $derived(config[type]);
    let Icon = $derived(current.icon);
</script>

<div
    class="absolute bottom-4 left-4 right-4 p-3.5 border rounded-lg shadow-lg text-sm z-20 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 {current.classes} {className}"
    role={type === "error" ? "alert" : "status"}
    aria-live={type === "error" ? "assertive" : "polite"}
>
    <div class="p-1 shrink-0">
        {#if type === "loading"}
            <Loader2 size={16} class="animate-spin" />
        {:else}
            <Icon size={16} />
        {/if}
    </div>
    <span class="flex-1">{message}</span>
    {#if dismissable && onDismiss}
        <button
            onclick={onDismiss}
            class="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Dismiss"
        >
            <X size={14} />
        </button>
    {/if}
</div>
