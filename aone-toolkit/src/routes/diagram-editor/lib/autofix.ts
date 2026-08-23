export interface AutoFix {
    label: string;
    description?: string;
    apply: (code: string) => string;
}

export function getAutoFixes(message: string, code: string, mode: 'plantuml' | 'graphviz'): AutoFix[] {
    const fixes: AutoFix[] = [];
    if (!code) return fixes;
    const lowerMessage = (message || '').toLowerCase();

    // 1. Missing @startuml / @enduml
    if (mode === 'plantuml') {
        const hasStart = /@start([a-z0-9_]*)/i.test(code);
        const hasEnd = /@end([a-z0-9_]*)/i.test(code);

        if (!hasStart && (lowerMessage.includes('missing @startuml') || !code.startsWith('@start'))) {
            fixes.push({
                label: 'Add @startuml',
                description: 'Wrap code with @startuml declaration',
                apply: (c) => `@startuml\n${c}\n@enduml`
            });
        } else if (hasStart && !hasEnd && (lowerMessage.includes('missing @enduml') || lowerMessage.includes('closing tag'))) {
            fixes.push({
                label: 'Add @enduml',
                description: 'Append missing @enduml closing tag',
                apply: (c) => `${c.trim()}\n@enduml`
            });
        }
    }

    // 2. Missing graph / digraph
    if (mode === 'graphviz') {
        if (!/^\s*(strict\s+)?(digraph|graph)\b/i.test(code.trim())) {
            fixes.push({
                label: 'Wrap in digraph G { }',
                description: 'Format as standard directed graph',
                apply: (c) => `digraph G {\n    rankdir=LR;\n    node [shape=box, style=filled, fillcolor="#f8fafc"];\n${c}\n}`
            });
        }
    }

    // 3. Convert Fullwidth/CJK Punctuation to ASCII
    if (/[\uff01-\uffee\u3000-\u303f]/.test(code)) {
        fixes.push({
            label: 'Fix Fullwidth Punctuation',
            description: 'Convert Chinese quotes, semicolons, and colons to ASCII',
            apply: (c) => c
                .replace(/；/g, ';')
                .replace(/：/g, ':')
                .replace(/，/g, ',')
                .replace(/（/g, '(')
                .replace(/）/g, ')')
                .replace(/[“”]/g, '"')
                .replace(/[‘’]/g, "'")
                .replace(/【/g, '[')
                .replace(/】/g, ']')
        });
    }

    // 4. Edge Operator Mismatch (Graphviz)
    if (mode === 'graphviz') {
        if (lowerMessage.includes("use '--' for undirected edges") || (/\bgraph\b/i.test(code) && /\b\w+\s*->\s*\w+/.test(code))) {
            fixes.push({
                label: "Convert -> to --",
                description: "Change directed arrows to undirected lines",
                apply: (c) => c.replace(/(\b[a-zA-Z0-9_]+\s*)->(\s*[a-zA-Z0-9_]+\b)/g, '$1--$2')
            });
        }
        if (lowerMessage.includes("use '->' for directed edges") || (/\bdigraph\b/i.test(code) && /\b\w+\s*--\s*\w+/.test(code))) {
            fixes.push({
                label: "Convert -- to ->",
                description: "Change undirected lines to directed arrows",
                apply: (c) => c.replace(/(\b[a-zA-Z0-9_]+\s*)--(\s*[a-zA-Z0-9_]+\b)/g, '$1->$2')
            });
        }
    }

    // 5. Invalid Arrow Spacing (PlantUML)
    if (mode === 'plantuml' && (lowerMessage.includes('invalid arrow spacing') || /-\s+>/.test(code))) {
        fixes.push({
            label: 'Fix Arrow Spacing',
            description: 'Remove spaces inside -> arrow symbols',
            apply: (c) => c.replace(/-\s+>/g, '->')
        });
    }

    // 6. Unbalanced Braces
    const openCount = (code.match(/{/g) || []).length;
    const closeCount = (code.match(/}/g) || []).length;
    if (openCount > closeCount && (lowerMessage.includes('unclosed brace') || openCount > closeCount)) {
        fixes.push({
            label: `Add ${openCount - closeCount} closing brace(s)`,
            description: 'Close unclosed block braces',
            apply: (c) => c.trimEnd() + '\n' + '}'.repeat(openCount - closeCount)
        });
    }

    return fixes;
}
