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
        Copy,
        CheckCheck,
        Cpu,
        Server,
        SlidersHorizontal,
        Info,
        ShieldAlert
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { open = $bindable(false) }: { open?: boolean } = $props();

    type TabKey = "model" | "params" | "restraint";
    let activeTab = $state<TabKey>("model");
    let showApiKey = $state(false);
    let copiedCmd = $state(false);
    let copiedRule = $state(false);

    const providerEntries = Object.entries(PROVIDERS).map(([key, p]) => ({
        key,
        ...p,
    }));

    const PROVIDER_METAS: Record<string, { tag: string; desc: string }> = {
        ollama: { tag: "本地私有", desc: "零数据外发" },
        groq: { tag: "极速吞吐", desc: "LPU 超快流式" },
        gemini: { tag: "长上下文", desc: "多模态协同" },
        deepseek: { tag: "深度推理", desc: "高智力性价比" },
        openai: { tag: "工业基准", desc: "全面泛化" },
        claude: { tag: "缜密分析", desc: "高逻辑严密" },
        openrouter: { tag: "聚合网关", desc: "多模型路由" },
        custom: { tag: "兼容中转", desc: "OpenAI 协议" },
    };

    const TEMP_PRESETS = [
        { val: 0.2, label: "0.2 严谨论证", desc: "精准无发散" },
        { val: 0.7, label: "0.7 均衡协同", desc: "推荐·多轮推演" },
        { val: 1.2, label: "1.2 创新破局", desc: "发散·战术头脑风暴" },
    ];

    const TOKEN_PRESETS = [
        { val: 2048, label: "2K", desc: "精简输出" },
        { val: 4096, label: "4K (推荐)", desc: "标准推演" },
        { val: 8192, label: "8K", desc: "长篇研判" },
        { val: 16384, label: "16K", desc: "深度报告" },
    ];

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") open = false;
    }

    function copyOllamaCommand() {
        navigator.clipboard.writeText('setx OLLAMA_ORIGINS "*"');
        copiedCmd = true;
        setTimeout(() => {
            copiedCmd = false;
        }, 2000);
    }

    function copyRestraintPrompt() {
        navigator.clipboard.writeText(settingsStore.activeRestraintRule);
        copiedRule = true;
        setTimeout(() => {
            copiedRule = false;
        }, 2000);
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md"
        onclick={handleBackdropClick}
        transition:fade={{ duration: 160 }}
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            class="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans"
            transition:scale={{ start: 0.96, duration: 180 }}
        >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 dark:shadow-none shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                        <Sliders class="w-5 h-5" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 id="settings-modal-title" class="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                AI 推理引擎与全局配置
                            </h2>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border
                                {settingsStore.isConfigured 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'}">
                                <span class="w-1.5 h-1.5 rounded-full {settingsStore.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                                {settingsStore.currentProvider?.name || '未配置'}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            底座模型拓扑、推理超参数与 AI 输出克制铁律调优
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                        ESC
                    </kbd>
                    <button
                        type="button"
                        onclick={() => (open = false)}
                        class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        aria-label="关闭配置"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <!-- Floating Modern Segmented Tab Navigation -->
            <div class="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div class="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <button
                        type="button"
                        onclick={() => (activeTab = "model")}
                        class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer {activeTab === 'model'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Globe class="w-3.5 h-3.5 shrink-0" />
                        <span class="truncate">模型节点接入</span>
                        {#if settingsStore.isConfigured}
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "params")}
                        class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer {activeTab === 'params'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Zap class="w-3.5 h-3.5 shrink-0" />
                        <span class="truncate">推理超参数</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "restraint")}
                        class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer {activeTab === 'restraint'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <ShieldCheck class="w-3.5 h-3.5 shrink-0" />
                        <span class="truncate">输出克制铁律</span>
                        {#if settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off'}
                            <span class="text-[9px] px-1 py-0.2 rounded font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 font-bold shrink-0">ON</span>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                {#if activeTab === "model"}
                    <!-- Tab 1: Model & Provider -->
                    <div class="space-y-5 animate-in fade-in duration-150">
                        <!-- Provider Selection Grid -->
                        <section class="space-y-2.5">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Server class="w-3.5 h-3.5 text-indigo-500" />
                                    <span>选择模型服务提供商 (Provider)</span>
                                </label>
                                <span class="text-[11px] text-slate-400">
                                    当前选择: <strong class="text-slate-900 dark:text-slate-100 font-mono">{settingsStore.currentProvider?.name || '未知'}</strong>
                                </span>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {#each providerEntries as p}
                                    {@const meta = PROVIDER_METAS[p.key] || { tag: "通用", desc: "API 接入" }}
                                    {@const isSelected = settingsStore.provider === p.key}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setProvider(p.key as any)}
                                        class="relative flex flex-col p-3 rounded-2xl border transition-all cursor-pointer text-left shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                            {isSelected
                                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                                            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-850'}"
                                    >
                                        <!-- Top Row: Icon + Tag -->
                                        <div class="flex items-center justify-between gap-1 mb-2">
                                            <span class="text-xl leading-none select-none">{p.icon}</span>
                                            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-medium font-sans
                                                {isSelected
                                                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700'}">
                                                {meta.tag}
                                            </span>
                                        </div>

                                        <!-- Name -->
                                        <div class="text-xs font-bold truncate {isSelected ? 'text-indigo-900 dark:text-indigo-200 font-bold' : 'text-slate-800 dark:text-slate-200'}">
                                            {p.name}
                                        </div>

                                        <!-- Short Desc -->
                                        <div class="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                            {meta.desc}
                                        </div>

                                        <!-- Check indicator -->
                                        {#if isSelected}
                                            <div class="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></div>
                                        {/if}
                                    </button>
                                {/each}
                            </div>

                            <!-- Ollama Local & CORS Notice -->
                            {#if settingsStore.provider === 'ollama'}
                                <div class="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-2 text-amber-900 dark:text-amber-200">
                                    <div class="font-bold flex items-center justify-between">
                                        <div class="flex items-center gap-2 text-amber-950 dark:text-amber-100">
                                            <AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                            <span>Ollama 本地服务跨域 (CORS) 快捷配置</span>
                                        </div>
                                        <button
                                            type="button"
                                            onclick={copyOllamaCommand}
                                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-[10px] font-medium text-amber-900 dark:text-amber-200 transition cursor-pointer"
                                        >
                                            {#if copiedCmd}
                                                <CheckCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                <span>已复制命令</span>
                                            {:else}
                                                <Copy class="w-3 h-3" />
                                                <span>复制 Windows 配置命令</span>
                                            {/if}
                                        </button>
                                    </div>
                                    <p class="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                        在 GitHub Pages 等 HTTPS 环境下连接本地 Ollama，需在系统终端执行环境变量配置 <code>setx OLLAMA_ORIGINS "*"</code> 并彻底重启 Ollama 守护进程。
                                    </p>
                                </div>
                            {/if}
                        </section>

                        <!-- API Key & Base URL & Model Selection in Solid Cards -->
                        <div class="space-y-4 pt-1">
                            {#if settingsStore.needsApiKey}
                                <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <label for="apiKey" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <KeyRound class="w-3.5 h-3.5 text-indigo-500" />
                                            <span>API 授权密钥 (API Key)</span>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <span class="text-[10px] text-slate-400">仅本地存储</span>
                                            <button
                                                type="button"
                                                onclick={() => (showApiKey = !showApiKey)}
                                                class="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                {#if showApiKey}
                                                    <EyeOff class="w-3 h-3" />
                                                    <span>隐藏</span>
                                                {:else}
                                                    <Eye class="w-3 h-3" />
                                                    <span>显示</span>
                                                {/if}
                                            </button>
                                        </div>
                                    </div>
                                    <div class="relative">
                                        <input
                                            id="apiKey"
                                            type={showApiKey ? "text" : "password"}
                                            value={settingsStore.apiKey}
                                            oninput={(e) => settingsStore.setApiKey((e.target as HTMLInputElement).value)}
                                            placeholder={`输入您的 ${settingsStore.currentProvider?.name} API Key...`}
                                            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
                                        />
                                    </div>
                                </div>
                            {/if}

                            {#if settingsStore.needsCustomUrl}
                                <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                                    <label for="customUrl" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Globe class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>自定义 Base URL (API 服务端点)</span>
                                    </label>
                                    <input
                                        id="customUrl"
                                        type="text"
                                        value={settingsStore.customBaseUrl}
                                        oninput={(e) => settingsStore.setCustomBaseUrl((e.target as HTMLInputElement).value)}
                                        placeholder="https://api.openai.com/v1"
                                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
                                    />
                                </div>
                            {/if}

                            <!-- Model Selection & Engine Switcher -->
                            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                                <div class="flex items-center justify-between">
                                    <label for="model" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Cpu class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>推理模型引擎 (Model Engine)</span>
                                    </label>
                                    <span class="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">
                                        {settingsStore.selectedModel || '未选择'}
                                    </span>
                                </div>

                                <div class="flex gap-2">
                                    <select
                                        id="model"
                                        value={settingsStore.selectedModel}
                                        onchange={(e) => settingsStore.setModel((e.target as HTMLSelectElement).value)}
                                        class="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-2xs"
                                    >
                                        {#if settingsStore.availableModels.length === 0}
                                            <option value="">点击右侧刷新拉取可用模型列表...</option>
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
                                        class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-2xs flex items-center gap-1.5 shrink-0"
                                        title="从提供商拉取最新可用模型"
                                    >
                                        {#if settingsStore.isRefreshingModels}
                                            <Loader2 class="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                            <span>拉取中</span>
                                        {:else}
                                            <RefreshCw class="w-3.5 h-3.5" />
                                            <span>刷新模型</span>
                                        {/if}
                                    </button>
                                </div>

                                <!-- Model chips for quick select -->
                                {#if settingsStore.availableModels.length > 0}
                                    <div class="space-y-1.5 pt-1">
                                        <div class="text-[10px] text-slate-400 font-medium">常用快捷模型切换:</div>
                                        <div class="flex flex-wrap items-center gap-1.5">
                                            {#each settingsStore.availableModels.slice(0, 8) as model}
                                                {@const isCur = settingsStore.selectedModel === model.id}
                                                <button
                                                    type="button"
                                                    onclick={() => settingsStore.setModel(model.id)}
                                                    class="px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer
                                                        {isCur
                                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'}"
                                                >
                                                    {model.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "params"}
                    <!-- Tab 2: Generation Hyperparameters -->
                    <div class="space-y-4 animate-in fade-in duration-150">
                        <!-- Temperature Slider Card -->
                        <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Thermometer class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>采样温度 (Temperature)</span>
                                    </label>
                                    <p class="text-[11px] text-slate-400 mt-0.5">
                                        控制智能体推演发散度与严谨性
                                    </p>
                                </div>
                                <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
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
                                class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            />

                            <!-- Temperature Preset Chips -->
                            <div class="grid grid-cols-3 gap-2 pt-1">
                                {#each TEMP_PRESETS as p}
                                    {@const isActive = Math.abs(settingsStore.temperature - p.val) < 0.05}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setTemperature(p.val)}
                                        class="p-2 rounded-xl border text-left transition-all cursor-pointer
                                            {isActive
                                                ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-1 ring-indigo-500/30 shadow-2xs'
                                                : 'border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'}"
                                    >
                                        <div class="text-[11px] font-bold {isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">
                                            {p.label}
                                        </div>
                                        <div class="text-[10px] text-slate-400 truncate mt-0.5">
                                            {p.desc}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <!-- Max Tokens Slider Card -->
                        <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Hash class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>单阶段最大 Token 上限 (Max Tokens)</span>
                                    </label>
                                    <p class="text-[11px] text-slate-400 mt-0.5">
                                        限制单智能体发言与推演的最大长度
                                    </p>
                                </div>
                                <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
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
                                class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            />

                            <!-- Token Preset Chips -->
                            <div class="grid grid-cols-4 gap-2 pt-1">
                                {#each TOKEN_PRESETS as t}
                                    {@const isActive = settingsStore.maxTokens === t.val}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setMaxTokens(t.val)}
                                        class="p-2 rounded-xl border text-center transition-all cursor-pointer
                                            {isActive
                                                ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-1 ring-indigo-500/30 shadow-2xs'
                                                : 'border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'}"
                                    >
                                        <div class="text-[11px] font-mono font-bold {isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">
                                            {t.label}
                                        </div>
                                        <div class="text-[9px] text-slate-400 truncate mt-0.5">
                                            {t.desc}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <!-- Grid: Stream, Delay, Timeout -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <!-- Stream Toggle -->
                            <div class="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between gap-3">
                                <div>
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Zap class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>流式输出 (Stream)</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-1">
                                        逐字实时推演动态呈现
                                    </p>
                                </div>

                                <div class="flex items-center justify-between pt-1">
                                    <span class="text-[11px] font-mono {settingsStore.stream ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}">
                                        {settingsStore.stream ? '已开启' : '已关闭'}
                                    </span>
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setStream(!settingsStore.stream)}
                                        class="relative w-11 h-6 rounded-full transition-colors cursor-pointer {settingsStore.stream ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}"
                                        aria-label="切换流式输出"
                                    >
                                        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform {settingsStore.stream ? 'translate-x-5' : ''}"></span>
                                    </button>
                                </div>
                            </div>

                            <!-- Stage Delay -->
                            <div class="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between gap-3">
                                <div>
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Timer class="w-3.5 h-3.5 text-slate-400" />
                                        <span>阶段间隔 (Delay)</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-1">
                                        智能体轮次冷却防频控
                                    </p>
                                </div>

                                <div class="flex items-center justify-between pt-1">
                                    <span class="text-[10px] text-slate-400">间隔秒数</span>
                                    <div class="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            value={settingsStore.stageDelay}
                                            oninput={(e) => settingsStore.setStageDelay(parseInt((e.target as HTMLInputElement).value) || 0)}
                                            class="w-12 text-center text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <span class="text-xs text-slate-400 font-mono">s</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Request Timeout -->
                            <div class="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between gap-3">
                                <div>
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Timer class="w-3.5 h-3.5 text-amber-500" />
                                        <span>熔断超时 (Timeout)</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 mt-1">
                                        看门狗等待最大时限
                                    </p>
                                </div>

                                <div class="flex items-center justify-between pt-1">
                                    <span class="text-[10px] text-slate-400">超时档位</span>
                                    <select
                                        value={settingsStore.requestTimeout}
                                        onchange={(e) => settingsStore.setRequestTimeout(parseInt((e.target as HTMLSelectElement).value) || 180)}
                                        class="text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
                    <div class="space-y-4 animate-in fade-in duration-150">
                        <section class="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
                            <!-- Toggle Hero Bar -->
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
                                        <ShieldCheck class="w-5 h-5" />
                                    </div>
                                    <div class="min-w-0">
                                        <div class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <span>AI 输出克制铁律 (Output Restraint)</span>
                                            <span class="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                                                {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? '已强制注入' : '已暂停'}
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
                                    class="relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 {settingsStore.enableOutputRestraint ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}"
                                    aria-label="切换 AI 输出克制原则"
                                >
                                    <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform {settingsStore.enableOutputRestraint ? 'translate-x-5' : ''}"></span>
                                </button>
                            </div>

                            {#if settingsStore.enableOutputRestraint}
                                <!-- Level Selector -->
                                <div class="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        克制控制级别 (Restraint Level)
                                    </div>
                                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {#each [
                                            { id: 'standard', label: '标准高密度', desc: '默认铁律·精简紧凑' },
                                            { id: 'strict', label: '极致严格', desc: '≤3要点·零修饰' },
                                            { id: 'relaxed', label: '宽松高效', desc: '允许背景延伸' },
                                            { id: 'custom', label: '自定义', desc: '自由微调系统指令' }
                                        ] as lvl}
                                            {@const isSelected = settingsStore.restraintLevel === lvl.id}
                                            <button
                                                type="button"
                                                onclick={() => settingsStore.setRestraintLevel(lvl.id as RestraintLevel)}
                                                class="p-2.5 rounded-xl border text-left transition-all cursor-pointer {isSelected
                                                    ? 'border-indigo-500 bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20 shadow-xs'
                                                    : 'border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'}"
                                            >
                                                <div class="text-xs font-bold {isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">{lvl.label}</div>
                                                <div class="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{lvl.desc}</div>
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <!-- Rule Preview / Terminal Editor -->
                                <div class="space-y-2 pt-2">
                                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                        <span class="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                            <SlidersHorizontal class="w-3 h-3 text-indigo-500" />
                                            <span>{settingsStore.restraintLevel === 'custom' ? '自定义铁律规则指令' : '当前实时注入的系统级提示词 (System Prompt)'}</span>
                                        </span>
                                        <div class="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onclick={copyRestraintPrompt}
                                                class="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                {#if copiedRule}
                                                    <CheckCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    <span>已复制</span>
                                                {:else}
                                                    <Copy class="w-3 h-3" />
                                                    <span>复制指令</span>
                                                {/if}
                                            </button>

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
                                    </div>

                                    {#if settingsStore.restraintLevel === 'custom'}
                                        <textarea
                                            value={settingsStore.customRestraintRule}
                                            oninput={(e) => settingsStore.setCustomRestraintRule((e.target as HTMLTextAreaElement).value)}
                                            rows="6"
                                            class="w-full text-xs font-mono p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed shadow-2xs"
                                            placeholder="输入自定义输出克制原则..."
                                        ></textarea>
                                    {:else}
                                        <div class="text-[11px] font-mono p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 dark:bg-slate-950 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto shadow-inner custom-scrollbar">
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
            <div class="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <!-- Live Connection Badge -->
                <div class="flex items-center gap-2 text-xs w-full sm:w-auto">
                    <span class="w-2 h-2 rounded-full shrink-0 {settingsStore.connectionStatus === 'connected' ? 'bg-emerald-500' : settingsStore.connectionStatus === 'error' ? 'bg-rose-500' : settingsStore.connectionStatus === 'testing' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}"></span>
                    <span class="truncate text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {#if settingsStore.connectionStatus === 'testing'}
                            正在测试服务端点连通性...
                        {:else if settingsStore.connectionStatus === 'connected'}
                            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{settingsStore.connectionMessage || 'API 连通就绪'}</span>
                        {:else if settingsStore.connectionStatus === 'error'}
                            <span class="text-rose-600 dark:text-rose-400">{settingsStore.connectionMessage || '连接失败，请检查网络或密钥'}</span>
                        {:else}
                            配置参数本地持久化就绪
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
                            <span>测试连接</span>
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
