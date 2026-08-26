<script lang="ts">
    import { settingsStore, type RestraintLevel, DEFAULT_AI_RESTRAINT_RULE } from "$lib/stores/settingsStore.svelte";
    import { PROVIDERS, type ProviderKey } from "$lib/constants/providers";
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
        ShieldAlert,
        Activity,
        Terminal,
        HardDrive,
        ExternalLink,
        Layers,
        Bot,
        CheckCircle2
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { open = $bindable(false) }: { open?: boolean } = $props();

    type TabKey = "model" | "params" | "restraint" | "diagnostics";
    let activeTab = $state<TabKey>("model");
    let showApiKey = $state(false);
    let copiedCmd = $state(false);
    let copiedRule = $state(false);

    const providerEntries = Object.entries(PROVIDERS).map(([key, p]) => ({
        key: key as ProviderKey,
        ...p,
    }));

    interface ProviderMeta {
        tag: string;
        desc: string;
        category: "cloud" | "local" | "demo" | "custom";
        speed: string;
        badgeColor: string;
    }

    const PROVIDER_METAS: Record<string, ProviderMeta> = {
        demo: {
            tag: "离线推演",
            desc: "零网络依赖 · 即开即用仿真引擎",
            category: "demo",
            speed: "< 50ms",
            badgeColor: "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
        },
        ollama: {
            tag: "本地私有",
            desc: "11434 端口 · 零数据外发本地部署",
            category: "local",
            speed: "本地硬件",
            badgeColor: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
        },
        deepseek: {
            tag: "深度推理",
            desc: "DeepSeek-R1 深度思考 / V3 架构",
            category: "cloud",
            speed: "80~120 t/s",
            badgeColor: "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
        },
        groq: {
            tag: "极速吞吐",
            desc: "LPU 超快流式推理 · 毫秒级首字响应",
            category: "cloud",
            speed: "500+ t/s",
            badgeColor: "bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60"
        },
        gemini: {
            tag: "长上下文",
            desc: "Google 2.0 Flash · 2M 超长多模态窗口",
            category: "cloud",
            speed: "150~200 t/s",
            badgeColor: "bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60"
        },
        openrouter: {
            tag: "聚合网关",
            desc: "一站式聚合 OpenAI/Claude/Llama 全系",
            category: "cloud",
            speed: "动态路由",
            badgeColor: "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
        },
        zhipu: {
            tag: "智谱清言",
            desc: "GLM-4 全系列 · 国内高可用大模型",
            category: "cloud",
            speed: "100+ t/s",
            badgeColor: "bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60"
        },
        siliconflow: {
            tag: "硅基流动",
            desc: "开源顶级模型云加速 · DeepSeek / Qwen",
            category: "cloud",
            speed: "120+ t/s",
            badgeColor: "bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60"
        },
        custom: {
            tag: "兼容中转",
            desc: "标准 OpenAI 协议 / OneAPI / 任意中转",
            category: "custom",
            speed: "自定义",
            badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        },
    };

    const BASE_URL_PRESETS = [
        { name: "DeepSeek", url: "https://api.deepseek.com/v1" },
        { name: "Groq", url: "https://api.groq.com/openai/v1" },
        { name: "SiliconFlow", url: "https://api.siliconflow.cn/v1" },
        { name: "OpenRouter", url: "https://openrouter.ai/api/v1" },
        { name: "Local Ollama", url: "http://localhost:11434" }
    ];

    const TEMP_PRESETS = [
        { 
            val: 0.2, 
            label: "0.2 严谨论证", 
            badge: "确定性高", 
            desc: "精准逻辑、代码生成与严肃工单审计，零发散" 
        },
        { 
            val: 0.7, 
            label: "0.7 均衡协同", 
            badge: "官方推荐", 
            desc: "多智能体攻坚推演与方案推敲最佳平衡" 
        },
        { 
            val: 1.2, 
            label: "1.2 创新破局", 
            badge: "发散思维", 
            desc: "战术头脑风暴、破局点探索与跨界灵感发散" 
        },
    ];

    const TOKEN_PRESETS = [
        { val: 2048, label: "2K", desc: "精简输出 · 快速响应" },
        { val: 4096, label: "4K", desc: "标准推演 (推荐)" },
        { val: 8192, label: "8K", desc: "长篇研判 · 复杂推演" },
        { val: 16384, label: "16K", desc: "超深架构分析报告" },
    ];

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") open = false;
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            open = false;
        }
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
    <!-- Backdrop with refined glassmorphism -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md transition-all"
        onclick={handleBackdropClick}
        transition:fade={{ duration: 180 }}
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            class="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans ring-1 ring-black/5 dark:ring-white/10"
            transition:scale={{ start: 0.95, duration: 200 }}
        >
            <!-- Header Section -->
            <header class="flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 shrink-0 backdrop-blur-sm">
                <div class="flex items-center gap-3.5 min-w-0">
                    <div class="w-10 h-10 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 dark:shadow-none shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                        <Sliders class="w-5 h-5" />
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h2 id="settings-modal-title" class="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                AI 推理引擎与全局网关配置
                            </h2>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border
                                {settingsStore.isConfigured 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60' 
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'}">
                                <span class="relative flex h-2 w-2">
                                    {#if settingsStore.isConfigured}
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    {:else}
                                        <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    {/if}
                                </span>
                                <span class="font-semibold">{settingsStore.currentProvider?.name || '未配置'}</span>
                                {#if settingsStore.selectedModel}
                                    <span class="text-slate-400 dark:text-slate-500 font-normal">/</span>
                                    <span class="truncate max-w-[120px] text-slate-600 dark:text-slate-300 font-sans">{settingsStore.selectedModel}</span>
                                {/if}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            底层大模型拓扑、推理超参数调度与 AI 智能体输出克制铁律管理
                        </p>
                    </div>
                </div>

                <!-- Window Actions -->
                <div class="flex items-center gap-2 shrink-0">
                    <div class="hidden sm:flex items-center gap-1">
                        <kbd class="px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                            ESC 关闭
                        </kbd>
                    </div>
                    <button
                        type="button"
                        onclick={() => (open = false)}
                        class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        aria-label="关闭配置面板"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </header>

            <!-- Segmented Tab Navigation -->
            <nav class="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div class="grid grid-cols-4 gap-1.5 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <button
                        type="button"
                        onclick={() => (activeTab = "model")}
                        class="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {activeTab === 'model'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Globe class="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                        <span class="truncate">模型节点接入</span>
                        {#if settingsStore.isConfigured}
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "params")}
                        class="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {activeTab === 'params'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Zap class="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span class="truncate">推理超参数</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "restraint")}
                        class="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {activeTab === 'restraint'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <ShieldCheck class="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        <span class="truncate">输出克制铁律</span>
                        {#if settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off'}
                            <span class="text-[9px] px-1.5 py-0.2 rounded-md font-mono bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 font-bold shrink-0">ON</span>
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeTab = "diagnostics")}
                        class="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {activeTab === 'diagnostics'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Activity class="w-3.5 h-3.5 shrink-0 text-sky-500" />
                        <span class="truncate">连通诊断</span>
                    </button>
                </div>
            </nav>

            <!-- Scrollable Content Area -->
            <div class="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                {#if activeTab === "model"}
                    <!-- TAB 1: MODEL & PROVIDER SELECTION -->
                    <div class="space-y-6 animate-in fade-in duration-150">
                        
                        <!-- 1. Provider Selection Grid -->
                        <section class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Server class="w-4 h-4 text-indigo-500" />
                                    <span>选择模型服务提供商 (Provider Gateway)</span>
                                </label>
                                <span class="text-[11px] text-slate-400">
                                    共支持 <strong class="text-slate-900 dark:text-slate-100 font-mono">{providerEntries.length}</strong> 种接入协议
                                </span>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {#each providerEntries as p}
                                    {@const meta = PROVIDER_METAS[p.key] || { tag: "通用接入", desc: "API 兼容服务", category: "cloud", speed: "标准", badgeColor: "bg-slate-100 text-slate-600" }}
                                    {@const isSelected = settingsStore.provider === p.key}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setProvider(p.key as any)}
                                        class="group relative flex flex-col p-3.5 rounded-2xl border transition-all cursor-pointer text-left shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                            {isSelected
                                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-sm'
                                            : 'border-slate-200/80 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/80'}"
                                    >
                                        <!-- Top Row: Icon + Badge -->
                                        <div class="flex items-center justify-between gap-1 mb-2">
                                            <span class="text-2xl leading-none select-none transition-transform group-hover:scale-110 duration-150">{p.icon}</span>
                                            <span class="text-[10px] px-2 py-0.5 rounded-md font-medium border {meta.badgeColor}">
                                                {meta.tag}
                                            </span>
                                        </div>

                                        <!-- Name -->
                                        <div class="text-xs font-bold truncate {isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}">
                                            {p.name}
                                        </div>

                                        <!-- Short Desc -->
                                        <div class="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                            {meta.desc}
                                        </div>

                                        <!-- Selection Indicator Tag -->
                                        {#if isSelected}
                                            <div class="absolute top-2.5 right-2.5 flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white dark:bg-indigo-500 shadow-xs">
                                                <Check class="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                        {/if}
                                    </button>
                                {/each}
                            </div>

                            <!-- Special Banner for Ollama Local Service & CORS -->
                            {#if settingsStore.provider === 'ollama'}
                                <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent border border-amber-300/60 dark:border-amber-700/60 text-xs space-y-2 text-amber-950 dark:text-amber-200">
                                    <div class="font-bold flex items-center justify-between flex-wrap gap-2">
                                        <div class="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                            <AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                            <span>Ollama 本地服务跨域 (CORS) 快捷配置指引</span>
                                        </div>
                                        <button
                                            type="button"
                                            onclick={copyOllamaCommand}
                                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300/80 dark:hover:bg-amber-800/80 text-[10px] font-semibold text-amber-950 dark:text-amber-100 transition cursor-pointer shadow-2xs"
                                        >
                                            {#if copiedCmd}
                                                <CheckCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                <span>已复制命令到剪贴板</span>
                                            {:else}
                                                <Copy class="w-3 h-3" />
                                                <span>复制 Windows 配置命令</span>
                                            {/if}
                                        </button>
                                    </div>
                                    <p class="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/90">
                                        在 GitHub Pages 等 HTTPS 线上网页中直接调用本地 Ollama (<code class="bg-amber-100 dark:bg-amber-950/80 px-1 py-0.5 rounded font-mono">http://localhost:11434</code>)，需在系统环境变量设置允许跨域：在终端执行 <code>setx OLLAMA_ORIGINS "*"</code> 并重启 Ollama 进程。
                                    </p>
                                </div>
                            {/if}

                            <!-- Special Banner for Demo Sandbox Mode -->
                            {#if settingsStore.provider === 'demo'}
                                <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-transparent dark:from-indigo-500/20 dark:via-sky-500/10 dark:to-transparent border border-indigo-200/80 dark:border-indigo-800/60 text-xs space-y-1.5 text-indigo-950 dark:text-indigo-200">
                                    <div class="font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                                        <Sparkles class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <span>沙盒推演仿真模式已激活</span>
                                    </div>
                                    <p class="text-[11px] text-indigo-900/80 dark:text-indigo-300/90 leading-relaxed">
                                        当前模式使用 Aone 内置的 MetaFlow 专家推演模拟引擎，无需配置任何 API Key 或 Base URL，即可完整体验多智能体协同、方案推演与决策审计全流程。
                                    </p>
                                </div>
                            {/if}
                        </section>

                        <!-- 2. Credential & Endpoint Configuration Cards -->
                        <div class="space-y-4">
                            {#if settingsStore.needsApiKey}
                                <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs">
                                    <div class="flex items-center justify-between">
                                        <label for="apiKey" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <KeyRound class="w-3.5 h-3.5 text-indigo-500" />
                                            <span>API 授权密钥 (API Key)</span>
                                        </label>
                                        <div class="flex items-center gap-2.5">
                                            <span class="text-[10px] text-slate-400 flex items-center gap-1">
                                                <ShieldCheck class="w-3 h-3 text-emerald-500" />
                                                <span>纯本地加密存储</span>
                                            </span>
                                            <button
                                                type="button"
                                                onclick={() => (showApiKey = !showApiKey)}
                                                class="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                {#if showApiKey}
                                                    <EyeOff class="w-3 h-3" />
                                                    <span>隐藏明文</span>
                                                {:else}
                                                    <Eye class="w-3 h-3" />
                                                    <span>显示密钥</span>
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
                                            placeholder={`输入您的 ${settingsStore.currentProvider?.name} API Key (例如 sk-...)`}
                                            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-2xs transition"
                                        />
                                    </div>
                                </div>
                            {/if}

                            {#if settingsStore.needsCustomUrl}
                                <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs">
                                    <div class="flex items-center justify-between">
                                        <label for="customUrl" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Globe class="w-3.5 h-3.5 text-indigo-500" />
                                            <span>自定义服务端点 (Custom Base URL)</span>
                                        </label>
                                        <span class="text-[10px] text-slate-400">标准 OpenAI 兼容规范</span>
                                    </div>
                                    <input
                                        id="customUrl"
                                        type="text"
                                        value={settingsStore.customBaseUrl}
                                        oninput={(e) => settingsStore.setCustomBaseUrl((e.target as HTMLInputElement).value)}
                                        placeholder="https://api.openai.com/v1 或中转站地址..."
                                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-2xs transition"
                                    />
                                    <!-- Preset pills for quick fill -->
                                    <div class="flex items-center gap-1.5 flex-wrap pt-1">
                                        <span class="text-[10px] text-slate-400 font-medium">快速填入常用端点:</span>
                                        {#each BASE_URL_PRESETS as preset}
                                            <button
                                                type="button"
                                                onclick={() => settingsStore.setCustomBaseUrl(preset.url)}
                                                class="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                            >
                                                {preset.name}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- 3. Model Selection & Dynamic Model Discovery Engine -->
                            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
                                <div class="flex items-center justify-between">
                                    <label for="model-selector" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Cpu class="w-3.5 h-3.5 text-indigo-500" />
                                        <span>底座推理模型引擎 (Model Engine)</span>
                                    </label>
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                            {settingsStore.availableModels.length} 个可用模型
                                        </span>
                                    </div>
                                </div>

                                <div class="flex gap-2">
                                    <div class="relative flex-1">
                                        <select
                                            id="model-selector"
                                            value={settingsStore.selectedModel}
                                            onchange={(e) => settingsStore.setModel((e.target as HTMLSelectElement).value)}
                                            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer shadow-2xs transition appearance-none"
                                        >
                                            {#if settingsStore.availableModels.length === 0}
                                                <option value="">点击右侧刷新拉取提供商模型列表...</option>
                                            {:else}
                                                {#each settingsStore.availableModels as model}
                                                    <option value={model.id}>{model.name} ({model.id})</option>
                                                {/each}
                                            {/if}
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        onclick={() => settingsStore.refreshModels()}
                                        disabled={settingsStore.isRefreshingModels}
                                        class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-2xs flex items-center gap-2 shrink-0"
                                        title="在线探测并拉取最新可用模型"
                                    >
                                        {#if settingsStore.isRefreshingModels}
                                            <Loader2 class="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                            <span>探测中</span>
                                        {:else}
                                            <RefreshCw class="w-3.5 h-3.5 text-indigo-500" />
                                            <span>探测模型</span>
                                        {/if}
                                    </button>
                                </div>

                                <!-- Popular Model Chips for Quick Switching -->
                                {#if settingsStore.availableModels.length > 0}
                                    <div class="space-y-1.5 pt-1">
                                        <div class="text-[10px] text-slate-400 font-medium">推荐旗舰大模型快捷切换:</div>
                                        <div class="flex flex-wrap items-center gap-1.5">
                                            {#each settingsStore.availableModels.slice(0, 8) as model}
                                                {@const isCur = settingsStore.selectedModel === model.id}
                                                <button
                                                    type="button"
                                                    onclick={() => settingsStore.setModel(model.id)}
                                                    class="px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer border
                                                        {isCur
                                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-bold shadow-xs'
                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200'}"
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
                    <!-- TAB 2: INFERENCE HYPERPARAMETERS -->
                    <div class="space-y-5 animate-in fade-in duration-150">
                        
                        <!-- 1. Temperature Control Card -->
                        <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Thermometer class="w-4 h-4 text-indigo-500" />
                                        <span>采样温度 (Temperature)</span>
                                    </label>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        调控智能体输出的发散度与确定性。数值越低越严密，数值越高越具发散性。
                                    </p>
                                </div>
                                <span class="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                                    {settingsStore.temperature.toFixed(1)}
                                </span>
                            </div>

                            <!-- Range Slider with sleek styled track -->
                            <div class="space-y-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={settingsStore.temperature}
                                    oninput={(e) => settingsStore.setTemperature(parseFloat((e.target as HTMLInputElement).value))}
                                    class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                                />
                                <div class="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                                    <span>0.0 确定严谨</span>
                                    <span>0.7 均衡协同</span>
                                    <span>1.5 创新发散</span>
                                    <span>2.0 极限混沌</span>
                                </div>
                            </div>

                            <!-- Temperature Preset Option Cards -->
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                {#each TEMP_PRESETS as p}
                                    {@const isActive = Math.abs(settingsStore.temperature - p.val) < 0.05}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setTemperature(p.val)}
                                        class="p-3 rounded-xl border text-left transition-all cursor-pointer
                                            {isActive
                                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30 shadow-xs'
                                                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 hover:bg-slate-50 dark:hover:bg-slate-800/60'}"
                                    >
                                        <div class="flex items-center justify-between mb-1">
                                            <span class="text-xs font-bold {isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">
                                                {p.label}
                                            </span>
                                            <span class="text-[9px] px-1.5 py-0.2 rounded font-medium {isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}">
                                                {p.badge}
                                            </span>
                                        </div>
                                        <div class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                                            {p.desc}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <!-- 2. Max Tokens Card -->
                        <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Hash class="w-4 h-4 text-indigo-500" />
                                        <span>单阶段最大 Token 上限 (Max Tokens)</span>
                                    </label>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        约束单个智能体在单轮推演中的最大生成长度，防止死循环与算力溢出。
                                    </p>
                                </div>
                                <span class="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                                    {settingsStore.maxTokens} tokens
                                </span>
                            </div>

                            <input
                                type="range"
                                min="256"
                                max="16384"
                                step="256"
                                value={settingsStore.maxTokens}
                                oninput={(e) => settingsStore.setMaxTokens(parseInt((e.target as HTMLInputElement).value))}
                                class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                            />

                            <!-- Token Preset Chips -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                {#each TOKEN_PRESETS as t}
                                    {@const isActive = settingsStore.maxTokens === t.val}
                                    <button
                                        type="button"
                                        onclick={() => settingsStore.setMaxTokens(t.val)}
                                        class="p-2.5 rounded-xl border text-center transition-all cursor-pointer
                                            {isActive
                                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30 shadow-xs'
                                                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 hover:bg-slate-50 dark:hover:bg-slate-800/60'}"
                                    >
                                        <div class="text-xs font-mono font-bold {isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">
                                            {t.label}
                                        </div>
                                        <div class="text-[9px] text-slate-400 truncate mt-0.5">
                                            {t.desc}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <!-- 3. Pipeline Runtime Options: Stream, Delay, Watchdog -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <!-- Stream Toggle -->
                            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3 shadow-2xs">
                                <div>
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Zap class="w-3.5 h-3.5 text-amber-500" />
                                        <span>逐字流式推演</span>
                                    </div>
                                    <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                        实时动态逐字呈现智能体思维链路
                                    </p>
                                </div>

                                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span class="text-[11px] font-mono font-semibold {settingsStore.stream ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}">
                                        {settingsStore.stream ? '已开启流式' : '全量返回'}
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
                            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3 shadow-2xs">
                                <div>
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Timer class="w-3.5 h-3.5 text-slate-400" />
                                        <span>小队阶段间隔</span>
                                    </div>
                                    <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                        智能体轮次冷却防频控 (0~30s)
                                    </p>
                                </div>

                                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span class="text-[10px] text-slate-400">间隔时长</span>
                                    <div class="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            value={settingsStore.stageDelay}
                                            oninput={(e) => settingsStore.setStageDelay(parseInt((e.target as HTMLInputElement).value) || 0)}
                                            class="w-12 text-center text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <span class="text-xs text-slate-400 font-mono">s</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Timeout Watchdog -->
                            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between gap-3 shadow-2xs">
                                <div>
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <ShieldAlert class="w-3.5 h-3.5 text-rose-500" />
                                        <span>熔断看门狗时限</span>
                                    </div>
                                    <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                        超长推演异常兜底看门狗
                                    </p>
                                </div>

                                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span class="text-[10px] text-slate-400">超时档位</span>
                                    <select
                                        value={settingsStore.requestTimeout}
                                        onchange={(e) => settingsStore.setRequestTimeout(parseInt((e.target as HTMLSelectElement).value) || 180)}
                                        class="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="60">60s (极速)</option>
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
                    <!-- TAB 3: AI OUTPUT RESTRAINT IRON RULE -->
                    <div class="space-y-5 animate-in fade-in duration-150">
                        <section class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
                            
                            <!-- Master Toggle Hero Banner -->
                            <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                                        <ShieldCheck class="w-5 h-5" />
                                    </div>
                                    <div class="min-w-0">
                                        <div class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                            <span>AI 智能体输出克制铁律 (Output Restraint System)</span>
                                            <span class="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">
                                                {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? '🟢 铁律已强制注入' : '⚪ 铁律已挂起'}
                                            </span>
                                        </div>
                                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                            核心铁律：短、准、直接、高信息密度 · 结论优先 > 信息密度 > 清晰度 > 完整性
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onclick={() => settingsStore.setEnableOutputRestraint(!settingsStore.enableOutputRestraint)}
                                    class="relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 {settingsStore.enableOutputRestraint ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}"
                                    aria-label="切换 AI 输出克制原则"
                                >
                                    <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform {settingsStore.enableOutputRestraint ? 'translate-x-5' : ''}"></span>
                                </button>
                            </div>

                            {#if settingsStore.enableOutputRestraint}
                                <!-- 4-Level Selector -->
                                <div class="space-y-2.5">
                                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        克制治理档位 (Restraint Intensity)
                                    </div>
                                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {#each [
                                            { id: 'standard', label: '标准高密度', tag: '推荐', desc: '默认铁律 · 精简紧凑结论优先' },
                                            { id: 'strict', label: '极致严格', tag: '严厉', desc: '≤3 要点 · 零客套修饰与废话' },
                                            { id: 'relaxed', label: '宽松高效', tag: '高效', desc: '允许关键背景与技术延伸' },
                                            { id: 'custom', label: '自定义指令', tag: '自由', desc: '自由微调系统注入提示词' }
                                        ] as lvl}
                                            {@const isSelected = settingsStore.restraintLevel === lvl.id}
                                            <button
                                                type="button"
                                                onclick={() => settingsStore.setRestraintLevel(lvl.id as RestraintLevel)}
                                                class="p-3 rounded-xl border text-left transition-all cursor-pointer {isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs'
                                                    : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'}"
                                            >
                                                <div class="flex items-center justify-between mb-1">
                                                    <span class="text-xs font-bold {isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}">{lvl.label}</span>
                                                    <span class="text-[9px] px-1 py-0.2 rounded font-medium {isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">{lvl.tag}</span>
                                                </div>
                                                <div class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{lvl.desc}</div>
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <!-- Terminal Styled System Prompt Preview / Editor -->
                                <div class="space-y-2 pt-1">
                                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                        <span class="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                            <Terminal class="w-3.5 h-3.5 text-emerald-500" />
                                            <span>{settingsStore.restraintLevel === 'custom' ? '自定义铁律系统指令 (System Prompt Editor)' : '实时注入底座的系统级提示词 (System Prompt Preview)'}</span>
                                        </span>
                                        <div class="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onclick={copyRestraintPrompt}
                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
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
                                                    <span>重置为官方默认</span>
                                                </button>
                                            {/if}
                                        </div>
                                    </div>

                                    {#if settingsStore.restraintLevel === 'custom'}
                                        <textarea
                                            value={settingsStore.customRestraintRule}
                                            oninput={(e) => settingsStore.setCustomRestraintRule((e.target as HTMLTextAreaElement).value)}
                                            rows="6"
                                            class="w-full text-xs font-mono p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none leading-relaxed shadow-inner"
                                            placeholder="输入自定义输出克制原则与系统指令..."
                                        ></textarea>
                                    {:else}
                                        <div class="text-[11px] font-mono p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 dark:bg-slate-950 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto shadow-inner custom-scrollbar">
                                            {settingsStore.activeRestraintRule}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </section>
                    </div>

                {:else if activeTab === "diagnostics"}
                    <!-- TAB 4: DIAGNOSTICS & SYSTEM STATUS -->
                    <div class="space-y-5 animate-in fade-in duration-150">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            <!-- Connection Health Card -->
                            <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-2xs">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <Activity class="w-4 h-4 text-sky-500" />
                                        <span class="text-xs font-bold text-slate-800 dark:text-slate-200">端点网络连通性</span>
                                    </div>
                                    <span class="text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold
                                        {settingsStore.connectionStatus === 'connected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' :
                                         settingsStore.connectionStatus === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' :
                                         settingsStore.connectionStatus === 'testing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300' :
                                         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">
                                        {settingsStore.connectionStatus.toUpperCase()}
                                    </span>
                                </div>

                                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {#if settingsStore.connectionMessage}
                                        {settingsStore.connectionMessage}
                                    {:else}
                                        尚未执行实时连通测试。点击下方按钮向目标服务发送轻量探测请求。
                                    {/if}
                                </p>

                                <button
                                    type="button"
                                    onclick={() => settingsStore.testConnection()}
                                    disabled={settingsStore.connectionStatus === 'testing'}
                                    class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition active:scale-98 cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                    {#if settingsStore.connectionStatus === 'testing'}
                                        <Loader2 class="w-3.5 h-3.5 animate-spin" />
                                        <span>正在发送网络探测 Ping...</span>
                                    {:else}
                                        <Wifi class="w-3.5 h-3.5" />
                                        <span>立即测试当前端点连通性</span>
                                    {/if}
                                </button>
                            </div>

                            <!-- System Capability Checklist -->
                            <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-2xs">
                                <div class="flex items-center gap-2">
                                    <ShieldCheck class="w-4 h-4 text-emerald-500" />
                                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">运行时环境能力清单</span>
                                </div>

                                <div class="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                                    <div class="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                        <span>逐字流式 (Streaming)</span>
                                        <span class="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">SUPPORTED</span>
                                    </div>
                                    <div class="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                        <span>本地加密持久化 (LocalStorage)</span>
                                        <span class="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">READY</span>
                                    </div>
                                    <div class="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                        <span>多智能体并发调度 (Multi-Agent)</span>
                                        <span class="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">ACTIVE</span>
                                    </div>
                                    <div class="flex items-center justify-between py-1">
                                        <span>跨域网络隔离防护 (CORS Guard)</span>
                                        <span class="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">ENABLED</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Reset / Purge Action Bar -->
                        <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <HardDrive class="w-4 h-4 text-slate-400" />
                                <span>配置已在本地浏览器安全隔离持久化</span>
                            </div>
                            <button
                                type="button"
                                onclick={() => {
                                    if (confirm("确定要将所有 AI 配置重置为系统默认值吗？")) {
                                        settingsStore.setProvider('demo');
                                        settingsStore.setTemperature(0.7);
                                        settingsStore.setMaxTokens(4096);
                                        settingsStore.resetRestraintRuleToDefault();
                                    }
                                }}
                                class="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <RotateCcw class="w-3 h-3" />
                                <span>恢复全部出厂默认设置</span>
                            </button>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Footer Toolbar with Status Badge & Confirmation Buttons -->
            <footer class="px-6 py-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur-sm">
                <!-- Status Message -->
                <div class="flex items-center gap-2 text-xs w-full sm:w-auto">
                    <span class="relative flex h-2.5 w-2.5">
                        {#if settingsStore.connectionStatus === 'testing'}
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        {:else if settingsStore.connectionStatus === 'connected'}
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        {:else if settingsStore.connectionStatus === 'error'}
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        {:else}
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                        {/if}
                    </span>
                    <span class="truncate text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {#if settingsStore.connectionStatus === 'testing'}
                            正在测试服务网关连通性...
                        {:else if settingsStore.connectionStatus === 'connected'}
                            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{settingsStore.connectionMessage || 'API 连通就绪'}</span>
                        {:else if settingsStore.connectionStatus === 'error'}
                            <span class="text-rose-600 dark:text-rose-400">{settingsStore.connectionMessage || '连接失败，请检查网络或密钥'}</span>
                        {:else}
                            本地持久化已同步就绪
                        {/if}
                    </span>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onclick={() => settingsStore.testConnection()}
                        disabled={settingsStore.connectionStatus === 'testing'}
                        class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer disabled:opacity-50 shadow-2xs"
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
                        class="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                        <Check class="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>完成配置</span>
                    </button>
                </div>
            </footer>
        </div>
    </div>
{/if}

