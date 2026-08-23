import { findDefinitions, type DiagramMode } from './parser';

/**
 * Updates the color of a specific element in the code.
 */
export function injectColor(code: string, id: string, color: string, mode: DiagramMode): string {
    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);

    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        if (mode === 'plantuml') {
            return appendNewDefinition(code, mode, `${id} ${color}`);
        } else {
            return appendNewDefinition(code, mode, `${id} [fillcolor="${color}", style="filled"];`);
        }
    }

    const lines = code.split('\n');
    let line = lines[def.line];

    if (mode === 'plantuml') {
        const existingColorRegex = /#(\w+|[0-9a-fA-F]{3,6})/;
        const match = line.match(existingColorRegex);

        if (match) {
            line = line.replace(match[0], color ? `${color}` : '');
        } else if (color) {
            const splitRegex = /(\s*)(\{|$|<<)/;
            const splitMatch = line.match(splitRegex);

            if (splitMatch && splitMatch.index !== undefined) {
                line = line.slice(0, splitMatch.index) + ' ' + color + line.slice(splitMatch.index);
            } else {
                line += ' ' + color;
            }
        }
    } else {
        const idRegex = new RegExp(`(?:^|[\\s;])(?:(${id})|"(${id})")\\s*(?:\\[(.*?)\\])?`);
        const match = line.match(idRegex);

        if (match) {
            const fullMatch = match[0];
            const hasAttrs = match[3] !== undefined;
            const content = match[3] || "";

            let newContent = content;
            const colorPropRegex = /\b(fillcolor|color)\s*=\s*(?:"[^"]*"|[^,\s\]]+)/g;

            if (colorPropRegex.test(content)) {
                newContent = content.replace(colorPropRegex, `fillcolor="${color}"`);
            } else {
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
                line = line.slice(0, splitMatch.index) + ` [fillcolor="${color}", style="filled"]` + line.slice(splitMatch.index);
            }
        }
    }

    lines[def.line] = line;
    return lines.join('\n');
}

/**
 * Batch applies color to multiple elements.
 */
export function injectBatchColor(code: string, ids: string[], color: string, mode: DiagramMode): string {
    let updatedCode = code;
    for (const id of ids) {
        updatedCode = injectColor(updatedCode, id, color, mode);
    }
    return updatedCode;
}

/**
 * Batch applies shape to multiple elements.
 */
export function injectBatchShape(code: string, ids: string[], shape: string, mode: DiagramMode): string {
    let updatedCode = code;
    for (const id of ids) {
        updatedCode = injectShape(updatedCode, id, shape, mode);
    }
    return updatedCode;
}

function appendNewDefinition(code: string, mode: DiagramMode, newLine: string): string {
    const lines = code.split('\n');
    let insertIdx = lines.length;

    if (mode === 'plantuml') {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '@enduml') {
                insertIdx = i;
                break;
            }
        }
    } else {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '}') {
                insertIdx = i;
                break;
            }
        }
    }

    const indent = '    ';
    lines.splice(insertIdx, 0, indent + newLine);
    return lines.join('\n');
}

/**
 * Updates the label of a specific element.
 */
export function injectLabel(code: string, id: string, label: string, mode: DiagramMode): string {
    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);
    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        if (mode === 'plantuml') {
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
        const typeRegex = new RegExp(`^(\\s*)${def.type}\\b`);
        if (typeRegex.test(line)) {
            line = line.replace(typeRegex, `$1${shape}`);
        }
    } else {
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
 */
export function injectPosition(code: string, id: string, x: number, y: number, mode: DiagramMode): string {
    if (mode !== 'graphviz') return code;

    const definitions = findDefinitions(code, mode);
    const def = definitions.get(id);
    const posStr = `${x.toFixed(2)},${y.toFixed(2)}!`;

    if (!def || (mode === 'graphviz' && !def.isExplicit)) {
        return appendNewDefinition(code, mode, `${id} [pos="${posStr}"];`);
    }

    const lines = code.split('\n');
    let line = lines[def.line];

    const posRegex = /pos\s*=\s*(?:"[^"]*"|[^,\s\]]+)/;
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

/**
 * Injects document metadata header and visual color legend into the code.
 */
export function injectMetadataAndLegend(
    code: string,
    metadata: { title?: string; author?: string; version?: string; date?: string },
    legendItems: { label: string; color: string }[],
    mode: DiagramMode
): string {
    if (mode === 'plantuml') {
        let metaBlock = '';
        if (metadata.title) metaBlock += `title ${metadata.title}\n`;
        if (metadata.author || metadata.version || metadata.date) {
            metaBlock += `header\n  Author: ${metadata.author || 'Architecture Team'}\n  Version: ${metadata.version || 'v1.0'}\n  Date: ${metadata.date || new Date().toISOString().slice(0, 10)}\nendheader\n`;
        }

        let legendBlock = '';
        if (legendItems.length > 0) {
            legendBlock += '\nlegend right\n';
            for (const item of legendItems) {
                legendBlock += `  <back:${item.color}>   </back> ${item.label}\n`;
            }
            legendBlock += 'endlegend\n';
        }

        let cleanCode = code.replace(/\btitle\s+[^\n]+\n/g, '').replace(/header[\s\S]*?endheader\n/g, '').replace(/legend[\s\S]*?endlegend\n/g, '');
        const startMatch = cleanCode.match(/@start\w+/);
        if (startMatch) {
            cleanCode = cleanCode.slice(0, startMatch.index! + startMatch[0].length) + '\n' + metaBlock + cleanCode.slice(startMatch.index! + startMatch[0].length);
        } else {
            cleanCode = metaBlock + cleanCode;
        }

        const endMatch = cleanCode.match(/@enduml/);
        if (endMatch) {
            cleanCode = cleanCode.slice(0, endMatch.index!) + legendBlock + cleanCode.slice(endMatch.index!);
        } else {
            cleanCode += legendBlock;
        }

        return cleanCode;
    } else {
        // Graphviz mode
        let labelItems: string[] = [];
        if (metadata.title) labelItems.push(metadata.title);
        if (metadata.version) labelItems.push(`Version: ${metadata.version}`);
        if (metadata.author) labelItems.push(`Author: ${metadata.author}`);

        const graphLabel = labelItems.length > 0 ? `labelloc="t";\n    label="${labelItems.join(' | ')}";\n` : '';
        return code.replace(/(digraph|graph)\s+\w*\s*\{/i, `$&\n    ${graphLabel}`);
    }
}
