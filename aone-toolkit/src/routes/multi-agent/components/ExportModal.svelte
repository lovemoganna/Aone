<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { ExportService } from "$lib/services/ExportService";
    import type { ExportFormat } from "$lib/services/ExportService";
    import { slide, fade } from "svelte/transition";
    import {
        X,
        FileText,
        Code2,
        Globe,
        BookOpen,
        Download,
        Eye,
        Settings2,
    } from "lucide-svelte";
    import { CodeBlock } from "$lib/components/ui";

    let { open = $bindable(false) } = $props();
    let selectedFormat = $state<ExportFormat>("markdown");
    let includeTimestamps = $state(true);
    let includePrompts = $state(false);

    const FORMATS: { key: ExportFormat; label: string; icon: any }[] = [
        { key: "markdown", label: "Markdown", icon: FileText },
        { key: "txt", label: "Plain Text", icon: Code2 },
        { key: "html", label: "HTML", icon: Globe },
        { key: "org", label: "Org Mode", icon: BookOpen },
    ];

    function get内容预览(): string {
        const messages = agentStore.currentSession.messages;
        const goal = agentStore.pipelineState.currentGoal;
        let content = "";

        switch (selectedFormat) {
            case "markdown":
                content = ExportService.generateMarkdown(messages, goal);
                break;
            case "txt":
                content = ExportService.generateTxt(messages, goal);
                break;
            case "html":
                content = ExportService.generateHtml(messages, goal);
                break;
            case "org":
                content = ExportService.generateOrg(messages, goal);
                break;
        }
        return (
            content.substring(0, 500) + (content.length > 500 ? "\n..." : "")
        );
    }

    function handleDownload() {
        const messages = agentStore.currentSession.messages;
        const goal = agentStore.pipelineState.currentGoal;
        let content = "";

        switch (selectedFormat) {
            case "markdown":
                content = ExportService.generateMarkdown(messages, goal);
                break;
            case "txt":
                content = ExportService.generateTxt(messages, goal);
                break;
            case "html":
                content = ExportService.generateHtml(messages, goal);
                break;
            case "org":
                content = ExportService.generateOrg(messages, goal);
                break;
        }
        ExportService.download(content, selectedFormat);
        open = false;
    }

    function handleBackdrop(e: MouseEvent) {
        if (e.target === e.currentTarget) open = false;
    }
</script>

{#if open}
    <!-- [01] 增强导出报告模态框的无障碍绑定、375px 窄屏容器适配与网格响应式 -->
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabindex="-1"
        onclick={handleBackdrop}
    >
        <div
            class="w-full max-w-[520px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800"
            >
                <div>
                    <h2
                        id="export-modal-title"
                        class="text-lg font-bold text-slate-900 dark:text-white"
                    >
                        导出运行报告
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">
                        选择导出格式并下载
                    </p>
                </div>
                <!-- [01] 为关闭按钮增加 type="button"、aria-label 与焦点样式 -->
                <button
                    type="button"
                    onclick={() => (open = false)}
                    class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="关闭导出窗口"
                    title="关闭"
                >
                    <X size={18} class="text-slate-400" />
                </button>
            </div>

            <!-- Format Selection -->
            <div class="p-5 space-y-4 overflow-y-auto">
                <!-- [01] 格式选择网格适配 375px 小屏为 2 列并自适应展开为 4 列 -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {#each FORMATS as fmt}
                        {@const FmtIcon = fmt.icon}
                        <button
                            type="button"
                            onclick={() => (selectedFormat = fmt.key)}
                            class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                            {selectedFormat === fmt.key
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}"
                        >
                            <FmtIcon
                                size={20}
                                class={selectedFormat === fmt.key
                                    ? "text-indigo-500"
                                    : "text-slate-400"}
                            />
                            <span
                                class="text-[10px] font-bold uppercase tracking-wider {selectedFormat ===
                                fmt.key
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500'}"
                            >
                                {fmt.label}
                            </span>
                        </button>
                    {/each}
                </div>

                <!-- 导出选项 -->
                <div
                    class="flex items-center gap-2 text-xs text-slate-500 mt-2"
                >
                    <Settings2 size={12} />
                    <span class="font-bold uppercase tracking-wider"
                        >导出选项</span
                    >
                </div>
                <div class="flex gap-4">
                    <label
                        class="flex items-center gap-2 text-xs cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            bind:checked={includeTimestamps}
                            class="rounded border-slate-300"
                        />
                        包含时间戳
                    </label>
                    <label
                        class="flex items-center gap-2 text-xs cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            bind:checked={includePrompts}
                            class="rounded border-slate-300"
                        />
                        包含提示词
                    </label>
                </div>

                <!-- 内容预览 -->
                <div>
                    <div
                        class="flex items-center gap-1.5 mb-2 text-xs text-slate-500"
                    >
                        <Eye size={12} />
                        <span class="font-bold uppercase tracking-wider">内容预览</span>
                    </div>
                    <CodeBlock
                        code={get内容预览()}
                        language={selectedFormat === "html" ? "html" : selectedFormat === "markdown" ? "markdown" : "plaintext"}
                        showHeader={false}
                        wrapLines={true}
                        maxHeight="190px"
                    />
                </div>
            </div>

            <!-- Footer -->
            <div
                class="flex justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
            >
                <button
                    type="button"
                    onclick={() => (open = false)}
                    class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    取消
                </button>
                <button
                    type="button"
                    onclick={handleDownload}
                    class="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                    <Download size={14} />
                    立即导出下载
                </button>
            </div>
        </div>
    </div>
{/if}
