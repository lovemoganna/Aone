<script lang="ts">
    import type { Snippet } from "svelte";
    import type { ComponentType } from "svelte";
    import { FileQuestion } from "lucide-svelte";

    type Variant = "default" | "success" | "muted";

    interface Props {
        icon?: ComponentType;
        title?: string;
        description?: string;
        actionLabel?: string;
        onAction?: () => void;
        children?: Snippet;
        compact?: boolean;
        variant?: Variant;
    }

    let {
        icon: Icon = FileQuestion,
        title = "No data yet",
        description = "",
        actionLabel = "",
        onAction,
        children,
        compact = false,
        variant = "default",
    }: Props = $props();

    const variantClasses: Record<Variant, { icon: string; title: string }> = {
        default: {
            icon: "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
            title: "text-slate-700 dark:text-slate-300",
        },
        success: {
            icon: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400",
            title: "text-emerald-700 dark:text-emerald-300",
        },
        muted: {
            icon: "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600",
            title: "text-slate-500 dark:text-slate-400",
        },
    };

    let v = $derived(variantClasses[variant]);
</script>

<div class="flex-1 flex items-center justify-center {compact ? 'p-4' : 'p-8'}">
    <div class="text-center max-w-sm {compact ? 'space-y-2' : 'space-y-4'}">
        <div
            class="mx-auto rounded-2xl flex items-center justify-center {v.icon} {compact ? 'w-10 h-10' : 'w-16 h-16'}"
        >
            <Icon size={compact ? 20 : 28} />
        </div>

        <div class="{compact ? 'space-y-0.5' : 'space-y-1.5'}">
            <h3 class="font-semibold {v.title} {compact ? 'text-xs' : 'text-sm'}">
                {title}
            </h3>
            {#if description}
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                </p>
            {/if}
        </div>

        {#if children}
            {@render children()}
        {:else if actionLabel && onAction}
            <button
                onclick={onAction}
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
                {actionLabel}
            </button>
        {/if}
    </div>
</div>
