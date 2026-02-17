<script lang="ts">
    import type { NodePath } from "../types";

    interface Props {
        data: any;
        onNavigate?: (path: NodePath) => void;
    }

    let { data, onNavigate }: Props = $props();

    function isObject(val: any): boolean {
        return val !== null && typeof val === "object" && !Array.isArray(val);
    }

    function isArray(val: any): boolean {
        return Array.isArray(val);
    }

    function getTypeLabel(val: unknown): string {
        if (isArray(val)) return `[${(val as unknown[]).length}]`;
        if (isObject(val)) return `{${Object.keys(val as object).length}}`;
        return typeof val;
    }

    function getTypeColor(val: any): string {
        if (isArray(val)) return "text-purple-500";
        if (isObject(val)) return "text-blue-500";
        return "text-slate-400";
    }
</script>

<div
    class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-56"
>
    <div class="p-3 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-medium text-slate-700 dark:text-slate-200 text-sm">
            Structure
        </h3>
    </div>

    <div class="flex-1 overflow-auto p-2 text-xs">
        {#if data && typeof data === "object"}
            <ul class="space-y-0.5">
                {#each Object.entries(data) as [key, value]}
                    <li>
                        <button
                            class="w-full text-left px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-between gap-1 transition-colors"
                            onclick={() => onNavigate?.([key])}
                        >
                            <span
                                class="truncate font-medium text-slate-700 dark:text-slate-300"
                                >{key}</span
                            >
                            <span class={getTypeColor(value)}
                                >{getTypeLabel(value)}</span
                            >
                        </button>

                        {#if isObject(value) && Object.keys(value as Record<string, unknown>).length > 0}
                            <ul
                                class="pl-3 border-l border-slate-200 dark:border-slate-700 ml-2 mt-0.5 space-y-0.5"
                            >
                                {#each Object.entries(value as Record<string, unknown>).slice(0, 5) as [subKey, subValue]}
                                    <li>
                                        <button
                                            class="w-full text-left px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-between gap-1 transition-colors"
                                            onclick={() =>
                                                onNavigate?.([key, subKey])}
                                        >
                                            <span
                                                class="truncate text-slate-600 dark:text-slate-400"
                                                >{subKey}</span
                                            >
                                            <span class={getTypeColor(subValue)}
                                                >{getTypeLabel(subValue)}</span
                                            >
                                        </button>
                                    </li>
                                {/each}
                                {#if Object.keys(value as Record<string, unknown>).length > 5}
                                    <li
                                        class="text-slate-400 px-2 py-0.5 italic"
                                    >
                                        +{Object.keys(
                                            value as Record<string, unknown>,
                                        ).length - 5} more
                                    </li>
                                {/if}
                            </ul>
                        {/if}
                    </li>
                {/each}
            </ul>
        {:else}
            <div class="text-slate-400 italic p-2">Empty document</div>
        {/if}
    </div>
</div>
