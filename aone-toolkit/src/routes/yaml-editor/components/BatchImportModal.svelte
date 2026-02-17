<script lang="ts">
    import { Button, Panel } from "$lib/components/ui";

    interface Props {
        open?: boolean;
        onImport?: (content: string) => void;
        onClose?: () => void;
    }

    let { open = $bindable(false), onImport, onClose }: Props = $props();

    let content = $state("");

    function handleImport() {
        onImport?.(content);
        content = ""; // Reset
    }
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
        <Panel class="w-full max-w-2xl" title="Batch Import YAML">
            <div class="space-y-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Paste your YAML content below. Support standard YAML format.
                </p>

                <textarea
                    bind:value={content}
                    class="w-full h-64 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Paste YAML here..."
                ></textarea>

                <div class="flex justify-end gap-2">
                    <Button variant="ghost" onclick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onclick={handleImport}
                        disabled={!content.trim()}>Import</Button
                    >
                </div>
            </div>
        </Panel>
    </div>
{/if}
