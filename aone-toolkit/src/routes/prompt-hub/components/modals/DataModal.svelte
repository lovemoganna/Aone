<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        X,
        Download,
        Upload,
        Database,
        AlertCircle,
        FileJson,
        CheckCircle2,
        Layers,
        Tag as TagIcon,
        Folder
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let importMode = $state<"merge" | "replace">("merge");
    let fileInput = $state<HTMLInputElement | null>(null);
    let importError = $state<string | null>(null);
    let selectedFileName = $state<string | null>(null);
    let pendingData = $state<any | null>(null);

    function handleExport() {
        const json = promptStore.exportData();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prompthub-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastStore.success("已成功导出提示词备份文件");
    }

    function handleFileSelected(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        selectedFileName = file.name;
        importError = null;
        pendingData = null;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
                    throw new Error("无效的备份文件：未包含有效的 prompts 列表");
                }
                pendingData = {
                    raw: content,
                    promptCount: parsed.prompts.length,
                    tagCount: parsed.tags?.length || 0,
                    collectionCount: parsed.collections?.length || 0,
                };
            } catch (err: any) {
                importError = err.message || "JSON 文件解析失败";
            }
        };
        reader.readAsText(file);
    }

    function confirmImport() {
        if (!pendingData?.raw) return;

        try {
            const result = promptStore.importData(pendingData.raw, importMode);
            if (result.success) {
                toastStore.success(
                    importMode === "merge"
                        ? `已成功合并导入 ${pendingData.promptCount} 个提示词！`
                        : `已成功替换导入 ${pendingData.promptCount} 个提示词！`
                );
                onClose();
                pendingData = null;
                selectedFileName = null;
            } else {
                importError = result.error || "导入失败";
            }
        } catch (err: any) {
            importError = err.message || "导入过程发生错误";
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        transition:fade={{ duration: 120 }}
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
            transition:scale={{ duration: 150, start: 0.97 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80"
            >
                <div class="flex items-center gap-2.5">
                    <div class="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
                        <Database size={16} />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            数据导入与导出
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            本地提示词库的备份、迁移与合并管理
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onclick={onClose}
                    title="关闭"
                    aria-label="关闭"
                >
                    <X size={16} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-5 space-y-6 overflow-y-auto max-h-[75vh]">
                <!-- 统计快照 -->
                <div class="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
                    <div class="flex items-center gap-2">
                        <Layers size={14} class="text-indigo-500" />
                        <div>
                            <span class="text-slate-400 block text-[10px]">当前提示词</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">{promptStore.prompts.length} 个</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <Folder size={14} class="text-emerald-500" />
                        <div>
                            <span class="text-slate-400 block text-[10px]">分类集合</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">{promptStore.collections.length} 个</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <TagIcon size={14} class="text-amber-500" />
                        <div>
                            <span class="text-slate-400 block text-[10px]">标签体系</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">{promptStore.tags.length} 个</span>
                        </div>
                    </div>
                </div>

                <!-- 导出模块 -->
                <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Download size={14} class="text-slate-500" />
                        导出备份
                    </h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        将当前全部提示词、标签分类、集合与版本历史打包下载为标准 JSON 格式文件。
                    </p>
                    <button
                        type="button"
                        onclick={handleExport}
                        class="w-full py-2 px-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                        <FileJson size={14} class="text-indigo-500" />
                        下载 JSON 完整数据备份
                    </button>
                </div>

                <div class="h-px bg-slate-200 dark:bg-slate-800"></div>

                <!-- 导入模块 -->
                <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Upload size={14} class="text-slate-500" />
                        导入数据
                    </h4>

                    <!-- 模式选择 -->
                    <div class="grid grid-cols-2 gap-2">
                        <label
                            class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors {importMode === 'merge' ? 'border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'}"
                        >
                            <input
                                type="radio"
                                bind:group={importMode}
                                value="merge"
                                class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <span class="text-xs font-medium text-slate-800 dark:text-slate-200 block">合并导入 (推荐)</span>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                                    保留本地现有条目，仅增量补全
                                </span>
                            </div>
                        </label>

                        <label
                            class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors {importMode === 'replace' ? 'border-rose-500/60 bg-rose-50/50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'}"
                        >
                            <input
                                type="radio"
                                bind:group={importMode}
                                value="replace"
                                class="mt-0.5 text-rose-600 focus:ring-rose-500"
                            />
                            <div>
                                <span class="text-xs font-medium text-rose-700 dark:text-rose-300 block">覆写替换</span>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                                    清空本地数据，完全使用文件内容
                                </span>
                            </div>
                        </label>
                    </div>

                    <!-- 文件选择框 -->
                    <div>
                        <input
                            id="prompt-data-file"
                            type="file"
                            accept=".json"
                            bind:this={fileInput}
                            onchange={handleFileSelected}
                            class="hidden"
                        />
                        <button
                            type="button"
                            onclick={() => fileInput?.click()}
                            class="w-full py-2.5 px-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Upload size={14} />
                            <span>{selectedFileName ? `已选择: ${selectedFileName}` : "选择或拖放 JSON 备份文件"}</span>
                        </button>
                    </div>

                    <!-- 解析预览与确认 -->
                    {#if pendingData}
                        <div class="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                            <div class="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                                <CheckCircle2 size={14} />
                                <span>文件校验成功：包含 {pendingData.promptCount} 个 Prompt，{pendingData.tagCount} 个标签</span>
                            </div>
                            <button
                                type="button"
                                onclick={confirmImport}
                                class="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
                            >
                                确认{importMode === 'merge' ? '合并' : '覆写'}并应用到当前库
                            </button>
                        </div>
                    {/if}

                    {#if importError}
                        <div
                            class="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
                        >
                            <AlertCircle size={14} class="shrink-0" />
                            <span>{importError}</span>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
