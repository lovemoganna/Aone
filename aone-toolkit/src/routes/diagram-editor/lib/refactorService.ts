import { diagramStore } from "./store.svelte";

export class RefactorService {
    /**
     * Wraps current selection or specified nodes into a container (Package for PlantUML, Subgraph for Graphviz)
     */
    static wrapInContainer(code: string, mode: string, containerName: string = "NewContainer"): string {
        if (mode === "plantuml") {
            return this.wrapPlantUML(code, containerName);
        } else if (mode === "graphviz") {
            return this.wrapGraphviz(code, containerName);
        }
        return code;
    }

    private static wrapPlantUML(code: string, name: string): string {
        const startIdx = code.indexOf("@startuml");
        const endIdx = code.lastIndexOf("@enduml");

        if (startIdx === -1 || endIdx === -1) return code;

        const content = code.substring(startIdx + 9, endIdx).trim();
        const wrapped = `package "${name}" {\n    ${content.split("\n").join("\n    ")}\n}`;

        return code.substring(0, startIdx + 9) + "\n" + wrapped + "\n" + code.substring(endIdx);
    }

    private static wrapGraphviz(code: string, name: string): string {
        // Handle both digraph and graph
        const match = code.match(/(digraph|graph)\s+\w*\s*\{([\s\S]*)\}/);
        if (!match) return code;

        const type = match[1];
        const content = match[2].trim();
        const wrapped = `  subgraph "cluster_${name.replace(/\s+/g, "_")}" {\n    label = "${name}";\n    ${content.split("\n").join("\n    ")}\n  }`;

        return `${type} G {\n${wrapped}\n}`;
    }

    /**
     * Converts standard PlantUML to C4 Model structure
     */
    static convertToC4(code: string): string {
        if (!code.includes("@startuml")) return code;

        let newCode = code;
        if (!code.includes("C4_Context.puml")) {
            newCode = newCode.replace("@startuml", "@startuml\n!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml");
        }

        // Intelligent replacement
        newCode = newCode.replace(/participant\s+"([^"]+)"/g, 'Person($1, "$1", "Description")');
        newCode = newCode.replace(/actor\s+"([^"]+)"/g, 'Person($1, "$1", "Role")');
        newCode = newCode.replace(/database\s+"([^"]+)"/g, 'SystemDb($1, "$1", "Database")');

        return newCode;
    }
}
