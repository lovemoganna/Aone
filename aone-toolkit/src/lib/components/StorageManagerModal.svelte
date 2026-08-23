<script lang="ts">
    import { onMount } from "svelte";
    import { 
        Database, 
        HardDrive, 
        Download, 
        Upload, 
        Trash2, 
        Check, 
        AlertCircle, 
        X, 
        RefreshCw,
        Layers
    } from "lucide-svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let { isOpen = $bindable(false) } = $props();

    interface StorageKeyInfo {
        key: string;
        sizeBytes: number;
        formattedSize: string;
        category: string;
    }

    let totalBytes = $state(0);
    let totalQuota = 5 * 1024 * 1024; // 5MB standard quota
    let keyList = $state<StorageKeyInfo[]>([]);
    let fileInputEl: HTMLInputElement | null = $state(null);

    function formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function categorizeKey(key: string): string {
        if (key.includes("agent") || key.includes("persona") || key.includes("squad")) return "Agent 工作坊";
        if (key.includes("workflow") || key.includes("orchestration")) return "工作流编排";
        if (key.includes("prompt")) return "提示词中心";
        if (key.includes("snippet")) return "代码片段";
        if (key.includes("sec-") || key.includes("secret")) return "安全治理规则";
        if (key.includes("table") || key.includes("json") || key.includes("yaml")) return "数据编辑器";
        if (key.includes("css-lab")) return "CSS 实验室";
        return "系统配置与缓存";
    }

    function refreshStorageStats() {
        if (typeof window === "undefined") return;
        let sum = 0;
        const keys: StorageKeyInfo[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const val = localStorage.getItem(key) || "";
                const bytes = (key.length + val.length) * 2; // UTF-16
                sum += bytes;
                keys.push({
                    key,
                    sizeBytes: bytes,
                    formattedSize: formatBytes(bytes),
                    category: categorizeKey(key)
                });
            }
        }

        keys.sort((a, b) => b.sizeBytes - a.sizeBytes);
        totalBytes = sum;
        keyList = keys;
    }

    $effect(() => {
        if (isOpen) {
            refreshStorageStats();
        }
    });

    function exportAllBackup() {
        try {
            const backup: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    backup[key] = localStorage.getItem(key) || "";
                }
            }

            const backupData = {
                app: "Aone AI Workflow Toolkit",
                version: "2.0",
                timestamp: Date.now(),
                formattedDate: new Date().toLocaleString(),
                totalKeys: Object.keys(backup).length,
                data: backup
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `aone-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);

            toastStore.success(`已成功备份 ${Object.keys(backup).length} 项工作区数据`);
        } catch (e: any) {
            toastStore.error("备份失败: " + e.message);
        }
    }

    function handleImportFile(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;
        const file = target.files[0];

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);
                if (!parsed.data || typeof parsed.data !== "object") {
                    throw new Error("非法的 Aone 备份文件格式");
                }

                let count = 0;
                for (const [k, v] of Object.entries(parsed.data)) {
                    if (typeof v === "string") {
                        localStorage.setItem(k, v);
                        count++;
                    }
                }

                refreshStorageStats();
                toastStore.success(`已从备份成功还原 ${count} 项数据`);
                if (fileInputEl) fileInputEl.value = "";
            } catch (err: any) {
                toastStore.error("还原失败: " + err.message);
            }
        };
        reader.readAsText(file);
    }

    function deleteKey(key: string) {
        if (!confirm(`确定要删除缓存项 "${key}" 吗？此操作不可逆。`)) return;
        localStorage.removeItem(key);
        refreshStorageStats();
        toastStore.success(`已删除 ${key}`);
    }

    function cleanTemporaryCache() {
        let count = 0;
        const tempPrefixes = ["aone_handoff", "__temp", "vite", "debug_"];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && tempPrefixes.some(p => key.startsWith(p))) {
                localStorage.removeItem(key);
                count++;
            }
        }
        sessionStorage.clear();
        refreshStorageStats();
        toastStore.success(`已安全清理 ${count} 项临时缓存`);
    }
</script>

{#if isOpen}
    <!-- [02] 完善模态框无障碍语义绑定与键盘焦点感知 -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="storage-manager-title"
        onkeydown={(e) => {
            if (e.key === "Escape") isOpen = false;
        }}
    >
        <div
            class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[85vh] overflow-hidden"
        >
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <HardDrive size={20} />
                    </div>
                    <div>
                        <h2 id="storage-manager-title" class="text-base font-bold text-slate-900 dark:text-white">工作区存储与备份中心</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">监控本地浏览器配额、一键全量备份及数据迁移</p>
                    </div>
                </div>
                <!-- [02] 为关闭按钮增加 aria-label、title 与 focus-visible 焦点环 -->
                <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="关闭工作区存储与备份中心"
                    title="关闭对话框"
                    onclick={() => (isOpen = false)}
                >
                    <X size={18} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6 overflow-y-auto flex-1">
                <!-- Usage Meter -->
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-3">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-slate-700 dark:text-slate-300">本地存储占用 (LocalStorage Quota)</span>
                        <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            {formatBytes(totalBytes)} / {formatBytes(totalQuota)} ({((totalBytes / totalQuota) * 100).toFixed(1)}%)
                        </span>
                    </div>

                    <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                            class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                            style="width: {Math.min(100, Math.max(2, (totalBytes / totalQuota) * 100))}%"
                        ></div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 font-semibold text-xs transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        onclick={exportAllBackup}
                    >
                        <Download size={15} />
                        一键导出全部备份 (JSON)
                    </button>

                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        onclick={() => fileInputEl?.click()}
                    >
                        <Upload size={15} />
                        从备份文件还原数据
                    </button>

                    <button
                        type="button"
                        class="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 font-semibold text-xs transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        onclick={cleanTemporaryCache}
                    >
                        <Trash2 size={15} />
                        清理临时数据与会话
                    </button>

                    <input
                        type="file"
                        accept=".json"
                        bind:this={fileInputEl}
                        class="hidden"
                        aria-label="选择工作区备份 JSON 文件"
                        onchange={handleImportFile}
                    />
                </div>

                <!-- Storage Key Breakdown -->
                <div class="space-y-2">
                    <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>存储项明细列表 ({keyList.length} 个键)</span>
                        <button
                            type="button"
                            class="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded"
                            onclick={refreshStorageStats}
                        >
                            <RefreshCw size={11} /> 刷新
                        </button>
                    </div>

                    <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto">
                        {#if keyList.length === 0}
                            <div class="p-4 text-center text-xs text-slate-400">
                                暂无本地数据存储
                            </div>
                        {:else}
                            {#each keyList as item}
                                <div class="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                    <div class="min-w-0 pr-2">
                                        <div class="font-mono text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {item.key}
                                        </div>
                                        <div class="text-[10px] text-slate-400">
                                            {item.category} • {item.formattedSize}
                                        </div>
                                    </div>
                                    <!-- [02] 为单项删除按钮增加明确的 aria-label 与 focus-visible 样式 -->
                                    <button
                                        type="button"
                                        class="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                        onclick={() => deleteKey(item.key)}
                                        aria-label={`删除缓存项 ${item.key}`}
                                        title="删除此项"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
                <button
                    type="button"
                    class="px-4 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-900 transition"
                    onclick={() => (isOpen = false)}
                >
                    关闭
                </button>
            </div>
        </div>
    </div>
{/if}
