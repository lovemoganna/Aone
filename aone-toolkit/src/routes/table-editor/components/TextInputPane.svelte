<script lang="ts">
    import { Button } from "$lib/components/ui";
    import type { InputFormat } from "../lib/types";

    interface Props {
        value: string;
        inputFormat: InputFormat;
        isProcessing: boolean;
        onParse: () => void;
        onValueChange: (value: string) => void;
        onFormatChange: (format: InputFormat) => void;
    }

    let {
        value,
        inputFormat,
        isProcessing,
        onParse,
        onValueChange,
        onFormatChange,
    }: Props = $props();

    function handleInput(e: Event) {
        const textarea = e.target as HTMLTextAreaElement;
        onValueChange(textarea.value);
    }

    function handleFormatChange(e: Event) {
        const select = e.target as HTMLSelectElement;
        onFormatChange(select.value as InputFormat);
    }

    function handleKeyDown(e: KeyboardEvent) {
        // Auto-parse on Ctrl+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            onParse();
        }
    }
</script>

<div class="pane">
    <div class="form-group">
        <label for="inputFormat" class="form-label">输入格式</label>
        <select
            id="inputFormat"
            value={inputFormat}
            onchange={handleFormatChange}
            aria-label="选择输入格式"
        >
            <option value="auto">🔍 自动检测</option>
            <option value="html">🌐 HTML表格</option>
            <option value="markdown">📋 Markdown表格</option>
            <option value="csv">📊 CSV数据</option>
            <option value="text">📄 纯文本</option>
        </select>
    </div>

    <div class="form-group">
        <label for="tableInput" class="form-label">表格数据</label>
        <textarea
            id="tableInput"
            placeholder="粘贴您的表格数据... 支持HTML、Markdown、CSV等格式"
            rows="8"
            {value}
            oninput={handleInput}
            onkeydown={handleKeyDown}
            aria-describedby="input-help"
        ></textarea>
        <div id="input-help" class="help-text">
            💡 提示：按 Ctrl+V 粘贴，Ctrl+Enter 解析
        </div>
    </div>

    <Button
        variant="primary"
        size="md"
        onclick={onParse}
        disabled={isProcessing || !value.trim()}
        class="parse-btn"
    >
        {#if isProcessing}
            <svg
                class="spinner"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            解析中...
        {:else}
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
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            解析表格
        {/if}
    </Button>
</div>

<style>
    .pane {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary, #374151);
    }

    :global(.dark) .form-label {
        color: #d1d5db;
    }

    select,
    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color, #d1d5db);
        border-radius: 0.5rem;
        background: var(--bg-primary, #ffffff);
        color: var(--text-primary, #111827);
        font-size: 1rem;
        transition: all 0.2s ease;
    }

    :global(.dark) select,
    :global(.dark) textarea {
        border-color: #4b5563;
        background: #374151;
        color: #f9fafb;
    }

    select:focus,
    textarea:focus {
        outline: none;
        border-color: #5d5cde;
        box-shadow: 0 0 0 3px rgba(93, 92, 222, 0.1);
    }

    textarea {
        resize: vertical;
        min-height: 120px;
        font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
    }

    .help-text {
        font-size: 0.75rem;
        color: #6b7280;
    }

    :global(.parse-btn) {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
