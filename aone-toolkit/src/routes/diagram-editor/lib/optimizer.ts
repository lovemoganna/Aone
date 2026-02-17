export function optimizeLayout(code: string, mode: 'plantuml' | 'graphviz'): string {
    if (mode === 'graphviz') return optimizeGraphviz(code);
    return optimizePlantUML(code);
}

function optimizePlantUML(code: string): string {
    const lines = code.split('\n');
    let hasSkinparam = false;
    let nodeCount = 0;
    let edgeCount = 0;

    // 1. Analyze Complexity
    lines.forEach(line => {
        if (line.trim().startsWith('skinparam')) hasSkinparam = true;
        if (line.includes('->') || line.includes('--')) edgeCount++;
        if (line.includes('participant') || line.includes('class') || line.includes('component') || line.includes('node')) nodeCount++;
    });

    const density = edgeCount / (nodeCount || 1);
    const updates: string[] = [];

    // 2. Inject Theme if missing
    if (!code.includes('!theme')) {
        updates.push('!theme blueprint');
    }

    // 3. Inject Layout Params based on density
    if (!hasSkinparam) {
        if (density > 1.5) {
            // High density: Spread out nodes
            updates.push('skinparam nodesep 1.0');
            updates.push('skinparam ranksep 1.0');
            updates.push('skinparam linetype ortho');
        } else {
            // Low density: Compact but clean
            updates.push('skinparam nodesep 0.6');
            updates.push('skinparam ranksep 0.6');
            updates.push('skinparam linetype polyline');
        }

        // Add round corners and shadows for polish
        updates.push('skinparam roundcorner 10');
        updates.push('skinparam shadowing false');
        updates.push('skinparam Handwritten false');
    }

    // Insert updates after @startuml
    const startIdx = lines.findIndex(l => l.trim().startsWith('@startuml'));
    if (startIdx !== -1) {
        lines.splice(startIdx + 1, 0, ...updates);
    } else {
        // Fallback if no start tag
        if (updates.length > 0) {
            lines.unshift('@startuml', ...updates);
            if (!code.includes('@enduml')) lines.push('@enduml');
        }
    }

    return lines.join('\n');
}

function optimizeGraphviz(code: string): string {
    // Simple Graphviz optimizations
    if (code.includes('graph [') || code.includes('rankdir=')) return code;

    const insertIndex = code.indexOf('{');
    if (insertIndex === -1) return code;

    const settings = `
  graph [fontname="Inter", fontsize=12, splines=ortho, nodesep=0.8, ranksep=0.8];
  node [fontname="Inter", fontsize=12, shape=box, style="filled,rounded", fillcolor="#e0e7ff", color="#4f46e5", penwidth=1.5];
  edge [fontname="Inter", fontsize=10, color="#6b7280", penwidth=1.2];
`;

    return code.slice(0, insertIndex + 1) + settings + code.slice(insertIndex + 1);
}
