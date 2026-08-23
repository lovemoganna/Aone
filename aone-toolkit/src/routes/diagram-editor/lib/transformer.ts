// Schema Transformer Engine
// Converts structured data (JSON, SQL) and converts between PlantUML <-> Graphviz

export function transformDataToDiagram(input: string, type: 'json' | 'sql'): string {
    if (type === 'json') return jsonToClassDiagram(input);
    if (type === 'sql') return sqlToERDiagram(input);
    return '';
}

/**
 * Converts PlantUML architecture diagram to Graphviz DOT syntax.
 */
export function convertPlantUMLToGraphviz(code: string): string {
    const lines = code.split('\n');
    const nodes = new Map<string, { label: string; shape?: string; color?: string }>();
    const edges: { from: string; to: string; label?: string; style?: string }[] = [];
    let rankdir = 'TB';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('@') || line.startsWith("'") || line.startsWith('!')) {
            if (line.includes('left to right direction')) rankdir = 'LR';
            continue;
        }

        // Match arrows: A -> B, A --> B : label
        const arrowMatch = line.match(/^([a-zA-Z0-9_]+|"[^"]+")\s*(?:-->|->|\.\.>)\s*([a-zA-Z0-9_]+|"[^"]+")(?:\s*:\s*(.*))?/);
        if (arrowMatch) {
            const from = arrowMatch[1].replace(/"/g, '');
            const to = arrowMatch[2].replace(/"/g, '');
            const label = arrowMatch[3]?.trim();
            const isDotted = line.includes('..>');
            edges.push({ from, to, label, style: isDotted ? 'dashed' : undefined });
            if (!nodes.has(from)) nodes.set(from, { label: from });
            if (!nodes.has(to)) nodes.set(to, { label: to });
            continue;
        }

        // Match node definitions
        const nodeMatch = line.match(/^(class|component|node|rectangle|database|queue|storage|actor)\s+([a-zA-Z0-9_]+|"[^"]+")(?:\s+as\s+([a-zA-Z0-9_]+))?(?:\s+#(\w+))?/i);
        if (nodeMatch) {
            const type = nodeMatch[1].toLowerCase();
            const rawName = nodeMatch[2].replace(/"/g, '');
            const alias = nodeMatch[3];
            const color = nodeMatch[4];
            const id = alias || rawName;
            const label = rawName;

            let shape = 'box';
            if (type === 'database') shape = 'cylinder';
            else if (type === 'queue') shape = 'cds';
            else if (type === 'actor') shape = 'ellipse';
            else if (type === 'component') shape = 'component';

            nodes.set(id, { label, shape, color: color ? `#${color}` : undefined });
        }
    }

    let dot = `digraph Architecture {\n    rankdir=${rankdir};\n    node [fontname="sans-serif", fontsize=12, style="filled", fillcolor="#f1f5f9", shape=box];\n    edge [fontname="sans-serif", fontsize=10, color="#64748b"];\n\n`;

    nodes.forEach((val, id) => {
        let attrs: string[] = [`label="${val.label}"`];
        if (val.shape) attrs.push(`shape="${val.shape}"`);
        if (val.color) attrs.push(`fillcolor="${val.color}"`);
        dot += `    "${id}" [${attrs.join(', ')}];\n`;
    });

    dot += '\n';
    edges.forEach(e => {
        let attrs: string[] = [];
        if (e.label) attrs.push(`label="${e.label}"`);
        if (e.style) attrs.push(`style="${e.style}"`);
        const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
        dot += `    "${e.from}" -> "${e.to}"${attrStr};\n`;
    });

    dot += '}\n';
    return dot;
}

/**
 * Converts Graphviz DOT syntax to PlantUML syntax.
 */
export function convertGraphvizToPlantUML(code: string): string {
    const lines = code.split('\n');
    const nodes = new Map<string, { label: string; shape?: string; color?: string }>();
    const edges: { from: string; to: string; label?: string }[] = [];
    let rankdir = 'TB';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('//') || line.startsWith('#') || /^(digraph|graph|strict|})/i.test(line)) {
            if (/rankdir\s*=\s*LR/i.test(line)) rankdir = 'LR';
            continue;
        }

        // Match edge: A -> B [label="..."]
        const edgeMatch = line.match(/^"([^"]+)"|[a-zA-Z0-9_]+\s*(?:->|--)\s*"([^"]+)"|[a-zA-Z0-9_]+/);
        const arrowRegex = /(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*(?:->|--)\s*(?:([a-zA-Z0-9_]+)|"([^"]+)")(?:\s*\[(.*?)\])?/;
        const match = line.match(arrowRegex);
        if (match) {
            const from = (match[1] || match[2]).trim();
            const to = (match[3] || match[4]).trim();
            let label: string | undefined;
            if (match[5]) {
                const lMatch = match[5].match(/label\s*=\s*"([^"]+)"/);
                if (lMatch) label = lMatch[1];
            }
            edges.push({ from, to, label });
            if (!nodes.has(from)) nodes.set(from, { label: from });
            if (!nodes.has(to)) nodes.set(to, { label: to });
            continue;
        }

        // Match node: node1 [label="...", fillcolor="..."]
        const nodeRegex = /^(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*\[(.*?)\]/;
        const nMatch = line.match(nodeRegex);
        if (nMatch) {
            const id = (nMatch[1] || nMatch[2]).trim();
            const attrs = nMatch[3];
            let label = id;
            let shape = 'rectangle';
            let color: string | undefined;

            const lMatch = attrs.match(/label\s*=\s*"([^"]+)"/);
            if (lMatch) label = lMatch[1];
            const sMatch = attrs.match(/shape\s*=\s*"?([a-zA-Z0-9_]+)"?/);
            if (sMatch) shape = sMatch[1];
            const cMatch = attrs.match(/(?:fillcolor|color)\s*=\s*"?(#[0-9a-fA-F]{3,6}|\w+)"?/);
            if (cMatch) color = cMatch[1];

            nodes.set(id, { label, shape, color });
        }
    }

    let puml = `@startuml\n!theme cerulean-outline\n`;
    if (rankdir === 'LR') puml += `left to right direction\n`;

    nodes.forEach((val, id) => {
        let type = 'rectangle';
        if (val.shape === 'cylinder' || val.shape === 'box3d') type = 'database';
        else if (val.shape === 'cds') type = 'queue';
        else if (val.shape === 'component') type = 'component';
        else if (val.shape === 'ellipse' || val.shape === 'circle') type = 'actor';

        const colorStr = val.color ? ` ${val.color}` : '';
        puml += `${type} "${val.label}" as ${id}${colorStr}\n`;
    });

    puml += '\n';
    edges.forEach(e => {
        const labelStr = e.label ? ` : ${e.label}` : '';
        puml += `${e.from} --> ${e.to}${labelStr}\n`;
    });

    puml += '@enduml\n';
    return puml;
}

function jsonToClassDiagram(jsonStr: string): string {
    try {
        const obj = JSON.parse(jsonStr);
        const classes: string[] = [];
        const relationships: string[] = [];

        function traverse(name: string, data: any) {
            if (typeof data !== 'object' || data === null) return;

            let classDef = `class "${name}" {\n`;

            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    relationships.push(`"${name}" *-- "${key}"`);
                    traverse(key, value);
                } else if (Array.isArray(value)) {
                    const itemType = value.length > 0 && typeof value[0] === 'object' ? key : 'List';
                    if (itemType !== 'List') {
                        relationships.push(`"${name}" *-- "1..*" "${key}"`);
                        traverse(key, value[0]);
                    } else {
                        classDef += `  ${key}: List\n`;
                    }
                } else {
                    classDef += `  ${key}: ${typeof value}\n`;
                }
            });

            classDef += `}\n`;
            classes.push(classDef);
        }

        traverse('Root', obj);

        return `@startuml
!theme blueprint
title Generated Class Diagram from JSON
hide circle
skinparam linetype ortho

${classes.join('\n')}

${relationships.join('\n')}
@enduml`;
    } catch (e) {
        return `note "Invalid JSON Input" as error`;
    }
}

function sqlToERDiagram(sql: string): string {
    const lines = sql.split('\n');
    const entities: string[] = [];
    const relationships: string[] = [];
    let currentTable = '';

    lines.forEach(line => {
        const l = line.trim();
        const createMatch = l.match(/CREATE TABLE\s+"?(\w+)"?/i);
        if (createMatch) {
            currentTable = createMatch[1];
            entities.push(`entity "${currentTable}" {`);
            return;
        }

        if (currentTable && !l.startsWith(')') && !l.startsWith('CREATE') && l.length > 0) {
            const clean = l.replace(/,$/, '');
            const parts = clean.split(/\s+/);
            if (parts.length >= 2) {
                const name = parts[0].replace(/"/g, '');
                const type = parts[1];
                let modifiers = '';
                if (l.includes('PRIMARY KEY')) modifiers = '<<PK>>';
                else if (l.includes('FOREIGN KEY') || l.includes('REFERENCES')) {
                    modifiers = '<<FK>>';
                    const refMatch = l.match(/REFERENCES\s+"?(\w+)"?/i);
                    if (refMatch) {
                        relationships.push(`"${currentTable}" }o..|| "${refMatch[1]}"`);
                    }
                } else if (l.includes('NOT NULL')) modifiers = '*';

                entities.push(`  ${modifiers} ${name} : ${type}`);
            }
        }

        if (l.startsWith(');')) {
            entities.push(`}\n`);
            currentTable = '';
        }
    });

    return `@startuml
!theme blueprint
title Generated ER Diagram from SQL
hide circle
skinparam linetype ortho

${entities.join('\n')}

${relationships.join('\n')}
@enduml`;
}
