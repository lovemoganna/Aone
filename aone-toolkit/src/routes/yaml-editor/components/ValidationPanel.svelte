<script lang="ts">
    import * as jsyaml from "js-yaml";

    interface Props {
        value: string;
    }

    let { value }: Props = $props();

    let error = $derived.by(() => {
        try {
            jsyaml.load(value);
            return null;
        } catch (e: any) {
            return e.message || "Invalid YAML";
        }
    });
</script>

<div
    class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col max-h-40 overflow-hidden shrink-0"
>
    <div
        class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center"
    >
        <h3
            class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2"
        >
            {#if error}
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                Validation Issues
            {:else}
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                Valid YAML
            {/if}
        </h3>
    </div>
    <div class="overflow-auto p-0">
        {#if error}
            <div
                class="p-3 text-sm text-red-600 dark:text-red-400 font-mono bg-red-50/50 dark:bg-red-900/10"
            >
                {error}
            </div>
        {:else}
            <div class="p-3 text-sm text-slate-400 italic text-center">
                No issues found.
            </div>
        {/if}
    </div>
</div>
