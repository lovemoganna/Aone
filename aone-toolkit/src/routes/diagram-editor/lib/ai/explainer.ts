export interface ExplainerResponse {
    summary: string;
    flows: string[];
    entities: string[];
}

export async function explainDiagram(code: string, mode: 'plantuml' | 'graphviz'): Promise<ExplainerResponse> {
    // 1. Check for API Configuration
    let apiKey = '';
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    let model = 'gpt-3.5-turbo';

    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('aone_ai_config');
        if (stored) {
            try {
                const config = JSON.parse(stored);
                apiKey = config.apiKey;
                if (config.endpoint) endpoint = config.endpoint;
                if (config.model) model = config.model;
            } catch (e) { /* ignore */ }
        }
    }

    // 2. Real API Call
    if (apiKey) {
        try {
            const prompt = `Analyze this ${mode} diagram code and provide a JSON response with:
            {
                "summary": "1-2 sentence high-level purpose",
                "flows": ["List of 3-5 key logical flows"],
                "entities": ["List of key entities with type"]
            }

            Code:
            ${code}`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
                })
            });

            if (res.ok) {
                const data = await res.json();
                const content = data.choices[0]?.message?.content;
                // Try parsing JSON from content (it might be wrapped in backticks)
                const cleanJson = content.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanJson);
            }
        } catch (e) {
            console.warn("AI API failed, falling back to heuristics", e);
        }
    }

    // 3. Fallback Heuristics (Offline)
    return new Promise((resolve) => {
        setTimeout(() => {
            const summary = `This is a ${mode} diagram demonstrating a structural or behavioral relationship. (Offline Analysis)`;
            const flows: string[] = [];
            const entities: string[] = [];

            // Simple heuristics
            if (mode === 'plantuml') {
                const lines = code.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.includes('->') || trimmed.includes('-->')) {
                        flows.push(trimmed);
                    }
                    if (trimmed.match(/^(?:class|interface|component|node|rectangle)\s+(\w+)/)) {
                        const match = trimmed.match(/^(?:class|interface|component|node|rectangle)\s+(\w+)/);
                        if (match) entities.push(`${match[1]}`);
                    }
                });
            } else {
                // Graphviz heuristic
                const lines = code.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.includes('->') || trimmed.includes('--')) {
                        flows.push(trimmed);
                    }
                });
            }

            resolve({
                summary,
                flows: flows.slice(0, 5), // Limit for demo
                entities: [...new Set(entities)].slice(0, 10)
            });
        }, 1000);
    });
}
