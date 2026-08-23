<script lang="ts">
    import type { Prompt } from "../lib/types";
    import { promptStore } from "../lib/store.svelte";
    import {
        Copy,
        Edit3,
        Star,
        Trash2,
        Check,
        FileJson,
        Code,
        FileText,
        ChevronDown,
        Files,
        Archive,
        ArchiveRestore,
        Play,
        Braces,
        Layers,
        MoreVertical
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let {
        prompt,
        onDelete,
        onEdit,
        onToggleFavorite,
        onDuplicate,
        onArchive,
        onRun,
        onOpenQuickView,
        onCopyResult,
        isSelected = false,
        onSelect,
    } = $props<{
        prompt: Prompt;
        onDelete: (id: string) => void;
        onEdit: (id: string) => void;
        onToggleFavorite: (id: string) => void;
        onDuplicate?: (id: string) => void;
        onArchive?: (id: string) => void;
        onRun?: (id: string) => void;
        onOpenQuickView?: (id: string) => void;
        onCopyResult?: (status: "success" | "error", format: "text" | "json" | "python") => void;
        isSelected?: boolean;
        onSelect?: (id: string) => void;
    }>();

    let copied = $state(false);
    let isMenuOpen = $state(false);
    let isMoreMenuOpen = $state(false);

    // 解析 tag name
    function getTagName(tagId: string): string {
        const tag = promptStore.tags.find((t) => t.id === tagId);
        return tag ? tag.name : tagId;
    }

    // 状态配色 (遵循克制原则，避免塑料感彩虹色)
    const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
        draft: { label: "草稿", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
        testing: { label: "测试中", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
        published: { label: "已发布", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
        deprecated: { label: "已废弃", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
    };

    let currentStatus = $derived(statusConfig[prompt.status || "draft"] || statusConfig.draft);

    // 变量计数 (支持中文及连字符)
    let varCount = $derived(() => {
        const regex = /\{\{\s*([\u4e00-\u9fa5\w-]+)\s*\}\}/g;
        const matches = prompt.content.match(regex);
        return matches ? new Set(matches.map((m: string) => m.replace(/[{}\s]/g, ''))).size : 0;
    });

    async function copyContent(format: "text" | "json" | "python") {
        if (!prompt.content) return;

        let textToCopy = "";
        switch (format) {
            case "json":
                textToCopy = JSON.stringify(prompt, null, 2);
                break;
            case "python":
                textToCopy = `prompt = """${prompt.content}"""`;
                break;
            default:
                textToCopy = prompt.content;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            copied = true;
            isMenuOpen = false;
            onCopyResult?.("success", format);
            setTimeout(() => (copied = false), 2000);
        } catch {
            onCopyResult?.("error", format);
        }
    }

    function handleCardClick(e: MouseEvent) {
        // Prevent trigger if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("a")) {
            return;
        }
        onOpenQuickView?.(prompt.id);
    }
</script>

<svelte:window onclick={() => { isMenuOpen = false; isMoreMenuOpen = false; }} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="prompt-card p-4 rounded-xl border flex flex-col h-full group relative transition-all duration-150 cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
    class:ring-2={isSelected}
    class:ring-indigo-500={isSelected}
    class:border-transparent={isSelected}
    onclick={handleCardClick}
    role="article"
    tabindex="0"
    onkeydown={(e) => {
        if (e.key === "Enter" && !(e.target as HTMLElement).closest("button")) {
            onOpenQuickView?.(prompt.id);
        }
    }}
    transition:fade={{ duration: 100 }}
>
    <!-- 顶行：选择框 + 标题 + 收藏 -->
    <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
            <input
                type="checkbox"
                aria-label={`选择提示词: ${prompt.title}`}
                checked={isSelected}
                onclick={(e) => {
                    e.stopPropagation();
                    if (onSelect) onSelect(prompt.id);
                }}
                class="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                class:!opacity-100={isSelected}
            />
            <h3 class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate min-w-0" title={prompt.title}>
                {prompt.title}
            </h3>
        </div>

        <button
            type="button"
            onclick={(e) => {
                e.stopPropagation();
                onToggleFavorite(prompt.id);
            }}
            aria-label={prompt.favorite ? "取消收藏提示词" : "收藏提示词"}
            class="text-slate-400 hover:text-amber-500 transition-colors shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            class:text-amber-500={prompt.favorite}
        >
            <Star size={15} fill={prompt.favorite ? "currentColor" : "none"} />
        </button>
    </div>

    <!-- 状态与属性徽标 (克制清晰) -->
    <div class="flex flex-wrap items-center gap-1.5 mb-2">
        <!-- 发布状态 -->
        <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium {currentStatus.bg} {currentStatus.text}">
            <span class="w-1.5 h-1.5 rounded-full {currentStatus.dot}"></span>
            {currentStatus.label}
        </span>

        <!-- 任务类型 -->
        {#if prompt.taskType}
            <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] rounded font-medium">
                {prompt.taskType}
            </span>
        {/if}

        <!-- 适用场景 -->
        {#if prompt.scene}
            <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] rounded font-medium">
                {prompt.scene}
            </span>
        {/if}

        <!-- 模型 -->
        {#if prompt.targetModel && prompt.targetModel !== "通用"}
            <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] rounded font-mono">
                {prompt.targetModel}
            </span>
        {/if}
    </div>

    <!-- 说明正文预览 -->
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 min-h-[2.4em] leading-relaxed">
        {prompt.description || prompt.content}
    </p>

    <!-- 标签 + 变量指示 -->
    <div class="flex flex-wrap items-center gap-1.5 mb-3 mt-auto">
        {#each prompt.tags.slice(0, 3) as tagId}
            <span class="px-1.5 py-0.5 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] rounded font-medium">
                {getTagName(tagId)}
            </span>
        {/each}
        {#if prompt.tags.length > 3}
            <span class="text-[10px] text-slate-400">+{prompt.tags.length - 3}</span>
        {/if}

        {#if varCount() > 0}
            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] rounded font-mono" title="包含模板变量">
                <Braces size={10} />
                {varCount()} 变量
            </span>
        {/if}
    </div>

    <!-- 底栏操作区 (精简利落，消除臃肿塑料感) -->
    <div class="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>使用 {prompt.usageCount} 次</span>
            <span>·</span>
            <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
        </div>

        <div class="flex items-center gap-1 relative">
            <!-- 运行 -->
            <button
                type="button"
                onclick={(e) => {
                    e.stopPropagation();
                    onRun?.(prompt.id);
                }}
                aria-label="运行并填写变量"
                class="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors"
                title="运行并填写变量"
            >
                <Play size={13} fill="currentColor" />
            </button>

            <!-- 复制格式下拉 -->
            <div class="relative">
                <button
                    type="button"
                    onclick={(e) => {
                        e.stopPropagation();
                        isMoreMenuOpen = false;
                        isMenuOpen = !isMenuOpen;
                    }}
                    aria-label="复制选项"
                    class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-0.5"
                    class:text-emerald-500={copied}
                    class:text-slate-500={!copied}
                    title="复制 Prompt"
                >
                    {#if copied}
                        <Check size={13} />
                    {:else}
                        <Copy size={13} />
                    {/if}
                    <ChevronDown size={9} class="opacity-60" />
                </button>

                {#if isMenuOpen}
                    <div
                        class="absolute bottom-full right-0 mb-1.5 w-28 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-30 flex flex-col py-1 text-xs"
                        transition:slide={{ duration: 100 }}
                    >
                        <button
                            type="button"
                            class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            onclick={(e) => {
                                e.stopPropagation();
                                copyContent("text");
                            }}
                        >
                            <FileText size={12} /> 复制正文
                        </button>
                        <button
                            type="button"
                            class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            onclick={(e) => {
                                e.stopPropagation();
                                copyContent("json");
                            }}
                        >
                            <FileJson size={12} /> 复制 JSON
                        </button>
                        <button
                            type="button"
                            class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            onclick={(e) => {
                                e.stopPropagation();
                                copyContent("python");
                            }}
                        >
                            <Code size={12} /> 复制 Python
                        </button>
                    </div>
                {/if}
            </div>

            <!-- 编辑 -->
            <button
                type="button"
                onclick={(e) => {
                    e.stopPropagation();
                    onEdit(prompt.id);
                }}
                aria-label="编辑提示词"
                class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                title="编辑 Prompt"
            >
                <Edit3 size={13} />
            </button>

            <!-- 更多操作下拉 -->
            <div class="relative">
                <button
                    type="button"
                    onclick={(e) => {
                        e.stopPropagation();
                        isMenuOpen = false;
                        isMoreMenuOpen = !isMoreMenuOpen;
                    }}
                    aria-label="更多操作"
                    class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    title="更多选项"
                >
                    <MoreVertical size={13} />
                </button>

                {#if isMoreMenuOpen}
                    <div
                        class="absolute bottom-full right-0 mb-1.5 w-28 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-30 flex flex-col py-1 text-xs"
                        transition:slide={{ duration: 100 }}
                    >
                        <button
                            type="button"
                            class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            onclick={(e) => {
                                e.stopPropagation();
                                isMoreMenuOpen = false;
                                onDuplicate?.(prompt.id);
                            }}
                        >
                            <Files size={12} /> 创建副本
                        </button>
                        <button
                            type="button"
                            class="px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            onclick={(e) => {
                                e.stopPropagation();
                                isMoreMenuOpen = false;
                                onArchive?.(prompt.id);
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
                                isMoreMenuOpen = false;
                                onDelete(prompt.id);
                            }}
                        >
                            <Trash2 size={12} /> 删除
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
