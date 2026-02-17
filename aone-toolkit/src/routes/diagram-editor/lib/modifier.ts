
import { findDefinitions, type DiagramMode } from './parser';

/**
 * Updates the color of a specific element in the code.
 */
export function injectColor(code: string, id: string, color: string, mode: DiagramMode): string {
    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);

    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        // Fallback: Append new definition if implicit or missing
        if (mode === 'plantuml') {
            return appendNewDefinition(code, mode, `${id} ${color}`);
        } else {
            // Graphviz default: assumption it's a node
            return appendNewDefinition(code, mode, `${id} [fillcolor="${color}", style="filled"];`);
        }
    }

    const lines = code.split('\n');
    let line = lines[def.line];

    if (mode === 'plantuml') {
        // Regex to find existing color: #current
        // We match # followed by word or hex.
        // Be careful not to replace random words, look for #
        const existingColorRegex = /#(\w+|[0-9a-fA-F]{3,6})/;
        const match = line.match(existingColorRegex);

        if (match) {
            // Replace existing color
            line = line.replace(match[0], color ? `${color}` : '');
        } else if (color) {
            // Add new color
            const splitRegex = /(\s*)(\{|$|<<)/;
            const splitMatch = line.match(splitRegex);

            if (splitMatch && splitMatch.index !== undefined) {
                line = line.slice(0, splitMatch.index) + ' ' + color + line.slice(splitMatch.index);
            } else {
                line += ' ' + color;
            }
        }
    } else {
        // Graphviz: specific ID matching
        // Match: (start/space/semi) (ID or "ID") (space) (optional [attrs])
        const idRegex = new RegExp(`(?:^|[\\s;])(?:(${id})|"(${id})")\\s*(?:\\[(.*?)\\])?`);
        const match = line.match(idRegex);

        if (match) {
            const fullMatch = match[0];
            const hasAttrs = match[3] !== undefined;
            const content = match[3] || "";

            let newContent = content;
            // Match color or fillcolor, handling quotes or no quotes
            const colorPropRegex = /\b(fillcolor|color)\s*=\s*(?:"[^"]*"|[^,\s\]]+)/g;

            if (colorPropRegex.test(content)) {
                // Replace all instances of color/fillcolor
                newContent = content.replace(colorPropRegex, `fillcolor="${color}"`);
            } else {
                // Append new color
                let stylePart = '';
                if (!/\bstyle\s*=/.test(content)) {
                    stylePart = ', style="filled"';
                }

                if (content.trim().length > 0) {
                    newContent += `, fillcolor="${color}"${stylePart}`;
                } else {
                    newContent = `fillcolor="${color}"${stylePart}`;
                }
            }

            // Reconstruct the part
            if (hasAttrs) {
                // We matched [ ... ]
                // Reconstruct exact match string but replace content
                // Be careful: start of match might have ; or space
                // We can't just replace `[${content}]` because content might appear elsewhere?
                // Safest: match[0] contains the whole thing.
                // It ends with `]`. So last `]` corresponds to end.
                // Or simplified: use the captured groups to reconstruct.
                // But we don't know exact spacing unless we capture it?
                // Simpler: Replace the `[${content}]` in `fullMatch` with `[${newContent}]`.
                // BUT content might be integer or something that regex replaces wrongly?
                // Better: find `[` index in `fullMatch`.
                const openBracketIndex = fullMatch.lastIndexOf('[');
                if (openBracketIndex !== -1) {
                    const before = fullMatch.slice(0, openBracketIndex);
                    // The ] should be at the end of match[0] usually? NOT GUARANTEED if non-greedy `.*?` stopped early?
                    // In parser we used `[^\]]*`. Here we used `.*?`? parser used `[^\]]*`.
                    // Let's use `[^\]]*` in RegExp as well for safety.
                    const newPart = `${before}[${newContent}]`;
                    line = line.replace(fullMatch, newPart);
                }
            } else {
                // No attributes. Insert them.
                // fullMatch is just the ID (with leading junk).
                // Append ` [attrs]` to it.
                const newPart = `${fullMatch} [${newContent}]`;
                line = line.replace(fullMatch, newPart);
            }
        } else {
            // Should not happen if parser found it?
            // But valid if parser logic differs slightly.
            // Fallback: append
            const splitRegex = /(\s*)(;|$)/;
            const splitMatch = line.match(splitRegex);
            if (splitMatch && splitMatch.index !== undefined) {
                line = line.slice(0, splitMatch.index) + ` [fillcolor="${color}", style="filled"]` + line.slice(splitMatch.index);
            }
        }
    }

    lines[def.line] = line;
    return lines.join('\n');
}

function appendNewDefinition(code: string, mode: DiagramMode, newLine: string): string {
    const lines = code.split('\n');
    let insertIdx = lines.length;

    if (mode === 'plantuml') {
        // Find @enduml
        // Search from end
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '@enduml') {
                insertIdx = i;
                break;
            }
        }
    } else {
        // Find closing brace '}'
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '}') {
                insertIdx = i;
                break;
            }
        }
    }

    // Indent?
    const indent = '    '; // 4 spaces
    lines.splice(insertIdx, 0, indent + newLine);
    return lines.join('\n');
}

/**
 * Updates the label of a specific element.
 */
/**
 * Updates the label of a specific element.
 */
export function injectLabel(code: string, id: string, label: string, mode: DiagramMode): string {
    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);
    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        if (mode === 'plantuml') {
            // Assume it is a class/component if not defined? 
            // Or just `ID : "Label"` (valid for objects/actors often)
            // Safest fallback: `component ${id} [${label}]`
            return appendNewDefinition(code, mode, `${id} : "${label}"`);
        } else {
            return appendNewDefinition(code, mode, `${id} [label="${label}"];`);
        }
    }

    const lines = code.split('\n');
    let line = lines[def.line];

    if (mode === 'plantuml') {
        const quotedLabelRegex = /"([^"]+)"/;
        const bracketLabelRegex = /\[([^\]]+)\]/;

        if (quotedLabelRegex.test(line)) {
            line = line.replace(quotedLabelRegex, `"${label}"`);
        } else if (bracketLabelRegex.test(line)) {
            line = line.replace(bracketLabelRegex, `[${label}]`);
        } else {
            const splitRegex = /(\s*)(\{|$|<<|#)/;
            const splitMatch = line.match(splitRegex);

            if (splitMatch && splitMatch.index !== undefined) {
                line = line.slice(0, splitMatch.index) + ` "${label}"` + line.slice(splitMatch.index);
            }
        }
    } else {
        const labelRegex = /label\s*=\s*"([^"]+)"/;
        if (labelRegex.test(line)) {
            line = line.replace(labelRegex, `label="${label}"`);
        } else {
            const attrBlockRegex = /\[(.*?)\]/;
            const blockMatch = line.match(attrBlockRegex);

            if (blockMatch) {
                let content = blockMatch[1];
                if (content.trim().length > 0) {
                    content += `, label="${label}"`;
                } else {
                    content = `label="${label}"`;
                }
                line = line.replace(attrBlockRegex, `[${content}]`);
            } else {
                const splitRegex = /(\s*)(;|$)/;
                const splitMatch = line.match(splitRegex);
                if (splitMatch && splitMatch.index !== undefined) {
                    line = line.slice(0, splitMatch.index) + ` [label="${label}"]` + line.slice(splitMatch.index);
                }
            }
        }
    }

    lines[def.line] = line;
    return lines.join('\n');
}

/**
 * Updates the Shape (type) of a specific element.
 * Only works well for PlantUML where type is explicit (rectangle vs database).
 */
export function injectShape(code: string, id: string, shape: string, mode: DiagramMode): string {
    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);
    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        if (mode === 'plantuml') {
            return appendNewDefinition(code, mode, `${shape} ${id}`);
        } else {
            return appendNewDefinition(code, mode, `${id} [shape=${shape}];`);
        }
    }

    const lines = code.split('\n');
    let line = lines[def.line];

    if (mode === 'plantuml') {
        // Type is at the start usually: "class Foo ..."
        const typeRegex = new RegExp(`^(\\s*)${def.type}\\b`);

        if (typeRegex.test(line)) {
            line = line.replace(typeRegex, `$1${shape}`);
        }
    } else {
        // Graphviz: specific ID matching
        const idRegex = new RegExp(`(?:^|[\\s;])(?:(${id})|"(${id})")\\s*(?:\\[(.*?)\\])?`);
        const match = line.match(idRegex);

        if (match) {
            const fullMatch = match[0];
            const hasAttrs = match[3] !== undefined;
            const content = match[3] || "";

            let newContent = content;
            const shapeRegex = /\bshape\s*=\s*([a-zA-Z0-9]+)/g;

            if (shapeRegex.test(content)) {
                newContent = content.replace(shapeRegex, `shape=${shape}`);
            } else {
                if (content.trim().length > 0) {
                    newContent += `, shape=${shape}`;
                } else {
                    newContent = `shape=${shape}`;
                }
            }

            if (hasAttrs) {
                const openBracketIndex = fullMatch.lastIndexOf('[');
                if (openBracketIndex !== -1) {
                    const before = fullMatch.slice(0, openBracketIndex);
                    const newPart = `${before}[${newContent}]`;
                    line = line.replace(fullMatch, newPart);
                }
            } else {
                const newPart = `${fullMatch} [${newContent}]`;
                line = line.replace(fullMatch, newPart);
            }
        } else {
            const splitRegex = /(\s*)(;|$)/;
            const splitMatch = line.match(splitRegex);
            if (splitMatch && splitMatch.index !== undefined) {
                line = line.slice(0, splitMatch.index) + ` [shape=${shape}]` + line.slice(splitMatch.index);
            }
        }
    }

    lines[def.line] = line;
    return lines.join('\n');
}

/**
 * Updates the Position of a specific element (Graphviz only).
 * Injects pos="x,y!" attribute.
 */
export function injectPosition(code: string, id: string, x: number, y: number, mode: DiagramMode): string {
    // Only Graphviz supports pos nicely
    if (mode !== 'graphviz') return code;

    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);
    const posStr = `${x.toFixed(2)},${y.toFixed(2)}!`;

    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        return appendNewDefinition(code, mode, `${id} [pos="${posStr}"];`);
    }

    const lines = code.split('\n');
    let line = lines[def.line];

    // Graphviz pos regex
    const posRegex = /pos\s*=\s*(?:"[^"]*"|[^,\s\]]+)/;

    // Check if attributes exist
    const attrBlockRegex = /\[(.*?)\]/;
    const blockMatch = line.match(attrBlockRegex);

    if (blockMatch) {
        let content = blockMatch[1];
        if (posRegex.test(content)) {
            content = content.replace(posRegex, `pos="${posStr}"`);
        } else {
            if (content.trim().length > 0) {
                content += `, pos="${posStr}"`;
            } else {
                content = `pos="${posStr}"`;
            }
        }
        line = line.replace(attrBlockRegex, `[${content}]`);
    } else {
        const splitRegex = /(\s*)(;|$)/;
        const splitMatch = line.match(splitRegex);
        if (splitMatch && splitMatch.index !== undefined) {
            line = line.slice(0, splitMatch.index) + ` [pos="${posStr}"]` + line.slice(splitMatch.index);
        }
    }

    lines[def.line] = line;
    return lines.join('\n');
}
