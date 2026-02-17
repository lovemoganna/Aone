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
    class="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 h-10 overflow-hidden group"
>
    <div
        class="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full py-1"
    >
        {#each diagramStore.documents as doc (doc.id)}
            <div
                class="flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[200px] text-xs font-medium rounded-t-lg transition-all relative group/tab cursor-pointer
                {diagramStore.activeDocumentId === doc.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-[0_-1px_0_rgba(0,0,0,0.05)] border-x border-t border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}"
                onclick={() => handleTabClick(doc.id)}
                ondblclick={() => startRename(doc.id, doc.name)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === "Enter" && handleTabClick(doc.id)}
            >
                <FileText
                    size={12}
                    class={diagramStore.activeDocumentId === doc.id
                        ? "opacity-100"
                        : "opacity-50"}
                />

                {#if editingTabId === doc.id}
                    <input
                        bind:value={editName}
                        class="bg-indigo-50 dark:bg-indigo-900/50 border-none outline-none text-xs w-full py-0.5 px-1 rounded"
                        use:autofocus
                        onblur={() => commitRename(doc.id)}
                        onkeydown={(e) =>
                            e.key === "Enter" && commitRename(doc.id)}
                        onclick={(e) => e.stopPropagation()}
                    />
                {:else}
                    <span class="truncate pr-4 flex-1 text-left"
                        >{doc.name}</span
                    >
                {/if}

                {#if diagramStore.documents.length > 1}
                    <button
                        class="absolute right-1.5 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded opacity-0 group-hover/tab:opacity-100 transition-opacity"
                        onclick={(e) => handleCloseTab(e, doc.id)}
                        title="Close Tab"
                    >
                        <X size={10} />
                    </button>
                {/if}
            </div>
        {/each}
    </div>

    <button
        class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors flex-shrink-0"
        onclick={handleNewTab}
        title="New Diagram (Ctrl+N)"
    >
        <Plus size={16} />
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
