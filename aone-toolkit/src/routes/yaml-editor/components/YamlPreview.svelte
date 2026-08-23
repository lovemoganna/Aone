<script lang="ts">
    import { CodeBlock } from "$lib/components/ui";

    interface Props {
        value: string;
        data?: any;
    }

    let { value, data }: Props = $props();

    let mode = $state<"yaml" | "json">("yaml");
    let currentCode = $derived.by(() => {
        if (mode === "yaml") {
            return value || "";
        }
        if (data !== undefined) {
            return JSON.stringify(data, null, 2);
        }
        return "";
    });
</script>

<div class="h-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col p-3">
    <div class="flex items-center justify-between pb-2 mb-1 border-b border-slate-200 dark:border-slate-800">
        <div class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            预览与格式转换
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs flex text-xs">
            <button
                type="button"
                class="px-2.5 py-1 rounded-md font-medium transition cursor-pointer {mode === 'yaml'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}"
                onclick={() => (mode = "yaml")}>YAML</button
            >
            <button
                type="button"
                class="px-2.5 py-1 rounded-md font-medium transition cursor-pointer {mode === 'json'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}"
                onclick={() => (mode = "json")}>JSON</button
            >
        </div>
    </div>

    <div class="flex-1 overflow-auto custom-scrollbar">
        <CodeBlock
            code={currentCode}
            language={mode}
            showLineNumbers={true}
            showHeader={false}
            class="!my-0 h-full"
        />
    </div>
</div>
