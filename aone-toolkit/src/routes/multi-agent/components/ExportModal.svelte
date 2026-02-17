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

    function getPreview(): string {
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
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={handleBackdrop}
    >
        <div
            class="w-[520px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800"
            >
                <div>
                    <h2
                        class="text-lg font-bold text-slate-900 dark:text-white"
                    >
                        Export Report
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">
                        Choose format and download
                    </p>
                </div>
                <button
                    onclick={() => (open = false)}
                    class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X size={18} class="text-slate-400" />
                </button>
            </div>

            <!-- Format Selection -->
            <div class="p-5 space-y-4">
                <div class="grid grid-cols-4 gap-2">
                    {#each FORMATS as fmt}
                        {@const FmtIcon = fmt.icon}
                        <button
                            onclick={() => (selectedFormat = fmt.key)}
                            class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
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

                <!-- Options -->
                <div
                    class="flex items-center gap-2 text-xs text-slate-500 mt-2"
                >
                    <Settings2 size={12} />
                    <span class="font-bold uppercase tracking-wider"
                        >Options</span
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
                        Include timestamps
                    </label>
                    <label
                        class="flex items-center gap-2 text-xs cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            bind:checked={includePrompts}
                            class="rounded border-slate-300"
                        />
                        Include prompts
                    </label>
                </div>

                <!-- Preview -->
                <div>
                    <div
                        class="flex items-center gap-1.5 mb-2 text-xs text-slate-500"
                    >
                        <Eye size={12} />
                        <span class="font-bold uppercase tracking-wider"
                            >Preview</span
                        >
                    </div>
                    <pre
                        class="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-mono">{getPreview()}</pre>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="flex justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800"
            >
                <button
                    onclick={() => (open = false)}
                    class="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                    Cancel
                </button>
                <button
                    onclick={handleDownload}
                    class="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Download size={14} />
                    Download
                </button>
            </div>
        </div>
    </div>
{/if}
