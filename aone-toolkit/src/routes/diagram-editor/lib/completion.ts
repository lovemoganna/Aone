import {
    snippetCompletion,
    type CompletionContext,
    type CompletionResult,
} from "@codemirror/autocomplete";

const plantUmlSnippets = [
    snippetCompletion("class ${Name} {\n\t${// properties}\n}", {
        label: "class",
        detail: "Define a class",
        type: "class",
    }),
    snippetCompletion("interface ${Name} {\n\t${// methods}\n}", {
        label: "interface",
        detail: "Define an interface",
        type: "interface",
    }),
    snippetCompletion('folder "${Name}" {\n\t${// content}\n}', {
        label: "folder",
        detail: "Group items in a folder",
        type: "namespace",
    }),
    snippetCompletion('package "${Name}" {\n\t${// content}\n}', {
        label: "package",
        detail: "Group items in a package",
        type: "namespace",
    }),
    snippetCompletion('node "${Name}" {\n\t${// content}\n}', {
        label: "node",
        detail: "Deployment node",
        type: "class",
    }),
    snippetCompletion('database "${Name}" {\n\t${// content}\n}', {
        label: "database",
        detail: "Database element",
        type: "class",
    }),
    snippetCompletion("note ${right} of ${Target} : ${text}", {
        label: "note",
        detail: "Attach a note",
        type: "text",
    }),
    snippetCompletion("@startuml\n${}\n@enduml", {
        label: "startuml",
        detail: "Start PlantUML block",
        type: "keyword",
    }),
    snippetCompletion("skinparam ${param} ${value}", {
        label: "skinparam",
        detail: "Style parameter",
        type: "variable",
    }),
    // Advanced Skinparams
    snippetCompletion("skinparam backgroundColor ${#EEEBDC}", {
        label: "skinparam-bg",
        detail: "Background color",
        type: "variable",
    }),
    snippetCompletion("skinparam handwritten true", {
        label: "skinparam-hand",
        detail: "Handwritten style",
        type: "variable",
    }),
    snippetCompletion("skinparam monochrome true", {
        label: "skinparam-mono",
        detail: "Monochrome style",
        type: "variable",
    }),
    snippetCompletion("!theme ${standard}", {
        label: "theme",
        detail: "Apply global theme",
        type: "keyword",
    }),
];

const graphvizSnippets = [
    snippetCompletion('digraph "${Name}" {\n\tlayout="${dot}";\n\t${// nodes and edges}\n}', {
        label: "digraph",
        detail: "Directed graph with layout",
        type: "keyword",
    }),
    snippetCompletion('subgraph "cluster_${Name}" {\n\tlabel = "${Label}";\n\tstyle = "${filled}";\n\tcolor = "${lightgrey}";\n\t${// items}\n}', {
        label: "subgraph",
        detail: "Styled cluster subgraph",
        type: "namespace",
    }),
    snippetCompletion('${node} [shape=${box}, label="${text}", style=${filled}, fillcolor=${lightblue}];', {
        label: "node_attr",
        detail: "Full styled node",
        type: "class",
    }),
    snippetCompletion('rankdir=${LR};', {
        label: "rankdir",
        detail: "Rank direction (LR, TB, etc.)",
        type: "variable",
    }),
    snippetCompletion('node [shape=${rectangle}, fontname="${Inter}", style=filled, color="${#f8f9fa}"];', {
        label: "node-global",
        detail: "Global node style",
        type: "variable",
    }),
];

export function diagramCompletion(mode: 'plantuml' | 'graphviz') {
    return (context: CompletionContext): CompletionResult | null => {
        const word = context.matchBefore(/\w*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        return {
            from: word.from,
            options: mode === 'plantuml' ? plantUmlSnippets : graphvizSnippets,
        };
    };
}
