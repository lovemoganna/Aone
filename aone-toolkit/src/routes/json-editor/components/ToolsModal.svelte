<script lang="ts">
    import { Button } from "$lib/components/ui";

    interface Props {
        isOpen: boolean;
        jsonData: any;
        onUpdate: (newData: any) => void;
        onClose: () => void;
    }

    let { isOpen, jsonData, onUpdate, onClose }: Props = $props();
    let toolStatus = $state<{ text: string; type: "success" | "warning" | "error" } | null>(null);

    function sortKeys(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(sortKeys);
        }
        if (obj !== null && typeof obj === "object") {
            return Object.keys(obj)
                .sort()
                .reduce((acc: any, key) => {
                    acc[key] = sortKeys(obj[key]);
                    return acc;
                }, {});
        }
        return obj;
    }

    function cleanData(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(cleanData).filter((value) => value !== null && value !== undefined);
        }
        if (obj !== null && typeof obj === "object") {
            return Object.keys(obj).reduce((acc: any, key) => {
                const value = cleanData(obj[key]);
                if (value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});
        }
        return obj;
    }

    function downloadCsv() {
        if (jsonData === null || jsonData === undefined) {
            toolStatus = { text: "没有可导出的 JSON 数据。", type: "error" };
            return;
        }

        const data = Array.isArray(jsonData) ? jsonData : [jsonData];
        if (data.length === 0) {
            toolStatus = { text: "JSON 数组为空。", type: "error" };
            return;
        }

        const headers = Array.from(
            new Set(
                data.flatMap((row) => (row && typeof row === "object" ? Object.keys(row) : [])),
            ),
        );

        if (headers.length === 0) {
            toolStatus = { text: "CSV 导出需要顶层为包含键的对象。", type: "error" };
            return;
        }

        const csvRows = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        if (value === null || value === undefined) return "";
                        const str = typeof value === "object" ? JSON.stringify(value) : String(value);
                        return `"${str.replace(/"/g, '""')}"`;
                    })
                    .join(","),
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.csv";
        a.click();
        URL.revokeObjectURL(url);
        toolStatus = { text: "已成功下载 CSV 导出文件。", type: "success" };
    }

    async function copyEscaped() {
        if (jsonData === null || jsonData === undefined) {
            toolStatus = { text: "没有可复制的 JSON 数据。", type: "error" };
            return;
        }

        const escaped = JSON.stringify(JSON.stringify(jsonData));
        const content = escaped.slice(1, -1);
        try {
            await navigator.clipboard.writeText(content);
            toolStatus = { text: "已复制转义后的 JSON 字符串。", type: "success" };
        } catch {
            toolStatus = { text: "访问剪贴板失败。", type: "error" };
        }
    }

    function handleUpdate(action: "sort" | "clean") {
        if (jsonData === null || jsonData === undefined) {
            toolStatus = { text: "没有可更新的 JSON 数据。", type: "error" };
            return;
        }

        const newData = action === "sort" ? sortKeys(jsonData) : cleanData(jsonData);
        onUpdate(newData);
        toolStatus = {
            text: action === "sort" ? "已递归排序所有键名。" : "已成功移除所有 null 和 undefined 值。",
            type: "success",
        };
        onClose();
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">JSON 实用工具</h3>
                <button
                    onclick={onClose}
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="关闭 JSON 实用工具"
                    title="关闭"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 18 18" />
                    </svg>
                </button>
            </div>

            <div class="p-4 grid grid-cols-1 gap-3">
                {#if toolStatus}
                    <div
                        class="rounded-md px-3 py-2 text-sm {toolStatus.type === 'error'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                            : toolStatus.type === 'warning'
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'}"
                        role={toolStatus.type === "error" ? "alert" : "status"}
                    >
                        {toolStatus.text}
                    </div>
                {/if}

                <h4 class="text-xs font-semibold text-slate-500 uppercase mt-1">数据结构</h4>
                <Button variant="secondary" onclick={() => handleUpdate("sort")} class="justify-start">
                    <span class="mr-2">A-Z</span> 键名排序 (递归)
                </Button>
                <Button variant="secondary" onclick={() => handleUpdate("clean")} class="justify-start">
                    <span class="mr-2">--</span> 数据清洗 (移除空值)
                </Button>

                <h4 class="text-xs font-semibold text-slate-500 uppercase mt-2">数据导出 / 实用功能</h4>
                <Button variant="secondary" onclick={downloadCsv} class="justify-start">
                    <span class="mr-2">CSV</span> 下载为 CSV
                </Button>
                <Button variant="secondary" onclick={copyEscaped} class="justify-start">
                    <span class="mr-2">\"</span> 复制转义字符串
                </Button>
            </div>
        </div>
    </div>
{/if}
