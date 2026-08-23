import type { DiagramMode } from './store.svelte';

export interface ValidationIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
    suggestion?: string;
    autoFix?: (code: string) => string;
}

export interface QualityMetrics {
    score: number; // 0-100
    complexity: 'low' | 'medium' | 'high';
    nodeCount: number;
    edgeCount: number;
    coupling: number; // inter-container edges / total edges
    density: number; // actual edges / possible edges
    issues: ValidationIssue[];
}

/**
 * Validates PlantUML code against best practices and anti-patterns.
 */
function validatePlantUML(code: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = code.split('\n');

    // 1. Check for theme usage (only for standard UML diagrams, not json/yaml/mindmap)
    const isStandardUML = /@startuml\b/i.test(code);
    if (isStandardUML && !code.includes('!theme') && !code.includes('skinparam') && !code.includes('scale')) {
        issues.push({
            id: 'puml-no-theme',
            severity: 'info',
            message: 'No theme or custom styling applied.',
            suggestion: 'Add "!theme spacelab" or custom skinparam to enhance clarity.',
            autoFix: (c) => c.replace(/(@startuml[^\n]*\n)/i, '$1!theme spacelab\n')
        });
    }

    // 2. Large diagram structure recommendation
    if (lines.length > 30 && !code.includes('-[hidden]') && !code.includes('package') && !code.includes('rectangle') && !code.includes('frame')) {
        issues.push({
            id: 'puml-structure',
            severity: 'info',
            message: 'Large diagram without container grouping.',
            suggestion: 'Consider grouping nodes with "package" or "rectangle" for readability.'
        });
    }

    // 3. Deprecated syntax
    if (code.includes('skinparam monochrome true')) {
        issues.push({
            id: 'puml-deprecated-mono',
            severity: 'warning',
            message: 'Deprecated monochrome configuration detected.',
            suggestion: 'Use "!theme plain" or modern skinparam directives.',
            autoFix: (c) => c.replace(/skinparam\s+monochrome\s+true/g, '!theme plain')
        });
    }

    return issues;
}

/**
 * Validates Graphviz/DOT code against best practices.
 */
function validateGraphviz(code: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lowerCode = code.toLowerCase();

    // 1. Check for layout engine definition
    if (!lowerCode.includes('rankdir=') && !lowerCode.includes('layout=') && lowerCode.includes('digraph')) {
        issues.push({
            id: 'dot-no-layout',
            severity: 'info',
            message: 'No explicit rankdir or layout defined.',
            suggestion: 'Add "rankdir=LR;" inside the root graph for horizontal layout flow.',
            autoFix: (c) => c.replace(/(digraph\s*[\w\-_]*\s*\{)/i, '$1\n    rankdir=LR;')
        });
    }

    // 2. Check for splines on complex graphs
    const edgeCount = (code.match(/->/g) || []).length;
    if (edgeCount > 6 && !lowerCode.includes('splines=')) {
        issues.push({
            id: 'dot-no-splines',
            severity: 'info',
            message: 'Complex graph with default straight edges.',
            suggestion: 'Add "splines=ortho;" or "splines=polyline;" for cleaner routing.',
            autoFix: (c) => c.replace(/(digraph\s*[\w\-_]*\s*\{)/i, '$1\n    splines=ortho;')
        });
    }

    return issues;
}

/**
 * Main validation function that produces metrics & issues.
 */
export function validateDiagram(code: string, mode: DiagramMode): QualityMetrics {
    const isPuml = mode === 'plantuml';
    const validationIssues = isPuml ? validatePlantUML(code) : validateGraphviz(code);

    // Calculate node and edge counts
    const cleanLines = code.split('\n').filter(l => {
        const t = l.trim();
        return t.length > 0 && !t.startsWith("'") && !t.startsWith("//") && !t.startsWith("#");
    });

    let nodeCount = 0;
    let edgeCount = 0;

    if (isPuml) {
        // Count explicit definitions and arrow participants
        const defs = code.match(/^(?:class|interface|component|node|rectangle|storage|database|actor|participant)\s+([a-zA-Z0-9_]+)/gim) || [];
        const edges = code.match(/([a-zA-Z0-9_]+)\s*(-+>|<-+|\.\.+>|<+\.\.)\s*([a-zA-Z0-9_]+)/g) || [];
        edgeCount = edges.length;
        const participantSet = new Set<string>();
        defs.forEach(d => {
            const m = d.match(/\b([a-zA-Z0-9_]+)$/);
            if (m) participantSet.add(m[1]);
        });
        edges.forEach(e => {
            const m = e.match(/([a-zA-Z0-9_]+)\s*[-.<>]+\s*([a-zA-Z0-9_]+)/);
            if (m) {
                participantSet.add(m[1]);
                participantSet.add(m[2]);
            }
        });
        nodeCount = participantSet.size || defs.length;
    } else {
        const edgeMatches = code.match(/([a-zA-Z0-9_]+)\s*(->|--)\s*([a-zA-Z0-9_]+)/g) || [];
        edgeCount = edgeMatches.length;
        const nodeSet = new Set<string>();
        edgeMatches.forEach(e => {
            const m = e.match(/([a-zA-Z0-9_]+)\s*(?:->|--)\s*([a-zA-Z0-9_]+)/);
            if (m) {
                nodeSet.add(m[1]);
                nodeSet.add(m[2]);
            }
        });
        const declaredNodes = code.match(/^\s*([a-zA-Z0-9_]+)\s*\[/gm) || [];
        declaredNodes.forEach(d => {
            const m = d.match(/^\s*([a-zA-Z0-9_]+)/);
            if (m) nodeSet.add(m[1]);
        });
        nodeCount = nodeSet.size;
    }

    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (cleanLines.length > 40 || edgeCount > 12) complexity = 'medium';
    if (cleanLines.length > 90 || edgeCount > 25) complexity = 'high';

    // Calculate quality score (100 - penalties)
    let score = 100;
    score -= validationIssues.filter(i => i.severity === 'error').length * 20;
    score -= validationIssues.filter(i => i.severity === 'warning').length * 10;
    score -= validationIssues.filter(i => i.severity === 'info').length * 2;

    if (complexity === 'high' && validationIssues.length > 0) score -= 5;
    if (complexity === 'medium' && validationIssues.length > 2) score -= 5;

    const density = nodeCount > 1 ? parseFloat((edgeCount / (nodeCount * (nodeCount - 1))).toFixed(2)) : 0;
    const coupling = edgeCount > 0 ? parseFloat(((code.match(/\}?\s*-\[?\w*\]?->\s*\{?/g) || []).length / edgeCount).toFixed(2)) : 0;

    return {
        score: Math.max(0, Math.min(100, score)),
        complexity,
        nodeCount,
        edgeCount,
        coupling,
        density,
        issues: validationIssues
    };
}
