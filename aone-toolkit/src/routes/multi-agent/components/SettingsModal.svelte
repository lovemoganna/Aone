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
        RotateCcw,
        Sliders,
        KeyRound,
        Globe,
        Sparkles,
        Eye,
        EyeOff,
        HelpCircle,
        Layers
    } from "lucide-svelte";

    let { open = $bindable(false) }: { open?: boolean } = $props();

    type TabKey = "model" | "params" | "restraint";
    let activeTab = $state<TabKey>("model");
    let showApiKey = $state(false);

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
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
        onclick={handleBackdropClick}
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            class="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans"
        >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-xs shrink-0">
                        <Sliders class="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <h2 id="settings-modal-title" class="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            模型与推理配置 (AI Configuration)
                        </h2>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">
                            底座模型接入、生成超参数与输出克制铁律调优
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                        ESC
                    </kbd>
                    <button
                        type="button"
                        onclick={() => (open = false)}
                        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        aria-label="关闭设置"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <!-- Segmented Navigation Tabs -->
            <div class="px-6 pt-3 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        onclick={() => (activeTab = "model")}
                        class="flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer {activeTab === 'model'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
                    >
                        <Globe class="w-3.5 h-3.5" />
                        <span>模型节点与服务</span>
                        {#if settingsStore.isConfigured}
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "params")}
                        class="flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer {activeTab === 'params'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
                    >
                        <Zap class="w-3.5 h-3.5" />
                        <span>生成超参数</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "restraint")}
                        class="flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer {activeTab === 'restraint'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}"
                    >
                        <ShieldCheck class="w-3.5 h-3.5" />
                        <span>AI 输出克制铁律</span>
                        {#if settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off'}
                            <span class="text-[10px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono">ON</span>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="p-6 overflow-y-auto flex-1 space-y-6">
                {#if activeTab === "model"}
                    <!-- Tab 1: Model & Provider -->
                    <div class="space-y-5 animate-in fade-in duration-100">
                        <!-- Provider Selection Grid -->
                        <section class="space-y-2.5">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    模型服务提供商 (Provider)
                                </label>
                                <span class="text-[11px] text-slate-400">
                                    当前选择: <strong class="text-slate-800 dark:text-slate-200">{settingsStore.currentProvider?.name || '未知'}</strong>
                                </span>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {#each providerEntries as p}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setProvider(p.key as any)}
                                        class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer text-left shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                            {settingsStore.provider === p.key
                                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}"
                                    >
                                        <span class="text-xl">{p.icon}</span>
                                        <span class="text-xs font-medium truncate w-full text-center {settingsStore.provider === p.key ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-300'}">
                                            {p.name}
                                        </span>
                                    </button>
                                {/each}
                            </div>

                            <!-- Ollama Local & CORS Notice -->
                            {#if settingsStore.provider === 'ollama'}
                                <div class="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
                                    <div class="font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                                        <AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span>Ollama 本地服务与跨域 (CORS) 须知</span>
                                    </div>
                                    <ul class="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                                        <li><strong>HTTPS 线上跨域限制</strong>：若在 GitHub Pages 上访问本地 Ollama，需在 Windows 终端执行 <code>setx OLLAMA_ORIGINS "*"</code> 并退出托盘图标彻底重启 Ollama。</li>
                                        <li><strong>免配置推荐</strong>：可直接切换至上方的 <strong>Groq / Gemini / DeepSeek / OpenRouter</strong> 云端大模型，无需本地算力。</li>
                                    </ul>
                                </div>
                            {/if}
                        </section>

                        <!-- API Key & Base URL -->
                        <div class="space-y-4">
                            {#if settingsStore.needsApiKey}
                                <section class="space-y-1.5">
                                    <div class="flex items-center justify-between">
                                        <label for="apiKey" class="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <KeyRound class="w-3.5 h-3.5 text-indigo-500" />
                                            <span>API Key 授权密钥</span>
                                        </label>
                                        <button
                                            type="button"
                                            onclick={() => (showApiKey = !showApiKey)}
                                            class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            {#if showApiKey}
                                                <EyeOff class="w-3 h-3" />
                                                <span>隐藏密钥</span>
                                            {:else}
                                                <Eye class="w-3 h-3" />
                                                <span>显示密钥</span>
                                            {/if}
                                        </button>
                                    </div>
                                    <div class="relative">
                                        <input
                                            id="apiKey"
                                            type={showApiKey ? "text" : "password"}
                                            value={settingsStore.apiKey}
                                            oninput={(e) => settingsStore.setApiKey((e.target as HTMLInputElement).value)}
                                            placeholder={`输入您的 ${settingsStore.currentProvider?.name} API Key...`}
                                            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
                                        />
                                    </div>
                                </section>
                            {/if}

                            {#if settingsStore.needsCustomUrl}
                                <section class="space-y-1.5">
                                    <label for="customUrl" class="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Globe class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>自定义 Base URL (API 端点)</span>
                                    </label>
                                    <input
                                        id="customUrl"
                                        type="text"
                                        value={settingsStore.customBaseUrl}
                                        oninput={(e) => settingsStore.setCustomBaseUrl((e.target as HTMLInputElement).value)}
                                        placeholder="https://api.openai.com/v1"
                                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
                                    />
                                </section>
                            {/if}

                            <!-- Model Selection & Quick Chips -->
                            <section class="space-y-2">
                                <label for="model" class="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span class="flex items-center gap-1.5">
                                        <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>推理模型 (Model Engine)</span>
                                    </span>
                                    <span class="text-[11px] text-slate-400 font-mono">
                                        {settingsStore.selectedModel || '未选择'}
                                    </span>
                                </label>

                                <div class="flex gap-2">
                                    <select
                                        id="model"
                                        value={settingsStore.selectedModel}
                                        onchange={(e) => settingsStore.setModel((e.target as HTMLSelectElement).value)}
                                        class="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-2xs"
                                    >
                                        {#if settingsStore.availableModels.length === 0}
                                            <option value="">点击右侧刷新拉取可用模型</option>
                                        {:else}
                                            {#each settingsStore.availableModels as model}
                                                <option value={model.id}>{model.name} ({model.id})</option>
                                            {/each}
                                        {/if}
                                    </select>

                                    <button
                                        type="button"
                                        onclick={() => settingsStore.refreshModels()}
                                        disabled={settingsStore.isRefreshingModels}
                                        class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 transition-all text-xs cursor-pointer disabled:opacity-50 shadow-2xs flex items-center gap-1.5 shrink-0"
                                        title="从提供商刷新最新模型列表"
                                    >
                                        {#if settingsStore.isRefreshingModels}
                                            <Loader2 class="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                                            <span>拉取中</span>
                                        {:else}
                                            <RefreshCw class="w-4 h-4" />
                                            <span>刷新</span>
                                        {/if}
                                    </button>
                                </div>

                                <!-- Model chips for quick select -->
                                {#if settingsStore.availableModels.length > 0}
                                    <div class="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span class="text-[10px] text-slate-400 mr-1">常用快捷选择:</span>
                                        {#each settingsStore.availableModels.slice(0, 6) as model}
                                            <button
                                                type="button"
                                                onclick={() => settingsStore.setModel(model.id)}
                                                class="px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer shadow-2xs
                                                    {settingsStore.selectedModel === model.id
                                                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-400'}"
                                            >
                                                {model.name}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </section>
                        </div>
                    </div>
                {:else if activeTab === "params"}
                    <!-- Tab 2: Generation Hyperparameters -->
                    <div class="space-y-5 animate-in fade-in duration-100">
                        <!-- Temperature Slider Card -->
                        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2.5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Thermometer class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>采样温度 (Temperature)</span>
                                    </label>
                                    <p class="text-[11px] text-slate-400">
                                        控制生成随机性：较低值严谨精准，较高值创新发散
                                    </p>
                                </div>
                                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                    {settingsStore.temperature.toFixed(1)}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settingsStore.temperature}
                                oninput={(e) => settingsStore.setTemperature(parseFloat((e.target as HTMLInputElement).value))}
                                class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            />

                            <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>0.0 (绝对确定)</span>
                                <span>0.7 (平衡推荐)</span>
                                <span>2.0 (极端创意)</span>
                            </div>
                        </div>

                        <!-- Max Tokens Slider Card -->
                        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2.5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Hash class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>最大生成 Token 数 (Max Tokens)</span>
                                    </label>
                                    <p class="text-[11px] text-slate-400">
                                        单阶段推演的响应上限
                                    </p>
                                </div>
                                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                    {settingsStore.maxTokens}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="256"
                                max="16384"
                                step="256"
                                value={settingsStore.maxTokens}
                                oninput={(e) => settingsStore.setMaxTokens(parseInt((e.target as HTMLInputElement).value))}
                                class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            />

                            <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>256 (短小)</span>
                                <span>4096 (标准推荐)</span>
                                <span>16384 (超长分析)</span>
                            </div>
                        </div>

                        <!-- Grid: Stream, Delay, Timeout -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <!-- Stream Toggle -->
                            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between gap-3">
                                <div>
                                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        流式输出 (Stream)
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-0.5">
                                        逐字实时推演呈现
                                    </p>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-[11px] font-mono {settingsStore.stream ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}">
                                        {settingsStore.stream ? '已开启' : '关闭'}
                                    </span>
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setStream(!settingsStore.stream)}
                                        class="relative w-10 h-5 rounded-full transition-colors cursor-pointer {settingsStore.stream ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}"
                                        aria-label="切换流式输出"
                                    >
                                        <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform {settingsStore.stream ? 'translate-x-5' : ''}"></span>
                                    </button>
                                </div>
                            </div>

                            <!-- Stage Delay -->
                            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between gap-3">
                                <div>
                                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Timer class="w-3 h-3 text-slate-400" />
                                        <span>单步延迟 (Delay)</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-0.5">
                                        防止频控 API 限流
                                    </p>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] text-slate-400">间隔秒数</span>
                                    <div class="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            value={settingsStore.stageDelay}
                                            oninput={(e) => settingsStore.setStageDelay(parseInt((e.target as HTMLInputElement).value) || 0)}
                                            class="w-12 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <span class="text-xs text-slate-400 font-mono">s</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Request Timeout -->
                            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between gap-3">
                                <div>
                                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Timer class="w-3 h-3 text-amber-500" />
                                        <span>超时限制 (Timeout)</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-0.5">
                                        看门狗等待熔断时限
                                    </p>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] text-slate-400">超时档位</span>
                                    <select
                                        value={settingsStore.requestTimeout}
                                        onchange={(e) => settingsStore.setRequestTimeout(parseInt((e.target as HTMLSelectElement).value) || 180)}
                                        class="text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="60">60s (快速)</option>
                                        <option value="120">120s (标准)</option>
                                        <option value="180">180s (推荐)</option>
                                        <option value="300">300s (5分钟)</option>
                                        <option value="600">600s (10分钟)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "restraint"}
                    <!-- Tab 3: AI Output Restraint Iron Rule -->
                    <div class="space-y-5 animate-in fade-in duration-100">
                        <section class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                        <ShieldCheck class="w-4.5 h-4.5" />
                                    </div>
                                    <div class="min-w-0">
                                        <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <span>AI 输出克制铁律</span>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">
                                                {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? '已强制生效' : '已暂停'}
                                            </span>
                                        </div>
                                        <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            短、准、直接、高信息密度 · 结论优先 > 信息密度 > 清晰度
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onclick={() => settingsStore.setEnableOutputRestraint(!settingsStore.enableOutputRestraint)}
                                    class="relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 {settingsStore.enableOutputRestraint ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}"
                                    aria-label="切换 AI 输出克制原则"
                                >
                                    <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform {settingsStore.enableOutputRestraint ? 'translate-x-5' : ''}"></span>
                                </button>
                            </div>

                            {#if settingsStore.enableOutputRestraint}
                                <!-- Level Selector -->
                                <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <div class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        克制控制级别 (Restraint Level)
                                    </div>
                                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {#each [
                                            { id: 'standard', label: '标准高密度', desc: '默认铁律·精简' },
                                            { id: 'strict', label: '极致严格', desc: '≤3要点·无修饰' },
                                            { id: 'relaxed', label: '宽松高效', desc: '允许背景延伸' },
                                            { id: 'custom', label: '自定义', desc: '自由微调规则' }
                                        ] as lvl}
                                            <button
                                                type="button"
                                                onclick={() => settingsStore.setRestraintLevel(lvl.id as RestraintLevel)}
                                                class="p-2.5 rounded-xl border text-left transition-all cursor-pointer {settingsStore.restraintLevel === lvl.id
                                                    ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-1 ring-indigo-500/40 shadow-xs'
                                                    : 'border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}"
                                            >
                                                <div class="text-xs font-bold {settingsStore.restraintLevel === lvl.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">{lvl.label}</div>
                                                <div class="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{lvl.desc}</div>
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <!-- Rule Preview / Editor -->
                                <div class="space-y-1.5 pt-1">
                                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                        <span>{settingsStore.restraintLevel === 'custom' ? '自定义铁律规则指令' : '当前生效的系统提示词注入内容'}</span>
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
                                            class="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed shadow-2xs"
                                            placeholder="输入自定义输出克制原则..."
                                        ></textarea>
                                    {:else}
                                        <div class="text-[11px] font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto shadow-2xs">
                                            {settingsStore.activeRestraintRule}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </section>
                    </div>
                {/if}
            </div>

            <!-- Footer Toolbar with Live Test & Confirmation -->
            <div class="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <!-- Live Connection Badge -->
                <div class="flex items-center gap-2 text-xs w-full sm:w-auto">
                    <span class="w-2 h-2 rounded-full shrink-0 {settingsStore.connectionStatus === 'connected' ? 'bg-emerald-500' : settingsStore.connectionStatus === 'error' ? 'bg-rose-500' : settingsStore.connectionStatus === 'testing' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}"></span>
                    <span class="truncate text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {#if settingsStore.connectionStatus === 'testing'}
                            正在测试服务连接...
                        {:else if settingsStore.connectionStatus === 'connected'}
                            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{settingsStore.connectionMessage || '连接就绪'}</span>
                        {:else if settingsStore.connectionStatus === 'error'}
                            <span class="text-rose-600 dark:text-rose-400">{settingsStore.connectionMessage || '连接失败'}</span>
                        {:else}
                            当前配置已本地持久化
                        {/if}
                    </span>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onclick={() => settingsStore.testConnection()}
                        disabled={settingsStore.connectionStatus === 'testing'}
                        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                        {#if settingsStore.connectionStatus === 'testing'}
                            <Loader2 class="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                            <span>测试中...</span>
                        {:else}
                            <Wifi class="w-3.5 h-3.5 text-indigo-500" />
                            <span>测试 API 连接</span>
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (open = false)}
                        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition active:scale-95 cursor-pointer shadow-xs"
                    >
                        <Check class="w-3.5 h-3.5" />
                        <span>完成</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
