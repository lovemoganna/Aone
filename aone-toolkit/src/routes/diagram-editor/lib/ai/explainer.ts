export interface ExplainerResponse {
    summary: string;
    flows: string[];
    entities: string[];
}

export async function explainDiagram(code: string, mode: 'plantuml' | 'graphviz'): Promise<ExplainerResponse> {
    // 1. Check for API Configuration
    let apiKey = '';
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    let model = 'gpt-4o-mini';

    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('aone_ai_config');
        if (stored) {
            try {
                const config = JSON.parse(stored);
                apiKey = config.apiKey || '';
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
    "summary": "Concise 1-2 sentence high-level architectural purpose",
    "flows": ["List of key logical flows"],
    "entities": ["List of key components/nodes"]
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
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
                })
            });

            if (res.ok) {
                const data = await res.json();
                const content = data.choices?.[0]?.message?.content || '';
                const cleanJson = content.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanJson);
            }
        } catch (e) {
            console.warn("AI API request failed, falling back to AST topology diagnostics", e);
        }
    }

    // 3. High-Precision AST Topological Diagnosis (Instant Offline Analysis)
    const lines = code.split('\n');
    const flows: string[] = [];
    const entitySet = new Set<string>();
    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();

    if (mode === 'plantuml') {
        lines.forEach((raw) => {
            const line = raw.trim();
            if (!line || line.startsWith("'") || line.startsWith("@") || line.startsWith("!")) return;

            // Detect sequence / relationship arrows: A -> B: msg
            const arrowMatch = line.match(/^([a-zA-Z0-9_"\s]+?)\s*(?:->|-->|<-|<--|-\|>|\.\.>|\.\.|--)\s*([a-zA-Z0-9_"\s]+?)(?:\s*:\s*(.*))?$/);
            if (arrowMatch) {
                const src = arrowMatch[1].replace(/["']/g, '').trim();
                const dst = arrowMatch[2].replace(/["']/g, '').trim();
                const label = arrowMatch[3]?.trim();
                if (src && dst) {
                    entitySet.add(src);
                    entitySet.add(dst);
                    outgoing.set(src, (outgoing.get(src) || 0) + 1);
                    incoming.set(dst, (incoming.get(dst) || 0) + 1);
                    flows.push(label ? `${src} ➔ ${dst} (${label})` : `${src} ➔ ${dst}`);
                }
            }

            // Entity definitions: class User, actor Client, component [Gateway] as GW, etc.
            const entityMatch = line.match(/^(?:actor|participant|database|queue|component|class|interface|node|package|rectangle)\s+(?:["']([^"']+)["']\s+as\s+(\w+)|["']?(\w+)["']?)/i);
            if (entityMatch) {
                const name = entityMatch[1] || entityMatch[2] || entityMatch[3];
                if (name) entitySet.add(name);
            }
        });
    } else {
        lines.forEach((raw) => {
            const line = raw.trim();
            if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("digraph") || line.startsWith("graph") || line.startsWith("}")) return;

            const edgeMatch = line.match(/([a-zA-Z0-9_]+)\s*(?:->|--)\s*([a-zA-Z0-9_]+)(?:\s*\[(.*)\])?/);
            if (edgeMatch) {
                const src = edgeMatch[1].trim();
                const dst = edgeMatch[2].trim();
                const labelMatch = edgeMatch[3]?.match(/label\s*=\s*["']([^"']+)["']/);
                const label = labelMatch ? labelMatch[1] : '';
                entitySet.add(src);
                entitySet.add(dst);
                outgoing.set(src, (outgoing.get(src) || 0) + 1);
                incoming.set(dst, (incoming.get(dst) || 0) + 1);
                flows.push(label ? `${src} ➔ ${dst} (${label})` : `${src} ➔ ${dst}`);
            }
        });
    }

    const entities = Array.from(entitySet);
    const entryPoints = entities.filter(e => (incoming.get(e) || 0) === 0 && (outgoing.get(e) || 0) > 0);
    const terminalPoints = entities.filter(e => (outgoing.get(e) || 0) === 0 && (incoming.get(e) || 0) > 0);

    let summary = `Topology contains ${entities.length} nodes and ${flows.length} relations.`;
    if (entryPoints.length > 0) {
        summary += ` Ingress starts at [${entryPoints.slice(0, 2).join(', ')}]`;
    }
    if (terminalPoints.length > 0) {
        summary += ` ending at [${terminalPoints.slice(0, 2).join(', ')}].`;
    }

    return {
        summary,
        flows: flows.slice(0, 8),
        entities: entities.slice(0, 12)
    };
}
