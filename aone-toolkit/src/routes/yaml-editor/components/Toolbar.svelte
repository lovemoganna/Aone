<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { onMount } from "svelte";

    interface Props {
        canUndo: boolean;
        canRedo: boolean;
        onUndo: () => void;
        onRedo: () => void;
        onClear: () => void;
        onCopy: () => void;
        onCopyJSON?: () => void;
        onExport: () => void;
        onExportJSON: () => void;
        onImport: () => void;
        onBatch: () => void;
        onHelp: () => void;
        onFormat?: () => void;
    }

    let {
        canUndo,
        canRedo,
        onUndo,
        onRedo,
        onClear,
        onCopy,
        onCopyJSON,
        onExport,
        onExportJSON,
        onImport,
        onBatch,
        onHelp,
        onFormat,
    }: Props = $props();

    let isDark = $state(false);
    let exportDropdownOpen = $state(false);

    onMount(() => {
        isDark = document.documentElement.classList.contains("dark");
    });

    function toggleTheme() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }

    function handleExportYAML() {
        onExport();
        exportDropdownOpen = false;
    }

    function handleExportJSON() {
        onExportJSON();
        exportDropdownOpen = false;
    }
</script>

<!-- Toolbar with clear groupings and lucid icons -->
<div class="flex items-center gap-0.5 text-xs">
    <!-- History Group -->
    <div
        class="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 mr-1"
    >
        <Button
            variant="ghost"
            size="sm"
            onclick={onUndo}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
            class="h-7 w-7 p-0"
        >
            <!-- Undo 2 -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-undo-2 shrink-0"
                ><path d="M9 14 4 9l5-5" /><path
                    d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"
                /></svg
            >
        </Button>
        <Button
            variant="ghost"
            size="sm"
            onclick={onRedo}
            disabled={!canRedo}
            title="重做 (Ctrl+Y)"
            class="h-7 w-7 p-0"
        >
            <!-- Redo 2 -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-redo-2 shrink-0"
                ><path d="m15 14 5-5-5-5" /><path
                    d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"
                /></svg
            >
        </Button>
    </div>

    <!-- Import/Export Group -->
    <div
        class="flex items-center gap-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-md p-0.5 mr-1"
    >
        <Button
            variant="ghost"
            size="sm"
            onclick={onBatch}
            title="批量导入 (粘贴 YAML)"
            class="h-7 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        >
            <!-- Clipboard Paste (ClipboardList) -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-clipboard-list mr-1 shrink-0"
                ><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path
                    d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                /><path d="M12 11h4" /><path d="M12 16h4" /><path
                    d="M8 11h.01"
                /><path d="M8 16h.01" /></svg
            >
            <span>批量导入</span>
        </Button>
        <Button
            variant="ghost"
            size="sm"
            onclick={onImport}
            title="导入 YAML 文件"
            class="h-7 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        >
            <!-- Upload -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-upload mr-1 shrink-0"
                ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
                    points="17 8 12 3 7 8"
                /><line x1="12" x2="12" y1="3" y2="15" /></svg
            >
            <span>导入</span>
        </Button>
    </div>

    <!-- Export Dropdown -->
    <div
        class="relative flex items-center gap-0.5 bg-green-50 dark:bg-green-900/20 rounded-md p-0.5 mr-1"
    >
        <Button
            variant="ghost"
            size="sm"
            onclick={() => (exportDropdownOpen = !exportDropdownOpen)}
            title="下载/导出数据"
            class="h-7 px-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
        >
            <!-- Download -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-download mr-1 shrink-0"
                ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
                    points="7 10 12 15 17 10"
                /><line x1="12" x2="12" y1="15" y2="3" /></svg
            >
            <span>导出</span>
            <!-- Chevron -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-chevron-down ml-1 shrink-0 transition-transform {exportDropdownOpen
                    ? 'rotate-180'
                    : ''}"><path d="m6 9 6 6 6-6" /></svg
            >
        </Button>

        <!-- Dropdown Menu -->
        {#if exportDropdownOpen}
            <div
                class="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[120px] py-1"
            >
                <button
                    class="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    onclick={handleExportYAML}
                >
                    <!-- File Code -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-orange-500"
                        ><path
                            d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
                        /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path
                            d="m10 13-2 2 2 2"
                        /><path d="m14 17 2-2-2-2" /></svg
                    >
                    <span>导出为 YAML</span>
                </button>
                <button
                    class="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    onclick={handleExportJSON}
                >
                    <!-- Braces -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-blue-500"
                        ><path
                            d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"
                        /><path
                            d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"
                        /></svg
                    >
                    <span>导出为 JSON</span>
                </button>
            </div>
        {/if}
    </div>

    <!-- Copy Group -->
    <div
        class="flex items-center gap-0.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-md p-0.5 mr-1"
    >
        <Button
            variant="ghost"
            size="sm"
            onclick={onCopy}
            title="复制为 YAML 文本"
            class="h-7 px-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40"
        >
            <!-- Clipboard + Code -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="mr-1 shrink-0"
                ><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path
                    d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                /><path d="m9 14 2 2 4-4" /></svg
            >
            <span>复制 YAML</span>
        </Button>
        {#if onCopyJSON}
            <Button
                variant="ghost"
                size="sm"
                onclick={onCopyJSON}
                title="复制为 JSON 文本"
                class="h-7 px-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40"
            >
                <!-- Clipboard + Braces -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-1 shrink-0"
                    ><rect
                        width="8"
                        height="4"
                        x="8"
                        y="2"
                        rx="1"
                        ry="1"
                    /><path
                        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                    /><path
                        d="M8 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"
                    /></svg
                >
                <span>复制 JSON</span>
            </Button>
        {/if}
    </div>

    <!-- Format Group -->
    {#if onFormat}
        <div
            class="flex items-center gap-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-md p-0.5 mr-1"
        >
            <Button
                variant="ghost"
                size="sm"
                onclick={onFormat}
                title="格式化 / 美化 YAML"
                class="h-7 px-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40"
            >
                <!-- Sparkles -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-sparkles mr-1 shrink-0"
                    ><path
                        d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
                    /><path d="M5 3v4" /><path d="M19 17v4" /><path
                        d="M3 5h4"
                    /><path d="M17 19h4" /></svg
                >
                <span>格式化</span>
            </Button>
        </div>
    {/if}

    <!-- Danger Action -->
    <Button
        variant="ghost"
        size="sm"
        onclick={onClear}
        title="清空所有数据"
        class="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 mr-1"
    >
        <!-- Trash 2 -->
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-trash-2 shrink-0"
            ><path d="M3 6h18" /><path
                d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
            /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line
                x1="10"
                x2="10"
                y1="11"
                y2="17"
            /><line x1="14" x2="14" y1="11" y2="17" /></svg
        >
    </Button>

    <!-- Help Group -->
    <div
        class="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 mr-1"
    >
        <Button
            variant="ghost"
            size="sm"
            onclick={onHelp}
            title="键盘快捷键"
            class="h-7 w-7 p-0 text-slate-600 dark:text-slate-400"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-help-circle shrink-0"
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
            </svg>
        </Button>
    </div>

    <!-- Settings Group -->
    <div
        class="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5"
    >
        <Button
            variant="ghost"
            size="sm"
            onclick={toggleTheme}
            title={isDark ? "切换到浅色模式" : "切换到深色模式"}
            class="h-7 w-7 p-0"
        >
            {#if isDark}
                <!-- Moon -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-moon text-yellow-400 shrink-0"
                    ><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg
                >
            {:else}
                <!-- Sun -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-sun text-orange-400 shrink-0"
                    ><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path
                        d="M12 20v2"
                    /><path d="m4.93 4.93 1.41 1.41" /><path
                        d="m17.66 17.66 1.41 1.41"
                    /><path d="M2 12h2" /><path d="M20 12h2" /><path
                        d="m6.34 17.66-1.41 1.41"
                    /><path d="m19.07 4.93-1.41 1.41" /></svg
                >
            {/if}
        </Button>
    </div>
</div>
