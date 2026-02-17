/**
 * Settings Store — Reactive AI configuration with localStorage persistence.
 */
import { PROVIDERS, type ProviderKey, type ModelInfo } from '../constants/providers';
import { AIBridge } from '../services/AIBridge';

const STORAGE_KEY = 'aone-metaflow-settings';

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
}

const DEFAULT_SETTINGS: SettingsState = {
    provider: 'ollama',
    apiKey: '',
    customBaseUrl: '',
    selectedModel: '',
    availableModels: [],
    temperature: 0.7,
    maxTokens: 4096,
    stream: true,
    stageDelay: 3
};

function loadFromStorage(): Partial<SettingsState> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
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
            stageDelay: state.stageDelay
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
        if (p.needsApiKey && !this._state.apiKey) return false;
        if (p.needsCustomUrl && !this._state.customBaseUrl) return false;
        if (!this._state.selectedModel) return false;
        return true;
    }

    // --- Setters ---
    setProvider(key: ProviderKey) {
        this._state.provider = key;
        this._state.selectedModel = '';
        this._state.availableModels = PROVIDERS[key]?.defaultModels || [];

        // Auto-select first default model
        if (this._state.availableModels.length > 0) {
            this._state.selectedModel = this._state.availableModels[0].id;
        }

        this.connectionStatus = 'idle';
        this.connectionMessage = '';
        this.persist();
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

    // --- Actions ---
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
    getCallOptions(overrides?: Partial<{ stream: boolean; onChunk: (c: string) => void; signal: AbortSignal }>) {
        return {
            providerKey: this._state.provider,
            apiKey: this._state.apiKey,
            customBaseUrl: this._state.customBaseUrl || undefined,
            model: this._state.selectedModel,
            temperature: this._state.temperature,
            maxTokens: this._state.maxTokens,
            stream: overrides?.stream ?? this._state.stream,
            onChunk: overrides?.onChunk,
            signal: overrides?.signal
        };
    }

    private persist() {
        saveToStorage(this._state);
    }
}

export const settingsStore = new SettingsStore();
