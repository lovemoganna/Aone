// Diagram Validation Utilities

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    line: number;
    message: string;
    type: 'syntax' | 'structure' | 'unknown';
}

export interface ValidationWarning {
    line: number;
    message: string;
}

// PlantUML Validation
export function validatePlantUML(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const lines = code.split('\n');

    let hasStart = false;
    let hasEnd = false;
    let startLine = -1;

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        const lineNum = i + 1;

        // Check for @startuml / @enduml
        if (trimmed.startsWith('@startuml')) {
            if (hasStart) {
                errors.push({ line: lineNum, message: 'Duplicate @startuml declaration', type: 'structure' });
            }
            hasStart = true;
            startLine = lineNum;
        }
        if (trimmed.startsWith('@enduml')) {
            if (!hasStart) {
                errors.push({ line: lineNum, message: '@enduml without matching @startuml', type: 'structure' });
            }
            hasEnd = true;
        }

        // Check for common syntax issues
        if (trimmed.includes('->') && !trimmed.includes(':') && !trimmed.startsWith('@') && !trimmed.startsWith("'")) {
            warnings.push({ line: lineNum, message: 'Arrow without message text (consider adding description)' });
        }

        // Check unbalanced brackets
        const openBrackets = (trimmed.match(/{/g) || []).length;
        const closeBrackets = (trimmed.match(/}/g) || []).length;
        if (openBrackets !== closeBrackets && !trimmed.endsWith('{') && !trimmed.startsWith('}')) {
            // Might be multi-line, so just warn
        }
    });

    if (!hasStart && code.trim().length > 0) {
        errors.push({ line: 1, message: 'Missing @startuml declaration', type: 'structure' });
    }
    if (hasStart && !hasEnd) {
        errors.push({ line: lines.length, message: 'Missing @enduml declaration', type: 'structure' });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

// Graphviz Validation
export function validateGraphviz(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const lines = code.split('\n');

    let hasGraph = false;
    let braceCount = 0;

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        const lineNum = i + 1;

        // Check for graph/digraph declaration
        if (trimmed.match(/^(strict\s+)?(di)?graph\s+/i)) {
            hasGraph = true;
        }

        // Count braces
        braceCount += (trimmed.match(/{/g) || []).length;
        braceCount -= (trimmed.match(/}/g) || []).length;

        // Check for common issues
        if (trimmed.includes('->') && !trimmed.includes('digraph') && code.includes('graph ') && !code.includes('digraph')) {
            errors.push({ line: lineNum, message: 'Using -> (directed edge) in undirected graph. Use -- instead.', type: 'syntax' });
        }

        // Check for missing semicolons (common in Graphviz)
        if (trimmed.length > 0 && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
            warnings.push({ line: lineNum, message: 'Statement may be missing semicolon' });
        }
    });

    if (!hasGraph && code.trim().length > 0) {
        errors.push({ line: 1, message: 'Missing graph or digraph declaration', type: 'structure' });
    }

    if (braceCount !== 0) {
        errors.push({ line: lines.length, message: `Unbalanced braces (${braceCount > 0 ? 'missing closing' : 'extra closing'})`, type: 'syntax' });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

// Main validation dispatcher
export function validateDiagram(code: string, mode: 'plantuml' | 'graphviz'): ValidationResult {
    if (!code.trim()) {
        return { isValid: true, errors: [], warnings: [] };
    }

    if (mode === 'plantuml') {
        return validatePlantUML(code);
    } else {
        return validateGraphviz(code);
    }
}
