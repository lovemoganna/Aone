<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";

    interface Props {
        open: boolean;
        onClose: () => void;
    }

    let { open = $bindable(), onClose }: Props = $props();

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && open) {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
    >
        <div class="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <Panel title="键盘快捷键" class="shadow-xl">
                <div class="space-y-4 p-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex flex-col gap-2">
                            <span
                                class="font-semibold text-slate-900 dark:text-slate-100"
                                >常规操作</span
                            >
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>撤销</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >Ctrl+Z</kbd
                                >
                            </div>
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>重做</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >Ctrl+Y</kbd
                                >
                            </div>
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>新建根节点</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >Ctrl+N</kbd
                                >
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <span
                                class="font-semibold text-slate-900 dark:text-slate-100"
                                >导航选择</span
                            >
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>移动选中项</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >↑ ↓</kbd
                                >
                            </div>
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>展开 / 聚焦</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >→</kbd
                                >
                            </div>
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>折叠 / 父节点</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >←</kbd
                                >
                            </div>
                            <div
                                class="flex justify-between text-slate-600 dark:text-slate-400"
                            >
                                <span>编辑节点</span>
                                <kbd
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs"
                                    >Enter</kbd
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="flex justify-end p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                >
                    <Button variant="secondary" onclick={onClose}>关闭</Button>
                </div>
            </Panel>
        </div>
    </div>
{/if}
