/**
 * Auto-formatter for PlantUML and Graphviz code.
 * Ported from legacy editor logic.
 */

export function formatDiagramCode(code: string, mode: "plantuml" | "graphviz" = "plantuml"): string {
    if (!code.trim()) return code;

    const lines = code.split('\n');
    let indent = 0;
    const INDENT_SIZE = 4;
    const indentStr = ' '.repeat(INDENT_SIZE);

    if (mode === 'plantuml') {
        return lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';

            // Decrease indent before printing line if it's a closing block
            if (/^(@enduml|@endmindmap|@endsalt|@endjson|@endyaml|endif|endwhile|endfor|endrepeat|end\s+fork|end\s+box|end\s+note|end\s+legend|end\s+group|\}|\])$/.test(trimmed) ||
                /^(else|elseif)\b/.test(trimmed)) {
                indent = Math.max(0, indent - 1);
            }

            const result = indentStr.repeat(indent) + trimmed;

            // Increase indent after printing line if it's an opening block
            if (/^@start(uml|mindmap|salt|json|yaml)/.test(trimmed)) {
                indent++;
            } else if (/^(if\s|alt\s|opt\s|loop\s|par\s|break\s|critical\s|group\s|box\s|note\s|legend\s|fork\b)/.test(trimmed)) {
                indent++;
            } else if (/^(package|namespace|rectangle|frame|node|folder|cloud|database|state)\s+.*\{$/.test(trimmed)) {
                indent++;
            } else if (/^(else|elseif)\b/.test(trimmed)) {
                indent++;
            }

            return result;
        }).join('\n');
    } else {
        // Graphviz (DOT)
        return lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';

            // Decrease if line starts with closing brace
            if (trimmed.startsWith('}')) {
                indent = Math.max(0, indent - 1);
            }

            const result = indentStr.repeat(indent) + trimmed;

            // Increase if line ends with opening brace (and doesn't close on same line)
            if (trimmed.endsWith('{') && !trimmed.includes('}')) {
                indent++;
            }

            return result;
        }).join('\n');
    }
}
