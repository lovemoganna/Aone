<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { Plus, X, FileText } from "lucide-svelte";

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
    class="flex items-center gap-0 bg-slate-100/80 dark:bg-[#070a0f] border-b border-slate-200 dark:border-slate-800 px-1 h-8 overflow-hidden select-none shrink-0"
>
    <div
        class="flex items-center gap-0.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full"
    >
        {#each diagramStore.documents as doc (doc.id)}
            <div
                class="flex items-center gap-1.5 px-3 h-full min-w-[110px] max-w-[190px] text-xs transition-colors relative group/tab cursor-pointer
                {diagramStore.activeDocumentId === doc.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold border-r border-l first:border-l-0 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border-r border-slate-200/40 dark:border-slate-800/40'}"
                onclick={() => handleTabClick(doc.id)}
                ondblclick={() => startRename(doc.id, doc.name)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === "Enter" && handleTabClick(doc.id)}
            >
                <FileText
                    size={12}
                    class={diagramStore.activeDocumentId === doc.id
                        ? "text-slate-700 dark:text-slate-300"
                        : "opacity-40"}
                />

                {#if editingTabId === doc.id}
                    <input
                        bind:value={editName}
                        class="bg-white dark:bg-slate-800 border border-blue-500 outline-none text-xs w-full py-0.5 px-1 rounded text-slate-900 dark:text-slate-100"
                        use:autofocus
                        onblur={() => commitRename(doc.id)}
                        onkeydown={(e) => {
                            if (e.key === "Enter") commitRename(doc.id);
                            if (e.key === "Escape") editingTabId = null;
                        }}
                        onclick={(e) => e.stopPropagation()}
                    />
                {:else}
                    <span class="truncate pr-3 flex-1 text-left"
                        >{doc.name}</span
                    >
                {/if}

                {#if diagramStore.documents.length > 1}
                    <button
                        type="button"
                        class="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded opacity-0 group-hover/tab:opacity-100 transition-opacity ml-auto"
                        onclick={(e) => handleCloseTab(e, doc.id)}
                        title="Close Tab"
                        aria-label="关闭标签页"
                    >
                        <X size={11} />
                    </button>
                {/if}
            </div>
        {/each}
    </div>

    <button
        type="button"
        class="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0 ml-1"
        onclick={handleNewTab}
        title="New Diagram (Ctrl+N)"
        aria-label="新建图表"
    >
        <Plus size={14} />
    </button>
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
