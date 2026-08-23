<script lang="ts">
    import { promptStore } from "../lib/store.svelte";
    import type { Prompt } from "../lib/types";
    import PromptCard from "./PromptCard.svelte";
    import {
        FileText,
        Plus,
        Search,
        X,
        Play,
        Copy,
        Check,
        Edit3,
        Trash2,
        Star,
        Files,
        Archive,
        ArchiveRestore,
        Braces,
        MoreVertical
    } from "lucide-svelte";

    let {
        prompts,
        onEdit,
        selectedIds = new Set<string>(),
        onSelectToggle,
        viewMode = "grid",
        onDeleteRequest,
        onArchive,
        onRun,
        onOpenQuickView,
        onDuplicate,
        onCopyResult,
        onCreateNew,
    } = $props<{
        prompts: Prompt[];
        onEdit?: (id: string) => void;
        selectedIds?: Set<string>;
        onSelectToggle?: (id: string) => void;
        viewMode?: "grid" | "list";
        onDeleteRequest: (id: string, title: string) => void;
        onArchive?: (id: string) => void;
        onRun?: (id: string) => void;
        onOpenQuickView?: (id: string) => void;
        onDuplicate?: (id: string) => void;
        onCopyResult?: (status: "success" | "error", format: "text" | "json" | "python") => void;
        onCreateNew?: () => void;
    }>();

    let copiedRowId = $state<string | null>(null);
    let activeRowMenuId = $state<string | null>(null);

    function handleDelete(id: string) {
        const prompt = prompts.find((p: Prompt) => p.id === id);
        if (prompt) {
            onDeleteRequest(id, prompt.title);
        }
    }

    function handleEdit(id: string) {
        if (onEdit) onEdit(id);
    }

    function handleFavorite(id: string) {
        promptStore.toggleFavorite(id);
    }

    function handleSelect(id: string) {
        if (onSelectToggle) onSelectToggle(id);
    }

    function handleDuplicate(id: string) {
        if (onDuplicate) {
            onDuplicate(id);
        } else {
            promptStore.duplicatePrompt(id);
        }
    }

    function handleArchive(id: string) {
        if (onArchive) onArchive(id);
    }

    function handleRun(id: string) {
        if (onRun) onRun(id);
    }

    function handleQuickView(id: string) {
        if (onOpenQuickView) onOpenQuickView(id);
        else if (onEdit) onEdit(id);
    }

    async function handleRowCopy(e: MouseEvent, prompt: Prompt) {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(prompt.content);
            copiedRowId = prompt.id;
            onCopyResult?.("success", "text");
            setTimeout(() => {
                if (copiedRowId === prompt.id) copiedRowId = null;
            }, 2000);
        } catch {
            onCopyResult?.("error", "text");
        }
    }

    function getTagName(tagId: string): string {
        const tag = promptStore.tags.find((t) => t.id === tagId);
        return tag ? tag.name : tagId;
    }

    function getVarCount(content: string): number {
        const regex = /\{\{\s*([\u4e00-\u9fa5\w-]+)\s*\}\}/g;
        const matches = content.match(regex);
        return matches ? new Set(matches.map((m: string) => m.replace(/[{}\s]/g, ''))).size : 0;
    }

    const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
        draft: { label: "草稿", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
        testing: { label: "测试中", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
        published: { label: "已发布", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
        deprecated: { label: "已废弃", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
    };

    // 判断是"首次无数据"还是"筛选无结果"
    let isFirstTime = $derived(promptStore.prompts.length === 0);
    let isFilteredEmpty = $derived(prompts.length === 0 && !isFirstTime);
    let hasActiveFilters = $derived(
        promptStore.searchTerm !== "" ||
        promptStore.activeFilter !== "all" ||
        promptStore.activeStatusFilter !== null ||
        promptStore.activeTagId !== null ||
        promptStore.activeCollectionId !== null
    );

    function clearAllFilters() {
        promptStore.searchTerm = "";
        promptStore.activeFilter = "all";
        promptStore.activeStatusFilter = null;
        promptStore.activeTagId = null;
        promptStore.activeCollectionId = null;
    }
</script>

<svelte:window onclick={() => (activeRowMenuId = null)} />

{#if isFirstTime}
    <!-- 首次进入：无任何 Prompt -->
    <div class="h-full flex flex-col items-center justify-center text-center px-8 py-16">
        <div class="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <FileText size={28} />
        </div>
        <h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            开启你的提示词管理库
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm leading-relaxed">
            结构化管理 Prompt 资产，支持变量占位符、AI 实时推演测试、多版本快照与一键复用。
        </p>
        <button
            type="button"
            onclick={() => onCreateNew?.()}
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
            <Plus size={15} />
            新建首个 Prompt
        </button>
    </div>
{:else if isFilteredEmpty}
    <!-- 有数据但筛选无结果 -->
    <div class="h-full flex flex-col items-center justify-center text-center px-8 py-16">
        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
            <Search size={22} />
        </div>
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            未找到匹配的 Prompt
        </h3>
        <p class="text-xs text-slate-400 mb-4 max-w-sm">
            {#if promptStore.searchTerm}
                没有找到包含「{promptStore.searchTerm}」的条目。建议更换关键词或重置筛选。
            {:else}
                当前筛选条件下无可用提示词。
            {/if}
        </p>
        <div class="flex gap-2.5">
            {#if hasActiveFilters}
                <button
                    type="button"
                    onclick={clearAllFilters}
                    class="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
                >
                    <X size={13} />
                    清空筛选条件
                </button>
            {/if}
            <button
                type="button"
                onclick={() => onCreateNew?.()}
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium shadow-2xs"
            >
                <Plus size={13} />
                新建 Prompt
            </button>
        </div>
    </div>
{:else if viewMode === "grid"}
    <!-- 网格视图 -->
    <div class="p-5 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each prompts as prompt (prompt.id)}
            <PromptCard
                {prompt}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onToggleFavorite={handleFavorite}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onRun={handleRun}
                onOpenQuickView={handleQuickView}
                onCopyResult={onCopyResult}
                isSelected={selectedIds.has(prompt.id)}
                onSelect={handleSelect}
            />
        {/each}
    </div>
{:else}
    <!-- 高密度列表/表格行视图 (去塑料感，高信息密度与易操作性) -->
    <div class="p-4 pb-24 space-y-1">
        <!-- 列表头 -->
        <div class="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center border-b border-slate-200 dark:border-slate-800">
            <span class="w-4"></span>
            <span>提示词 / 摘要</span>
            <span class="hidden md:inline w-20 text-center">状态</span>
            <span class="hidden sm:inline w-28">标签/变量</span>
            <span class="hidden lg:inline w-24 text-right">使用/修改</span>
            <span class="w-24 text-right">操作</span>
        </div>

        <!-- 列表行 -->
        {#each prompts as prompt (prompt.id)}
            {@const status = statusConfig[prompt.status || "draft"] || statusConfig.draft}
            {@const varNum = getVarCount(prompt.content)}
            {@const isSelected = selectedIds.has(prompt.id)}

            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
            <div
                class="group px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 text-xs cursor-pointer {isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'}"
                onclick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest("button") && !target.closest("input")) {
                        handleQuickView(prompt.id);
                    }
                }}
                role="row"
                tabindex="0"
            >
                <!-- 勾选与收藏与标题 -->
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                        type="checkbox"
                        aria-label={`选择 ${prompt.title}`}
                        checked={isSelected}
                        onclick={(e) => {
                            e.stopPropagation();
                            handleSelect(prompt.id);
                        }}
                        class="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />

                    <button
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            handleFavorite(prompt.id);
                        }}
                        class="text-slate-400 hover:text-amber-500 transition-colors shrink-0 p-0.5"
                        class:text-amber-500={prompt.favorite}
                        aria-label="收藏"
                    >
                        <Star size={13} fill={prompt.favorite ? "currentColor" : "none"} />
                    </button>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {prompt.title}
                            </span>
                            {#if prompt.scene}
                                <span class="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                    {prompt.scene}
                                </span>
                            {/if}
                        </div>
                        <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xl">
                            {prompt.description || prompt.content.slice(0, 80)}
                        </p>
                    </div>
                </div>

                <!-- 状态徽标 -->
                <div class="hidden md:flex items-center justify-center w-20 shrink-0">
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium {status.bg} {status.text}">
                        <span class="w-1.5 h-1.5 rounded-full {status.dot}"></span>
                        {status.label}
                    </span>
                </div>

                <!-- 标签与变量 -->
                <div class="hidden sm:flex items-center gap-1 w-28 shrink-0 overflow-hidden">
                    {#each prompt.tags.slice(0, 1) as tagId}
                        <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[70px]">
                            {getTagName(tagId)}
                        </span>
                    {/each}
                    {#if prompt.tags.length > 1}
                        <span class="text-[10px] text-slate-400">+{prompt.tags.length - 1}</span>
                    {/if}
                    {#if varNum > 0}
                        <span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono shrink-0">
                            <Braces size={9} />
                            {varNum}
                        </span>
                    {/if}
                </div>

                <!-- 频次与时间 -->
                <div class="hidden lg:flex flex-col items-end text-[11px] text-slate-400 w-24 shrink-0 font-mono">
                    <span>{prompt.usageCount} 次</span>
                    <span class="text-[10px] text-slate-400/80">{new Date(prompt.updatedAt).toLocaleDateString()}</span>
                </div>

                <!-- 快捷操作栏 -->
                <div class="flex items-center gap-1 w-24 justify-end shrink-0 relative">
                    <button
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            handleRun(prompt.id);
                        }}
                        aria-label="运行"
                        class="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors"
                        title="运行 AI"
                    >
                        <Play size={13} fill="currentColor" />
                    </button>

                    <button
                        type="button"
                        onclick={(e) => handleRowCopy(e, prompt)}
                        aria-label="复制正文"
                        class="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="复制正文"
                    >
                        {#if copiedRowId === prompt.id}
                            <Check size={13} class="text-emerald-500" />
                        {:else}
                            <Copy size={13} />
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={(e) => {
                            e.stopPropagation();
                            handleEdit(prompt.id);
                        }}
                        aria-label="编辑"
                        class="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="编辑"
                    >
                        <Edit3 size={13} />
                    </button>

                    <!-- 更多 -->
                    <div class="relative">
                        <button
                            type="button"
                            onclick={(e) => {
                                e.stopPropagation();
                                activeRowMenuId = activeRowMenuId === prompt.id ? null : prompt.id;
                            }}
                            aria-label="更多"
                            class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                        >
                            <MoreVertical size={13} />
                        </button>

                        {#if activeRowMenuId === prompt.id}
                            <div
                                class="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 flex flex-col text-xs"
                            >
                                <button
                                    type="button"
                                    class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        activeRowMenuId = null;
                                        handleDuplicate(prompt.id);
                                    }}
                                >
                                    <Files size={12} /> 创建副本
                                </button>
                                <button
                                    type="button"
                                    class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        activeRowMenuId = null;
                                        handleArchive(prompt.id);
                                    }}
                                >
                                    {#if prompt.archived}
                                        <ArchiveRestore size={12} /> 恢复
                                    {:else}
                                        <Archive size={12} /> 归档
                                    {/if}
                                </button>
                                <div class="h-px bg-slate-100 dark:bg-slate-700 my-0.5"></div>
                                <button
                                    type="button"
                                    class="px-2.5 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 text-rose-600 dark:text-rose-400"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        activeRowMenuId = null;
                                        handleDelete(prompt.id);
                                    }}
                                >
                                    <Trash2 size={12} /> 删除
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}
