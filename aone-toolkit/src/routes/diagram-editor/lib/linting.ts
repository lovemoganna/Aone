export interface LintResult {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    actions?: any[];
}

/**
 * Masks strings and comments with spaces to keep character indices/columns accurate
 * while preventing false positives in syntax checks.
 */
function maskStringsAndComments(code: string, mode: 'plantuml' | 'graphviz'): string[] {
    const lines = code.split('\n');
    let inBlockComment = false;

    return lines.map((line) => {
        let masked = '';
        let inSingleQuoteComment = false;
        let inDoubleQuoteString = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1] || '';

            // PlantUML Block comment: /' ... '/
            if (mode === 'plantuml' && !inDoubleQuoteString && !inSingleQuoteComment) {
                if (!inBlockComment && char === '/' && nextChar === "'") {
                    inBlockComment = true;
                    masked += '  ';
                    i++;
                    continue;
                }
                if (inBlockComment && char === "'" && nextChar === '/') {
                    inBlockComment = false;
                    masked += '  ';
                    i++;
                    continue;
                }
            }

            // Graphviz Block comment: /* ... */
            if (mode === 'graphviz' && !inDoubleQuoteString) {
                if (!inBlockComment && char === '/' && nextChar === '*') {
                    inBlockComment = true;
                    masked += '  ';
                    i++;
                    continue;
                }
                if (inBlockComment && char === '*' && nextChar === '/') {
                    inBlockComment = false;
                    masked += '  ';
                    i++;
                    continue;
                }
            }

            if (inBlockComment) {
                masked += ' ';
                continue;
            }

            // PlantUML line comment: '
            if (mode === 'plantuml' && !inDoubleQuoteString && char === "'") {
                inSingleQuoteComment = true;
            }

            // Graphviz line comment: // or #
            if (mode === 'graphviz' && !inDoubleQuoteString) {
                if ((char === '/' && nextChar === '/') || char === '#') {
                    inSingleQuoteComment = true;
                }
            }

            if (inSingleQuoteComment) {
                masked += ' ';
                continue;
            }

            // Strings: "..."
            if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inDoubleQuoteString = !inDoubleQuoteString;
                masked += ' ';
                continue;
            }

            if (inDoubleQuoteString) {
                masked += ' ';
                continue;
            }

            masked += char;
        }

        return masked;
    });
}

export function lintDiagram(code: string, mode: 'plantuml' | 'graphviz'): LintResult[] {
    const results: LintResult[] = [];
    if (!code || !code.trim()) return results;

    const rawLines = code.split('\n');
    const maskedLines = maskStringsAndComments(code, mode);

    if (mode === 'plantuml') {
        // 1. PlantUML Start / End tag validation
        const hasStart = /@start([a-z0-9_]*)/i.test(code);
        const hasEnd = /@end([a-z0-9_]*)/i.test(code);

        if (!hasStart) {
            results.push({
                line: 1,
                column: 1,
                message: 'Missing @startuml declaration',
                severity: 'error'
            });
        }
        if (hasStart && !hasEnd) {
            results.push({
                line: Math.max(1, rawLines.length),
                column: 1,
                message: 'Missing @enduml closing tag',
                severity: 'error'
            });
        }

        // 2. Bracket Matching & Arrow Spacing (on non-comment, non-string tokens)
        const bracketStack: { line: number; column: number }[] = [];

        maskedLines.forEach((content, index) => {
            const lineNum = index + 1;

            // Check for invalid arrow spacing: e.g. "- >" or "-- >"
            const invalidArrow = /-\s+>/.exec(content);
            if (invalidArrow) {
                results.push({
                    line: lineNum,
                    column: invalidArrow.index + 1,
                    message: 'Invalid arrow spacing. Use "->" instead of "- >"',
                    severity: 'warning'
                });
            }

            for (let col = 0; col < content.length; col++) {
                const char = content[col];
                if (char === '{') {
                    bracketStack.push({ line: lineNum, column: col + 1 });
                } else if (char === '}') {
                    if (bracketStack.length === 0) {
                        results.push({
                            line: lineNum,
                            column: col + 1,
                            message: 'Unexpected closing brace "}"',
                            severity: 'error'
                        });
                    } else {
                        bracketStack.pop();
                    }
                }
            }
        });

        bracketStack.forEach((unclosed) => {
            results.push({
                line: unclosed.line,
                column: unclosed.column,
                message: 'Unclosed brace "{"',
                severity: 'error'
            });
        });
    }

    if (mode === 'graphviz') {
        const hasDigraph = /\b(strict\s+)?(digraph|graph)\b/i.test(code);
        if (!hasDigraph) {
            results.push({
                line: 1,
                column: 1,
                message: 'Missing graph or digraph definition',
                severity: 'error'
            });
        }

        const isDirected = /\bdigraph\b/i.test(code);
        const bracketStack: { line: number; column: number }[] = [];

        maskedLines.forEach((content, index) => {
            const lineNum = index + 1;

            // Check for edge operator mismatch on unmasked tokens
            if (isDirected && /\b[a-zA-Z0-9_]+\s*--\s*[a-zA-Z0-9_]+/.test(content)) {
                const col = content.indexOf('--');
                results.push({
                    line: lineNum,
                    column: col >= 0 ? col + 1 : 1,
                    message: "Use '->' for directed edges in digraph",
                    severity: 'warning'
                });
            } else if (!isDirected && /\b[a-zA-Z0-9_]+\s*->\s*[a-zA-Z0-9_]+/.test(content)) {
                const col = content.indexOf('->');
                results.push({
                    line: lineNum,
                    column: col >= 0 ? col + 1 : 1,
                    message: "Use '--' for undirected edges in graph",
                    severity: 'warning'
                });
            }

            for (let col = 0; col < content.length; col++) {
                const char = content[col];
                if (char === '{') {
                    bracketStack.push({ line: lineNum, column: col + 1 });
                } else if (char === '}') {
                    if (bracketStack.length === 0) {
                        results.push({
                            line: lineNum,
                            column: col + 1,
                            message: 'Unexpected closing brace "}"',
                            severity: 'error'
                        });
                    } else {
                        bracketStack.pop();
                    }
                }
            }
        });

        bracketStack.forEach((unclosed) => {
            results.push({
                line: unclosed.line,
                column: unclosed.column,
                message: 'Unclosed brace "{"',
                severity: 'error'
            });
        });
    }

    return results;
}
