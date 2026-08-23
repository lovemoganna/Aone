import type { ParseResult } from './yamlParser';

export function parseJson(content: string): ParseResult {
    if (!content.trim()) {
        return { data: null, error: "JSON input is empty." };
    }
    try {
        const parsed = JSON.parse(content);
        return { data: parsed, error: null };
    } catch (err: any) {
        return { data: null, error: err instanceof Error ? err.message : "Invalid JSON." };
    }
}

export function stringifyJson(data: any, space: number = 2): string {
    return JSON.stringify(data, null, space);
}
