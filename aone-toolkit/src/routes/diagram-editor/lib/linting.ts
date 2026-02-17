export interface LintResult {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    actions?: any[];
}

export function lintDiagram(code: string, mode: 'plantuml' | 'graphviz'): LintResult[] {
    const results: LintResult[] = [];
    const lines = code.split('\n');

    if (mode === 'plantuml') {
        const hasStart = code.includes('@startuml');
        const hasEnd = code.includes('@enduml');

        if (!hasStart) {
            results.push({ line: 1, column: 1, message: 'Missing @startuml', severity: 'error' });
        }
        if (!hasEnd) {
            results.push({ line: lines.length, column: 1, message: 'Missing @enduml', severity: 'error' });
        }

        // Basic bracket matching for class/package
        let bracketStack: { line: number, char: string }[] = [];
        lines.forEach((content, index) => {
            const lineNum = index + 1;

            // Check for invalid arrows (e.g., -- > or - ->)
            if (/\-\s+\>/.test(content)) {
                results.push({ line: lineNum, column: content.indexOf('-'), message: 'Invalid arrow spacing. Use "->" instead of "- >"', severity: 'warning' });
            }

            if (content.includes('{')) bracketStack.push({ line: lineNum, char: '{' });
            if (content.includes('}')) {
                if (bracketStack.length === 0) {
                    results.push({ line: lineNum, column: 1, message: 'Unexpected closing brace "}"', severity: 'error' });
                } else {
                    bracketStack.pop();
                }
            }
        });

        bracketStack.forEach(unclosed => {
            results.push({ line: unclosed.line, column: 1, message: 'Unclosed brace "{"', severity: 'error' });
        });
    }

    if (mode === 'graphviz') {
        const hasDigraph = lines.some(l => l.includes('digraph') || l.includes('graph'));
        if (!hasDigraph) {
            results.push({ line: 1, column: 1, message: 'Missing graph or digraph definition', severity: 'error' });
        }

        // Check for edge operator mismatch
        const isDirected = code.includes('digraph');
        lines.forEach((content, index) => {
            const lineNum = index + 1;
            const trimmed = content.trim();

            if (trimmed && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
                // Semicolon warning for professional DOT style
                results.push({ line: lineNum, column: content.length, message: 'Missing semicolon (optional but recommended)', severity: 'warning' });
            }

            if (isDirected && content.includes('--')) {
                results.push({ line: lineNum, column: content.indexOf('--'), message: "Use '->' for directed edges in digraph", severity: 'warning' });
            }
            if (!isDirected && content.includes('->')) {
                results.push({ line: lineNum, column: content.indexOf('->'), message: "Use '--' for undirected edges in graph", severity: 'warning' });
            }
        });
    }

    return results;
}
