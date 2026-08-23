<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import type { Prompt, VariableDef, TestCase, PromptVersion } from "../../lib/types";
    import { TASK_TYPES, TARGET_MODELS } from "../../lib/types";
    import { onMount, untrack } from "svelte";
    import { marked } from "marked";
    import { diffLines, type Change } from "diff";
    import {
        X,
        Plus,
        Clock,
        RotateCcw,
        Trash2,
        Bot,
        Play,
        Square,
        Sparkles,
        Check,
        Copy,
        CheckCircle2,
        Save,
        BarChart2,
        AlertCircle,
        Code,
        GitCompare,
        FileText,
        Braces,
        SlidersHorizontal,
        ChevronDown,
        ChevronUp,
        Star,
        Zap,
        History,
        FileCode,
        Settings,
        Edit2,
        Tag as TagIcon,
        Folder,
        Eraser
    } from "lucide-svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { AIBridge } from "$lib/services/AIBridge";
    import RichMessageContent from "../../../multi-agent/components/RichMessageContent.svelte";
    import PromptCodeEditor from "../PromptCodeEditor.svelte";

    let {
        promptId = null,
        initialRightTab = "playground",
        onClose,
        onCreateTag,
    } = $props<{
        promptId: string | null;
        initialRightTab?: "playground" | "preview" | "compiled" | "history";
        onClose: () => void;
        onCreateTag: () => void;
    }>();

    // ——— 基本信息 ———
    let title = $state("");
    let description = $state("");
    let scene = $state("");
    let taskType = $state("");
    let targetModel = $state("");
    let status = $state<"draft" | "testing" | "published" | "deprecated">("draft");
    let collectionId = $state<string | undefined>(undefined);
    let tags = $state<string[]>([]);
    let favorite = $state(false);
    let outputFormat = $state("");
    let isAdvancedOpen = $state(false);

    // ——— 正文内容 ———
    let content = $state("");
    let promptEditorRef = $state<any>(null);
    let textareaRef = $state<HTMLTextAreaElement | null>(null);

    // ——— 变量单源化管理 ———
    let variableDefs = $state<VariableDef[]>([]);
    let testValues = $state<Record<string, string>>({});
    let editingVarName = $state<string | null>(null);
    let tempRenameValue = $state("");

    // 从 content 中提取变量名（唯一真实来源）
    let detectedVarNames = $derived.by(() => {
        const regex = /\{\{\s*([\u4e00-\u9fa5\w-]+)\s*\}\}/g;
        const matches = [...content.matchAll(regex)];
        return [...new Set(matches.map((m) => m[1]))];
    });

    // 状态单源同步机制：确保 variableDefs 和 testValues 紧跟 detectedVarNames
    $effect(() => {
        const names = detectedVarNames;
        untrack(() => {
            const currentDefs = [...variableDefs];
            const defMap = new Map(currentDefs.map((d) => [d.name, d]));

            // 按正文出现顺序重构 definitions
            const updatedDefs: VariableDef[] = names.map((name) => {
                const existing = defMap.get(name);
                if (existing) return existing;
                return {
                    name,
                    description: "",
                    required: true,
                    defaultValue: "",
                    exampleValue: "",
                    inputType: "text",
                };
            });

            // 同步测试值字典
            const updatedTestValues = { ...testValues };
            names.forEach((name) => {
                if (updatedTestValues[name] === undefined) {
                    const def = defMap.get(name);
                    updatedTestValues[name] = def?.defaultValue || def?.exampleValue || "";
                }
            });

            // 仅在结构变动时赋值，避免循环刷新
            const namesKey = names.join(",");
            const currentKey = variableDefs.map((d) => d.name).join(",");
            if (namesKey !== currentKey || variableDefs.length !== updatedDefs.length) {
                variableDefs = updatedDefs;
                testValues = updatedTestValues;
            }
        });
    });

    // 光标处插入变量
    function insertVariableAtCursor(varName: string) {
        const placeholder = `{{${varName}}}`;
        if (promptEditorRef?.insertAtCursor) {
            promptEditorRef.insertAtCursor(placeholder);
        } else if (textareaRef) {
            const start = textareaRef.selectionStart ?? content.length;
            const end = textareaRef.selectionEnd ?? content.length;
            content = content.slice(0, start) + placeholder + content.slice(end);
            setTimeout(() => {
                if (textareaRef) {
                    textareaRef.focus();
                    textareaRef.setSelectionRange(start + placeholder.length, start + placeholder.length);
                }
            }, 10);
        } else {
            content = content ? `${content}\n${placeholder}` : placeholder;
        }
        toastStore.info(`已插入变量 ${placeholder}`);
    }

    function clearAllTestValues() {
        testValues = {};
        toastStore.info("已清空所有测试注入值");
    }

    function createNewVariable() {
        let count = detectedVarNames.length + 1;
        let newName = `var_${count}`;
        while (detectedVarNames.includes(newName)) {
            count++;
            newName = `var_${count}`;
        }
        insertVariableAtCursor(newName);
    }

    // 原子级重命名变量：同步正文与元数据
    function renameVariableAtomic(oldName: string, newName: string) {
        const cleanName = newName.trim().replace(/[^\u4e00-\u9fa5\w-]/g, "");
        if (!cleanName || cleanName === oldName) {
            editingVarName = null;
            return;
        }
        if (detectedVarNames.includes(cleanName)) {
            toastStore.warning(`变量 {{${cleanName}}} 已存在`);
            editingVarName = null;
            return;
        }

        const regex = new RegExp(`\\{\\{\\s*${oldName}\\s*\\}\\}`, "g");
        content = content.replace(regex, `{{${cleanName}}}`);

        variableDefs = variableDefs.map((vd) => {
            if (vd.name === oldName) {
                return { ...vd, name: cleanName };
            }
            return vd;
        });

        if (testValues[oldName] !== undefined) {
            testValues[cleanName] = testValues[oldName];
            delete testValues[oldName];
        }

        editingVarName = null;
        toastStore.success(`已将 {{${oldName}}} 重命名为 {{${cleanName}}}`);
    }

    // 删除变量：从正文中剥离所有占位符
    function removeVariableAtomic(varName: string) {
        const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, "g");
        content = content.replace(regex, "");
        variableDefs = variableDefs.filter((vd) => vd.name !== varName);
        const updated = { ...testValues };
        delete updated[varName];
        testValues = updated;
        toastStore.info(`已从正文中移除 {{${varName}}}`);
    }

    function fillAllExampleValues() {
        if (variableDefs.length === 0) return;
        variableDefs.forEach((vd) => {
            if (vd.exampleValue || vd.defaultValue) {
                testValues[vd.name] = vd.exampleValue || vd.defaultValue || "";
            }
        });
        toastStore.info("已填入变量预置示例值");
    }

    // 编译后的 Prompt（注入测试值）
    let compiledPrompt = $derived.by(() => {
        let text = content;
        for (const [key, val] of Object.entries(testValues)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
            text = text.replace(regex, val || `{{${key}}}`);
        }
        return text;
    });

    // 右侧工作台 Tab 切换
    let rightTab = $state<"playground" | "preview" | "compiled" | "history">(initialRightTab);

    let renderedMarkdownHtml = $derived.by(() => {
        try {
            return marked.parse(compiledPrompt) as string;
        } catch {
            return '<p class="text-rose-500">Markdown 渲染出错</p>';
        }
    });

    // ——— AI 推演与性能测试 ———
    let isTestingAI = $state(false);
    let aiTestResult = $state("");
    let aiLatency = $state(0);
    let aiSpeed = $state(0);
    let aiError = $state<string | null>(null);
    let aiAbortCtrl = $state<AbortController | null>(null);
    let testScore = $state(5);
    let testCaseSaved = $state(false);
    let copiedCompiled = $state(false);
    let copiedAI = $state(false);
    let copiedFormat = $state<string | null>(null);

    let renderedAITestHtml = $derived.by(() => {
        if (!aiTestResult) return "";
        try {
            return marked.parse(aiTestResult) as string;
        } catch {
            return aiTestResult;
        }
    });

    async function runEditorAITest() {
        if (!compiledPrompt.trim() || isTestingAI) return;

        isTestingAI = true;
        aiTestResult = "";
        aiError = null;
        testCaseSaved = false;
        const startTime = performance.now();
        aiAbortCtrl = new AbortController();

        try {
            if (settingsStore.isConfigured) {
                const options = settingsStore.getCallOptions({
                    stream: true,
                    signal: aiAbortCtrl.signal,
                    onChunk: (chunk: string) => {
                        aiTestResult += chunk;
                        const elapsedSec = (performance.now() - startTime) / 1000;
                        if (elapsedSec > 0.1) {
                            aiSpeed = Math.round(aiTestResult.length / elapsedSec);
                        }
                    },
                });
                const finalResult = await AIBridge.callAI(compiledPrompt, options);
                aiTestResult = finalResult;
            } else {
                const simChunks = [
                    `【本地模拟推理测试响应】\n\n`,
                    `已成功解析并编译当前 Prompt 指令：\n\n`,
                    `**当前注入参数**：\n`,
                    ...Object.entries(testValues).map(([k, v]) => `- \`{{${k}}}\`: "${v}"\n`),
                    `\n---\n\n### 模版推演结论\n`,
                    `1. **参数解析度**：完整，${Object.keys(testValues).length} 个动态变量已准确插桩。\n`,
                    `2. **期望输出规格**：${outputFormat || '无特殊限制'}\n\n`,
                    `> 💡 **提示**：若需获取真实模型推理输出，请点击右上角「配置 AI」绑定 API Key。`,
                ];

                for (const chunk of simChunks) {
                    if (aiAbortCtrl.signal.aborted) break;
                    await new Promise((r) => setTimeout(r, 50));
                    aiTestResult += chunk;
                }
            }

            aiLatency = Math.round(performance.now() - startTime);
            const totalElapsedSec = aiLatency / 1000;
            aiSpeed = totalElapsedSec > 0 ? Math.round(aiTestResult.length / totalElapsedSec) : aiTestResult.length;
        } catch (err: any) {
            if (err.name === "AbortError") {
                aiError = "测试已中止。";
            } else {
                aiError = err.message || "调用失败，请检查 AI 服务配置。";
            }
        } finally {
            isTestingAI = false;
            aiAbortCtrl = null;
        }
    }

    function stopEditorAITest() {
        if (aiAbortCtrl) aiAbortCtrl.abort();
    }

    function saveEditorTestCase() {
        if (!aiTestResult.trim() || !promptId) return;

        const newCase: TestCase = {
            id: crypto.randomUUID(),
            label: `用例 #${testCases.length + 1} (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
            inputs: { ...testValues },
            expectedOutput: outputFormat || "符合指令要求",
            actualOutput: aiTestResult,
            passed: testScore >= 3,
            score: testScore,
            latencyMs: aiLatency,
            tokens: Math.round(aiTestResult.length * 0.6),
            model: settingsStore.isConfigured
                ? `${settingsStore.currentProvider?.name}/${settingsStore.selectedModel}`
                : "模拟模型",
            testedAt: Date.now(),
        };

        testCases = [newCase, ...testCases];
        testCaseSaved = true;
        toastStore.success("已归档至测试用例库");
        setTimeout(() => (testCaseSaved = false), 3000);
    }

    // ——— 版本快照与 Diff 对比 ———
    let testCases = $state<TestCase[]>([]);
    let selectedVersionId = $state<string | null>(null);

    let activeVersionDiff = $derived.by(() => {
        if (!selectedVersionId || !promptId) return null;
        const version = promptStore.getVersions(promptId).find((v) => v.versionId === selectedVersionId);
        if (!version) return null;
        const diffs: Change[] = diffLines(version.content, content);
        return { version, diffs };
    });

    function handleRestore(version: PromptVersion) {
        if (confirm(`是否恢复至 ${version.versionNumber || "历史版本"}？当前未保存的修改将被覆盖。`)) {
            content = version.content;
            title = version.title;
            if (version.description) description = version.description;
            rightTab = "playground";
            toastStore.success(`已成功恢复至 ${version.versionNumber}`);
        }
    }

    // ——— 状态管理与保存 ———
    let changeNote = $state("");
    let initialSnapshot = $state("");
    let isDiscardConfirmOpen = $state(false);

    function getSnapshot() {
        return JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            description: description.trim(),
            scene: scene.trim(),
            taskType,
            targetModel,
            status,
            collectionId,
            tags,
            favorite,
            outputFormat: outputFormat.trim(),
            variableDefs,
        });
    }

    let isDirty = $derived(initialSnapshot !== "" && getSnapshot() !== initialSnapshot);

    function handleAttemptClose() {
        if (isDirty) {
            isDiscardConfirmOpen = true;
        } else {
            onClose();
        }
    }

    onMount(() => {
        if (promptId) {
            const p = promptStore.prompts.find((p: Prompt) => p.id === promptId);
            if (p) {
                title = p.title;
                content = p.content;
                description = p.description || "";
                collectionId = p.collectionId;
                tags = [...(p.tags || [])];
                favorite = p.favorite || false;
                scene = p.scene || "";
                taskType = p.taskType || "";
                targetModel = p.targetModel || "";
                status = p.status || "draft";
                outputFormat = p.outputFormat || "";
                variableDefs = p.variableDefs ? [...p.variableDefs] : [];
                testCases = p.testCases ? [...p.testCases] : [];
            }
            const versions = promptStore.getVersions(promptId);
            if (versions.length > 0) {
                selectedVersionId = versions[0].versionId;
            }
        }
        initialSnapshot = getSnapshot();
    });

    function requestSave() {
        if (!title.trim()) {
            toastStore.warning("请填写 Prompt 标题");
            return;
        }
        if (!content.trim()) {
            toastStore.warning("请填写 Prompt 正文内容");
            return;
        }
        doSave(changeNote.trim() || (promptId ? "更新提示词" : "创建新提示词"));
    }

    function doSave(note: string) {
        const promptData: Prompt = {
            id: promptId || crypto.randomUUID(),
            title: title.trim(),
            content: content.trim(),
            description: description.trim(),
            collectionId,
            tags,
            favorite,
            scene: scene.trim(),
            taskType,
            targetModel,
            status,
            outputFormat: outputFormat.trim(),
            variableDefs,
            testCases,
            createdAt: promptId
                ? promptStore.prompts.find((p: Prompt) => p.id === promptId)?.createdAt || Date.now()
                : Date.now(),
            updatedAt: Date.now(),
            usageCount: promptId
                ? promptStore.prompts.find((p: Prompt) => p.id === promptId)?.usageCount || 0
                : 0,
        };

        if (promptId) {
            promptStore.updatePrompt(promptId, promptData, true, note || "手动保存");
        } else {
            promptStore.addPrompt(promptData);
        }
        initialSnapshot = getSnapshot();
        toastStore.success(`已保存「${promptData.title}」`);
        onClose();
    }

    function toggleTag(tagId: string) {
        if (tags.includes(tagId)) {
            tags = tags.filter((t) => t !== tagId);
        } else {
            tags = [...tags, tagId];
        }
    }

    async function copyFormattedContent(format: "text" | "json" | "python") {
        let text = "";
        if (format === "json") {
            text = JSON.stringify(
                {
                    title,
                    content: compiledPrompt,
                    variables: testValues,
                    outputFormat,
                },
                null,
                2
            );
        } else if (format === "python") {
            text = `prompt = """${compiledPrompt}"""`;
        } else {
            text = compiledPrompt;
        }

        try {
            await navigator.clipboard.writeText(text);
            copiedFormat = format;
            setTimeout(() => (copiedFormat = null), 2000);
        } catch {
            toastStore.error("复制失败");
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && !isDiscardConfirmOpen) {
            handleAttemptClose();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            requestSave();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div
    class="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4"
    onclick={handleAttemptClose}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
>
    <div
        class="bg-white dark:bg-slate-900 w-full max-w-6xl h-[92vh] rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
        onclick={(e) => e.stopPropagation()}
        role="document"
        tabindex="-1"
        aria-labelledby="prompt-studio-title"
    >
        <!-- 顶部控制条 (精致工程级 Studio 工作台) -->
        <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/90 dark:bg-slate-900/90 gap-3">
            <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 shrink-0">
                    <FileText size={15} />
                </div>

                <!-- 标题输入 (融入式行内设计) -->
                <input
                    id="prompt-studio-title"
                    type="text"
                    bind:value={title}
                    placeholder="输入 Prompt 标题，例如：商务邮件起草专家..."
                    class="font-semibold text-sm bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none px-2 py-1 rounded-md min-w-[200px] max-w-md transition-all"
                />

                {#if isDirty}
                    <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-medium shrink-0">未保存</span>
                {/if}

                <!-- 状态切换胶囊 -->
                <div class="relative inline-flex items-center">
                    <select
                        bind:value={status}
                        class="text-xs pl-5 pr-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors appearance-none"
                    >
                        <option value="draft">草稿</option>
                        <option value="testing">测试中</option>
                        <option value="published">已发布</option>
                        <option value="deprecated">已废弃</option>
                    </select>
                    <span class="absolute left-2 w-1.5 h-1.5 rounded-full pointer-events-none {status === 'published' ? 'bg-emerald-500' : status === 'testing' ? 'bg-sky-500' : status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'}"></span>
                </div>

                <!-- 收藏 -->
                <button
                    type="button"
                    onclick={() => (favorite = !favorite)}
                    class="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    class:text-amber-500={favorite}
                    title={favorite ? "已收藏" : "点击收藏"}
                >
                    <Star size={15} fill={favorite ? "currentColor" : "none"} />
                </button>

                <!-- 高级属性折叠触发器 -->
                <button
                    type="button"
                    onclick={() => (isAdvancedOpen = !isAdvancedOpen)}
                    class="px-2.5 py-1 rounded-md text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors {isAdvancedOpen ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' : ''}"
                    title="配置业务场景、模型偏好、分类与标签"
                >
                    <SlidersHorizontal size={12} class="text-indigo-500" />
                    <span>属性配置</span>
                    {#if isAdvancedOpen}
                        <ChevronUp size={12} />
                    {:else}
                        <ChevronDown size={12} />
                    {/if}
                </button>
            </div>

            <!-- 右侧快捷保存与关闭 -->
            <div class="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onclick={requestSave}
                    class="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                    <Save size={13} />
                    <span>保存</span>
                    <kbd class="hidden sm:inline px-1 py-0.5 text-[9px] font-mono bg-indigo-700/70 dark:bg-indigo-800/80 rounded border border-indigo-500/40">Ctrl+S</kbd>
                </button>

                <button
                    type="button"
                    onclick={handleAttemptClose}
                    class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label="关闭编辑器"
                >
                    <X size={16} />
                </button>
            </div>
        </div>

        <!-- 折叠高级属性区 (优雅分组微网格) -->
        {#if isAdvancedOpen}
            <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 text-xs space-y-3 shadow-inner">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <!-- 模块 1: 业务定位 -->
                    <div class="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <div class="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <Folder size={12} class="text-indigo-500" />
                            <span>业务定位</span>
                        </div>
                        <div class="space-y-1.5">
                            <input
                                type="text"
                                bind:value={description}
                                placeholder="功能简要描述（如：精准周报生成助手）"
                                class="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none text-xs"
                            />
                            <div class="grid grid-cols-2 gap-1.5">
                                <input
                                    type="text"
                                    bind:value={scene}
                                    placeholder="业务场景 (代码审查)"
                                    class="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none text-xs"
                                />
                                <select
                                    bind:value={collectionId}
                                    class="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none text-xs"
                                >
                                    <option value={undefined}>所属集合: 未分类</option>
                                    {#each promptStore.collections as col}
                                        <option value={col.id}>{col.name}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 模块 2: 推理与输出规范 -->
                    <div class="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <div class="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <Bot size={12} class="text-indigo-500" />
                            <span>推理与输出规范</span>
                        </div>
                        <div class="space-y-1.5">
                            <div class="grid grid-cols-2 gap-1.5">
                                <select
                                    bind:value={taskType}
                                    class="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none text-xs"
                                >
                                    <option value="">任务类型: 不限</option>
                                    {#each TASK_TYPES as t}
                                        <option value={t}>{t}</option>
                                    {/each}
                                </select>
                                <select
                                    bind:value={targetModel}
                                    class="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none text-xs"
                                >
                                    <option value="">目标模型: 通用</option>
                                    {#each TARGET_MODELS as m}
                                        <option value={m}>{m}</option>
                                    {/each}
                                </select>
                            </div>
                            <input
                                type="text"
                                bind:value={outputFormat}
                                placeholder="期望格式（如：仅输出 JSON，不要任何问候与解释）"
                                class="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none text-xs"
                            />
                        </div>
                    </div>

                    <!-- 模块 3: 标签归属 -->
                    <div class="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                <TagIcon size={12} class="text-indigo-500" />
                                <span>标签体系</span>
                            </div>
                            <button
                                type="button"
                                onclick={onCreateTag}
                                class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                                <Plus size={10} /> 新建标签
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-0.5">
                            {#each promptStore.tags as tag}
                                <button
                                    type="button"
                                    onclick={() => toggleTag(tag.id)}
                                    class="px-2 py-0.5 rounded text-[10.5px] border transition-colors {tags.includes(tag.id) ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}"
                                >
                                    {tag.name}
                                </button>
                            {/each}
                            {#if promptStore.tags.length === 0}
                                <span class="text-[11px] text-slate-400 italic">暂无标签，点击右上角新建</span>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- 主工作台 (左右双栏分屏，沉浸且无层级阻断) -->
        <div class="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-0 overflow-hidden">
            <!-- 左栏：Prompt 模板编辑与变量配置 (52% 宽度) -->
            <div class="w-full md:w-[52%] flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
                <!-- 编辑器顶部工具行：变量快速插入胶囊 -->
                <div class="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between shrink-0 gap-2">
                    <div class="flex items-center gap-1.5 shrink-0">
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Code size={13} class="text-indigo-500" />
                            模板正文
                        </span>
                    </div>

                    <!-- 快速插入变量胶囊流式布局 -->
                    <div class="flex items-center gap-1 overflow-x-auto py-0.5">
                        {#each detectedVarNames as vName}
                            <button
                                type="button"
                                onclick={() => insertVariableAtCursor(vName)}
                                class="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-medium border border-indigo-200/60 dark:border-indigo-900/60 transition-colors shrink-0"
                                title="点击在光标处再次插入"
                            >
                                + {`{{${vName}}}`}
                            </button>
                        {/each}

                        <button
                            type="button"
                            onclick={createNewVariable}
                            class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 dark:text-slate-300 font-medium text-[10.5px] flex items-center gap-1 transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60"
                            title="新增变量插桩"
                        >
                            <Plus size={10} /> 插入新变量
                        </button>
                    </div>
                </div>

                <!-- 正文专业代码编辑区 (CodeMirror 6 高亮与行号) -->
                <div class="flex-1 p-3 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-900">
                    <PromptCodeEditor
                        bind:this={promptEditorRef}
                        bind:value={content}
                        placeholder={"在此输入 Prompt 核心指令...\n\n使用 {{变量名}} 定义动态参数，例如：\n请将以下代码审查并重构为 {{language}} 规范代码：\n\n```{{language}}\n{{code}}\n```"}
                    />
                </div>

                <!-- 编辑器底部 IDE 状态条 -->
                <div class="px-3.5 py-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
                    <div class="flex items-center gap-2.5">
                        <span>{content.length} 字符</span>
                        <span>·</span>
                        <span>~{Math.round(content.length * 0.6)} Tokens</span>
                        <span>·</span>
                        <span>{detectedVarNames.length} 个动态变量</span>
                    </div>
                    <div class="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>变量已双向同步</span>
                    </div>
                </div>

                <!-- 变量单源检查器与测试值注入面板 (精简紧凑的 Key-Value 检查表) -->
                <div class="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3 shrink-0 max-h-[36vh] overflow-y-auto space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <Braces size={13} class="text-indigo-500" />
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                                变量检查器与注入值 ({detectedVarNames.length})
                            </span>
                        </div>

                        {#if detectedVarNames.length > 0}
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    onclick={clearAllTestValues}
                                    class="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium"
                                    title="清空所有测试注入值"
                                >
                                    <Eraser size={11} /> 清空注入值
                                </button>
                                <button
                                    type="button"
                                    onclick={fillAllExampleValues}
                                    class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <Sparkles size={11} /> 一键填入示例值
                                </button>
                            </div>
                        {/if}
                    </div>

                    {#if detectedVarNames.length > 0}
                        <div class="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-md border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
                            {#each variableDefs as vd}
                                <div class="px-3 py-1.5 flex items-center gap-2.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <!-- 变量名 (点击可原子级重命名) -->
                                    <div class="w-32 shrink-0 flex items-center gap-1">
                                        {#if editingVarName === vd.name}
                                            <input
                                                type="text"
                                                bind:value={tempRenameValue}
                                                onkeydown={(e) => {
                                                    if (e.key === "Enter") renameVariableAtomic(vd.name, tempRenameValue);
                                                    if (e.key === "Escape") editingVarName = null;
                                                }}
                                                onblur={() => renameVariableAtomic(vd.name, tempRenameValue)}
                                                class="px-1.5 py-0.5 text-xs font-mono border border-indigo-500 rounded bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 outline-none w-full"
                                                autofocus
                                            />
                                        {:else}
                                            <button
                                                type="button"
                                                onclick={() => {
                                                    editingVarName = vd.name;
                                                    tempRenameValue = vd.name;
                                                }}
                                                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] border border-indigo-200/60 dark:border-indigo-900/60 font-semibold hover:border-indigo-400 transition-colors truncate max-w-full"
                                                title="点击重命名此变量并同步替换正文"
                                            >
                                                <span class="truncate">{`{{${vd.name}}}`}</span>
                                                <Edit2 size={9} class="opacity-60 shrink-0" />
                                            </button>
                                        {/if}
                                        {#if vd.required}
                                            <span class="text-[9px] text-rose-500 font-bold shrink-0">*</span>
                                        {/if}
                                    </div>

                                    <!-- 变量说明 (透明极简输入) -->
                                    <div class="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            bind:value={vd.description}
                                            placeholder="变量说明..."
                                            class="w-full px-2 py-1 text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 rounded bg-transparent text-slate-700 dark:text-slate-300 outline-none transition-colors placeholder:text-slate-400 placeholder:italic"
                                        />
                                    </div>

                                    <!-- 测试值注入 (优雅胶囊输入) -->
                                    <div class="w-44 shrink-0">
                                        <input
                                            type="text"
                                            bind:value={testValues[vd.name]}
                                            placeholder={vd.exampleValue || `测试值...`}
                                            class="w-full px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    <!-- 移除按钮 -->
                                    <button
                                        type="button"
                                        onclick={() => removeVariableAtomic(vd.name)}
                                        class="p-1 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 rounded transition-colors shrink-0"
                                        title="从正文中移除该变量"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-xs text-slate-400 italic py-2 text-center">
                            正文中尚无变量，输入 <code>{"{{变量名}}"}</code> 或点击上方按钮快速插桩。
                        </p>
                    {/if}
                </div>
            </div>

            <!-- 右栏：Playground / AI 实时推演与预览 (48% 宽度) -->
            <div class="w-full md:w-[48%] flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
                <!-- Tab 栏 -->
                <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
                    <div class="flex bg-slate-200/70 dark:bg-slate-800 rounded-md p-0.5 text-xs font-medium">
                        <button
                            type="button"
                            onclick={() => (rightTab = "playground")}
                            class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {rightTab === 'playground' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                        >
                            <Bot size={12} />
                            <span>AI 实时推演</span>
                            {#if isTestingAI}
                                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                            {/if}
                        </button>

                        <button
                            type="button"
                            onclick={() => (rightTab = "preview")}
                            class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {rightTab === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                        >
                            <FileText size={12} />
                            <span>排版预览</span>
                        </button>

                        <button
                            type="button"
                            onclick={() => (rightTab = "compiled")}
                            class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {rightTab === 'compiled' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                        >
                            <FileCode size={12} />
                            <span>填充后纯文本</span>
                        </button>

                        {#if promptId}
                            <button
                                type="button"
                                onclick={() => (rightTab = "history")}
                                class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {rightTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                <History size={12} />
                                <span>历史快照</span>
                            </button>
                        {/if}
                    </div>

                    <!-- AI 状态指示 / 快捷复制 -->
                    <div class="flex items-center gap-1.5">
                        {#if rightTab === "playground"}
                            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                <span class="w-1.5 h-1.5 rounded-full {settingsStore.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                                {settingsStore.isConfigured ? settingsStore.currentProvider?.name : "模拟模型"}
                            </span>
                        {/if}
                    </div>
                </div>

                <!-- Tab 1: AI Playground -->
                {#if rightTab === "playground"}
                    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <!-- 运行与操作横条 -->
                        <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
                            {#if isTestingAI}
                                <button
                                    type="button"
                                    onclick={stopEditorAITest}
                                    class="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                                >
                                    <Square size={11} class="fill-white" />
                                    <span>停止推演</span>
                                </button>
                            {:else}
                                <button
                                    type="button"
                                    onclick={runEditorAITest}
                                    class="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                                >
                                    <Play size={11} class="fill-white" />
                                    <span>运行推演测试</span>
                                </button>
                            {/if}

                            {#if aiLatency > 0 || aiTestResult}
                                <div class="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                    <span class="flex items-center gap-0.5">
                                        <Clock size={11} class="text-indigo-500" />
                                        {aiLatency}ms
                                    </span>
                                    {#if aiSpeed > 0}
                                        <span class="flex items-center gap-0.5">
                                            <Zap size={11} class="text-amber-500" />
                                            {aiSpeed} 字/秒
                                        </span>
                                    {/if}
                                </div>
                            {/if}

                            {#if aiTestResult}
                                <div class="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onclick={() => {
                                            navigator.clipboard.writeText(aiTestResult);
                                            copiedAI = true;
                                            setTimeout(() => (copiedAI = false), 2000);
                                        }}
                                        class="text-xs px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                                    >
                                        {#if copiedAI}
                                            <Check size={11} class="text-emerald-500" />
                                            <span>已复制</span>
                                        {:else}
                                            <Copy size={11} />
                                            <span>复制结果</span>
                                        {/if}
                                    </button>

                                    {#if promptId}
                                        <button
                                            type="button"
                                            onclick={saveEditorTestCase}
                                            class="text-xs px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 rounded font-semibold flex items-center gap-1"
                                        >
                                            <CheckCircle2 size={11} />
                                            <span>{testCaseSaved ? "已保存用例" : "归档用例"}</span>
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        {#if aiError}
                            <div class="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border-b border-rose-200 dark:border-rose-800 flex items-center gap-2">
                                <AlertCircle size={13} />
                                <span>{aiError}</span>
                            </div>
                        {/if}

                        <!-- 推演内容流式展示区 -->
                        <div class="flex-1 p-4 overflow-y-auto min-h-0 bg-white dark:bg-slate-900">
                            {#if isTestingAI && !aiTestResult}
                                <div class="h-full flex items-center justify-center text-indigo-500 gap-2 py-10">
                                    <span class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                    <span class="text-xs font-medium">模型生成中，流式响应接收中...</span>
                                </div>
                            {:else if aiTestResult}
                                <div class="w-full text-xs">
                                    <RichMessageContent content={aiTestResult} />
                                </div>
                            {:else}
                                <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                                    <Bot size={24} class="opacity-50 text-indigo-500" />
                                    <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Prompt 实时推演测试区</p>
                                    <p class="text-[11px] text-slate-400 max-w-xs">
                                        在左侧填入变量测试值，点击上方「运行推演测试」即可实时验证效果。
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>

                <!-- Tab 2: Markdown 排版预览 -->
                {:else if rightTab === "preview"}
                    <div class="flex-1 p-5 overflow-y-auto bg-white dark:bg-slate-900 text-xs">
                        {#if compiledPrompt.trim()}
                            <RichMessageContent content={compiledPrompt} />
                        {:else}
                            <p class="text-slate-400 italic">暂无内容，请在左侧输入 Prompt。</p>
                        {/if}
                    </div>

                <!-- Tab 3: 填充后纯文本与代码导出 -->
                {:else if rightTab === "compiled"}
                    <div class="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/50">
                        <div class="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">填充后的完整文本</span>
                            <div class="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onclick={() => copyFormattedContent("text")}
                                    class="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                                >
                                    {#if copiedFormat === "text"}
                                        <Check size={11} class="text-emerald-500" />
                                        <span>已复制文本</span>
                                    {:else}
                                        <Copy size={11} />
                                        <span>复制文本</span>
                                    {/if}
                                </button>
                                <button
                                    type="button"
                                    onclick={() => copyFormattedContent("json")}
                                    class="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                                >
                                    {#if copiedFormat === "json"}
                                        <Check size={11} class="text-emerald-500" />
                                        <span>已复制 JSON</span>
                                    {:else}
                                        <Code size={11} />
                                        <span>JSON</span>
                                    {/if}
                                </button>
                                <button
                                    type="button"
                                    onclick={() => copyFormattedContent("python")}
                                    class="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                                >
                                    {#if copiedFormat === "python"}
                                        <Check size={11} class="text-emerald-500" />
                                        <span>已复制 Python</span>
                                    {:else}
                                        <FileCode size={11} />
                                        <span>Python</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 overflow-y-auto">
                            <pre class="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">{compiledPrompt || "（未输入内容）"}</pre>
                        </div>
                    </div>

                <!-- Tab 4: 历史快照与 Diff -->
                {:else if rightTab === "history" && promptId}
                    <div class="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-0">
                        <div class="w-full md:w-48 bg-slate-50/50 dark:bg-slate-900/40 p-3 overflow-y-auto space-y-1.5">
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">历史快照</span>
                            {#each promptStore.getVersions(promptId) as v}
                                <button
                                    type="button"
                                    onclick={() => (selectedVersionId = v.versionId)}
                                    class="w-full text-left p-2 rounded border text-xs transition-colors {selectedVersionId === v.versionId ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-2xs font-semibold' : 'border-slate-200 dark:border-slate-800 hover:bg-white'}"
                                >
                                    <div class="flex items-center justify-between mb-0.5">
                                        <span class="text-indigo-600 dark:text-indigo-400 font-mono">{v.versionNumber}</span>
                                        <span class="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p class="text-[10px] text-slate-500 truncate">{v.changeNote || "手动快照"}</p>
                                </button>
                            {/each}
                        </div>

                        <div class="flex-1 p-4 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
                            {#if activeVersionDiff}
                                <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                                    <span class="text-xs text-slate-600 dark:text-slate-300">
                                        对比当前内容与 <strong>{activeVersionDiff.version.versionNumber}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onclick={() => handleRestore(activeVersionDiff!.version)}
                                        class="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw size={11} /> 恢复此版本
                                    </button>
                                </div>

                                <div class="flex-1 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                                    {#each activeVersionDiff.diffs as part}
                                        <span class="{part.added ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : part.removed ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 line-through' : 'text-slate-700 dark:text-slate-300'}">
                                            {part.value}
                                        </span>
                                    {/each}
                                </div>
                            {:else}
                                <div class="flex items-center justify-center h-full text-slate-400 text-xs">
                                    在左侧选择一个历史快照查看内容差异
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- 放弃修改确认对话框 -->
{#if isDiscardConfirmOpen}
    <div class="fixed inset-0 bg-black/70 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-2xl p-5 border border-slate-200 dark:border-slate-800"
            onclick={(e) => e.stopPropagation()}
            role="alertdialog"
            tabindex="-1"
        >
            <div class="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                <AlertCircle size={16} />
                <span>放弃未保存的修改？</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                当前编辑的内容尚未保存，离开将丢失本次改动。
            </p>
            <div class="flex gap-2 justify-end">
                <button
                    type="button"
                    onclick={() => (isDiscardConfirmOpen = false)}
                    class="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium transition-colors"
                >
                    继续编辑
                </button>
                <button
                    type="button"
                    onclick={() => {
                        isDiscardConfirmOpen = false;
                        onClose();
                    }}
                    class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                    放弃并离开
                </button>
            </div>
        </div>
    </div>
{/if}
