<script lang="ts">
    import type { MountedFile } from "$lib/services/interpreter";
    import { mountFileToDuckDB } from "$lib/services/interpreter";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        HardDrive,
        UploadCloud,
        FileSpreadsheet,
        Copy,
        Check,
        Trash2,
        Database,
        ChevronRight,
        ChevronDown,
        Code2,
        Columns,
        BarChart3
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
    let expandedFiles = $state<Record<string, boolean>>({});

    function toggleExpand(fileId: string) {
        expandedFiles[fileId] = !expandedFiles[fileId];
    }

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
                const { tableName, rowCount, columns } = await mountFileToDuckDB(file);
                const ext = file.name.split(".").pop()?.toLowerCase() || "file";

                const mountedItem: MountedFile = {
                    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    name: file.name,
                    size: file.size,
                    type: ext,
                    tableName,
                    rowCount,
                    columns,
                    fileObject: file,
                    uploadedAt: Date.now()
                };

                onFileMounted?.(mountedItem);
                expandedFiles[mountedItem.id] = true;
                toastStore.success(`文件 ${file.name} 已挂载为「${tableName}」`);
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

    function insertColumn(colName: string) {
        onInsertQuery?.(`"${colName}"`);
        toastStore.success(`已填入字段: ${colName}`);
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 text-xs">
    <!-- Header -->
    <div class="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
            <HardDrive size={13} class="text-slate-400" />
            <span class="font-medium text-slate-800 dark:text-slate-200 text-xs">本地数据集</span>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
            {files.length} 个表
        </span>
    </div>

    <!-- Drag & Drop Zone -->
    <div class="p-2.5 shrink-0">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <label
            ondragover={(e) => { e.preventDefault(); isDragging = true; }}
            ondragleave={() => (isDragging = false)}
            ondrop={(e) => {
                e.preventDefault();
                isDragging = false;
                handleFileUpload(e.dataTransfer?.files || null);
            }}
            class="flex flex-col items-center justify-center p-3.5 border border-dashed rounded-lg cursor-pointer transition-colors {isDragging ? 'border-slate-400 bg-slate-100/70 dark:bg-slate-800/60' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-950/20'}"
        >
            <input
                type="file"
                multiple
                accept=".csv,.tsv,.json,.parquet"
                class="hidden"
                onchange={(e) => handleFileUpload((e.target as HTMLInputElement).files)}
            />
            <UploadCloud size={18} class="text-slate-400 mb-1" />
            <p class="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                {#if isUploading}
                    挂载解析中...
                {:else}
                    点击或拖拽挂载数据集
                {/if}
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5 text-center font-mono">
                CSV · TSV · JSON · Parquet
            </p>
        </label>
    </div>

    <!-- Mounted Files List -->
    <div class="flex-1 overflow-y-auto px-2.5 pb-3 space-y-2 scrollbar-thin">
        {#if files.length === 0}
            <div class="py-10 text-center text-slate-400 dark:text-slate-500">
                <Database size={18} class="mx-auto mb-1.5 opacity-40" />
                <p class="text-xs">暂无挂载文件</p>
                <p class="text-[10px] text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                    挂载后自动解析 Schema 并注册为 DuckDB WASM 虚拟表
                </p>
            </div>
        {:else}
            {#each files as f (f.id)}
                <div class="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                    <!-- Table Header Row -->
                    <div class="p-2.5 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-1.5">
                        <button
                            type="button"
                            onclick={() => toggleExpand(f.id)}
                            class="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer"
                        >
                            {#if expandedFiles[f.id]}
                                <ChevronDown size={13} class="text-slate-400 shrink-0" />
                            {:else}
                                <ChevronRight size={13} class="text-slate-400 shrink-0" />
                            {/if}
                            <FileSpreadsheet size={13} class="text-emerald-500 shrink-0" />
                            <div class="min-w-0 truncate">
                                <div class="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate font-mono" title={f.tableName}>
                                    {f.tableName}
                                </div>
                                <div class="text-[10px] text-slate-400 truncate">
                                    {f.name} · {formatFileSize(f.size)}
                                    {#if f.rowCount !== undefined}
                                        · {f.rowCount} 行
                                    {/if}
                                </div>
                            </div>
                        </button>

                        <div class="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onclick={() => handleCopyTable(f.tableName)}
                                class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                                title="复制表名"
                            >
                                {#if copiedTableName === f.tableName}
                                    <Check size={12} class="text-emerald-500" />
                                {:else}
                                    <Copy size={12} />
                                {/if}
                            </button>
                            <button
                                type="button"
                                onclick={() => onFileRemoved?.(f.id)}
                                class="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="移除挂载"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    <!-- Schema & Actions Body -->
                    {#if expandedFiles[f.id]}
                        <div class="p-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
                            <!-- Column list tree -->
                            {#if f.columns && f.columns.length > 0}
                                <div class="space-y-1">
                                    <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                                        <span class="flex items-center gap-1">
                                            <Columns size={10} /> 字段 Schema ({f.columns.length})
                                        </span>
                                    </div>
                                    <div class="max-h-36 overflow-y-auto space-y-0.5 scrollbar-thin bg-slate-50/60 dark:bg-slate-950/40 p-1 rounded-md border border-slate-100 dark:border-slate-800/60">
                                        {#each f.columns as col}
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <div
                                                onclick={() => insertColumn(col.name)}
                                                class="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer group text-[11px]"
                                                title="点击插入字段名"
                                            >
                                                <span class="font-mono text-slate-700 dark:text-slate-300 truncate font-medium group-hover:text-slate-900 dark:group-hover:text-white">
                                                    {col.name}
                                                </span>
                                                <span class="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 uppercase">
                                                    {col.type || 'TEXT'}
                                                </span>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- Quick SQL actions -->
                            <div class="grid grid-cols-2 gap-1 pt-1">
                                <button
                                    type="button"
                                    onclick={() => onInsertQuery?.(`SELECT * FROM "${f.tableName}" LIMIT 20;`)}
                                    class="py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Code2 size={10} />
                                    <span>查询前 20 行</span>
                                </button>
                                <button
                                    type="button"
                                    onclick={() => onInsertQuery?.(`SUMMARIZE "${f.tableName}";`)}
                                    class="py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <BarChart3 size={10} />
                                    <span>统计概览</span>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</div>
