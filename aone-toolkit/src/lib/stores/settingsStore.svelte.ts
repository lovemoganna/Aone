/**
 * Settings Store — Reactive AI configuration with localStorage persistence.
 */
import { PROVIDERS, type ProviderKey, type ModelInfo } from '../constants/providers';
import { AIBridge } from '../services/AIBridge';

const STORAGE_KEY = 'aone-metaflow-settings';

export const DEFAULT_AI_RESTRAINT_RULE = `【AI 输出克制原则（最高铁律）】
保持克制，先解决问题，再考虑表达。默认短、准、直接、高信息密度：
1. 不复述问题，不加无意义前言、总结、客套、评价和延伸；
2. 能一句说清，不写一段；能三点说清，不展开成十点；
3. 只保留结论、关键依据和必要动作，不为显得专业而堆概念，不为显得完整而扩写；
4. 除非明确要求，否则不要主动补充背景、发散建议或重复解释；
5. 信息不足时明确指出，不要猜测或编造；
原则排序：结论优先 > 信息密度 > 清晰度 > 完整性 > 文采。`;

export type RestraintLevel = 'strict' | 'standard' | 'relaxed' | 'custom' | 'off';

export interface SettingsState {
    provider: ProviderKey;
    apiKey: string;
    customBaseUrl: string;
    selectedModel: string;
    availableModels: ModelInfo[];
    temperature: number;
    maxTokens: number;
    stream: boolean;
    stageDelay: number; // seconds between pipeline stages
    requestTimeout: number; // seconds for AI request timeout watchdog
    enableOutputRestraint: boolean;
    restraintLevel: RestraintLevel;
    customRestraintRule: string;
}

const DEFAULT_SETTINGS: SettingsState = {
    provider: 'ollama',
    apiKey: '',
    customBaseUrl: '',
    selectedModel: 'qwen2.5:7b',
    availableModels: PROVIDERS.ollama?.defaultModels || [],
    temperature: 0.7,
    maxTokens: 4096,
    stream: true,
    stageDelay: 3,
    requestTimeout: 180, // Default 180s for local models and complex prompts
    enableOutputRestraint: true,
    restraintLevel: 'standard',
    customRestraintRule: DEFAULT_AI_RESTRAINT_RULE
};

function loadFromStorage(): Partial<SettingsState> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Ensure valid provider
        if (parsed.provider && !PROVIDERS[parsed.provider]) {
            parsed.provider = 'ollama';
        }
        if (parsed.provider === 'ollama') {
            if (!parsed.selectedModel) {
                parsed.selectedModel = 'qwen2.5:7b';
            }
            if (!parsed.availableModels || parsed.availableModels.length === 0) {
                parsed.availableModels = PROVIDERS.ollama?.defaultModels || [];
            }
        }
        return parsed;
    } catch {
        return {};
    }
}

function saveToStorage(state: SettingsState) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            provider: state.provider,
            apiKey: state.apiKey,
            customBaseUrl: state.customBaseUrl,
            selectedModel: state.selectedModel,
            temperature: state.temperature,
            maxTokens: state.maxTokens,
            stream: state.stream,
            stageDelay: state.stageDelay,
            requestTimeout: state.requestTimeout,
            enableOutputRestraint: state.enableOutputRestraint,
            restraintLevel: state.restraintLevel,
            customRestraintRule: state.customRestraintRule
        }));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

class SettingsStore {
    private _state = $state<SettingsState>({ ...DEFAULT_SETTINGS, ...loadFromStorage() });

    // Connection status
    connectionStatus = $state<'idle' | 'testing' | 'connected' | 'error'>('idle');
    connectionMessage = $state('');
    isRefreshingModels = $state(false);

    constructor() {
        // If provider is ollama and availableModels is empty or selectedModel is empty, ensure defaults
        if (this._state.provider === 'ollama') {
            if (!this._state.availableModels || this._state.availableModels.length === 0) {
                this._state.availableModels = PROVIDERS.ollama?.defaultModels || [];
            }
            if (!this._state.selectedModel) {
                this._state.selectedModel = this._state.availableModels[0]?.id || 'qwen2.5:7b';
            }
        }
        // Auto-detect local Ollama models in the background
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                if (this._state.provider === 'ollama') {
                    void this.autoDetectOllamaModels();
                }
            }, 300);
        }
    }

    // --- Getters ---
    get provider() { return this._state.provider; }
    get apiKey() { return this._state.apiKey; }
    get customBaseUrl() { return this._state.customBaseUrl; }
    get selectedModel() { return this._state.selectedModel; }
    get availableModels() { return this._state.availableModels; }
    get temperature() { return this._state.temperature; }
    get maxTokens() { return this._state.maxTokens; }
    get stream() { return this._state.stream; }
    get stageDelay() { return this._state.stageDelay; }
    get requestTimeout() { return this._state.requestTimeout ?? 180; }
    get enableOutputRestraint() { return this._state.enableOutputRestraint ?? true; }
    get restraintLevel() { return this._state.restraintLevel ?? 'standard'; }
    get customRestraintRule() { return this._state.customRestraintRule ?? DEFAULT_AI_RESTRAINT_RULE; }

    get activeRestraintRule(): string {
        if (this._state.enableOutputRestraint === false || this._state.restraintLevel === 'off') {
            return '';
        }
        if (this._state.restraintLevel === 'custom') {
            return this._state.customRestraintRule || DEFAULT_AI_RESTRAINT_RULE;
        }
        if (this._state.restraintLevel === 'strict') {
            return `${DEFAULT_AI_RESTRAINT_RULE}\n【极致克制附加令】：严禁超过 3 个核心要点，严禁任何过渡句与修饰词，直接输出核心结论与执行参数。`;
        }
        if (this._state.restraintLevel === 'relaxed') {
            return `【AI 输出效率指南】：优先结论，保持直接高效，必要时可补充关键背景与延伸。`;
        }
        return DEFAULT_AI_RESTRAINT_RULE;
    }

    get currentProvider() {
        return PROVIDERS[this._state.provider];
    }

    get needsApiKey() {
        return this.currentProvider?.needsApiKey ?? false;
    }

    get needsCustomUrl() {
        return this.currentProvider?.needsCustomUrl ?? false;
    }

    get isConfigured(): boolean {
        const p = this.currentProvider;
        if (!p) return false;
        if (this._state.provider === 'demo') return true;
        if (p.needsApiKey && !this._state.apiKey) return false;
        if (p.needsCustomUrl && !this._state.customBaseUrl) return false;
        if (!this._state.selectedModel) return false;
        return true;
    }

    // --- Setters ---
    setProvider(key: ProviderKey) {
        this._state.provider = key;
        this._state.availableModels = PROVIDERS[key]?.defaultModels || [];

        // Auto-select first default model
        if (this._state.availableModels.length > 0) {
            this._state.selectedModel = this._state.availableModels[0].id;
        } else {
            this._state.selectedModel = '';
        }

        this.connectionStatus = 'idle';
        this.connectionMessage = '';
        this.persist();

        if (key === 'ollama' && typeof window !== 'undefined') {
            void this.autoDetectOllamaModels();
        }
    }

    setApiKey(key: string) {
        this._state.apiKey = key;
        this.persist();
    }

    setCustomBaseUrl(url: string) {
        this._state.customBaseUrl = url;
        this.persist();
    }

    setModel(modelId: string) {
        this._state.selectedModel = modelId;
        this.persist();
    }

    setTemperature(t: number) {
        this._state.temperature = Math.max(0, Math.min(2, t));
        this.persist();
    }

    setMaxTokens(n: number) {
        this._state.maxTokens = Math.max(100, Math.min(32768, n));
        this.persist();
    }

    setStream(enabled: boolean) {
        this._state.stream = enabled;
        this.persist();
    }

    setStageDelay(seconds: number) {
        this._state.stageDelay = Math.max(0, Math.min(30, seconds));
        this.persist();
    }

    setRequestTimeout(seconds: number) {
        this._state.requestTimeout = Math.max(10, Math.min(600, seconds));
        this.persist();
    }

    setEnableOutputRestraint(enabled: boolean) {
        this._state.enableOutputRestraint = enabled;
        this.persist();
    }

    setRestraintLevel(level: RestraintLevel) {
        this._state.restraintLevel = level;
        this.persist();
    }

    setCustomRestraintRule(rule: string) {
        this._state.customRestraintRule = rule;
        this.persist();
    }

    resetRestraintRuleToDefault() {
        this._state.customRestraintRule = DEFAULT_AI_RESTRAINT_RULE;
        this._state.restraintLevel = 'standard';
        this._state.enableOutputRestraint = true;
        this.persist();
    }

    // --- Actions ---
    async autoDetectOllamaModels() {
        try {
            const models = await AIBridge.fetchModels('ollama', undefined, this._state.customBaseUrl);
            if (models && models.length > 0) {
                this._state.availableModels = models;
                if (!models.some(m => m.id === this._state.selectedModel)) {
                    this._state.selectedModel = models[0].id;
                }
                this.persist();
            }
        } catch {
            // Keep default Ollama models
        }
    }

    async refreshModels() {
        this.isRefreshingModels = true;
        try {
            const models = await AIBridge.fetchModels(
                this._state.provider,
                this._state.apiKey,
                this._state.customBaseUrl
            );
            this._state.availableModels = models;

            if (models.length > 0 && !models.find(m => m.id === this._state.selectedModel)) {
                this._state.selectedModel = models[0].id;
            }
        } catch (e) {
            console.warn('Model refresh failed:', e);
        } finally {
            this.isRefreshingModels = false;
            this.persist();
        }
    }

    async testConnection() {
        this.connectionStatus = 'testing';
        this.connectionMessage = 'Testing connection...';

        const result = await AIBridge.testConnection(
            this._state.provider,
            this._state.apiKey,
            this._state.customBaseUrl
        );

        if (result.success) {
            this.connectionStatus = 'connected';
            this.connectionMessage = result.message;
            if (result.models) {
                this._state.availableModels = result.models;
                if (result.models.length > 0 && !result.models.find(m => m.id === this._state.selectedModel)) {
                    this._state.selectedModel = result.models[0].id;
                }
            }
        } else {
            this.connectionStatus = 'error';
            this.connectionMessage = result.message;
        }

        this.persist();
    }

    /** Build AICallOptions from current settings */
    getCallOptions(overrides?: Partial<{ stream: boolean; onChunk: (c: string) => void; signal: AbortSignal; timeoutMs?: number }>) {
        return {
            providerKey: this._state.provider,
            apiKey: this._state.apiKey,
            customBaseUrl: this._state.customBaseUrl || undefined,
            model: this._state.selectedModel,
            temperature: this._state.temperature,
            maxTokens: this._state.maxTokens,
            stream: overrides?.stream ?? this._state.stream,
            onChunk: overrides?.onChunk,
            signal: overrides?.signal,
            timeoutMs: overrides?.timeoutMs ?? (this.requestTimeout * 1000)
        };
    }

    private persist() {
        saveToStorage(this._state);
    }
}

export const settingsStore = new SettingsStore();
