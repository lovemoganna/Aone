<script lang="ts">
    import { settingsStore, type RestraintLevel, DEFAULT_AI_RESTRAINT_RULE } from "$lib/stores/settingsStore.svelte";
    import { PROVIDERS } from "$lib/constants/providers";
    import {
        Settings,
        X,
        RefreshCw,
        Wifi,
        WifiOff,
        Loader2,
        Check,
        AlertCircle,
        Thermometer,
        Hash,
        Zap,
        Timer,
        ShieldCheck,
        Scale,
        RotateCcw,
        FileText,
        Sliders,
    } from "lucide-svelte";

    let { open = $bindable(false) }: { open?: boolean } = $props();

    const providerEntries = Object.entries(PROVIDERS).map(([key, p]) => ({
        key,
        ...p,
    }));

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") open = false;
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onclick={handleBackdropClick}
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            class="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl"
        >
            <!-- Header -->
            <div
                class="sticky top-0 z-10 flex items-center justify-between p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs"
                    >
                        <Settings class="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h2
                            class="text-base font-bold text-slate-900 dark:text-white"
                        >
                            模型与推理配置 (AI Configuration)
                        </h2>
                        <p class="text-xs text-slate-500">
                            提供商、大模型基座与生成参数调优
                        </p>
                    </div>
                </div>
                <!-- [02] 为关闭按钮增加 type="button" 与 focus-visible 焦点轮廓 -->
                <button
                    type="button"
                    onclick={() => (open = false)}
                    class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="关闭设置"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-5 space-y-6">
                <!-- Provider Selection -->
                <section>
                    <div
                        class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3"
                    >
                        模型服务提供商 (Provider)
                    </div>
                    <!-- [02] 提供商网格在 375px 移动端适配为 2 列并在更大屏幕自适应为 4 列 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {#each providerEntries as p}
                            <button
                                type="button"
                                onclick={() =>
                                    settingsStore.setProvider(p.key as any)}
                                class="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                    {settingsStore.provider === p.key
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}"
                            >
                                <span class="text-xl">{p.icon}</span>
                                <span
                                    class="text-xs font-medium truncate w-full text-center {settingsStore.provider ===
                                    p.key
                                        ? 'text-indigo-700 dark:text-indigo-300 font-bold'
                                        : 'text-slate-600 dark:text-slate-400'}"
                                >
                                    {p.name}
                                </span>
                            </button>
                        {/each}
                    </div>

                    <!-- Ollama Status & CORS Guidance -->
                    {#if settingsStore.provider === 'ollama'}
                        <div class="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
                            <div class="font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                                <AlertCircle class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Ollama 本地服务与跨域 (CORS) 提示</span>
                            </div>
                            <ul class="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                                <li><strong>HTTPS 线上跨域限制</strong>：若在 GitHub Pages 上连接本地 Ollama，需在 Windows 终端执行 <code>setx OLLAMA_ORIGINS "*"</code> 并退出托盘图标彻底重启 Ollama。</li>
                                <li><strong>llama-server 报错修复</strong>：若 Ollama 报 <code>llama-server binary not found</code>，说明本地安装被中断，重新运行 Ollama 安装程序即可一键修复。</li>
                                <li><strong>免配置推荐</strong>：亦可直接切换至顶部的 <strong>Groq / Gemini / DeepSeek / OpenRouter</strong> 云端大模型，无需本地算力。</li>
                            </ul>
                        </div>
                    {/if}
                </section>

                <!-- API Key -->
                {#if settingsStore.needsApiKey}
                    <section>
                        <label
                            for="apiKey"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            API Key
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={settingsStore.apiKey}
                            oninput={(e) =>
                                settingsStore.setApiKey(
                                    (e.target as HTMLInputElement).value,
                                )}
                            placeholder="输入您的 API 密钥..."
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                        />
                    </section>
                {/if}

                <!-- Custom URL -->
                {#if settingsStore.needsCustomUrl}
                    <section>
                        <label
                            for="customUrl"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Base URL
                        </label>
                        <input
                            id="customUrl"
                            type="text"
                            value={settingsStore.customBaseUrl}
                            oninput={(e) =>
                                settingsStore.setCustomBaseUrl(
                                    (e.target as HTMLInputElement).value,
                                )}
                            placeholder="输入接口地址，如 https://api.openai.com/v1"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                        />
                    </section>
                {/if}

                <!-- Model Selection -->
                <section>
                    <label
                        for="model"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                        Model
                    </label>
                    <div class="flex gap-2">
                        <select
                            id="model"
                            value={settingsStore.selectedModel}
                            onchange={(e) =>
                                settingsStore.setModel(
                                    (e.target as HTMLSelectElement).value,
                                )}
                            class="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                        >
                            {#if settingsStore.availableModels.length === 0}
                                <option value=""
                                    >点击右侧刷新获取模型列表</option
                                >
                            {:else}
                                {#each settingsStore.availableModels as model}
                                    <option value={model.id}
                                        >{model.name}</option
                                    >
                                {/each}
                            {/if}
                        </select>
                        <button
                            onclick={() => settingsStore.refreshModels()}
                            disabled={settingsStore.isRefreshingModels}
                            class="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all text-sm cursor-pointer disabled:opacity-50"
                        >
                            {#if settingsStore.isRefreshingModels}
                                <Loader2 class="w-4 h-4 animate-spin" />
                            {:else}
                                <RefreshCw class="w-4 h-4" />
                            {/if}
                        </button>
                    </div>

                    <!-- Model chips for quick select -->
                    {#if settingsStore.availableModels.length > 0}
                        <div class="flex flex-wrap gap-1.5 mt-2">
                            {#each settingsStore.availableModels.slice(0, 6) as model}
                                <button
                                    onclick={() =>
                                        settingsStore.setModel(model.id)}
                                    class="px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer
                                        {settingsStore.selectedModel ===
                                    model.id
                                        ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-cyan-400'}"
                                >
                                    {model.name}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </section>

                <!-- Generation Config -->
                <section class="space-y-4">
                    <h3
                        class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                        <Zap class="w-4 h-4 text-amber-500" />
                        内容生成设置 (Generation)
                    </h3>

                    <!-- Temperature -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label
                                class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                            >
                                <Thermometer class="w-3.5 h-3.5" />
                                采样温度 (Temperature)
                            </label>
                            <span
                                class="text-xs font-mono text-cyan-600 dark:text-cyan-400"
                            >
                                {settingsStore.temperature.toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={settingsStore.temperature}
                            oninput={(e) =>
                                settingsStore.setTemperature(
                                    parseFloat(
                                        (e.target as HTMLInputElement).value,
                                    ),
                                )}
                            class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <!-- Max Tokens -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label
                                class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                            >
                                <Hash class="w-3.5 h-3.5" />
                                最大词数限制 (Max Tokens)
                            </label>
                            <span
                                class="text-xs font-mono text-cyan-600 dark:text-cyan-400"
                            >
                                {settingsStore.maxTokens}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="256"
                            max="16384"
                            step="256"
                            value={settingsStore.maxTokens}
                            oninput={(e) =>
                                settingsStore.setMaxTokens(
                                    parseInt(
                                        (e.target as HTMLInputElement).value,
                                    ),
                                )}
                            class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <!-- Row: Stream + Stage Delay -->
                    <div class="grid grid-cols-2 gap-4">
                        <!-- Stream Toggle -->
                        <div
                            class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                            <span
                                class="text-xs text-slate-600 dark:text-slate-400"
                            >
                                流式输出 (Stream)
                            </span>
                            <button
                                onclick={() =>
                                    settingsStore.setStream(
                                        !settingsStore.stream,
                                    )}
                                class="relative w-10 h-5 rounded-full transition-colors cursor-pointer {settingsStore.stream
                                    ? 'bg-cyan-500'
                                    : 'bg-slate-300 dark:bg-slate-600'}"
                            >
                                <span
                                    class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform {settingsStore.stream
                                        ? 'translate-x-5'
                                        : ''}"
                                ></span>
                            </button>
                        </div>

                        <!-- Stage Delay -->
                        <div
                            class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                            <label
                                class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1"
                            >
                                <Timer class="w-3 h-3" />
                                单步延迟 (Delay)
                            </label>
                            <div class="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={settingsStore.stageDelay}
                                    oninput={(e) =>
                                        settingsStore.setStageDelay(
                                            parseInt(
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            ) || 0,
                                        )}
                                    class="w-12 text-center text-xs font-mono bg-transparent border-none focus:outline-none text-indigo-600 dark:text-indigo-400"
                                />
                                <span class="text-xs text-slate-400">s</span>
                            </div>
                        </div>

                        <!-- Request Timeout -->
                        <div
                            class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                            <label
                                class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1"
                            >
                                <Timer class="w-3 h-3 text-amber-500" />
                                请求超时限制 (Timeout)
                            </label>
                            <div class="flex items-center gap-1">
                                <select
                                    value={settingsStore.requestTimeout}
                                    onchange={(e) =>
                                        settingsStore.setRequestTimeout(
                                            parseInt(
                                                (e.target as HTMLSelectElement)
                                                    .value,
                                            ) || 180,
                                        )}
                                    class="text-xs font-mono bg-transparent border-none focus:outline-none text-indigo-600 dark:text-indigo-400 cursor-pointer font-bold"
                                >
                                    <option value="60">60s (快速)</option>
                                    <option value="120">120s (标准)</option>
                                    <option value="180">180s (推荐·本地)</option>
                                    <option value="300">300s (5分钟·复杂)</option>
                                    <option value="600">600s (10分钟·极慢)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- AI Output Restraint Iron Rule Section -->
                <section class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 min-w-0">
                            <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                <ShieldCheck class="w-4 h-4" />
                            </div>
                            <div class="min-w-0">
                                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>AI 输出克制铁律</span>
                                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-normal {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">
                                        {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? '已强制生效' : '已暂停'}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    短、准、直接、高信息密度 · 结论优先 > 信息密度 > 清晰度
                                </p>
                            </div>
                        </div>

                        <!-- Main Restraint Toggle -->
                        <button
                            type="button"
                            onclick={() => settingsStore.setEnableOutputRestraint(!settingsStore.enableOutputRestraint)}
                            class="relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 {settingsStore.enableOutputRestraint
                                ? 'bg-indigo-600'
                                : 'bg-slate-300 dark:bg-slate-600'}"
                            aria-label="切换 AI 输出克制原则"
                        >
                            <span
                                class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform {settingsStore.enableOutputRestraint
                                    ? 'translate-x-5'
                                    : ''}"
                            ></span>
                        </button>
                    </div>

                    {#if settingsStore.enableOutputRestraint}
                        <!-- Level Selector -->
                        <div class="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div class="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                克制控制级别 (Restraint Level)
                            </div>
                            <div class="grid grid-cols-4 gap-1.5 text-xs">
                                {#each [
                                    { id: 'standard', label: '标准高密度', desc: '默认铁律' },
                                    { id: 'strict', label: '极致严格', desc: '≤3要点' },
                                    { id: 'relaxed', label: '宽松高效', desc: '允许背景' },
                                    { id: 'custom', label: '自定义', desc: '自由微调' }
                                ] as lvl}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setRestraintLevel(lvl.id as RestraintLevel)}
                                        class="px-2 py-1.5 rounded-xl border text-center transition-all cursor-pointer {settingsStore.restraintLevel === lvl.id
                                            ? 'border-indigo-500 bg-white dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs'
                                            : 'border-transparent hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-400'}"
                                    >
                                        <div class="text-[11px] truncate">{lvl.label}</div>
                                        <div class="text-[9px] opacity-70 truncate">{lvl.desc}</div>
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <!-- Rule Editor / Preview -->
                        <div class="space-y-1.5">
                            <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{settingsStore.restraintLevel === 'custom' ? '自定义铁律规则文本' : '当前注入 Agent 的生效指令'}</span>
                                {#if settingsStore.restraintLevel === 'custom'}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.resetRestraintRuleToDefault()}
                                        class="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        <RotateCcw class="w-2.5 h-2.5" />
                                        <span>重置为默认</span>
                                    </button>
                                {/if}
                            </div>

                            {#if settingsStore.restraintLevel === 'custom'}
                                <textarea
                                    value={settingsStore.customRestraintRule}
                                    oninput={(e) => settingsStore.setCustomRestraintRule((e.target as HTMLTextAreaElement).value)}
                                    rows="5"
                                    class="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                                    placeholder="输入自定义输出克制原则..."
                                ></textarea>
                            {:else}
                                <div class="text-[11px] font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                                    {settingsStore.activeRestraintRule}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </section>

                <!-- Connection Test -->
                <section>
                    <button
                        onclick={() => settingsStore.testConnection()}
                        disabled={settingsStore.connectionStatus === "testing"}
                        class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer
                            {settingsStore.connectionStatus === 'connected'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                            : settingsStore.connectionStatus === 'error'
                              ? 'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-400'}"
                    >
                        {#if settingsStore.connectionStatus === "testing"}
                            <Loader2 class="w-4 h-4 animate-spin" />
                            <span>正在测试连接...</span>
                        {:else if settingsStore.connectionStatus === "connected"}
                            <Check class="w-4 h-4" />
                            <span>{settingsStore.connectionMessage}</span>
                        {:else if settingsStore.connectionStatus === "error"}
                            <AlertCircle class="w-4 h-4" />
                            <span>{settingsStore.connectionMessage}</span>
                        {:else}
                            <Wifi class="w-4 h-4" />
                            <span>测试 API 连接</span>
                        {/if}
                    </button>
                </section>
            </div>
        </div>
    </div>
{/if}
