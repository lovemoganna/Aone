<script lang="ts">
    import { untrack } from "svelte";
    import {
        X,
        Play,
        Copy,
        Check,
        Terminal,
        FileText,
        Code,
        Bot,
        Sparkles,
        Settings,
        Square,
        Clock,
        Zap,
        BarChart2,
        Star,
        Save,
        CheckCircle2,
        AlertCircle,
        History,
        Braces
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { marked } from "marked";
    import type { Prompt, TestCase, VariableDef } from "../../lib/types";
    import { promptStore } from "../../lib/store.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { AIBridge } from "$lib/services/AIBridge";
    import SettingsModal from "../../../multi-agent/components/SettingsModal.svelte";

    let {
        isOpen = false,
        prompt,
        initialValues = {},
        onClose,
    } = $props<{
        isOpen: boolean;
        prompt: Prompt | null;
        initialValues?: Record<string, string>;
        onClose: () => void;
    }>();

    let variables = $state<string[]>([]);
    let values = $state<Record<string, string>>({});
    let copied = $state(false);
    let copiedAI = $state(false);
    let viewMode = $state<"ai_result" | "preview" | "raw" | "test_cases">("ai_result");

    // AI Testing States
    let isAITesting = $state(false);
    let aiOutput = $state("");
    let latencyMs = $state(0);
    let charCount = $state(0);
    let speedCharsSec = $state(0);
    let errorMessage = $state<string | null>(null);
    let testCaseSaved = $state(false);
    let userScore = $state(5);
    let isSettingsOpen = $state(false);
    let abortController = $state<AbortController | null>(null);

    let compiledPrompt = $derived.by(() => {
        if (!prompt) return "";
        let text = prompt.content;
        for (const [key, val] of Object.entries(values)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
            if (val !== undefined && val !== "") {
                text = text.replace(regex, val);
            }
        }
        return text;
    });

    let renderedPromptHtml = $derived.by(() => {
        try {
            return marked.parse(compiledPrompt) as string;
        } catch {
            return compiledPrompt;
        }
    });

    let renderedAIOutputHtml = $derived.by(() => {
        if (!aiOutput) return "";
        try {
            return marked.parse(aiOutput) as string;
        } catch {
            return aiOutput;
        }
    });

    // Auto extract variables when modal opens or prompt changes (支持中文)
    $effect(() => {
        if (isOpen && prompt) {
            const regex = /\{\{\s*([\u4e00-\u9fa5\w-]+)\s*\}\}/g;
            const matches = [...prompt.content.matchAll(regex)];
            const newVars = [...new Set(matches.map((m) => m[1]))];

            untrack(() => {
                variables = newVars;
                const newValues: Record<string, string> = {};
                newVars.forEach((v) => {
                    const def = prompt?.variableDefs?.find((vd: VariableDef) => vd.name === v);
                    newValues[v] = initialValues[v] || values[v] || def?.defaultValue || def?.exampleValue || "";
                });
                values = newValues;
            });
        }
    });

    function fillExampleValues() {
        if (!prompt?.variableDefs) return;
        prompt.variableDefs.forEach((vd: VariableDef) => {
            if (vd.exampleValue || vd.defaultValue) {
                values[vd.name] = vd.exampleValue || vd.defaultValue || "";
            }
        });
        toastStore.info("已填入预置变量示例值");
    }

    async function runAITest() {
        if (!compiledPrompt.trim() || isAITesting) return;

        isAITesting = true;
        aiOutput = "";
        errorMessage = null;
        testCaseSaved = false;
        viewMode = "ai_result";
        const startTime = performance.now();

        abortController = new AbortController();

        try {
            if (settingsStore.isConfigured) {
                const options = settingsStore.getCallOptions({
                    stream: true,
                    signal: abortController.signal,
                    onChunk: (chunk: string) => {
                        aiOutput += chunk;
                        charCount = aiOutput.length;
                        const elapsedSec = (performance.now() - startTime) / 1000;
                        if (elapsedSec > 0.1) {
                            speedCharsSec = Math.round(charCount / elapsedSec);
                        }
                    }
                });

                const finalResult = await AIBridge.callAI(compiledPrompt, options);
                aiOutput = finalResult;
            } else {
                const simChunks = [
                    `【模拟 AI 模型测试响应】\n\n`,
                    `您当前处于本地模拟测试模式。已成功解析提示词与变量配置：\n\n`,
                    `**已填充变量**：\n`,
                    ...Object.entries(values).map(([k, v]) => `- \`{{${k}}}\`: "${v}"\n`),
                    `\n---\n\n### 提示词结构评估\n`,
                    `1. **指令完整度**：良好，所有动态变量占位符已全部正确填充。\n`,
                    `2. **任务类型**：${prompt?.taskType || '通用任务'}\n`,
                    `3. **适用场景**：${prompt?.scene || '通用场景'}\n\n`,
                    `> 💡 **提示**：若需获取实际大模型真实推理输出，请点击右上角「配置 AI」绑定 API Key。`
                ];

                for (const chunk of simChunks) {
                    if (abortController.signal.aborted) break;
                    await new Promise(r => setTimeout(r, 60));
                    aiOutput += chunk;
                }
            }

            latencyMs = Math.round(performance.now() - startTime);
            charCount = aiOutput.length;
            const totalElapsedSec = latencyMs / 1000;
            speedCharsSec = totalElapsedSec > 0 ? Math.round(charCount / totalElapsedSec) : charCount;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                errorMessage = '测试已中止。';
            } else {
                errorMessage = err.message || 'AI 测试调用失败，请检查服务配置。';
            }
        } finally {
            isAITesting = false;
            abortController = null;
        }
    }

    function stopAITest() {
        if (abortController) {
            abortController.abort();
        }
    }

    function saveAsTestCase() {
        if (!prompt || !aiOutput.trim()) return;

        const newCase: TestCase = {
            id: crypto.randomUUID(),
            label: `实测用例 (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            inputs: { ...values },
            expectedOutput: prompt.outputFormat || "符合预期格式与指令规范",
            actualOutput: aiOutput,
            passed: userScore >= 3,
            score: userScore,
            latencyMs,
            tokens: Math.round(charCount * 0.6),
            model: settingsStore.isConfigured ? `${settingsStore.currentProvider?.name}/${settingsStore.selectedModel}` : '模拟模型',
            testedAt: Date.now()
        };

        promptStore.addTestCase(prompt.id, newCase);
        testCaseSaved = true;
        toastStore.success("已归档至测试用例库");
        setTimeout(() => (testCaseSaved = false), 3000);
    }

    function copyResult() {
        navigator.clipboard.writeText(compiledPrompt);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    function copyAIOutput() {
        navigator.clipboard.writeText(aiOutput);
        copiedAI = true;
        setTimeout(() => (copiedAI = false), 2000);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && !isSettingsOpen) onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && prompt}
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
        transition:fade={{ duration: 120 }}
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        }}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:scale={{ duration: 150, start: 0.97 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0"
            >
                <div class="flex items-center gap-3 min-w-0">
                    <div
                        class="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 shrink-0"
                    >
                        <Bot size={16} />
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                运行与 AI 效果推演
                            </h3>
                            <!-- AI Provider Status Pill -->
                            <button
                                type="button"
                                onclick={() => (isSettingsOpen = true)}
                                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors {settingsStore.isConfigured ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'}"
                                title="点击配置或切换 AI 服务商"
                            >
                                <span class="w-1.5 h-1.5 rounded-full {settingsStore.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                                <span>{settingsStore.isConfigured ? `${settingsStore.currentProvider?.name} · ${settingsStore.selectedModel}` : '模拟模式 (点击绑定 API)'}</span>
                                <Settings size={10} class="opacity-60" />
                            </button>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-lg mt-0.5">
                            {prompt.title} · {prompt.taskType || '通用'} · {prompt.scene || '未指定场景'}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-1.5">
                    <button
                        type="button"
                        onclick={() => (isSettingsOpen = true)}
                        class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="AI 服务配置"
                        aria-label="打开 AI 配置"
                    >
                        <Settings size={15} />
                    </button>
                    <button
                        type="button"
                        onclick={onClose}
                        class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="关闭窗口"
                        aria-label="关闭"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <!-- Body (Split Panel) -->
            <div
                class="flex-1 overflow-hidden p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-0"
            >
                <!-- Left: Variables & Action Bar -->
                <div
                    class="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/50 w-full md:w-[340px] shrink-0 flex flex-col overflow-y-auto"
                >
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal size={13} class="text-indigo-500" />
                            模板参数填入
                        </span>
                        {#if variables.length > 0}
                            <button
                                type="button"
                                onclick={fillExampleValues}
                                aria-label="自动填入模板变量示例值"
                                class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                            >
                                <Sparkles size={11} />
                                填入示例值
                            </button>
                        {/if}
                    </div>

                    <!-- Variables Input List -->
                    <div class="flex-1 space-y-3">
                        {#if variables.length > 0}
                            {#each variables as variable}
                                <div class="space-y-1">
                                    <label
                                        for={`run-var-${variable}`}
                                        class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        <code class="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono">{`{{${variable}}}`}</code>
                                        {#if prompt?.variableDefs?.find((vd: VariableDef) => vd.name === variable)?.description}
                                            <span class="text-[11px] text-slate-400 font-normal ml-1">
                                                {prompt.variableDefs.find((vd: VariableDef) => vd.name === variable)?.description}
                                            </span>
                                        {/if}
                                    </label>
                                    <textarea
                                        id={`run-var-${variable}`}
                                        rows="2"
                                        bind:value={values[variable]}
                                        class="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
                                        placeholder={`输入 ${variable}...`}
                                    ></textarea>
                                </div>
                            {/each}
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center p-6 text-slate-400 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-white/50 dark:bg-slate-800/30"
                            >
                                <Terminal size={20} class="mb-1.5 opacity-50 text-indigo-400" />
                                <p class="text-xs font-medium text-slate-600 dark:text-slate-300">无动态变量占位符</p>
                                <p class="text-[11px] text-slate-400 mt-0.5">
                                    可直接运行 AI 测试，或在正文中使用 <code>{"{{变量名}}"}</code> 添加。
                                </p>
                            </div>
                        {/if}
                    </div>

                    <!-- Left Bottom: Action Execution Button -->
                    <div class="pt-3.5 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-2">
                        {#if isAITesting}
                            <button
                                type="button"
                                onclick={stopAITest}
                                class="w-full py-2 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
                            >
                                <Square size={12} class="fill-white" />
                                <span>中止推演</span>
                            </button>
                        {:else}
                            <button
                                type="button"
                                onclick={runAITest}
                                class="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
                            >
                                <Play size={12} class="fill-white" />
                                <span>运行 AI 测试</span>
                            </button>
                        {/if}

                        <button
                            type="button"
                            onclick={copyResult}
                            class="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                        >
                            {#if copied}
                                <Check size={12} class="text-emerald-500" />
                                <span class="text-emerald-600 dark:text-emerald-400">已复制填充后 Prompt</span>
                            {:else}
                                <Copy size={12} />
                                <span>复制填充后 Prompt</span>
                            {/if}
                        </button>
                    </div>
                </div>

                <!-- Right: AI Output & Evaluation -->
                <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
                    <!-- Tab & Action Bar -->
                    <div
                        class="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 shrink-0"
                    >
                        <div class="flex bg-slate-200/70 dark:bg-slate-800 rounded-md p-0.5 text-xs font-medium">
                            <button
                                type="button"
                                onclick={() => (viewMode = "ai_result")}
                                class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {viewMode === 'ai_result' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                <Bot size={12} />
                                <span>AI 生成结果</span>
                                {#if isAITesting}
                                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                                {/if}
                            </button>
                            <button
                                type="button"
                                onclick={() => (viewMode = "preview")}
                                class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                <FileText size={12} />
                                <span>Prompt 预览</span>
                            </button>
                            <button
                                type="button"
                                onclick={() => (viewMode = "raw")}
                                class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {viewMode === 'raw' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                            >
                                <Code size={12} />
                                <span>源码模板</span>
                            </button>
                            {#if prompt.testCases && prompt.testCases.length > 0}
                                <button
                                    type="button"
                                    onclick={() => (viewMode = "test_cases")}
                                    class="px-2.5 py-1 rounded transition-all flex items-center gap-1.5 {viewMode === 'test_cases' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                                >
                                    <History size={12} />
                                    <span>测试记录 ({prompt.testCases.length})</span>
                                </button>
                            {/if}
                        </div>

                        <!-- Action / Copy buttons -->
                        <div class="flex items-center gap-2">
                            {#if viewMode === 'ai_result' && aiOutput}
                                <button
                                    type="button"
                                    onclick={copyAIOutput}
                                    aria-label="复制 AI 实时推演测试结果"
                                    class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors {copiedAI ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'}"
                                    title="复制 AI 输出"
                                >
                                    {#if copiedAI}
                                        <Check size={11} class="text-emerald-500" />
                                        <span>已复制</span>
                                    {:else}
                                        <Copy size={11} />
                                        <span>复制结果</span>
                                    {/if}
                                </button>
                            {/if}
                        </div>
                    </div>

                    <!-- Performance Ribbon -->
                    {#if viewMode === 'ai_result' && (aiOutput || latencyMs > 0)}
                        <div class="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                            <div class="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-[11px] font-mono">
                                <span class="flex items-center gap-1">
                                    <Clock size={12} class="text-indigo-500" />
                                    耗时: <strong class="text-slate-800 dark:text-slate-100">{latencyMs}ms</strong>
                                </span>
                                <span class="flex items-center gap-1">
                                    <BarChart2 size={12} class="text-slate-400" />
                                    字数: <strong class="text-slate-800 dark:text-slate-100">{charCount}</strong>
                                </span>
                                {#if speedCharsSec > 0}
                                    <span class="flex items-center gap-1">
                                        <Zap size={12} class="text-amber-500" />
                                        速率: <strong class="text-slate-800 dark:text-slate-100">{speedCharsSec} 字/秒</strong>
                                    </span>
                                {/if}
                            </div>

                            <!-- Score & Save -->
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-0.5 text-amber-500">
                                    {#each [1, 2, 3, 4, 5] as star}
                                        <button
                                            type="button"
                                            onclick={() => (userScore = star)}
                                            class="p-0.5 hover:scale-110 transition-transform"
                                            aria-label={`评 ${star} 星`}
                                        >
                                            <Star
                                                size={12}
                                                fill={star <= userScore ? "currentColor" : "none"}
                                            />
                                        </button>
                                    {/each}
                                </div>
                                <button
                                    type="button"
                                    onclick={saveAsTestCase}
                                    disabled={!aiOutput || isAITesting}
                                    aria-label="将当前结果保存为测试用例"
                                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition disabled:opacity-50"
                                >
                                    {#if testCaseSaved}
                                        <CheckCircle2 size={11} />
                                        <span>已归档</span>
                                    {:else}
                                        <Save size={11} />
                                        <span>保存用例</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    {/if}

                    <!-- Error Alert -->
                    {#if errorMessage}
                        <div class="p-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 shrink-0">
                            <AlertCircle size={14} class="shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    {/if}

                    <!-- Main Output Viewer -->
                    <div class="flex-1 p-4 overflow-y-auto min-h-[280px]">
                        {#if viewMode === "ai_result"}
                            {#if !aiOutput && !isAITesting}
                                <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Bot size={20} />
                                    </div>
                                    <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">准备就绪，点击左侧按钮进行 AI 推演测试</p>
                                    <p class="text-[11px] text-slate-400 max-w-sm">
                                        系统将把填入变量后的完整指令提交给 AI 服务，实时流式返回生成效果与性能指标。
                                    </p>
                                </div>
                            {:else}
                                <div class="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                                    {@html renderedAIOutputHtml}
                                </div>
                            {/if}
                        {:else if viewMode === "preview"}
                            <div class="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                                {@html renderedPromptHtml}
                            </div>
                        {:else if viewMode === "raw"}
                            <pre class="font-mono text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">{compiledPrompt}</pre>
                        {:else if viewMode === "test_cases" && prompt.testCases}
                            <div class="space-y-2.5">
                                {#each prompt.testCases as tc (tc.id)}
                                    <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                                        <div class="flex items-center justify-between gap-2">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    {tc.label || '测试记录'}
                                                </span>
                                                {#if tc.model}
                                                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                                                        {tc.model}
                                                    </span>
                                                {/if}
                                            </div>
                                            <div class="flex items-center gap-2 text-xs">
                                                {#if tc.score}
                                                    <span class="text-amber-500 font-medium">{'★'.repeat(tc.score)}{'☆'.repeat(5 - tc.score)}</span>
                                                {/if}
                                                {#if tc.latencyMs}
                                                    <span class="text-[11px] text-slate-400 font-mono">{tc.latencyMs}ms</span>
                                                {/if}
                                            </div>
                                        </div>
                                        {#if tc.actualOutput}
                                            <div class="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                                                {tc.actualOutput}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<SettingsModal bind:open={isSettingsOpen} />
