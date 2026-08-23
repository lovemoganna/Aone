<script lang="ts">
    import type { MountedFile } from "$lib/services/interpreter";
    import { mountFileToDuckDB } from "$lib/services/interpreter";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        HardDrive,
        UploadCloud,
        FileSpreadsheet,
        FileCode2,
        Copy,
        Check,
        Trash2,
        Plus,
        Database,
        Sparkles
    } from "lucide-svelte";

    interface Props {
        files: MountedFile[];
        onFileMounted?: (file: MountedFile) => void;
        onFileRemoved?: (fileId: string) => void;
        onInsertQuery?: (sql: string) => void;
    }

    let { files = [], onFileMounted, onFileRemoved, onInsertQuery }: Props = $props();

    let isDragging = $state(false);
    let isUploading = $state(false);
    let copiedTableName = $state<string | null>(null);

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    async function handleFileUpload(fileList: FileList | null) {
        if (!fileList || fileList.length === 0) return;
        isUploading = true;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            try {
                const tableName = await mountFileToDuckDB(file);
                const ext = file.name.split(".").pop()?.toLowerCase() || "file";

                const mountedItem: MountedFile = {
                    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    name: file.name,
                    size: file.size,
                    type: ext,
                    tableName,
                    fileObject: file,
                    uploadedAt: Date.now()
                };

                onFileMounted?.(mountedItem);
                toastStore.success(`文件 ${file.name} 已成功挂载为虚拟表「${tableName}」`);
            } catch (err: any) {
                toastStore.error(`挂载文件 ${file.name} 失败: ${err?.message || String(err)}`);
            }
        }
        isUploading = false;
    }

    async function handleCopyTable(name: string) {
        const ok = await copyToClipboard(name);
        if (ok) {
            copiedTableName = name;
            toastStore.success(`已复制表名: ${name}`);
            setTimeout(() => (copiedTableName = null), 2000);
        }
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-xs">
    <!-- Header -->
    <div class="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <HardDrive size={14} class="text-slate-500" />
            <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs">本地数据集挂载</span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px]">
            {files.length} 个文件
        </span>
    </div>

    <!-- Drag & Drop Zone -->
    <div class="p-3">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <label
            ondragover={(e) => { e.preventDefault(); isDragging = true; }}
            ondragleave={() => (isDragging = false)}
            ondrop={(e) => {
                e.preventDefault();
                isDragging = false;
                handleFileUpload(e.dataTransfer?.files || null);
            }}
            class="flex flex-col items-center justify-center p-3.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors {isDragging ? 'border-slate-500 bg-slate-100/50 dark:bg-slate-800/50' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-950/20'}"
        >
            <input
                type="file"
                multiple
                accept=".csv,.tsv,.json,.parquet"
                class="hidden"
                onchange={(e) => handleFileUpload((e.target as HTMLInputElement).files)}
            />
            <UploadCloud size={20} class="text-slate-400 dark:text-slate-500 mb-1" />
            <p class="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                点击或拖拽文件到此处挂载
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5 text-center font-mono">
                CSV, TSV, JSON, Parquet
            </p>
        </label>
    </div>

    <!-- Mounted Files List -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {#if files.length === 0}
            <div class="py-8 text-center text-slate-400 dark:text-slate-500">
                <Database size={20} class="mx-auto mb-1.5 opacity-40" />
                <p class="text-xs">暂无挂载文件</p>
                <p class="text-[10px] text-slate-400 mt-0.5">挂载后可直接在 DuckDB SQL 中使用表名秒级查询</p>
            </div>
        {:else}
            {#each files as f (f.id)}
                <div class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 truncate">
                            <FileSpreadsheet size={13} class="text-emerald-500 shrink-0" />
                            <span class="font-medium text-slate-800 dark:text-slate-200 truncate text-xs" title={f.name}>
                                {f.name}
                            </span>
                        </div>
                        <button
                            onclick={() => onFileRemoved?.(f.id)}
                            class="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="移除挂载"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div class="flex items-center justify-between text-[11px] text-slate-500">
                        <span class="font-mono text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[140px]" title={f.tableName}>
                            表: {f.tableName}
                        </span>
                        <span class="font-mono text-[10px]">{formatFileSize(f.size)}</span>
                    </div>

                    <div class="flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                            onclick={() => handleCopyTable(f.tableName)}
                            class="flex-1 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-[10px] cursor-pointer shadow-2xs"
                        >
                            {#if copiedTableName === f.tableName}
                                <Check size={10} class="text-emerald-500" />
                                <span>已复制</span>
                            {:else}
                                <Copy size={10} />
                                <span>复制表名</span>
                            {/if}
                        </button>

                        <button
                            onclick={() => onInsertQuery?.(`SELECT * FROM "${f.tableName}" LIMIT 20;`)}
                            class="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[10px] cursor-pointer shadow-2xs"
                            title="插入快速查询 SQL"
                        >
                            <Sparkles size={10} />
                            <span>生成查询</span>
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
