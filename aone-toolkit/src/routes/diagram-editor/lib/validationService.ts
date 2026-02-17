import type { DiagramMode } from './store.svelte';

export interface ValidationIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
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

    // 1. Check for theme usage
    if (!code.includes('!theme') && !code.includes('skinparam')) {
        issues.push({
            id: 'puml-no-theme',
            severity: 'info',
            message: 'No theme or styling detected. Consider using a theme.',
            suggestion: 'Add "!theme spacelab" or similar to improve aesthetics.',
            autoFix: (c) => c.replace(/(@start\w+)/, '$1\n!theme spacelab')
        });
    }

    // 2. Check for "spaghetti" (too many crossing lines heuristic)
    // Actually hard to detect without layout engine, but we can check for layout hints
    if (lines.length > 20 && !code.includes('-[hidden]') && !code.includes('package') && !code.includes('rectangle')) {
        issues.push({
            id: 'puml-structure',
            severity: 'info',
            message: 'Large diagram without grouping or layout hints.',
            suggestion: 'Use "package", "rectangle", or "-[hidden]-" to organize nodes.'
        });
    }

    // 3. Check for default colors (yellow note)
    if (code.includes('note') && !code.includes('skinparam note') && !code.includes('!theme')) {
        issues.push({
            id: 'puml-default-note',
            severity: 'info',
            message: 'Using default yellow notes.',
            suggestion: 'Style notes with "skinparam note { ... }".'
        });
    }

    // 4. Check for deprecated syntax
    if (code.includes('skinparam monochrome true')) {
        issues.push({
            id: 'puml-deprecated-mono',
            severity: 'warning',
            message: 'Monochrome skinparam is old-school.',
            suggestion: 'Use "!theme plain" or "skinparam handwritten false".'
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
    if (!lowerCode.includes('layout=') && !lowerCode.includes('rankdir=') && lowerCode.includes('digraph')) {
        issues.push({
            id: 'dot-no-layout',
            severity: 'info',
            message: 'No explicit layout or rankdir defined.',
            suggestion: 'Add "rankdir=LR" or "layout=neato" for better control.',
            autoFix: (c) => c.replace(/(digraph\s+\w+\s*\{)/, '$1\n    rankdir=LR;')
        });
    }

    // 2. Check for "splines" (curved lines)
    if (!lowerCode.includes('splines=')) {
        issues.push({
            id: 'dot-no-splines',
            severity: 'info',
            message: 'Default straight lines can be messy.',
            suggestion: 'Enable curved lines with "splines=true" or "splines=ortho".',
            autoFix: (c) => c.replace(/(digraph\s+\w+\s*\{)/, '$1\n    splines=ortho;')
        });
    }

    // 3. Check for global attributes
    if (!lowerCode.includes('node [') && (code.match(/\w+\s*->\s*\w+/g) || []).length > 5) {
        issues.push({
            id: 'dot-no-globals',
            severity: 'warning',
            message: 'Repeating attributes on nodes/edges?',
            suggestion: 'Use global "node [...]" or "edge [...]" blocks to reduce repetition.'
        });
    }

    // 4. Graph type check
    if (lowerCode.includes('digraph') && code.includes('--')) {
        issues.push({
            id: 'dot-syntax-mix',
            severity: 'error',
            message: 'Using "--" (undirected) in "digraph" (directed).',
            suggestion: 'Change "--" to "->".',
            autoFix: (c) => c.replace(/--/g, '->')
        });
    }

    return issues;
}

/**
 * Main validation function.
 */
export function validateDiagram(code: string, mode: DiagramMode): QualityMetrics {
    const isPuml = mode === 'plantuml';
    const validationIssues = isPuml ? validatePlantUML(code) : validateGraphviz(code);

    // Calculate complexity
    const lines = code.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith("'") && !l.trim().startsWith("//"));
    const nodeCount = (code.match(/\w+\s*(\[|:)/g) || []).length; // Rough heuristic
    const edgeCount = (code.match(/(-+>|--)/g) || []).length;

    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (lines.length > 50 || edgeCount > 15) complexity = 'medium';
    if (lines.length > 100 || edgeCount > 30) complexity = 'high';

    // Calculate score (100 - penalties)
    let score = 100;
    score -= validationIssues.filter(i => i.severity === 'error').length * 20;
    score -= validationIssues.filter(i => i.severity === 'warning').length * 10;
    score -= validationIssues.filter(i => i.severity === 'info').length * 2;

    // Penalize complexity slightly if unmanaged
    if (complexity === 'high' && validationIssues.length > 0) score -= 5;
    if (complexity === 'medium' && validationIssues.length > 2) score -= 5;

    // Calculate Coupling & Density
    const interContainerEdges = (code.match(/\}?\s*-\[?\w*\]?->\s*\{?/g) || []).length; // High-level proxy
    const coupling = edgeCount > 0 ? (interContainerEdges / edgeCount) : 0;
    const density = nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1)) : 0;

    return {
        score: Math.max(0, score),
        complexity,
        nodeCount,
        edgeCount,
        coupling: parseFloat(coupling.toFixed(2)),
        density: parseFloat(density.toFixed(2)),
        issues: validationIssues
    };
}
