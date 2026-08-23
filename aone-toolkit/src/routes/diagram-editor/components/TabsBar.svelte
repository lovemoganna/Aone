<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { formatDiagramCode } from "../lib/formatter";
    import { Plus, X, FileText, AlignLeft, Check } from "lucide-svelte";

    function handleTabClick(id: string) {
        diagramStore.switchDocument(id);
    }

    function handleCloseTab(e: MouseEvent, id: string) {
        e.stopPropagation();
        diagramStore.closeDocument(id);
    }

    function handleNewTab() {
        diagramStore.createDocument();
    }

    let editingTabId = $state<string | null>(null);
    let editName = $state("");
    let formatted = $state(false);

    function handleFormat() {
        diagramStore.code = formatDiagramCode(diagramStore.code, diagramStore.mode);
        diagramStore.render();
        formatted = true;
        setTimeout(() => (formatted = false), 1500);
    }

    function startRename(id: string, currentName: string) {
        editingTabId = id;
        editName = currentName;
    }

    function commitRename(id: string) {
        if (editName.trim()) {
            const doc = diagramStore.documents.find((d) => d.id === id);
            if (doc) {
                doc.name = editName.trim();
                diagramStore.saveState();
            }
        }
        editingTabId = null;
    }

    function autofocus(node: HTMLElement) {
        node.focus();
    }
</script>

<div
    class="flex items-center justify-between bg-slate-100 dark:bg-[#090d14] border-b border-slate-200 dark:border-slate-800 px-2 h-8 overflow-hidden select-none shrink-0 relative z-10"
>
    <!-- Left: Tabs list -->
    <div
        class="flex items-center gap-0.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full min-w-0"
    >
        {#each diagramStore.documents as doc (doc.id)}
            <div
                class="flex items-center gap-1.5 px-3 h-full max-w-[200px] min-w-[90px] text-xs transition-colors relative group/tab cursor-pointer select-none shrink-0
                {diagramStore.activeDocumentId === doc.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold border-r border-l first:border-l-0 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border-r border-slate-200/60 dark:border-slate-800/60'}"
                onclick={() => handleTabClick(doc.id)}
                ondblclick={() => startRename(doc.id, doc.name)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === "Enter" && handleTabClick(doc.id)}
            >
                <FileText
                    size={12}
                    class="shrink-0 {diagramStore.activeDocumentId === doc.id
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'opacity-40'}"
                />

                {#if editingTabId === doc.id}
                    <input
                        bind:value={editName}
                        class="bg-white dark:bg-slate-800 border border-blue-500 outline-none text-xs w-full py-0.5 px-1 rounded text-slate-900 dark:text-slate-100 min-w-0"
                        use:autofocus
                        onblur={() => commitRename(doc.id)}
                        onkeydown={(e) => {
                            if (e.key === "Enter") commitRename(doc.id);
                            if (e.key === "Escape") editingTabId = null;
                        }}
                        onclick={(e) => e.stopPropagation()}
                    />
                {:else}
                    <span class="truncate flex-1 min-w-0 text-left whitespace-nowrap"
                        >{doc.name}</span
                    >
                {/if}

                {#if diagramStore.documents.length > 1}
                    <button
                        type="button"
                        class="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded opacity-0 group-hover/tab:opacity-100 transition-opacity ml-1 shrink-0"
                        onclick={(e) => handleCloseTab(e, doc.id)}
                        title="Close Tab"
                        aria-label="关闭标签页"
                    >
                        <X size={11} />
                    </button>
                {/if}
            </div>
        {/each}

        <button
            type="button"
            class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0 ml-1"
            onclick={handleNewTab}
            title="New Diagram (Ctrl+N)"
            aria-label="新建图表"
        >
            <Plus size={13} />
        </button>
    </div>

    <!-- Right: Format Quick Action -->
    <div class="flex items-center shrink-0 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800">
        <button
            type="button"
            class="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1 font-medium shrink-0"
            onclick={handleFormat}
            title="Format Code (Shift+Alt+F)"
            aria-label="格式化图表代码"
        >
            {#if formatted}
                <Check size={12} class="text-emerald-500 shrink-0" />
            {:else}
                <AlignLeft size={12} class="shrink-0" />
            {/if}
        </button>
    </div>
</div>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
