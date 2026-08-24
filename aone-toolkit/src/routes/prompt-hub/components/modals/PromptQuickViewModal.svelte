<script lang="ts">
    import type { Prompt, VariableDef } from "../../lib/types";
    import { promptStore } from "../../lib/store.svelte";
    import {
        X,
        Play,
        Copy,
        Check,
        Edit3,
        FileText,
        Code,
        Sparkles,
        Star,
        Archive,
        ArchiveRestore,
        Files,
        ExternalLink,
        Braces,
        Tag as TagIcon,
        Folder,
        CheckCircle2
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { marked } from "marked";
    import RichMessageContent from "../../../multi-agent/components/RichMessageContent.svelte";
    import { CodeBlock } from "$lib/components/ui";

    let {
        isOpen = false,
        prompt,
        onClose,
        onEdit,
        onRun,
        onDuplicate,
        onArchive,
    } = $props<{
        isOpen: boolean;
        prompt: Prompt | null;
        onClose: () => void;
        onEdit?: (id: string) => void;
        onRun?: (id: string, initialValues?: Record<string, string>) => void;
        onDuplicate?: (id: string) => void;
        onArchive?: (id: string) => void;
    }>();

    let values = $state<Record<string, string>>({});
    let copiedFormat = $state<string | null>(null);
    let previewTab = $state<"rendered" | "compiled" | "raw">("rendered");

    // Extract variables (支持中文)
    let variables = $derived.by(() => {
        if (!prompt) return [];
        const regex = /\{\{\s*([\u4e00-\u9fa5\w-]+)\s*\}\}/g;
        const matches = [...prompt.content.matchAll(regex)];
        return [...new Set(matches.map((m) => m[1]))];
    });

    // Populate initial variable values
    $effect(() => {
        if (isOpen && prompt) {
            const initial: Record<string, string> = {};
            variables.forEach((v) => {
                const def = prompt?.variableDefs?.find((vd: VariableDef) => vd.name === v);
                initial[v] = def?.defaultValue || def?.exampleValue || "";
            });
            values = initial;
        }
    });

    let compiledPrompt = $derived.by(() => {
        if (!prompt) return "";
        let text = prompt.content;
        for (const [k, v] of Object.entries(values)) {
            const regex = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g");
            if (v !== undefined && v !== "") {
                text = text.replace(regex, v);
            }
        }
        return text;
    });

    let renderedHtml = $derived.by(() => {
        try {
            return marked.parse(compiledPrompt) as string;
        } catch {
            return compiledPrompt;
        }
    });

    async function copyContent(format: "text" | "json" | "python") {
        if (!prompt) return;
        let text = "";
        if (format === "json") {
            text = JSON.stringify(prompt, null, 2);
        } else if (format === "python") {
            text = `prompt = """${compiledPrompt}"""`;
        } else {
            text = compiledPrompt;
        }

        try {
            await navigator.clipboard.writeText(text);
            copiedFormat = format;
            setTimeout(() => (copiedFormat = null), 2000);
        } catch (e) {
            console.error(e);
        }
    }

    function getTagName(tagId: string): string {
        const tag = promptStore.tags.find((t) => t.id === tagId);
        return tag ? tag.name : tagId;
    }

    function getCollectionName(cId?: string): string {
        if (!cId) return "";
        const col = promptStore.collections.find((c) => c.id === cId);
        return col ? col.name : "";
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && prompt}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
        transition:fade={{ duration: 120 }}
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            transition:scale={{ duration: 150, start: 0.97 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Top Header -->
            <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2.5 min-w-0">
                    <button
                        type="button"
                        onclick={() => promptStore.toggleFavorite(prompt.id)}
                        class="text-slate-400 hover:text-amber-500 transition-colors shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        class:text-amber-500={prompt.favorite}
                        title={prompt.favorite ? "取消收藏" : "加入收藏"}
                    >
                        <Star size={16} fill={prompt.favorite ? "currentColor" : "none"} />
                    </button>
                    <div class="min-w-0">
                        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {prompt.title}
                        </h2>
                        <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {#if prompt.collectionId}
                                <span class="inline-flex items-center gap-1">
                                    <Folder size={11} class="text-slate-400" />
                                    {getCollectionName(prompt.collectionId)}
                                </span>
                                <span>•</span>
                            {/if}
                            <span>修改于 {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>使用 {prompt.usageCount} 次</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5">
                    <button
                        type="button"
                        onclick={() => {
                            onClose();
                            onEdit?.(prompt.id);
                        }}
                        class="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                        title="编辑 Prompt"
                    >
                        <Edit3 size={13} />
                        <span>编辑</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => {
                            onClose();
                            onRun?.(prompt.id, { ...values });
                        }}
                        class="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="进入实时 AI 运行推演"
                    >
                        <Play size={12} fill="currentColor" />
                        <span>运行 AI</span>
                    </button>

                    <div class="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <button
                        type="button"
                        onclick={onClose}
                        class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="关闭"
                        aria-label="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <!-- Content Area: Split View -->
            <div class="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
                <!-- Left: Metadata & Variables -->
                <div class="w-full md:w-80 bg-slate-50/50 dark:bg-slate-900/40 p-4 overflow-y-auto flex flex-col space-y-4 shrink-0">
                    <!-- Description -->
                    {#if prompt.description}
                        <div>
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">说明描述</span>
                            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                {prompt.description}
                            </p>
                        </div>
                    {/if}

                    <!-- Meta Tags -->
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">属性信息</span>
                        <div class="flex flex-wrap gap-1.5">
                            {#if prompt.status}
                                <span class="px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                    状态: {prompt.status}
                                </span>
                            {/if}
                            {#if prompt.taskType}
                                <span class="px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                    {prompt.taskType}
                                </span>
                            {/if}
                            {#if prompt.scene}
                                <span class="px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                    {prompt.scene}
                                </span>
                            {/if}
                            {#if prompt.targetModel && prompt.targetModel !== "通用"}
                                <span class="px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                    {prompt.targetModel}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- Tags -->
                    {#if prompt.tags.length > 0}
                        <div>
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">标签</span>
                            <div class="flex flex-wrap gap-1.5">
                                {#each prompt.tags as tId}
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        <TagIcon size={10} />
                                        {getTagName(tId)}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Variable Inputs (Interactive Test Fill) -->
                    {#if variables.length > 0}
                        <div class="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                            <div class="flex items-center justify-between">
                                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Braces size={12} class="text-indigo-500" />
                                    试填变量
                                </span>
                                <span class="text-[10px] text-slate-400">{variables.length} 个占位符</span>
                            </div>

                            {#each variables as varName}
                                <div class="space-y-1">
                                    <label for={`qv-var-${varName}`} class="block text-[11px] font-mono text-slate-600 dark:text-slate-400">
                                        {`{{${varName}}}`}
                                    </label>
                                    <input
                                        id={`qv-var-${varName}`}
                                        type="text"
                                        bind:value={values[varName]}
                                        placeholder={`输入 ${varName}...`}
                                        class="w-full px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <!-- Output Format if any -->
                    {#if prompt.outputFormat}
                        <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">输出格式要求</span>
                            <p class="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                                {prompt.outputFormat}
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- Right: Prompt Viewer & Copy Formats -->
                <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
                    <!-- Tab Bar -->
                    <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
                        <div class="flex bg-slate-200/70 dark:bg-slate-800 rounded-md p-0.5 text-xs">
                            <button
                                type="button"
                                onclick={() => (previewTab = "rendered")}
                                class="px-3 py-1 rounded transition-colors {previewTab === 'rendered' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                排版渲染
                            </button>
                            <button
                                type="button"
                                onclick={() => (previewTab = "compiled")}
                                class="px-3 py-1 rounded transition-colors {previewTab === 'compiled' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                填充后纯文本
                            </button>
                            <button
                                type="button"
                                onclick={() => (previewTab = "raw")}
                                class="px-3 py-1 rounded transition-colors {previewTab === 'raw' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                原始模板
                            </button>
                        </div>

                        <!-- Copy Actions -->
                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                onclick={() => copyContent("text")}
                                class="px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                                title="复制正文文本"
                            >
                                {#if copiedFormat === "text"}
                                    <Check size={12} class="text-emerald-500" />
                                    <span class="text-emerald-600 font-medium">已复制文本</span>
                                {:else}
                                    <Copy size={12} />
                                    <span>复制正文</span>
                                {/if}
                            </button>

                            <button
                                type="button"
                                onclick={() => copyContent("json")}
                                class="px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                                title="复制为 JSON 对象"
                            >
                                {#if copiedFormat === "json"}
                                    <Check size={12} class="text-emerald-500" />
                                    <span class="text-emerald-600 font-medium">已复制 JSON</span>
                                {:else}
                                    <Code size={12} />
                                    <span>复制 JSON</span>
                                {/if}
                            </button>
                        </div>
                    </div>

                    <!-- Viewer Content -->
                    <div class="flex-1 p-5 overflow-y-auto min-h-[300px]">
                        {#if previewTab === "rendered"}
                            <div class="w-full text-xs sm:text-sm">
                                <RichMessageContent content={compiledPrompt} />
                            </div>
                        {:else if previewTab === "compiled"}
                            <CodeBlock
                                code={compiledPrompt}
                                language="markdown"
                                showHeader={false}
                                wrapLines={true}
                                class="!my-0"
                            />
                        {:else}
                            <CodeBlock
                                code={prompt.content}
                                language="markdown"
                                showHeader={false}
                                wrapLines={true}
                                class="!my-0"
                            />
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
