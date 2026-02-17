// Schema Transformer Engine
// Converts structured data (JSON, SQL) into PlantUML diagrams

export function transformDataToDiagram(input: string, type: 'json' | 'sql'): string {
    if (type === 'json') return jsonToClassDiagram(input);
    if (type === 'sql') return sqlToERDiagram(input);
    return '';
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
                    // Nested object -> Relationship
                    relationships.push(`"${name}" *-- "${key}"`);
                    traverse(key, value);
                } else if (Array.isArray(value)) {
                    // Array -> List Relationship
                    const itemType = value.length > 0 && typeof value[0] === 'object' ? key : 'List';
                    if (itemType !== 'List') {
                        relationships.push(`"${name}" *-- "1..*" "${key}"`);
                        traverse(key, value[0]);
                    } else {
                        classDef += `  ${key}: List\n`;
                    }
                } else {
                    // Primitive
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
        // Detect CREATE TABLE
        const createMatch = l.match(/CREATE TABLE\s+"?(\w+)"?/i);
        if (createMatch) {
            currentTable = createMatch[1];
            entities.push(`entity "${currentTable}" {`);
            return;
        }

        // Detect Columns
        if (currentTable && !l.startsWith(')') && !l.startsWith('CREATE') && l.length > 0) {
            // Simple heuristic for columns (name type ...)
            // Remove trailing commas
            const clean = l.replace(/,$/, '');
            const parts = clean.split(/\s+/);
            if (parts.length >= 2) {
                const name = parts[0].replace(/"/g, '');
                const type = parts[1];
                let modifiers = '';
                if (l.includes('PRIMARY KEY')) modifiers = '<<PK>>';
                else if (l.includes('FOREIGN KEY') || l.includes('REFERENCES')) {
                    modifiers = '<<FK>>';
                    // Try to extract relationship
                    const refMatch = l.match(/REFERENCES\s+"?(\w+)"?/i);
                    if (refMatch) {
                        relationships.push(`"${currentTable}" }o..|| "${refMatch[1]}"`);
                    }
                } else if (l.includes('NOT NULL')) modifiers = '*';

                entities.push(`  ${modifiers} ${name} : ${type}`);
            }
        }

        // Detect End of Table
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
