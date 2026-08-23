<script lang="ts">
    import { promptStore } from "../lib/store.svelte";
    import type { Collection, Tag } from "../lib/types";
    import TagTree from "./TagTree.svelte";
    import CollectionTree from "./CollectionTree.svelte";
    import {
        Search,
        Star,
        HelpCircle,
        Plus,
        BrainCircuit,
        Sun,
        Moon,
        Archive,
        Database,
        FileEdit,
        FlaskConical,
        CheckCircle2,
        Ban,
        X,
        PanelLeftClose,
    } from "lucide-svelte";
    import DataModal from "./modals/DataModal.svelte";
    import { onMount } from "svelte";

    let {
        isCollapsed = false,
        onToggleCollapse,
        onEditTag,
        onDeleteTag,
        onDeleteCollection,
    } = $props<{
        isCollapsed?: boolean;
        onToggleCollapse?: () => void;
        onEditTag: (tag: Tag) => void;
        onDeleteTag: (tag: Tag) => void;
        onDeleteCollection: (collection: Collection) => void;
    }>();

    let isDark = $state(false);
    let isDataModalOpen = $state(false);

    onMount(() => {
        isDark = document.documentElement.classList.contains("dark");
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.attributeName === "class") {
                    isDark = document.documentElement.classList.contains("dark");
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    });

    function toggleTheme() {
        if (isDark) {
            document.documentElement.classList.remove("dark");
        } else {
            document.documentElement.classList.add("dark");
        }
        isDark = !isDark;
    }

    function getRootTags() {
        return promptStore.tags.filter((t: Tag) => t.parentId === null);
    }

    function setFilter(type: "all" | "favorites" | "untagged" | "archived") {
        if (type === "all") {
            promptStore.activeFilter = "all";
            promptStore.activeTagId = null;
            promptStore.activeStatusFilter = null;
            promptStore.activeCollectionId = null;
        } else {
            promptStore.activeFilter = promptStore.activeFilter === type ? "all" : type;
        }
    }

    function setStatusFilter(status: string | null) {
        if (promptStore.activeStatusFilter === status) {
            promptStore.activeStatusFilter = null;
        } else {
            promptStore.activeStatusFilter = status;
        }
    }

    function clearSearch() {
        promptStore.searchTerm = "";
    }

    function statusBtnClass(statusKey: string): string {
        const isActive = promptStore.activeStatusFilter === statusKey;
        if (isActive) {
            const activeColors: Record<string, string> = {
                draft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border-indigo-200 dark:border-indigo-800",
                testing: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold border-amber-200 dark:border-amber-800",
                published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border-emerald-200 dark:border-emerald-800",
                deprecated: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold border-rose-200 dark:border-rose-800",
            };
            return `text-left px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs transition-colors border ${activeColors[statusKey] || ""}`;
        }
        return "text-left px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs transition-colors border border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
    }

    function filterBtnClass(filterKey: string): string {
        const isActive = promptStore.activeFilter === filterKey;
        if (isActive) {
            return "w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs font-semibold transition-colors bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300";
        }
        return "w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
    }

    // 统计各状态数量
    let statusCounts = $derived.by(() => {
        const nonArchived = promptStore.prompts.filter((p: { archived?: boolean }) => !p.archived);
        return {
            draft: nonArchived.filter((p: { status?: string }) => (p.status || "draft") === "draft").length,
            testing: nonArchived.filter((p: { status?: string }) => p.status === "testing").length,
            published: nonArchived.filter((p: { status?: string }) => p.status === "published").length,
            deprecated: nonArchived.filter((p: { status?: string }) => p.status === "deprecated").length,
        };
    });
</script>

<aside
    class="bg-slate-50/70 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 transition-all duration-200 ease-in-out {isCollapsed ? 'w-0 border-r-0 opacity-0 overflow-hidden pointer-events-none' : 'w-72 sm:w-80 opacity-100'}"
    aria-label="Prompt 侧边栏导航"
    aria-hidden={isCollapsed}
>
    <!-- 侧边栏头部 -->
    <div
        class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-white/50 dark:bg-slate-900/50"
    >
        <div
            class="flex items-center gap-2 cursor-pointer min-w-0"
            onclick={() => setFilter("all")}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && setFilter("all")}
        >
            <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <BrainCircuit size={18} />
            </div>
            <div class="min-w-0">
                <h1 class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    Prompt 管理
                </h1>
                <p class="text-[10px] text-slate-400 truncate">提示词工程与模版中心</p>
            </div>
        </div>

        <div class="flex items-center gap-0.5 shrink-0">
            <button
                type="button"
                onclick={(e) => { e.stopPropagation(); toggleTheme(); }}
                aria-label="切换明暗主题"
                class="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="切换主题"
            >
                {#if isDark}
                    <Sun size={15} />
                {:else}
                    <Moon size={15} />
                {/if}
            </button>

            {#if onToggleCollapse}
                <button
                    type="button"
                    onclick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
                    aria-label="折叠侧边栏 (Ctrl+B)"
                    class="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="收起侧边栏 (Ctrl+B)"
                >
                    <PanelLeftClose size={15} />
                </button>
            {/if}
        </div>
    </div>

    <!-- 搜索栏 -->
    <div class="px-3.5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div class="relative">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
                id="search-input"
                type="text"
                bind:value={promptStore.searchTerm}
                placeholder="搜索名称、内容、标签 (按 / 聚焦)..."
                class="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 outline-none transition-all"
            />
            {#if promptStore.searchTerm}
                <button
                    type="button"
                    onclick={clearSearch}
                    aria-label="清空搜索输入"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    title="清空搜索"
                >
                    <X size={12} />
                </button>
            {/if}
        </div>
        {#if promptStore.searchTerm}
            <p class="text-[11px] text-slate-500 mt-1.5 px-0.5">
                匹配 <span class="font-semibold text-indigo-600 dark:text-indigo-400">{promptStore.filteredPrompts.length}</span> 条结果
                {#if promptStore.filteredPrompts.length === 0}
                    <button type="button" onclick={clearSearch} class="text-indigo-500 hover:underline ml-1">清空搜索</button>
                {/if}
            </p>
        {/if}
    </div>

    <!-- 滚动区域 -->
    <div class="flex-1 overflow-y-auto p-3.5 space-y-4 min-h-0">
        <!-- 快速视图过滤 -->
        <div>
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                快捷过滤
            </h3>
            <div class="space-y-0.5">
                <button type="button" onclick={() => setFilter("all")} class={filterBtnClass("all")}>
                    <BrainCircuit size={13} class="text-slate-400" />
                    <span>全部提示词</span>
                    <span class="ml-auto text-[11px] text-slate-400 font-normal">
                        {promptStore.prompts.filter(p => !p.archived).length}
                    </span>
                </button>
                <button type="button" onclick={() => setFilter("favorites")} class={filterBtnClass("favorites")}>
                    <Star size={13} class="text-amber-500" />
                    <span>我的收藏</span>
                    <span class="ml-auto text-[11px] text-slate-400 font-normal">
                        {promptStore.prompts.filter(p => p.favorite && !p.archived).length}
                    </span>
                </button>
                <button type="button" onclick={() => setFilter("untagged")} class={filterBtnClass("untagged")}>
                    <HelpCircle size={13} class="text-slate-400" />
                    <span>未分类</span>
                    <span class="ml-auto text-[11px] text-slate-400 font-normal">
                        {promptStore.prompts.filter(p => (!p.tags || p.tags.length === 0) && !p.archived).length}
                    </span>
                </button>
                <button type="button" onclick={() => setFilter("archived")} class={filterBtnClass("archived")}>
                    <Archive size={13} class="text-slate-400" />
                    <span>已归档</span>
                    <span class="ml-auto text-[11px] text-slate-400 font-normal">
                        {promptStore.prompts.filter(p => p.archived).length}
                    </span>
                </button>
            </div>
        </div>

        <!-- 发布状态筛选 -->
        <div>
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                生命周期状态
            </h3>
            <div class="grid grid-cols-2 gap-1">
                <button type="button" onclick={() => setStatusFilter("draft")} class={statusBtnClass("draft")}>
                    <FileEdit size={12} class="text-indigo-500" /> 草稿
                    <span class="ml-auto text-slate-400 font-mono">{statusCounts.draft}</span>
                </button>
                <button type="button" onclick={() => setStatusFilter("testing")} class={statusBtnClass("testing")}>
                    <FlaskConical size={12} class="text-amber-500" /> 测试中
                    <span class="ml-auto text-slate-400 font-mono">{statusCounts.testing}</span>
                </button>
                <button type="button" onclick={() => setStatusFilter("published")} class={statusBtnClass("published")}>
                    <CheckCircle2 size={12} class="text-emerald-500" /> 已发布
                    <span class="ml-auto text-slate-400 font-mono">{statusCounts.published}</span>
                </button>
                <button type="button" onclick={() => setStatusFilter("deprecated")} class={statusBtnClass("deprecated")}>
                    <Ban size={12} class="text-rose-500" /> 已废弃
                    <span class="ml-auto text-slate-400 font-mono">{statusCounts.deprecated}</span>
                </button>
            </div>
        </div>

        <!-- 集合分类 -->
        <CollectionTree {onDeleteCollection} />

        <!-- 标签分类 -->
        <div>
            <div class="flex items-center justify-between mb-1.5 px-1">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    标签分类
                </h3>
                <button
                    type="button"
                    onclick={() => onEditTag({ id: "", name: "", color: "#6366f1", parentId: null, level: 0, path: "" })}
                    class="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="新建标签"
                    aria-label="新建标签"
                >
                    <Plus size={13} />
                </button>
            </div>
            <TagTree tags={getRootTags()} {onEditTag} {onDeleteTag} />
        </div>
    </div>

    <!-- 底部数据管理 -->
    <div class="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white/40 dark:bg-slate-900/40">
        <button
            type="button"
            onclick={() => (isDataModalOpen = true)}
            class="w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
            <Database size={14} class="text-slate-400" />
            <span class="font-medium">数据备份与迁移</span>
        </button>
    </div>

    <DataModal bind:isOpen={isDataModalOpen} onClose={() => (isDataModalOpen = false)} />
</aside>
