export interface LintResult {
    severity: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
}

export interface AnalysisResult {
    lints: LintResult[];
    layers: Record<string, string[]>; // elementId -> tags
    allTags: string[];
}

export function analyzeDiagram(code: string, mode: 'plantuml' | 'graphviz'): AnalysisResult {
    const results: LintResult[] = [];
    const layers: Record<string, string[]> = {};
    const allTags = new Set<string>();
    const lowerCode = code.toLowerCase();

    // 1. Build Graph & Nodes
    const adj: Record<string, string[]> = {};
    const degrees: Record<string, number> = {}; // Total degree (in + out)
    const nodes = new Set<string>();
    const definitions = new Set<string>(); // For duplicate check

    const lines = code.split('\n');
    lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // Tag Parsing: ' @tag: layerName  or  !pragma tag: layerName
        // We need to associate tags with the *next* element defined, or previous?
        // Usually tags apply to the element on the SAME line or the block.
        // Let's support inline comments:  class Foo ' @tag: Core

        const tagMatch = line.match(/(?:'|#|\/\/)\s*@tag:\s*([a-zA-Z0-9_, ]+)/) || line.match(/!pragma\s+tag:\s*([a-zA-Z0-9_, ]+)/);
        if (tagMatch) {
            const tags = tagMatch[1].split(/[,\s]+/).filter(t => t);
            tags.forEach(t => allTags.add(t));

            // Try to find element ID on this line
            let idMatch = trimmed.match(/^(?:class|interface|component|node|rectangle|storage|database)\s+([a-zA-Z0-9_]+)/i);
            if (!idMatch && mode === 'graphviz') {
                idMatch = trimmed.match(/^\s*([a-zA-Z0-9_]+)\s*\[/); // simple node [
            }
            // If no definition, maybe valid for the element involved in arrow?
            // This is complex. Let's assume tags apply to the IDs found on the line.

            const idsFound: string[] = [];
            if (idMatch) idsFound.push(idMatch[1]);

            const arrowMatch = line.match(/([a-zA-Z0-9_]+)\s*-+>\s*([a-zA-Z0-9_]+)/);
            if (arrowMatch) {
                idsFound.push(arrowMatch[1]);
                idsFound.push(arrowMatch[2]);
            }

            if (idsFound.length > 0) {
                idsFound.forEach(id => {
                    if (!layers[id]) layers[id] = [];
                    // Avoid duplicates
                    tags.forEach(t => {
                        if (!layers[id].includes(t)) layers[id].push(t);
                    });
                });
            }
        }

        if (!trimmed || trimmed.startsWith("'") || trimmed.startsWith("#") || trimmed.startsWith("//")) return;

        // Definition Check (PlantUML)
        // Match explicit definitions: class Foo, component Bar
        if (mode === 'plantuml') {
            const defMatch = trimmed.match(/^(?:class|interface|component|node|rectangle|storage|database)\s+([a-zA-Z0-9_]+)/i);
            if (defMatch) {
                const id = defMatch[1];
                if (definitions.has(id)) {
                    results.push({
                        severity: 'info',
                        message: `Duplicate definition for '${id}'`,
                        line: idx + 1
                    });
                } else {
                    definitions.add(id);
                }
                nodes.add(id);
                if (!degrees[id]) degrees[id] = 0;
            }
        }

        // Arrow Helper
        const addEdge = (src: string, tgt: string) => {
            if (!adj[src]) adj[src] = [];
            adj[src].push(tgt);
            nodes.add(src);
            nodes.add(tgt);
            degrees[src] = (degrees[src] || 0) + 1;
            degrees[tgt] = (degrees[tgt] || 0) + 1;
        };

        // Arrow Parsing
        // A -> B, A --> B, A -> B : Label
        const arrowMatch = line.match(/([a-zA-Z0-9_]+)\s*-+>\s*([a-zA-Z0-9_]+)/);
        if (arrowMatch) {
            addEdge(arrowMatch[1], arrowMatch[2]);
        }
    });

    // 2. Cycle Detection (Only for DAG / topological diagrams, skip sequence diagrams)
    const isSequenceDiagram = mode === 'plantuml' && (
        code.includes('participant ') ||
        code.includes('actor ') ||
        code.includes('activate ') ||
        code.includes('deactivate ') ||
        code.includes('autonumber') ||
        /([a-zA-Z0-9_]+)\s*-+>\s*([a-zA-Z0-9_]+)\s*:\s*.+/.test(code)
    );

    if (!isSequenceDiagram) {
        const visited = new Set<string>();
        const recStack = new Set<string>();

        function hasCycle(node: string, path: string[]): string[] | null {
            if (recStack.has(node)) return [...path, node];
            if (visited.has(node)) return null;

            visited.add(node);
            recStack.add(node);
            path.push(node);

            if (adj[node]) {
                for (const neighbor of adj[node]) {
                    const cycle = hasCycle(neighbor, path);
                    if (cycle) return cycle;
                }
            }

            recStack.delete(node);
            path.pop();
            return null;
        }

        for (const node of nodes) {
            if (!visited.has(node)) {
                const cyclePath = hasCycle(node, []);
                if (cyclePath) {
                    const cycleStart = cyclePath[cyclePath.length - 1];
                    const cleanCycle = cyclePath.slice(cyclePath.indexOf(cycleStart));
                    // Only report simple cycles for now
                    if (cleanCycle.length > 1) {
                        results.push({
                            severity: 'warning',
                            message: `Cycle detected: ${cleanCycle.join(' -> ')}`
                        });
                        break;
                    }
                }
            }
        }
    }

    // 3. Disconnected Nodes Detection
    // Ignore common syntax keywords that might look like nodes if parsing failed
    const ignored = new Set(['start', 'stop', 'end', 'top', 'bottom', 'left', 'right', 'up', 'down']);

    nodes.forEach(node => {
        if (degrees[node] === 0 && !definitions.has(node) && !ignored.has(node.toLowerCase())) {
            results.push({
                severity: 'info',
                message: `Disconnected node: '${node}'`
            });
        } else if (degrees[node] === 0 && definitions.has(node)) {
            results.push({
                severity: 'info',
                message: `Disconnected component: '${node}'`
            });
        }
    });

    return {
        lints: results,
        layers,
        allTags: Array.from(allTags).sort()
    };
}

export const lintDiagram = (code: string, mode: 'plantuml' | 'graphviz') => analyzeDiagram(code, mode).lints;
