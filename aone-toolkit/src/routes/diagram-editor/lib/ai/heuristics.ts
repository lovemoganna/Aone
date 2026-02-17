export function generateHeuristicDiagram(prompt: string): { code: string; mode: 'plantuml' | 'graphviz' } {
    const p = prompt.toLowerCase();
    const lines = prompt.split('\n').filter(l => l.trim());

    // --- GRAPHVIZ DETECTION ---
    if (p.includes('graphviz') || p.includes('dot') || p.includes('digraph') || p.includes('cluster')) {
        let code = `digraph G {\n    rankdir=LR;\n    node [shape=box, style=filled, fillcolor="#e0e7ff", color="#4338ca", fontname="Sans-Serif"];\n    edge [color="#6366f1"];\n\n`;

        // Extract nodes and edges
        // "A connects to B" or "A -> B"
        const edges: string[] = [];
        const nodes = new Set<string>();

        lines.forEach(line => {
            const cleanLine = line.replace(/connects to|leads to|goes to/gi, '->');
            if (cleanLine.includes('->')) {
                const parts = cleanLine.split('->');
                if (parts.length >= 2) {
                    const src = parts[0].trim().replace(/\s+/g, '_');
                    const dst = parts[1].trim().replace(/\s+/g, '_');
                    edges.push(`    ${src} -> ${dst};`);
                    nodes.add(src);
                    nodes.add(dst);
                }
            } else {
                // Potential node definition "User is a node"
                const word = line.split(' ')[0].trim().replace(/\s+/g, '_');
                if (word && !word.includes('->')) {
                    nodes.add(word);
                }
            }
        });

        // Add some basic nodes if none found but prompt is short
        if (edges.length === 0 && nodes.size === 0) {
            const words = p.split(' ').filter(w => w.length > 3 && !['make', 'create', 'draw', 'graph'].includes(w)).slice(0, 3);
            if (words.length > 0) {
                words.forEach((w, i) => {
                    if (i < words.length - 1) code += `    ${w} -> ${words[i + 1]};\n`;
                });
            } else {
                code += `    Start -> Process -> End;\n`;
            }
        } else {
            edges.forEach(e => code += e + '\n');
        }

        code += '}';
        return { code, mode: 'graphviz' };
    }

    // --- PLANTUML HEURISTICS ---
    let code = "@startuml\n!theme plain\n";

    // 1. CLASS DIAGRAM
    if (p.includes('class') || p.includes('object') || p.includes('interface') || p.includes('inherit')) {
        code = "@startuml\n!theme mimeograph\nskinparam classAttributeIconSize 0\n\n";
        lines.forEach(line => {
            if (line.includes('extends') || line.includes('inherits')) {
                const parts = line.split(/extends|inherits/i);
                code += `class ${parts[0].trim()} extends ${parts[1].trim()}\n`;
            } else if (line.includes('class')) {
                const name = line.match(/class\s+(\w+)/i)?.[1] || line.split(' ')[0];
                code += `class ${name} {\n  + method()\n}\n`;
            }
        });
        if (code.trim() === "@startuml\n!theme mimeograph\nskinparam classAttributeIconSize 0") {
            code += `class User {\n  - id : String\n  + login()\n}\nclass System\nUser --> System : interactive\n`;
        }
    }
    // 2. USE CASE
    else if (p.includes('use case') || p.includes('actor')) {
        code += `left to right direction\n`;
        lines.forEach(line => {
            if (line.toLowerCase().includes('actor')) {
                const name = line.split(' ').pop() || "User";
                code += `actor ${name}\n`;
            } else if (line.includes('uses') || line.includes('can')) {
                // "User can Login"
                code += `usecase "Action" as UC1\n`;
                // Very basic fallback
            }
        });
        code += `actor User\nusecase "Core Feature" as UC1\nUser --> UC1\n`;
    }
    // 3. GANTT
    else if (p.includes('gantt') || p.includes('timeline') || p.includes('schedule')) {
        code = `@startgantt\n[Project Start] lasts 0 days\n`;
        lines.forEach(line => {
            if (line.includes('days') || line.includes('weeks')) {
                code += `[Task] lasts 5 days\n`;
            }
        });
        code += `[Phase 1] lasts 10 days\n[Phase 2] starts at [Phase 1]'s end and lasts 5 days\n@endgantt`;
        return { code, mode: 'plantuml' };
    }
    // 4. MINDMAP (Default for lists)
    else if (p.includes('mindmap') || p.includes('breakdown') || p.includes('idea')) {
        code = `@startmindmap\n* Root\n`;
        lines.forEach(line => {
            if (line.trim()) code += `** ${line.trim()}\n`;
        });
        code += `@endmindmap`;
        return { code, mode: 'plantuml' };
    }
    // 5. ER DIAGRAM
    else if (p.includes('db') || p.includes('database') || p.includes('entity') || p.includes('schema') || p.includes('table')) {
        code = `@startuml\n!theme bluegray\nhide circle\nskinparam linetype ortho\n\n`;
        code += `entity "User" as user {\n  *id : number <<generated>>\n  --\n  name : text\n}\n\n`;
        code += `entity "Order" as order {\n  *id : number\n  user_id : number <<FK>>\n}\n\n`;
        code += `user ||..o{ order : places\n`;
    }
    // 6. SEQUENCE (Default Fallback for interaction)
    else {
        code = "@startuml\nautonumber\n";

        let hasInteraction = false;
        lines.forEach(line => {
            if (line.includes('->') || line.includes(' to ')) {
                const parts = line.split(/->| to /);
                if (parts.length >= 2) {
                    code += `${parts[0].trim()} -> ${parts[1].trim()} : ${parts[1].trim().split(' ')[0]}\n`;
                    hasInteraction = true;
                }
            }
        });

        if (!hasInteraction) {
            code += `User -> System : Request\nSystem --> User : Response\n`;
        }
    }

    code += "\n@enduml";
    return { code, mode: 'plantuml' };
}
