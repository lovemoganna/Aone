<script lang="ts">
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
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
            class="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl"
        >
            <!-- Header -->
            <div
                class="sticky top-0 z-10 flex items-center justify-between p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"
                    >
                        <Settings class="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h2
                            class="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            AI Configuration
                        </h2>
                        <p class="text-xs text-slate-500">
                            Provider, model & generation settings
                        </p>
                    </div>
                </div>
                <button
                    onclick={() => (open = false)}
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-5 space-y-6">
                <!-- Provider Selection -->
                <section>
                    <label
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3"
                    >
                        Provider
                    </label>
                    <div class="grid grid-cols-4 gap-2">
                        {#each providerEntries as p}
                            <button
                                onclick={() =>
                                    settingsStore.setProvider(p.key as any)}
                                class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer
                                    {settingsStore.provider === p.key
                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/30'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}"
                            >
                                <span class="text-xl">{p.icon}</span>
                                <span
                                    class="text-xs font-medium truncate w-full text-center {settingsStore.provider ===
                                    p.key
                                        ? 'text-cyan-700 dark:text-cyan-400'
                                        : 'text-slate-600 dark:text-slate-400'}"
                                >
                                    {p.name}
                                </span>
                            </button>
                        {/each}
                    </div>
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
                            placeholder="Enter your API key..."
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
                            placeholder="https://api.example.com/v1"
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
                                    >Click refresh to fetch models</option
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
                        Generation
                    </h3>

                    <!-- Temperature -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label
                                class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                            >
                                <Thermometer class="w-3.5 h-3.5" />
                                Temperature
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
                                Max Tokens
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
                                Stream
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
                                Delay
                            </label>
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
                                class="w-12 text-center text-xs font-mono bg-transparent border-none focus:outline-none text-cyan-600 dark:text-cyan-400"
                            />
                            <span class="text-xs text-slate-400">s</span>
                        </div>
                    </div>
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
                            <span>Testing...</span>
                        {:else if settingsStore.connectionStatus === "connected"}
                            <Check class="w-4 h-4" />
                            <span>{settingsStore.connectionMessage}</span>
                        {:else if settingsStore.connectionStatus === "error"}
                            <AlertCircle class="w-4 h-4" />
                            <span>{settingsStore.connectionMessage}</span>
                        {:else}
                            <Wifi class="w-4 h-4" />
                            <span>Test Connection</span>
                        {/if}
                    </button>
                </section>
            </div>
        </div>
    </div>
{/if}
