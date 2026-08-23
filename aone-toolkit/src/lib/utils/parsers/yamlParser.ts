import * as jsyaml from 'js-yaml';

export interface ParseResult {
    data: any;
    error: string | null;
}

export function parseYaml(content: string): ParseResult {
    if (!content.trim()) {
        return { data: null, error: "YAML input is empty." };
    }
    try {
        const parsed = jsyaml.load(content, { schema: jsyaml.DEFAULT_SCHEMA });
        return { data: parsed, error: null };
    } catch (err: any) {
        return { data: null, error: err instanceof Error ? err.message : "Invalid YAML." };
    }
}

export function stringifyYaml(data: any, options?: jsyaml.DumpOptions): string {
    try {
        return jsyaml.dump(data, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            quotingType: '"',
            forceQuotes: false,
            flowLevel: -1,
            styles: {
                "!!null": "empty",
                "!!map": "block",
                "!!seq": "block",
            },
            ...options
        }).replace(/^---\n/, "").replace(/\n---$/, "").replace(/\n\n+/g, "\n");
    } catch (e) {
        throw new Error("Could not generate YAML from data.");
    }
}
