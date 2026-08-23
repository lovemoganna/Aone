<script lang="ts">
  import { Button } from "$lib/components/ui";
  import type { InputFormat } from "../lib/types";
  import { Play, Sparkles, Trash2, Clipboard, FileText, Code2, Table2 } from "lucide-svelte";
  import { toastStore } from "$lib/stores/toastStore.svelte";

  interface Props {
    value: string;
    inputFormat: InputFormat;
    isProcessing: boolean;
    onParse: () => void;
    onValueChange: (value: string) => void;
    onFormatChange: (format: InputFormat) => void;
    onSampleLoad?: (type: "csv" | "markdown" | "html" | "sql") => void;
  }

  let {
    value,
    inputFormat,
    isProcessing,
    onParse,
    onValueChange,
    onFormatChange,
    onSampleLoad,
  }: Props = $props();

  const lineCount = $derived(value ? value.split("\n").length : 0);
  const charCount = $derived(value.length);

  function handleInput(event: Event) {
    onValueChange((event.target as HTMLTextAreaElement).value);
  }

  function handleFormatChange(event: Event) {
    onFormatChange((event.target as HTMLSelectElement).value as InputFormat);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onParse();
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onValueChange(text);
        toastStore.success("已从剪贴板粘贴文本");
      }
    } catch {
      toastStore.error("无法访问剪贴板，请手动粘贴");
    }
  }

  function handleClear() {
    onValueChange("");
  }
</script>

<div class="flex flex-col gap-3">
  <!-- Subheader / Format Selector Bar -->
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <div class="flex items-center gap-1.5">
      <label for="inputFormat" class="text-xs font-medium text-slate-700 dark:text-slate-300">
        源格式:
      </label>
      <div class="relative">
        <select
          id="inputFormat"
          value={inputFormat}
          onchange={handleFormatChange}
          aria-label="选择输入格式"
          class="text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-1 pl-2.5 pr-7 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="auto">⚡ 自动智能识别 (Auto)</option>
          <option value="csv">CSV 逗号/分号分隔</option>
          <option value="markdown">Markdown 表格 (| 表头 |)</option>
          <option value="html">HTML (&lt;table&gt; 结构)</option>
          <option value="text">纯文本/制表符列表</option>
        </select>
      </div>
    </div>

    <!-- Quick action buttons -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        onclick={handlePaste}
        class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="从剪贴板粘贴"
      >
        <Clipboard class="h-3 w-3 text-slate-400" />
        <span>粘贴</span>
      </button>
      {#if value.length > 0}
        <button
          type="button"
          onclick={handleClear}
          class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          title="清空输入内容"
        >
          <Trash2 class="h-3 w-3" />
          <span>清空</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Textarea Area -->
  <div class="relative">
    <textarea
      id="tableInput"
      placeholder="粘贴 HTML (<table>)、Markdown 表格、CSV 或制表符分隔的纯文本表格数据..."
      rows="9"
      {value}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      aria-describedby="input-help"
      class="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-y min-h-[160px]"
    ></textarea>
  </div>

  <!-- Bottom Action Bar & Shortcut info -->
  <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
    <div id="input-help" class="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
      <span>Ctrl + Enter 快捷解析</span>
      {#if charCount > 0}
        <span>•</span>
        <span>{lineCount} 行</span>
        <span>•</span>
        <span>{charCount} 字符</span>
      {/if}
    </div>

    <Button
      variant="primary"
      size="sm"
      onclick={onParse}
      disabled={isProcessing || !value.trim()}
      title={!value.trim() ? "请先粘贴或输入表格数据" : "执行表格数据结构化解析 (Ctrl+Enter)"}
    >
      {#if isProcessing}
        <span class="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <span>解析中...</span>
      {:else}
        <Play class="h-3 w-3 fill-current" />
        <span>解析表格</span>
      {/if}
    </Button>
  </div>
</div>
