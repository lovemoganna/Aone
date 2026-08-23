export type DiagramMode = 'plantuml' | 'graphviz';

export interface Definition {
    id: string;
    type: string; // 'class', 'node', 'edge'
    line: number; // 0-indexed
    raw: string;
    isExplicit?: boolean;
}

export interface ElementProperties {
    color?: string;
    scale?: number;
    label?: string;
    pos?: string;
    shape?: string;
}

export interface Connection {
    from: string;
    to: string;
    label?: string;
    line: number;
}

export interface TreeNode {
    id: string;
    name: string;
    type: 'container' | 'node' | 'cluster';
    line: number;
    children?: TreeNode[];
}

/**
 * Finds all element definitions in the code.
 */
export function findDefinitions(code: string, mode: DiagramMode): Map<string, Definition> {
    const definitions = new Map<string, Definition>();
    const lines = code.split('\n');

    if (mode === 'plantuml') {
        const regexExplicit = /^\s*(class|interface|enum|component|node|rectangle|file|storage|usecase|actor|agent|boundary|control|entity|database|queue|frame|package|cloud)\s+(.+?)(?:\s*\{|$)/;

        lines.forEach((line, index) => {
            const match = line.match(regexExplicit);
            if (match) {
                const type = match[1];
                const body = match[2].trim();
                let id = "";

                const asMatch = body.split(/\s+as\s+/);
                if (asMatch.length > 1) {
                    let potentialId = asMatch[1].trim();
                    potentialId = potentialId.split(/[\s<<#]/)[0];
                    id = potentialId;
                } else {
                    if (body.startsWith('"')) {
                        const endQuote = body.indexOf('"', 1);
                        if (endQuote !== -1) id = body.slice(1, endQuote);
                        else id = body;
                    } else if (body.startsWith('[')) {
                        const endBracket = body.indexOf(']');
                        if (endBracket !== -1) id = body.slice(1, endBracket);
                        else id = body;
                    } else {
                        id = body.split(/\s+/)[0];
                    }
                }

                id = id.replace(/^["\[]|["\]]$/g, '');

                if (id && !definitions.has(id)) {
                    definitions.set(id, {
                        id,
                        type,
                        line: index,
                        raw: line,
                        isExplicit: true
                    });
                }
            }
        });
    } else {
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) return;

            const isEdgeStatement = trimmed.includes('->') || trimmed.includes('--');
            const regexGlobal = /(?:^|[;\s])(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*(?:\[([^\]]*)\])?/g;

            const matches = line.matchAll(regexGlobal);
            for (const match of matches) {
                const id = match[1] || match[2];
                if (!id || /^(subgraph|digraph|graph|strict|node|edge)$/i.test(id)) continue;

                const existing = definitions.get(id);
                const isExplicit = !isEdgeStatement;

                if (!existing) {
                    definitions.set(id, {
                        id,
                        type: 'node',
                        line: index,
                        raw: line,
                        isExplicit
                    });
                } else if (!existing.isExplicit && isExplicit) {
                    definitions.set(id, {
                        id,
                        type: 'node',
                        line: index,
                        raw: line,
                        isExplicit
                    });
                }
            }
        });
    }

    return definitions;
}

/**
 * Extracts all connections/relationships between nodes.
 */
export function findConnections(code: string, mode: DiagramMode): Connection[] {
    const connections: Connection[] = [];
    const lines = code.split('\n');

    if (mode === 'plantuml') {
        // Match PlantUML relations: A -> B, A --> B, A ..> B, A --|> B, etc.
        const relRegex = /^\s*([a-zA-Z0-9_]+|["][^"]+["])\s*(?:-->|->|\.\.>|\.\.|-\[#\w+\]->|--\*>|--o>)\s*([a-zA-Z0-9_]+|["][^"]+["])(?:\s*:\s*(.*))?/;
        lines.forEach((line, index) => {
            const match = line.match(relRegex);
            if (match) {
                const from = match[1].replace(/^"|"$/g, '').trim();
                const to = match[2].replace(/^"|"$/g, '').trim();
                const label = match[3]?.trim();
                if (from && to) {
                    connections.push({ from, to, label, line: index });
                }
            }
        });
    } else {
        // Match Graphviz relations: A -> B [label="foo"] or A -- B
        const relRegex = /([a-zA-Z0-9_]+|"([^"]+)")\s*(?:->|--)\s*([a-zA-Z0-9_]+|"([^"]+)")(?:\s*\[([^\]]*)\])?/g;
        lines.forEach((line, index) => {
            const matches = line.matchAll(relRegex);
            for (const m of matches) {
                const from = (m[1] || m[2]).replace(/^"|"$/g, '').trim();
                const to = (m[3] || m[4]).replace(/^"|"$/g, '').trim();
                let label: string | undefined;
                if (m[5]) {
                    const lMatch = m[5].match(/label\s*=\s*"([^"]+)"/);
                    if (lMatch) label = lMatch[1];
                }
                if (from && to && !/^(digraph|graph|subgraph|node|edge)$/i.test(from)) {
                    connections.push({ from, to, label, line: index });
                }
            }
        });
    }

    return connections;
}

/**
 * Parses hierarchical tree structure (packages, clusters, subgraphs).
 */
export function parseHierarchicalTree(code: string, mode: DiagramMode): TreeNode[] {
    const rootNodes: TreeNode[] = [];
    const stack: { node: TreeNode; indent: number }[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("'") || trimmed.startsWith('//')) return;

        if (mode === 'plantuml') {
            const containerMatch = trimmed.match(/^(package|cloud|node|rectangle|folder|frame)\s+(.+?)(?:\s*\{|$)/i);
            if (containerMatch) {
                const name = containerMatch[2].replace(/^["\[]|["\]]$/g, '').trim();
                const containerNode: TreeNode = {
                    id: name,
                    name,
                    type: 'container',
                    line: index,
                    children: []
                };

                if (stack.length > 0) {
                    stack[stack.length - 1].node.children?.push(containerNode);
                } else {
                    rootNodes.push(containerNode);
                }

                if (trimmed.includes('{')) {
                    stack.push({ node: containerNode, indent: stack.length });
                }
                return;
            }

            if (trimmed === '}' && stack.length > 0) {
                stack.pop();
                return;
            }

            const defMatch = trimmed.match(/^(class|interface|component|database|queue|actor|agent)\s+(.+?)(?:\s*\{|$)/i);
            if (defMatch) {
                const name = defMatch[2].split(/\s+as\s+/)[0].replace(/^["\[]|["\]]$/g, '').trim();
                const leaf: TreeNode = {
                    id: name,
                    name,
                    type: 'node',
                    line: index
                };
                if (stack.length > 0) {
                    stack[stack.length - 1].node.children?.push(leaf);
                } else {
                    rootNodes.push(leaf);
                }
            }
        } else {
            // Graphviz subgraph cluster_xxx { ... }
            const clusterMatch = trimmed.match(/^(subgraph\s+([a-zA-Z0-9_]+))\s*\{/i);
            if (clusterMatch) {
                const name = clusterMatch[2] || 'cluster';
                const clusterNode: TreeNode = {
                    id: name,
                    name,
                    type: 'cluster',
                    line: index,
                    children: []
                };
                if (stack.length > 0) {
                    stack[stack.length - 1].node.children?.push(clusterNode);
                } else {
                    rootNodes.push(clusterNode);
                }
                stack.push({ node: clusterNode, indent: stack.length });
                return;
            }

            if (trimmed === '}' && stack.length > 0) {
                stack.pop();
                return;
            }

            // Normal node definition
            const nodeMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*\[([^\]]*)\]/);
            if (nodeMatch && !/^(graph|node|edge)$/i.test(nodeMatch[1])) {
                const name = nodeMatch[1];
                const leaf: TreeNode = {
                    id: name,
                    name,
                    type: 'node',
                    line: index
                };
                if (stack.length > 0) {
                    stack[stack.length - 1].node.children?.push(leaf);
                } else {
                    rootNodes.push(leaf);
                }
            }
        }
    });

    return rootNodes;
}

/**
 * Compares two diagram versions and calculates structural difference.
 */
export function diffDiagramModels(oldCode: string, newCode: string, mode: DiagramMode) {
    const oldDefs = findDefinitions(oldCode, mode);
    const newDefs = findDefinitions(newCode, mode);
    const oldEdges = findConnections(oldCode, mode);
    const newEdges = findConnections(newCode, mode);

    const oldNodeIds = new Set(oldDefs.keys());
    const newNodeIds = new Set(newDefs.keys());

    const addedNodes = Array.from(newNodeIds).filter(x => !oldNodeIds.has(x));
    const removedNodes = Array.from(oldNodeIds).filter(x => !newNodeIds.has(x));
    const modifiedNodes = Array.from(newNodeIds).filter(x => {
        if (!oldNodeIds.has(x)) return false;
        const oldRaw = oldDefs.get(x)?.raw.trim();
        const newRaw = newDefs.get(x)?.raw.trim();
        return oldRaw !== newRaw;
    });

    const edgeKey = (e: Connection) => `${e.from}->${e.to}`;
    const oldEdgeKeys = new Set(oldEdges.map(edgeKey));
    const newEdgeKeys = new Set(newEdges.map(edgeKey));

    const addedEdges = Array.from(newEdgeKeys).filter(x => !oldEdgeKeys.has(x));
    const removedEdges = Array.from(oldEdgeKeys).filter(x => !newEdgeKeys.has(x));

    return {
        addedNodes,
        removedNodes,
        modifiedNodes,
        addedEdges,
        removedEdges
    };
}

/**
 * Extracts properties from a definition line.
 */
export function extractProperties(definitionLine: string, mode: DiagramMode): ElementProperties {
    const props: ElementProperties = {};

    if (mode === 'plantuml') {
        const colorMatch = definitionLine.match(/#(\w+|[0-9a-fA-F]{3,6})/);
        if (colorMatch) {
            props.color = '#' + colorMatch[1];
        }

        const labelMatch = definitionLine.match(/"([^"]+)"/);
        if (labelMatch) {
            props.label = labelMatch[1];
        } else {
            const bracketMatch = definitionLine.match(/\[([^\]]+)\]/);
            if (bracketMatch) {
                props.label = bracketMatch[1];
            }
        }
    } else {
        const colorMatch = definitionLine.match(/(?:color|fillcolor)\s*=\s*(?:"([^"]+)"|([a-zA-Z0-9#]+))/);
        if (colorMatch) {
            props.color = colorMatch[1] || colorMatch[2];
        }

        const labelMatch = definitionLine.match(/label\s*=\s*"([^"]+)"/);
        if (labelMatch) {
            props.label = labelMatch[1];
        }

        const shapeMatch = definitionLine.match(/shape\s*=\s*(?:"([^"]+)"|([a-zA-Z0-9]+))/);
        if (shapeMatch) {
            props.shape = shapeMatch[1] || shapeMatch[2];
        }

        const posMatch = definitionLine.match(/pos\s*=\s*"?([-0-9.,!]+)"?/);
        if (posMatch) {
            props.pos = posMatch[1];
        }
    }

    return props;
}

export interface Point {
    x: number;
    y: number;
}

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

export function formatPos(point: Point): string {
    return `${point.x.toFixed(2)},${point.y.toFixed(2)}!`;
}
