

export type DiagramMode = 'plantuml' | 'graphviz';

export interface Definition {
    id: string;
    type: string; // 'class', 'node', 'edge'
    line: number; // 0-indexed
    raw: string;
    isExplicit?: boolean; // True if defined as "ID [attrs]" or "ID;", False if only found in "A -> B"
}

export interface ElementProperties {
    color?: string;
    scale?: number;
    label?: string;
    pos?: string;
}

/**
 * Finds all element definitions in the code.
 * @param code The source code.
 * @param mode 'plantuml' or 'graphviz'.
 */
export function findDefinitions(code: string, mode: DiagramMode): Map<string, Definition> {
    const definitions = new Map<string, Definition>();
    const lines = code.split('\n');

    if (mode === 'plantuml') {
        // PlantUML Patterns
        // 1. "class Foo {" or "class Foo"
        // 2. "component [Foo]"
        // 3. "rectangle Foo"
        // 4. "Foo : label" (implicit node, harder to track)

        // PlantUML:
        // 1. class Foo
        // 2. class Foo "Label"
        // 3. class "Long Label" as Foo
        // 4. component [Label] as Foo

        // We match: TYPE (captured) + SPACE + BODY (captured)
        const regexExplicit = /^\s*(class|interface|enum|component|node|rectangle|file|storage|usecase|actor|agent|boundary|control|entity|database|queue)\s+(.+?)(?:\s*\{|$)/;

        lines.forEach((line, index) => {
            const match = line.match(regexExplicit);
            if (match) {
                let type = match[1];
                let body = match[2].trim();
                let id = "";

                // Check for 'as' alias which defines the true ID
                // "Long Label" as Foo
                // [Label] as Foo
                const asMatch = body.split(/\s+as\s+/);
                if (asMatch.length > 1) {
                    // ID is the part AFTER 'as'
                    // Remove quotes/brackets/stereotypes/colors from it if any (usually alias is clean)
                    let potentialId = asMatch[1].trim();
                    // Strip stereotypes/color if they are at the end
                    // Foo <<Stereo>> #red
                    potentialId = potentialId.split(/[\s<<#]/)[0];
                    id = potentialId;
                } else {
                    // No alias. ID is the first part.
                    // Foo "Label"
                    // "Foo"
                    // [Foo]
                    // Foo #red

                    // Take first token
                    // But handle quotes: "Foo Bar" should be one token
                    // Handle brackets: [Foo Bar] one token

                    if (body.startsWith('"')) {
                        const endQuote = body.indexOf('"', 1);
                        if (endQuote !== -1) id = body.slice(1, endQuote);
                        else id = body; // fallback
                    } else if (body.startsWith('[')) {
                        const endBracket = body.indexOf(']');
                        if (endBracket !== -1) id = body.slice(1, endBracket);
                        else id = body;
                    } else {
                        // Just the first word
                        id = body.split(/\s+/)[0];
                    }
                }

                // Cleanup ID (just in case)
                id = id.replace(/^["\[]|["\]]$/g, '');

                if (id && !definitions.has(id)) {
                    definitions.set(id, {
                        id,
                        type,
                        line: index,
                        raw: line,
                        isExplicit: true // PlantUML matches here are explicit
                    });
                }
            }
        });

    } else {
        // Graphviz Patterns
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('#')) return; // comment line

            // Check if this line is an edge statement
            const isEdgeStatement = trimmed.includes('->') || trimmed.includes('--');

            // Regex to find: (start/space/semi) (ID or "ID") (optional attrs)
            const regexGlobal = /(?:^|[;\s])(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*(?:\[([^\]]*)\])?/g;

            const matches = line.matchAll(regexGlobal);
            for (const match of matches) {
                const id = match[1] || match[2];
                // Check if this ID looks like a keyword (subgraph, digraph, etc)
                if (/^(subgraph|digraph|graph|strict|node|edge)$/i.test(id)) continue;

                if (id) {
                    const existing = definitions.get(id);
                    // Treat as explicit if it's NOT an edge statement
                    const isExplicit = !isEdgeStatement;

                    if (!existing) {
                        definitions.set(id, {
                            id,
                            type: 'node',
                            line: index,
                            raw: line,
                            isExplicit
                        });
                    } else {
                        // If existing is implicit (In edge) and new one is explicit (In node def), overwrite!
                        if (!existing.isExplicit && isExplicit) {
                            definitions.set(id, {
                                id,
                                type: 'node',
                                line: index,
                                raw: line,
                                isExplicit
                            });
                        }
                    }
                }
            }
        });
    }

    return definitions;
}

/**
 * Extracts properties from a definition line.
 * @param definitionLine The raw line of code.
 * @param mode 'plantuml' or 'graphviz'.
 */
export function extractProperties(definitionLine: string, mode: DiagramMode): ElementProperties {
    const props: ElementProperties = {};

    if (mode === 'plantuml') {
        // Color: #color or #color;line.bold
        const colorMatch = definitionLine.match(/#(\w+|[0-9a-fA-F]{3,6})/);
        if (colorMatch) {
            props.color = '#' + colorMatch[1];
        }

        // Label: "My Label"
        // Matches quoted string that is NOT inside brackets or part of an alias if possible
        // Simple heuristic: look for "..."
        const labelMatch = definitionLine.match(/"([^"]+)"/);
        if (labelMatch) {
            props.label = labelMatch[1];
        } else {
            // Check for [Label] in component
            const bracketMatch = definitionLine.match(/\[([^\]]+)\]/);
            if (bracketMatch) {
                props.label = bracketMatch[1];
            }
        }

        // Scale is strictly not per-element in standard PlantUML (except via skinparam or specialized parsers)
        // But for our purpose if we see `scale 2` it's global.
        // We might look for inline styling if we support it later.

    } else {
        // Graphviz: [color=red, fillcolor=blue, label="Text"]
        const colorMatch = definitionLine.match(/(?:color|fillcolor)\s*=\s*(?:"([^"]+)"|([a-zA-Z0-9#]+))/);
        if (colorMatch) {
            props.color = colorMatch[1] || colorMatch[2];
        }

        const labelMatch = definitionLine.match(/label\s*=\s*"([^"]+)"/);
        if (labelMatch) {
            props.label = labelMatch[1];
        }
        // Scale in graphviz can be 'width', 'height', or 'scale' (rare).
        // Let's assume fontsize for "scale" proxy? Or just skip scale for now.

        const posMatch = definitionLine.match(/pos\s*=\s*"?([-0-9.,!]+)"?/);
        if (posMatch) {
            props.pos = posMatch[1];
        }
    }

    return props;
}

// --- Position Utils ---

export interface Point {
    x: number;
    y: number;
}

/**
 * Parses Graphviz pos string "x,y" or "x,y!" into {x, y}.
 * Note: Graphviz Y grows UPWARDS, but we usually handle screen coords where Y grows DOWN.
 * However, we just store what we read.
 */
export function parsePos(posStr: string): Point | null {
    if (!posStr) return null;
    const parts = posStr.replace('!', '').split(',');
    if (parts.length >= 2) {
        return {
            x: parseFloat(parts[0]),
            y: parseFloat(parts[1])
        };
    }
    return null;
}

/**
 * Formats point to Graphviz pos string "x,y!".
 * The '!' is generic for "pinned" but check engine specific docs.
 * Usually neato/fdp respect input pos.
 */
export function formatPos(point: Point): string {
    return `${point.x.toFixed(2)},${point.y.toFixed(2)}!`;
}
