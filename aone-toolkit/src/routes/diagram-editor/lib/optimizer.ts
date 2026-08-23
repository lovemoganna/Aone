export type LayoutPreset = 'orthogonal' | 'compact' | 'concentrate' | 'organic';

export function optimizeLayout(code: string, mode: 'plantuml' | 'graphviz', preset: LayoutPreset = 'orthogonal'): string {
    if (mode === 'graphviz') return optimizeGraphviz(code, preset);
    return optimizePlantUML(code, preset);
}

function optimizePlantUML(code: string, preset: LayoutPreset): string {
    let cleanCode = code
        .replace(/skinparam\s+linetype\s+\w+\n?/gi, '')
        .replace(/skinparam\s+nodesep\s+[\d.]+\n?/gi, '')
        .replace(/skinparam\s+ranksep\s+[\d.]+\n?/gi, '');

    const updates: string[] = [];

    switch (preset) {
        case 'orthogonal':
            updates.push('skinparam linetype ortho');
            updates.push('skinparam nodesep 0.8');
            updates.push('skinparam ranksep 0.8');
            break;
        case 'compact':
            updates.push('skinparam linetype polyline');
            updates.push('skinparam nodesep 0.4');
            updates.push('skinparam ranksep 0.4');
            break;
        case 'concentrate':
            updates.push('skinparam linetype ortho');
            updates.push('skinparam nodesep 1.0');
            updates.push('skinparam ranksep 1.2');
            break;
        case 'organic':
            updates.push('skinparam linetype curved');
            updates.push('skinparam nodesep 0.7');
            updates.push('skinparam ranksep 0.7');
            break;
    }

    const lines = cleanCode.split('\n');
    const startIdx = lines.findIndex(l => l.trim().startsWith('@startuml'));

    if (startIdx !== -1) {
        lines.splice(startIdx + 1, 0, ...updates);
    } else {
        lines.unshift('@startuml', ...updates);
        if (!cleanCode.includes('@enduml')) lines.push('@enduml');
    }

    return lines.join('\n');
}

function optimizeGraphviz(code: string, preset: LayoutPreset): string {
    let splines = 'ortho';
    let nodesep = '0.6';
    let ranksep = '0.7';
    let concentrate = 'false';

    if (preset === 'compact') {
        splines = 'polyline';
        nodesep = '0.35';
        ranksep = '0.45';
    } else if (preset === 'concentrate') {
        splines = 'spline';
        concentrate = 'true';
        nodesep = '0.8';
        ranksep = '1.0';
    } else if (preset === 'organic') {
        splines = 'curved';
        nodesep = '0.7';
        ranksep = '0.7';
    }

    let result = code;
    // Replace or inject splines
    if (/splines\s*=\s*\w+/i.test(result)) {
        result = result.replace(/splines\s*=\s*\w+/i, `splines=${splines}`);
    }
    if (/nodesep\s*=\s*[\d.]+/i.test(result)) {
        result = result.replace(/nodesep\s*=\s*[\d.]+/i, `nodesep=${nodesep}`);
    }
    if (/ranksep\s*=\s*[\d.]+/i.test(result)) {
        result = result.replace(/ranksep\s*=\s*[\d.]+/i, `ranksep=${ranksep}`);
    }

    // If no graph attributes defined yet, inject after {
    if (!result.includes('splines=')) {
        const insertIndex = result.indexOf('{');
        if (insertIndex !== -1) {
            const settings = `\n    graph [splines=${splines}, nodesep=${nodesep}, ranksep=${ranksep}, concentrate=${concentrate}];\n`;
            result = result.slice(0, insertIndex + 1) + settings + result.slice(insertIndex + 1);
        }
    }

    return result;
}
