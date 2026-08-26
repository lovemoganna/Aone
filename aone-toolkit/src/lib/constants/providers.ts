export interface ModelInfo {
    id: string;
    name: string;
}

export interface ProviderConfig {
    temperature: number;
    maxTokens: number;
    stream: boolean;
}

export interface Provider {
    name: string;
    icon: string;
    baseUrl: string;
    needsApiKey: boolean;
    needsCustomUrl: boolean;
    defaultModels: ModelInfo[];
    getModelsEndpoint: (baseUrl: string, apiKey?: string) => string | null;
    parseModels: (data: any) => ModelInfo[];
    chatEndpoint: (baseUrl: string, model?: string, apiKey?: string, stream?: boolean) => string;
    formatRequest: (prompt: string, model: string, config: ProviderConfig) => any;
    parseResponse: (data: any) => string;
    parseStreamChunk: (line: string) => string;
}

// OpenAI-compatible stream parser (shared by most providers)
function openAIStreamParser(line: string): string {
    if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return '';
        try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta;
            if (delta?.reasoning_content) {
                return delta.reasoning_content;
            }
            return delta?.content || '';
        } catch { return ''; }
    }
    return '';
}

// OpenAI-compatible response parser
function openAIResponseParser(data: any): string {
    return data.choices?.[0]?.message?.content || '';
}

// OpenAI-compatible request formatter
function openAIRequestFormatter(prompt: string, model: string, config: ProviderConfig): any {
    return {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: config.stream
    };
}

export const PROVIDERS: Record<string, Provider> = {
    ollama: {
        name: 'Ollama',
        icon: '🦙',
        baseUrl: 'http://localhost:11434',
        needsApiKey: false,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B' },
            { id: 'granite4.1:8b', name: 'Granite 4.1 8B' },
            { id: 'qwen3-vl:8b', name: 'Qwen 3 VL 8B' },
            { id: 'deepseek-r1:7b', name: 'DeepSeek R1 7B' },
            { id: 'llama3.2:3b', name: 'Llama 3.2 3B' },
        ],
        getModelsEndpoint: (baseUrl) => `${baseUrl}/api/tags`,
        parseModels: (data) => (data.models || []).map((m: any) => ({ id: m.name, name: m.name })),
        chatEndpoint: (baseUrl) => `${baseUrl}/api/chat`,
        formatRequest: (prompt, model, config) => ({
            model,
            messages: [{ role: 'user', content: prompt }],
            stream: config.stream,
            options: {
                temperature: config.temperature,
                num_predict: config.maxTokens
            }
        }),
        parseResponse: (data) => data.message?.content || data.response || '',
        parseStreamChunk: (line) => {
            try {
                const json = JSON.parse(line);
                return json.message?.content || json.response || '';
            } catch { return ''; }
        }
    },

    groq: {
        name: 'Groq',
        icon: '⚡',
        baseUrl: 'https://api.groq.com/openai/v1',
        needsApiKey: true,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
            { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
            { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
            { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
        ],
        getModelsEndpoint: (baseUrl) => `${baseUrl}/models`,
        parseModels: (data) => (data.data || []).map((m: any) => ({ id: m.id, name: m.id })),
        chatEndpoint: (baseUrl) => `${baseUrl}/chat/completions`,
        formatRequest: openAIRequestFormatter,
        parseResponse: openAIResponseParser,
        parseStreamChunk: openAIStreamParser
    },

    gemini: {
        name: 'Gemini',
        icon: '💎',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        needsApiKey: true,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
        ],
        getModelsEndpoint: (baseUrl, apiKey) => `${baseUrl}/models?key=${apiKey}`,
        parseModels: (data) => (data.models || [])
            .filter((m: any) => m.name.includes('gemini'))
            .map((m: any) => ({
                id: m.name.replace('models/', ''),
                name: m.displayName || m.name.replace('models/', '')
            })),
        chatEndpoint: (baseUrl, model, apiKey, stream) =>
            `${baseUrl}/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`,
        formatRequest: (prompt, _model, config) => ({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.maxTokens
            }
        }),
        parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        parseStreamChunk: (line) => {
            try {
                if (line.startsWith('data: ')) {
                    const json = JSON.parse(line.slice(6));
                    return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                }
                const json = JSON.parse(line);
                return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } catch { return ''; }
        }
    },

    openrouter: {
        name: 'OpenRouter',
        icon: '🔀',
        baseUrl: 'https://openrouter.ai/api/v1',
        needsApiKey: true,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
            { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
            { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
            { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
            { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' }
        ],
        getModelsEndpoint: (baseUrl) => `${baseUrl}/models`,
        parseModels: (data) => (data.data || []).slice(0, 50).map((m: any) => ({ id: m.id, name: m.name || m.id })),
        chatEndpoint: (baseUrl) => `${baseUrl}/chat/completions`,
        formatRequest: openAIRequestFormatter,
        parseResponse: openAIResponseParser,
        parseStreamChunk: openAIStreamParser
    },

    deepseek: {
        name: 'DeepSeek',
        icon: '🔮',
        baseUrl: 'https://api.deepseek.com/v1',
        needsApiKey: true,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat' },
            { id: 'deepseek-coder', name: 'DeepSeek Coder' },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' }
        ],
        getModelsEndpoint: (baseUrl) => `${baseUrl}/models`,
        parseModels: (data) => (data.data || []).map((m: any) => ({ id: m.id, name: m.id })),
        chatEndpoint: (baseUrl) => `${baseUrl}/chat/completions`,
        formatRequest: openAIRequestFormatter,
        parseResponse: openAIResponseParser,
        parseStreamChunk: openAIStreamParser
    },

    zhipu: {
        name: 'Zhipu GLM',
        icon: '🧠',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        needsApiKey: true,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'glm-4-plus', name: 'GLM-4 Plus' },
            { id: 'glm-4-flash', name: 'GLM-4 Flash' },
            { id: 'glm-4', name: 'GLM-4' },
            { id: 'glm-4-air', name: 'GLM-4 Air' },
            { id: 'glm-4-long', name: 'GLM-4 Long' }
        ],
        getModelsEndpoint: () => null,
        parseModels: () => [],
        chatEndpoint: (baseUrl) => `${baseUrl}/chat/completions`,
        formatRequest: openAIRequestFormatter,
        parseResponse: openAIResponseParser,
        parseStreamChunk: openAIStreamParser
    },

    siliconflow: {
        name: 'SiliconFlow',
        icon: '🌊',
        baseUrl: 'https://api.siliconflow.cn/v1',
        needsApiKey: true,
        needsCustomUrl: false,
        defaultModels: [
            { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
            { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
            { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B' },
            { id: 'THUDM/glm-4-9b-chat', name: 'GLM-4 9B' }
        ],
        getModelsEndpoint: (baseUrl) => `${baseUrl}/models`,
        parseModels: (data) => (data.data || []).map((m: any) => ({ id: m.id, name: m.id.split('/').pop() || m.id })),
        chatEndpoint: (baseUrl) => `${baseUrl}/chat/completions`,
        formatRequest: openAIRequestFormatter,
        parseResponse: openAIResponseParser,
        parseStreamChunk: openAIStreamParser
    },

    custom: {
        name: 'Custom (OpenAI)',
        icon: '🔧',
        baseUrl: '',
        needsApiKey: true,
        needsCustomUrl: true,
        defaultModels: [],
        getModelsEndpoint: (baseUrl) => `${baseUrl}/models`,
        parseModels: (data) => (data.data || []).map((m: any) => ({ id: m.id, name: m.id })),
        chatEndpoint: (baseUrl) => `${baseUrl}/chat/completions`,
        formatRequest: openAIRequestFormatter,
        parseResponse: openAIResponseParser,
        parseStreamChunk: openAIStreamParser
    }
};

export type ProviderKey = keyof typeof PROVIDERS;
