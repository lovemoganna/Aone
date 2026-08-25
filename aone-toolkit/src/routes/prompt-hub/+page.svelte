<script lang="ts">
    import { onMount } from "svelte";
    import { promptStore } from "./lib/store.svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import Sidebar from "./components/Sidebar.svelte";
    import PromptList from "./components/PromptList.svelte";
    import type {
        Collection,
        Prompt,
        Tag as TagModel,
    } from "./lib/types";
    import {
        Plus,
        Download,
        Upload,
        LayoutGrid,
        LayoutList,
        Trash2,
        X,
        Tag,
        Sparkles,
        Archive,
        FolderInput,
        Star,
        Settings,
        CheckSquare,
        Square,
        PanelLeftOpen,
        PanelLeftClose
    } from "lucide-svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import SettingsModal from "../multi-agent/components/SettingsModal.svelte";

    let PromptEditorModal = $state<any>(null);
    let PromptQuickViewModal = $state<any>(null);
    let DataModal = $state<any>(null);
    let TagModal = $state<any>(null);
    let ConfirmModal = $state<any>(null);
    let TemplateLibrary = $state<any>(null);
    let RunPromptModal = $state<any>(null);
    let BatchCollectionModal = $state<any>(null);
    let isSettingsOpen = $state(false);
    let modalLoadError = $state("");
    let loadingModal = $state("");

    // 侧边栏折叠状态
    let isSidebarCollapsed = $state(false);

    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed;
        try {
            localStorage.setItem("prompt_hub_sidebar_collapsed", String(isSidebarCollapsed));
        } catch {
            // ignore
        }
    }

    // 状态栏提示
    let statusText = $state("");
    let statusType = $state<"success" | "warning" | "error">("success");
    let statusVisible = $state(false);
    let statusTimer: ReturnType<typeof setTimeout> | null = null;

    function updateStatus(
        text: string,
        type: "success" | "warning" | "error" = "success",
    ) {
        statusText = text;
        statusType = type;
        statusVisible = true;
        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            statusVisible = false;
        }, 3000);
    }

    let isBatchCollectionOpen = $state(false);

    onMount(() => {
        try {
            isSidebarCollapsed = localStorage.getItem("prompt_hub_sidebar_collapsed") === "true";
        } catch {
            // ignore
        }

        const handoff = dataBridge.consume("/prompt-hub");
        if (handoff && handoff.payload) {
            promptStore.addPrompt({
                id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                title: handoff.title || `从 ${handoff.sourceTool} 导入的 Prompt`,
                description: `于 ${new Date().toLocaleString()} 从 ${handoff.sourceTool} 流转接收`,
                content: handoff.payload,
                tags: [],
                favorite: false,
                status: "draft",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                usageCount: 0,
            });
            updateStatus(`已从 ${handoff.sourceTool} 成功导入新提示词！`, "success");
        }
    });

    function errorMessage(error: unknown, fallback: string) {
        return error instanceof Error ? error.message : fallback;
    }

    async function ensureModal(
        name: string,
        loader: () => Promise<any>,
        assign: (component: any) => void,
        current: any,
    ) {
        if (current) return true;
        loadingModal = name;
        modalLoadError = "";
        try {
            const mod = await loader();
            assign(mod.default || mod);
            return true;
        } catch (error) {
            modalLoadError = errorMessage(error, `无法加载 ${name}。`);
            updateStatus(modalLoadError, "error");
            return false;
        } finally {
            loadingModal = "";
        }
    }

    const ensureEditorModal = () =>
        ensureModal(
            "编辑器",
            () => import("./components/modals/PromptEditorModal.svelte"),
            (component) => (PromptEditorModal = component),
            PromptEditorModal,
        );

    const ensureQuickViewModal = () =>
        ensureModal(
            "快速检视",
            () => import("./components/modals/PromptQuickViewModal.svelte"),
            (component) => (PromptQuickViewModal = component),
            PromptQuickViewModal,
        );

    const ensureDataModal = () =>
        ensureModal(
            "数据管理",
            () => import("./components/modals/DataModal.svelte"),
            (component) => (DataModal = component),
            DataModal,
        );

    const ensureTagModal = () =>
        ensureModal(
            "标签编辑器",
            () => import("./components/modals/TagModal.svelte"),
            (component) => (TagModal = component),
            TagModal,
        );

    const ensureConfirmModal = () =>
        ensureModal(
            "确认",
            () => import("./components/modals/ConfirmModal.svelte"),
            (component) => (ConfirmModal = component),
            ConfirmModal,
        );

    const ensureTemplateLibrary = () =>
        ensureModal(
            "模版库",
            () => import("./components/modals/TemplateLibrary.svelte"),
            (component) => (TemplateLibrary = component),
            TemplateLibrary,
        );

    const ensureRunModal = () =>
        ensureModal(
            "运行器",
            () => import("./components/modals/RunPromptModal.svelte"),
            (component) => (RunPromptModal = component),
            RunPromptModal,
        );

    const ensureBatchCollectionModal = () =>
        ensureModal(
            "集合选择",
            () => import("./components/modals/BatchCollectionModal.svelte"),
            (component) => (BatchCollectionModal = component),
            BatchCollectionModal,
        );

    async function batchArchive() {
        if (selectedIds.size === 0) {
            updateStatus("请先选择要归档的 Prompt。", "warning");
            return;
        }
        await openConfirm(
            `归档 ${selectedIds.size} 个 Prompt`,
            `确定要归档选中的 ${selectedIds.size} 个 Prompt 吗？可在「已归档」中恢复。`,
            () => {
                promptStore.archivePrompts(selectedIds, true);
                clearSelection();
                isConfirmOpen = false;
                updateStatus("选中的 Prompt 已归档。", "success");
            },
            "归档",
            "info",
        );
    }

    function batchFavorite() {
        if (selectedIds.size === 0) {
            updateStatus("请先选择要修改收藏状态的 Prompt。", "warning");
            return;
        }
        const allFav = Array.from(selectedIds).every(
            (id) => promptStore.prompts.find((p) => p.id === id)?.favorite,
        );
        promptStore.setFavoritePrompts(selectedIds, !allFav);
        updateStatus(
            allFav ? "已取消收藏。" : "已加入收藏。",
            "success",
        );
    }

    async function openBatchCollection() {
        if (selectedIds.size === 0) {
            updateStatus("请先选择要移动的 Prompt。", "warning");
            return;
        }
        if (await ensureBatchCollectionModal()) {
            isBatchCollectionOpen = true;
        }
    }

    function handleBatchCollection(collectionId: string | undefined) {
        promptStore.movePromptsToCollection(selectedIds, collectionId);
        isBatchCollectionOpen = false;
        clearSelection();
        updateStatus("已移动到目标集合。", "success");
    }

    let { prompts, filteredPrompts } = $derived(promptStore);

    let isEditorOpen = $state(false);
    let isQuickViewOpen = $state(false);
    let isDataOpen = $state(false);
    let isTagModalOpen = $state(false);
    let isTemplateLibraryOpen = $state(false);
    let editingPromptId = $state<string | null>(null);
    let quickViewPromptId = $state<string | null>(null);
    let editingTag = $state<TagModel | null>(null);

    // Batch Selection
    let selectedIds = $state(new Set<string>());

    // View Mode
    let viewMode = $state<"grid" | "list">("grid");
    let editorInitialTab = $state<"playground" | "preview" | "compiled" | "history">("playground");

    async function openEditor(
        id: string | null = null,
        tab: "playground" | "preview" | "compiled" | "history" = "playground"
    ) {
        if (await ensureEditorModal()) {
            editingPromptId = id;
            editorInitialTab = tab;
            isEditorOpen = true;
        }
    }

    async function openQuickView(id: string) {
        if (await ensureQuickViewModal()) {
            quickViewPromptId = id;
            isQuickViewOpen = true;
        }
    }

    function closeEditor() {
        isEditorOpen = false;
        editingPromptId = null;
    }

    function toggleSelect(id: string) {
        selectedIds = new Set(selectedIds);
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
    }

    function selectAllCurrent() {
        if (selectedIds.size === filteredPrompts.length) {
            selectedIds = new Set();
        } else {
            selectedIds = new Set(filteredPrompts.map((p) => p.id));
        }
    }

    function clearSelection() {
        selectedIds = new Set();
    }

    // Confirm Modal State
    let isConfirmOpen = $state(false);
    let confirmConfig = $state<{
        title: string;
        message: string;
        confirmText: string;
        variant: "danger" | "warning" | "info";
        onConfirm: () => void;
    }>({
        title: "",
        message: "",
        confirmText: "确认",
        variant: "danger",
        onConfirm: () => {},
    });

    async function openConfirm(
        title: string,
        message: string,
        onConfirm: () => void,
        confirmText = "删除",
        variant: "danger" | "warning" | "info" = "danger",
    ) {
        if (await ensureConfirmModal()) {
            confirmConfig = { title, message, confirmText, variant, onConfirm };
            isConfirmOpen = true;
        }
    }

    async function deleteSelected() {
        if (selectedIds.size === 0) {
            updateStatus("请先选择要删除的 Prompt。", "warning");
            return;
        }
        await openConfirm(
            `删除 ${selectedIds.size} 个 Prompt`,
            `确定要删除选中的 ${selectedIds.size} 个 Prompt 吗？此操作无法撤销。`,
            () => {
                for (const id of selectedIds) {
                    promptStore.deletePrompt(id);
                }
                clearSelection();
                isConfirmOpen = false;
                updateStatus("已删除选中的 Prompt。", "success");
            },
        );
    }

    // Batch Tagging
    let isBatchTagOpen = $state(false);
    let batchSelectedTags = $state<string[]>([]);

    function toggleBatchTag(tagId: string) {
        if (batchSelectedTags.includes(tagId)) {
            batchSelectedTags = batchSelectedTags.filter((t) => t !== tagId);
        } else {
            batchSelectedTags = [...batchSelectedTags, tagId];
        }
    }

    function applyBatchTags() {
        if (batchSelectedTags.length === 0) {
            updateStatus("请至少选择一个标签。", "warning");
            return;
        }
        promptStore.addTagsToPrompts(selectedIds, batchSelectedTags);
        isBatchTagOpen = false;
        batchSelectedTags = [];
        clearSelection();
        updateStatus("标签已成功批量应用。", "success");
    }

    // Run Mode
    let isRunOpen = $state(false);
    let runPrompt = $state<Prompt | null>(null);
    let runInitialValues = $state<Record<string, string>>({});

    async function handleRun(id: string, initialValues: Record<string, string> = {}) {
        await openEditor(id, "playground");
    }

    function handleArchive(id: string) {
        const prompt = promptStore.prompts.find((p) => p.id === id);
        promptStore.toggleArchive(id);
        updateStatus(
            prompt?.archived ? "已从归档恢复。" : "已移至归档。",
            "success",
        );
    }

    function handleDuplicate(id: string) {
        const prompt = promptStore.prompts.find((p) => p.id === id);
        promptStore.duplicatePrompt(id);
        updateStatus(
            prompt ? `已创建「${prompt.title}」的副本。` : "已创建副本。",
            "success",
        );
    }

    function handleCopyResult(
        result: "success" | "error",
        format: "text" | "json" | "python",
    ) {
        const formatLabel =
            format === "json" ? "JSON" : format === "python" ? "Python" : "正文";
        updateStatus(
            result === "success"
                ? `已复制为 ${formatLabel} 格式。`
                : `复制失败，请检查浏览器剪贴板权限。`,
            result === "success" ? "success" : "error",
        );
    }

    async function handleDeleteCollection(collection: Collection) {
        const promptCount = promptStore.prompts.filter(
            (prompt) => prompt.collectionId === collection.id,
        ).length;
        await openConfirm(
            `删除集合「${collection.name}」`,
            promptCount > 0
                ? `确定删除此集合吗？其中的 ${promptCount} 个 Prompt 不会被删除，仅从集合中移除。`
                : "确定删除此空集合吗？",
            () => {
                promptStore.deleteCollection(collection.id);
                if (promptStore.activeCollectionId === collection.id) {
                    promptStore.activeCollectionId = null;
                }
                isConfirmOpen = false;
                updateStatus(`已删除集合「${collection.name}」。`, "success");
            },
            "删除",
            "danger",
        );
    }

    async function handleDeleteTag(tag: TagModel) {
        const childCount = promptStore.tags.filter((t) => t.parentId === tag.id).length;
        const promptCount = promptStore.prompts.filter((prompt) =>
            prompt.tags.includes(tag.id),
        ).length;
        await openConfirm(
            `删除标签「${tag.name}」`,
            childCount > 0 || promptCount > 0
                ? `确定删除此标签吗？关联的 ${childCount} 个子标签和 ${promptCount} 个 Prompt 的标签引用将被移除。`
                : "确定删除此未使用的标签吗？",
            () => {
                promptStore.deleteTag(tag.id);
                if (promptStore.activeTagId === tag.id) {
                    promptStore.activeTagId = null;
                }
                isConfirmOpen = false;
                updateStatus(`已删除标签「${tag.name}」。`, "success");
            },
            "删除",
            "danger",
        );
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            if (isEditorOpen) { closeEditor(); return; }
            if (isQuickViewOpen) { isQuickViewOpen = false; return; }
            if (isRunOpen) { isRunOpen = false; return; }
            if (isConfirmOpen) { isConfirmOpen = false; return; }
            if (isBatchCollectionOpen) { isBatchCollectionOpen = false; return; }
            if (isTagModalOpen) { isTagModalOpen = false; return; }
            if (isDataOpen) { isDataOpen = false; return; }
            if (isTemplateLibraryOpen) { isTemplateLibraryOpen = false; return; }
            if (selectedIds.size > 0) { clearSelection(); return; }
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            toggleSidebar();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
            e.preventDefault();
            openEditor(null);
            return;
        }

        if (
            e.key === "/" &&
            !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
        ) {
            e.preventDefault();
            document.getElementById("search-input")?.focus();
            return;
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="h-full w-full flex flex-col p-2.5 sm:p-3.5 overflow-hidden bg-slate-50 dark:bg-slate-950">
    <div
        class="flex-1 flex flex-row min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden text-slate-900 dark:text-slate-100 font-sans"
    >
        <!-- 侧边栏 (支持折叠) -->
        <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onEditTag={async (tag) => {
                if (await ensureTagModal()) {
                    editingTag = tag;
                    isTagModalOpen = true;
                }
            }}
            onDeleteTag={handleDeleteTag}
            onDeleteCollection={handleDeleteCollection}
        />

        <main class="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden">
            <!-- 顶部工具栏 (去塑料感，克制利落) -->
            <div
                class="h-12 min-h-12 px-4 py-2 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/80 shrink-0"
            >
            <div class="flex items-center gap-2">
                <!-- 侧边栏折叠/展开切换按钮 -->
                <button
                    type="button"
                    onclick={toggleSidebar}
                    class="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    title={isSidebarCollapsed ? "展开侧边栏 (Ctrl+B)" : "折叠侧边栏 (Ctrl+B)"}
                    aria-label={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
                >
                    {#if isSidebarCollapsed}
                        <PanelLeftOpen size={15} />
                    {:else}
                        <PanelLeftClose size={15} />
                    {/if}
                </button>

                <div class="w-px h-3.5 bg-slate-200 dark:border-slate-700 mx-0.5"></div>

                <button
                    type="button"
                    class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors text-xs font-semibold"
                    onclick={() => openEditor(null)}
                >
                    <Plus size={14} />
                    新建 Prompt
                </button>

                <button
                    type="button"
                    class="px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 text-xs transition-colors font-medium"
                    onclick={async () => {
                        if (await ensureTemplateLibrary()) {
                            isTemplateLibraryOpen = true;
                        }
                    }}
                >
                    <Sparkles size={13} class="text-indigo-500" />
                    模版库
                </button>

                <div class="flex gap-1 border-l pl-2 border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onclick={async () => {
                            if (await ensureDataModal()) {
                                isDataOpen = true;
                            }
                        }}
                        class="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-xs transition-colors text-slate-600 dark:text-slate-300"
                        title="导出或导入备份数据"
                    >
                        <Download size={13} />
                        <span>数据管理</span>
                    </button>

                    <!-- AI Service Settings Button -->
                    <button
                        type="button"
                        onclick={() => (isSettingsOpen = true)}
                        class="px-2.5 py-1.5 border rounded-lg flex items-center gap-1.5 text-xs transition-colors {settingsStore.isConfigured ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'}"
                        title={settingsStore.isConfigured ? `已连接 AI 服务: ${settingsStore.currentProvider?.name} / ${settingsStore.selectedModel}` : '未连接真实 AI 服务（点击配置 API Key）'}
                    >
                        <Settings size={13} />
                        <span class="font-medium">
                            {settingsStore.isConfigured ? `${settingsStore.currentProvider?.name}` : '配置 AI'}
                        </span>
                        <span class="w-1.5 h-1.5 rounded-full {settingsStore.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                    </button>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <!-- 排序 -->
                <div class="flex items-center gap-1.5">
                    <span class="text-[11px] text-slate-400">排序:</span>
                    <select
                        bind:value={promptStore.sortOrder}
                        class="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 cursor-pointer focus:ring-0 font-medium"
                    >
                        <option value="created_desc">最新创建</option>
                        <option value="created_asc">最早创建</option>
                        <option value="updated_desc">最近修改</option>
                        <option value="title_asc">按名称</option>
                        <option value="usage_desc">使用最多</option>
                    </select>
                </div>

                <div class="w-px h-3.5 bg-slate-200 dark:bg-slate-700"></div>

                <span class="text-xs text-slate-500">{filteredPrompts.length} 个 Prompt</span>

                <button
                    type="button"
                    onclick={() => (viewMode = viewMode === "grid" ? "list" : "grid")}
                    aria-label={viewMode === "grid" ? "切换为列表视图" : "切换为网格视图"}
                    class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                    title={viewMode === "grid" ? "切换为列表" : "切换为网格"}
                >
                    {#if viewMode === "grid"}
                        <LayoutList size={15} />
                    {:else}
                        <LayoutGrid size={15} />
                    {/if}
                </button>
            </div>
        </div>

        <!-- 状态提示 -->
        {#if statusVisible}
            <div
                class="px-5 py-2 text-xs transition-all duration-200 {statusType === 'error'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : statusType === 'warning'
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}"
                role={statusType === "error" ? "alert" : "status"}
            >
                {loadingModal ? `正在加载${loadingModal}... ` : ""}{statusText}
            </div>
        {/if}

        <!-- 主内容列表 -->
        <div class="flex-1 overflow-y-auto min-h-0">
            <PromptList
                prompts={filteredPrompts}
                onEdit={(id) => openEditor(id)}
                onOpenQuickView={(id) => openQuickView(id)}
                {selectedIds}
                onSelectToggle={toggleSelect}
                {viewMode}
                onDeleteRequest={async (id, title) =>
                    await openConfirm(
                        `删除「${title}」`,
                        `确定要删除此 Prompt 吗？此操作无法撤销。`,
                        () => {
                            promptStore.deletePrompt(id);
                            isConfirmOpen = false;
                            updateStatus(`已删除「${title}」。`, "success");
                        },
                    )}
                onArchive={handleArchive}
                onDuplicate={handleDuplicate}
                onRun={handleRun}
                onCopyResult={handleCopyResult}
                onCreateNew={() => openEditor(null)}
            />
        </div>

        <!-- 底部批量操作条 (桌面端整洁布局) -->
        {#if selectedIds.size > 0}
            <div
                class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 flex items-center justify-between z-20 shrink-0 shadow-lg"
            >
                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        onclick={selectAllCurrent}
                        class="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1.5 font-medium"
                    >
                        {#if selectedIds.size === filteredPrompts.length}
                            <CheckSquare size={14} class="text-indigo-600" />
                            <span>已全选 ({selectedIds.size})</span>
                        {:else}
                            <Square size={14} />
                            <span>全选当前 ({selectedIds.size}/{filteredPrompts.length})</span>
                        {/if}
                    </button>
                    <button
                        type="button"
                        onclick={clearSelection}
                        class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        清空选择
                    </button>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        onclick={batchFavorite}
                        class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 transition-colors"
                        title="批量收藏/取消收藏"
                    >
                        <Star size={13} />
                        <span>收藏</span>
                    </button>

                    <button
                        type="button"
                        onclick={batchArchive}
                        class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                        title="批量归档"
                    >
                        <Archive size={13} />
                        <span>归档</span>
                    </button>

                    <button
                        type="button"
                        onclick={openBatchCollection}
                        class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                        <FolderInput size={13} />
                        <span>移动到集合</span>
                    </button>

                    <!-- 标签弹窗 -->
                    <div class="relative">
                        <button
                            type="button"
                            onclick={() => (isBatchTagOpen = !isBatchTagOpen)}
                            class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                            <Tag size={13} />
                            <span>打标签</span>
                        </button>

                        {#if isBatchTagOpen}
                            <div
                                class="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50"
                            >
                                <div class="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                                    选择要批量添加的标签：
                                </div>
                                <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto mb-3">
                                    {#each promptStore.tags as tag}
                                        <button
                                            type="button"
                                            onclick={() => toggleBatchTag(tag.id)}
                                            class="px-2 py-0.5 rounded text-xs border transition-colors {batchSelectedTags.includes(tag.id) ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 text-indigo-700 dark:text-indigo-300 font-medium' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}"
                                        >
                                            {tag.name}
                                        </button>
                                    {/each}
                                </div>
                                <button
                                    type="button"
                                    onclick={applyBatchTags}
                                    class="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs"
                                >
                                    应用所选标签
                                </button>
                            </div>
                        {/if}
                    </div>

                    <div class="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <button
                        type="button"
                        onclick={deleteSelected}
                        class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-md text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                        <Trash2 size={13} />
                        <span>删除</span>
                    </button>
                </div>
            </div>
        {/if}
    </main>

    {#if isBatchCollectionOpen && BatchCollectionModal}
        <BatchCollectionModal
            onClose={() => (isBatchCollectionOpen = false)}
            onConfirm={handleBatchCollection}
        />
    {/if}

    {#if isEditorOpen && PromptEditorModal}
        <PromptEditorModal
            promptId={editingPromptId}
            initialRightTab={editorInitialTab}
            onClose={closeEditor}
            onCreateTag={async () => {
                if (await ensureTagModal()) {
                    editingTag = null;
                    isTagModalOpen = true;
                }
            }}
        />
    {/if}

    {#if isQuickViewOpen && PromptQuickViewModal}
        <PromptQuickViewModal
            isOpen={isQuickViewOpen}
            prompt={promptStore.prompts.find((p) => p.id === quickViewPromptId) || null}
            onClose={() => (isQuickViewOpen = false)}
            onEdit={(id: string) => openEditor(id)}
            onRun={(id: string, initialValues?: Record<string, string>) => handleRun(id, initialValues)}
            onDuplicate={(id: string) => handleDuplicate(id)}
            onArchive={(id: string) => handleArchive(id)}
        />
    {/if}

    {#if isDataOpen && DataModal}
        <DataModal bind:isOpen={isDataOpen} onClose={() => (isDataOpen = false)} />
    {/if}

    {#if isTagModalOpen && TagModal}
        <TagModal
            tagToEdit={editingTag}
            onClose={() => {
                isTagModalOpen = false;
                editingTag = null;
            }}
        />
    {/if}

    {#if ConfirmModal}
        <ConfirmModal
            isOpen={isConfirmOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText={confirmConfig.confirmText}
            variant={confirmConfig.variant}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => (isConfirmOpen = false)}
        />
    {/if}

    {#if TemplateLibrary}
        <TemplateLibrary
            isOpen={isTemplateLibraryOpen}
            onClose={() => (isTemplateLibraryOpen = false)}
        />
    {/if}

    {#if RunPromptModal}
        <RunPromptModal
            isOpen={isRunOpen}
            prompt={runPrompt}
            initialValues={runInitialValues}
            onClose={() => {
                isRunOpen = false;
                runInitialValues = {};
            }}
        />
    {/if}

    <!-- AI Settings Configuration Modal -->
    <SettingsModal bind:open={isSettingsOpen} />
    </div>
</div>
