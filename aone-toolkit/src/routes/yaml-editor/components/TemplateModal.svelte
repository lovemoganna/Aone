<script lang="ts">
    import { Button, Input, Panel } from "$lib/components/ui";

    interface Props {
        open: boolean;
        initialName?: string;
        initialContent?: string;
        onSave: (name: string, content: string) => void;
        onClose: () => void;
    }

    let {
        open,
        initialName = "",
        initialContent = "",
        onSave,
        onClose,
    }: Props = $props();

    let name = $state("");
    let content = $state("");

    $effect(() => {
        if (open) {
            name = initialName;
            content = initialContent;
        }
    });

    function handleSave() {
        if (!name.trim()) return alert("Name is required");
        onSave(name, content);
        onClose();
    }
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
        <div
            class="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        >
            <div
                class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800"
            >
                <h3
                    class="text-lg font-semibold text-slate-800 dark:text-slate-200"
                >
                    {initialName ? "Edit Template" : "New Template"}
                </h3>
                <button
                    onclick={onClose}
                    class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-x"
                        ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                    >
                </button>
            </div>

            <div class="p-4 space-y-4 flex-1 overflow-auto">
                <div class="space-y-1.5">
                    <div
                        class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Name
                    </div>
                    <Input bind:value={name} placeholder="Template Name" />
                </div>

                <div class="space-y-1.5 flex flex-col h-64">
                    <div
                        class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Content
                    </div>
                    <textarea
                        bind:value={content}
                        class="flex-1 w-full p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="YAML Content..."
                    ></textarea>
                </div>
            </div>

            <div
                class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2"
            >
                <Button variant="ghost" onclick={onClose}>Cancel</Button>
                <Button onclick={handleSave}>Save</Button>
            </div>
        </div>
    </div>
{/if}
