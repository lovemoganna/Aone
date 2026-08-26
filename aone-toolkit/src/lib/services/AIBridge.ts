/**
 * AIBridge — Central AI communication service.
 * Routes calls through user-configured providers with streaming support.
 */
import { PROVIDERS, type ProviderKey, type ProviderConfig, type ModelInfo } from '../constants/providers';

export interface AICallOptions {
    providerKey: ProviderKey;
    apiKey?: string;
    customBaseUrl?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
    signal?: AbortSignal;
}

export class AIBridge {

    /**
     * Make an AI call to the configured provider.
     */
    static async callAI(prompt: string, options: AICallOptions): Promise<string> {
        const provider = PROVIDERS[options.providerKey];
        if (!provider) throw new Error(`Unknown provider: ${options.providerKey}`);

        const baseUrl = options.customBaseUrl || provider.baseUrl;
        const config: ProviderConfig = {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens ?? 4096,
            stream: options.stream ?? false
        };

        const endpoint = provider.chatEndpoint(baseUrl, options.model, options.apiKey, config.stream);
        const body = provider.formatRequest(prompt, options.model, config);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (options.apiKey && options.providerKey !== 'gemini') {
            headers['Authorization'] = `Bearer ${options.apiKey}`;
        }

        // OpenRouter requires extra headers
        if (options.providerKey === 'openrouter') {
            headers['HTTP-Referer'] = window.location.origin;
            headers['X-Title'] = 'Aone MetaFlow';
        }

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: options.signal
            });
        } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') throw fetchErr;
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || options.providerKey === 'ollama';
            if (isHttps && isLocal) {
                throw new Error(`无法连接本地 Ollama (CORS/网络跨域受限): 当前处于 HTTPS 线上环境。请在终端执行 'setx OLLAMA_ORIGINS "*"' 并重启 Ollama，或使用云端 API (Groq/Gemini/DeepSeek)。`);
            }
            throw new Error(`网络请求失败: ${fetchErr.message || '无法连接到模型服务'}`);
        }

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            let parsedErr = '';
            try {
                const errJson = JSON.parse(errText);
                parsedErr = errJson.error || errJson.message || '';
            } catch {}

            if (parsedErr.includes('llama-server binary not found')) {
                throw new Error(`Ollama 推理服务异常 (llama-server not found): Ollama 本地安装文件不完整。请重新安装/修复 Ollama 或在终端运行 'ollama pull ${options.model}'。`);
            }
            throw new Error(`API error ${response.status}: ${parsedErr || errText.slice(0, 200)}`);
        }

        // Streaming mode
        if (config.stream && options.onChunk && response.body) {
            return this.handleStream(response, provider.parseStreamChunk, options.onChunk);
        }

        // Non-streaming mode
        const data = await response.json();
        return provider.parseResponse(data);
    }

    /**
     * Handle SSE/streaming response.
     */
    private static async handleStream(
        response: Response,
        parseChunk: (line: string) => string,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                const text = parseChunk(trimmed);
                if (text) {
                    accumulated += text;
                    onChunk(text);
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
            const text = parseChunk(buffer.trim());
            if (text) {
                accumulated += text;
                onChunk(text);
            }
        }

        return accumulated;
    }

    /**
     * Fetch available models from the provider.
     */
    static async fetchModels(
        providerKey: ProviderKey,
        apiKey?: string,
        customBaseUrl?: string
    ): Promise<ModelInfo[]> {
        const provider = PROVIDERS[providerKey];
        if (!provider) return [];

        const baseUrl = customBaseUrl || provider.baseUrl;
        const endpoint = provider.getModelsEndpoint(baseUrl, apiKey);

        if (!endpoint) {
            return provider.defaultModels;
        }

        try {
            const headers: Record<string, string> = {};
            if (apiKey && providerKey !== 'gemini') {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const resp = await fetch(endpoint, { headers });
            if (!resp.ok) {
                console.warn(`Failed to fetch models: ${resp.status}`);
                return provider.defaultModels;
            }

            const data = await resp.json();
            const fetched = provider.parseModels(data);
            return fetched.length > 0 ? fetched : provider.defaultModels;
        } catch (e: any) {
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || providerKey === 'ollama';
            if (isHttps && isLocal) {
                console.info('HTTPS to localhost Ollama CORS restricted. Falling back to default models.');
            } else {
                console.warn('Model fetch failed, using defaults:', e);
            }
            return provider.defaultModels;
        }
    }

    /**
     * Quick connection test.
     */
    static async testConnection(
        providerKey: ProviderKey,
        apiKey?: string,
        customBaseUrl?: string
    ): Promise<{ success: boolean; message: string; models?: ModelInfo[] }> {
        const provider = PROVIDERS[providerKey];
        if (!provider) return { success: false, message: `未知提供商: ${providerKey}` };

        const baseUrl = customBaseUrl || provider.baseUrl;
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || providerKey === 'ollama';

        try {
            const endpoint = provider.getModelsEndpoint(baseUrl, apiKey);
            if (endpoint) {
                const headers: Record<string, string> = {};
                if (apiKey && providerKey !== 'gemini') {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }
                const resp = await fetch(endpoint, { headers });
                if (!resp.ok) {
                    return { success: false, message: `服务响应错误: HTTP ${resp.status}` };
                }
                const data = await resp.json();
                const models = provider.parseModels(data);
                if (models.length > 0) {
                    return {
                        success: true,
                        message: `连接成功！已获取 ${models.length} 个可用模型。`,
                        models
                    };
                }
            }

            return {
                success: true,
                message: `已连接到 ${provider.name} 默认节点。`,
                models: provider.defaultModels
            };
        } catch (e: any) {
            if (isHttps && isLocal) {
                return {
                    success: false,
                    message: '无法连接本地 Ollama (CORS 跨域限制)。请为 Ollama 设置环境变量 OLLAMA_ORIGINS="*" 并重启，或使用云端 API。'
                };
            }
            return { success: false, message: e.message || '连接失败，请检查网络或配置' };
        }
    }

    /**
     * Call AI with full message history (for chat mode).
     */
    static async callAIWithMessages(
        messages: Array<{ role: string; content: string }>,
        options: AICallOptions
    ): Promise<string> {
        const provider = PROVIDERS[options.providerKey];
        if (!provider) throw new Error(`Unknown provider: ${options.providerKey}`);

        const baseUrl = options.customBaseUrl || provider.baseUrl;
        const config: ProviderConfig = {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens ?? 4096,
            stream: options.stream ?? false
        };

        const endpoint = provider.chatEndpoint(baseUrl, options.model, options.apiKey, config.stream);

        // For Gemini, convert messages to its format
        let body: any;
        if (options.providerKey === 'gemini') {
            body = {
                contents: messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                })),
                generationConfig: {
                    temperature: config.temperature,
                    maxOutputTokens: config.maxTokens
                }
            };
        } else if (options.providerKey === 'ollama') {
            body = {
                model: options.model,
                messages,
                stream: config.stream,
                options: {
                    temperature: config.temperature,
                    num_predict: config.maxTokens
                }
            };
        } else {
            body = {
                model: options.model,
                messages,
                temperature: config.temperature,
                max_tokens: config.maxTokens,
                stream: config.stream
            };
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (options.apiKey && options.providerKey !== 'gemini') {
            headers['Authorization'] = `Bearer ${options.apiKey}`;
        }
        if (options.providerKey === 'openrouter') {
            headers['HTTP-Referer'] = window.location.origin;
            headers['X-Title'] = 'Aone MetaFlow';
        }

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: options.signal
            });
        } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') throw fetchErr;
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || options.providerKey === 'ollama';
            if (isHttps && isLocal) {
                throw new Error(`无法连接本地 Ollama (CORS/网络跨域受限): 当前处于 HTTPS 线上环境。请在终端执行 'setx OLLAMA_ORIGINS "*"' 并重启 Ollama，或使用云端 API (Groq/Gemini/DeepSeek)。`);
            }
            throw new Error(`网络请求失败: ${fetchErr.message || '无法连接到模型服务'}`);
        }

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            let parsedErr = '';
            try {
                const errJson = JSON.parse(errText);
                parsedErr = errJson.error || errJson.message || '';
            } catch {}

            if (parsedErr.includes('llama-server binary not found')) {
                throw new Error(`Ollama 推理服务异常 (llama-server not found): Ollama 本地安装文件不完整。请重新安装/修复 Ollama 或在终端运行 'ollama pull ${options.model}'。`);
            }
            throw new Error(`API error ${response.status}: ${parsedErr || errText.slice(0, 200)}`);
        }

        if (config.stream && options.onChunk && response.body) {
            return this.handleStream(response, provider.parseStreamChunk, options.onChunk);
        }

        const data = await response.json();
        return provider.parseResponse(data);
    }
}
