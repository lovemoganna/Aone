export interface AutoFix {
    label: string;
    apply: (code: string) => string;
}

export function getAutoFixes(message: string, code: string, mode: 'plantuml' | 'graphviz'): AutoFix[] {
    const fixes: AutoFix[] = [];
    const lowerMessage = message.toLowerCase();

    // 1. Missing @startuml / @enduml
    if (mode === 'plantuml') {
        if (lowerMessage.includes('missing @startuml')) {
            fixes.push({
                label: 'Add @startuml',
                apply: (c) => `@startuml\n${c}`
            });
        }
        if (lowerMessage.includes('missing @enduml')) {
            fixes.push({
                label: 'Add @enduml',
                apply: (c) => `${c.trim()}\n@enduml`
            });
        }
    }

    // 2. Missing graph / digraph
    if (mode === 'graphviz') {
        if (lowerMessage.includes('missing graph or digraph')) {
            fixes.push({
                label: 'Add digraph { }',
                apply: (c) => `digraph G {\n${c}\n}`
            });
        }
    }

    // 3. Edge Operator Mismatch (Graphviz)
    if (mode === 'graphviz') {
        if (lowerMessage.includes("use '--' for undirected edges")) {
            fixes.push({
                label: "Convert -> to --",
                apply: (c) => c.replace(/->/g, '--')
            });
        }
        if (lowerMessage.includes("use '->' for directed edges")) {
            fixes.push({
                label: "Convert -- to ->",
                apply: (c) => c.replace(/--/g, '->')
            });
        }
    }

    // 4. Invalid Arrow Spacing (PlantUML)
    if (mode === 'plantuml' && lowerMessage.includes('invalid arrow spacing')) {
        fixes.push({
            label: 'Fix Arrow Spacing',
            apply: (c) => c.replace(/\-\s+\>/g, '->')
        });
    }

    // 5. Missing Semicolon (Graphviz)
    if (mode === 'graphviz' && lowerMessage.includes('missing semicolon')) {
        fixes.push({
            label: 'Add Missing Semicolons',
            apply: (c) => {
                const lines = c.split('\n');
                return lines.map(line => {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
                        return line + ';';
                    }
                    return line;
                }).join('\n');
            }
        });
    }

    // 6. Unbalanced Braces
    if (lowerMessage.includes('unclosed brace') || lowerMessage.includes('unexpected closing brace')) {
        const open = (code.match(/{/g) || []).length;
        const close = (code.match(/}/g) || []).length;
        if (open > close) {
            fixes.push({
                label: `Add ${open - close} closing braces`,
                apply: (c) => c.trim() + '\n' + '}'.repeat(open - close)
            });
        }
    }

    return fixes;
}
