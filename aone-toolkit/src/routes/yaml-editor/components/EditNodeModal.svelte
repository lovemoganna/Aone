<script lang="ts">
    import { Button, Input, Panel } from "$lib/components/ui";

    interface Props {
        open?: boolean;
        title?: string;
        nodeKey?: string;
        nodeValue?: string | number | boolean;
        isObject?: boolean;
        onSave?: (
            key: string,
            value: any,
            isObject: boolean,
            type: string,
        ) => void;
        isArrayItem?: boolean;
        onClose?: () => void;
    }

    let {
        open = $bindable(false),
        title = "Edit Node",
        nodeKey = "",
        nodeValue = "",
        isObject = false,
        isArrayItem = false,
        onSave,
        onClose,
    }: Props = $props();

    let key = $state("");
    let value = $state("");
    let isObj = $state(false);
    let explicitType = $state("Auto");

    $effect(() => {
        if (open) {
            key = nodeKey || "";
            value = String(nodeValue || "");
            isObj = !!isObject;
            explicitType = "Auto";
        }
    });

    function handleSave() {
        onSave?.(key, value, isObj, explicitType);
    }
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
        <Panel class="w-full max-w-sm" {title}>
            <div class="space-y-4">
                {#if !isArrayItem}
                    <Input
                        label="Key Name"
                        placeholder="Enter key name"
                        bind:value={key}
                    />
                {/if}

                <div class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is-object-check"
                        bind:checked={isObj}
                        class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                        for="is-object-check"
                        class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Is Object/Container
                    </label>
                </div>

                {#if !isObj}
                    <div class="flex flex-col gap-1.5">
                        <div
                            class="text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            Type
                        </div>
                        <select
                            bind:value={explicitType}
                            class="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        >
                            <option value="Auto">Auto (Infer)</option>
                            <option value="String">String</option>
                            <option value="Number">Number</option>
                            <option value="Boolean">Boolean</option>
                        </select>
                    </div>

                    <Input label="Value" placeholder="Enter value" bind:value />
                {/if}

                <div class="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onclick={onClose}>Cancel</Button>
                    <Button variant="primary" onclick={handleSave}>Save</Button>
                </div>
            </div>
        </Panel>
    </div>
{/if}
