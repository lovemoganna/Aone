<script lang="ts">
    import { Button } from "$lib/components/ui";
    import type { OutputFormat } from "../lib/types";
    import { FORMAT_CONFIG } from "../lib/types";

    interface Props {
        content: string;
        format: OutputFormat | null;
        onCopy: () => void;
        onDownload: () => void;
    }

    let { content, format, onCopy, onDownload }: Props = $props();

    let charCount = $derived(content.length);
    let lineCount = $derived(content.split("\n").length);
    let formatLabel = $derived(format ? FORMAT_CONFIG[format].label : "");
</script>

<div class="output-container">
    <div class="toolbar">
        <h3 class="title">📤 转换结果</h3>
        <div class="toolbar-group">
            <span class="stats">
                {formatLabel} · {lineCount} 行 · {charCount} 字符
            </span>
            <Button
                variant="ghost"
                size="sm"
                onclick={onCopy}
                title="复制到剪贴板"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path
                        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                    />
                </svg>
                复制
            </Button>
            <Button
                variant="primary"
                size="sm"
                onclick={onDownload}
                title="下载文件"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                下载
            </Button>
        </div>
    </div>

    <div class="output-wrapper">
        <pre class="output-pre" aria-label="转换后的结果">{content}</pre>
    </div>
</div>

<style>
    .output-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .toolbar-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary, #111827);
        margin: 0;
    }

    :global(.dark) .title {
        color: #f9fafb;
    }

    .stats {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .output-wrapper {
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 0.5rem;
        overflow: hidden;
    }

    :global(.dark) .output-wrapper {
        border-color: #4b5563;
    }

    .output-pre {
        padding: 1rem;
        font-size: 0.875rem;
        overflow: auto;
        max-height: 24rem;
        background: #f9fafb;
        color: #111827;
        white-space: pre-wrap;
        font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
        line-height: 1.5;
        margin: 0;
    }

    :global(.dark) .output-pre {
        background: #111827;
        color: #f9fafb;
    }
</style>
