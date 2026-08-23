import type { FormattingResult } from './CodeFormatterService';

export interface ProviderResult extends FormattingResult {
    error?: string;
}

/**
 * Provider Pattern for multi-language support.
 * Detaches UI from specific formatting logic.
 */
export class CodeFormatterProvider {
    private static async loadSqlFormatter() {
        const { CodeFormatterService } = await import('./CodeFormatterService');
        return CodeFormatterService;
    }

    /**
     * Formats input based on language.
     */
    public static async format(
        input: string,
        language: string,
        options: any = {}
    ): Promise<ProviderResult> {
        if (!input.trim()) return { result: "" };

        try {
            switch (language.toLowerCase()) {
                case 'json':
                    return this.formatJSON(input, options);
                case 'html':
                    return this.formatHTML(input, options);
                case 'css':
                    return this.formatCSS(input, options);
                case 'sql':
                case 'duckdb':
                    // SQL formatting uses the advanced Service
                    const CodeFormatterService = await this.loadSqlFormatter();
                    return CodeFormatterService.format(input, options);
                default:
                    return { result: input };
            }
        } catch (e: any) {
            return { result: input, error: e.message };
        }
    }

    private static formatJSON(input: string, options: any): ProviderResult {
        const obj = JSON.parse(input);
        const result = JSON.stringify(obj, null, options.tabWidth || 2);
        return { result };
    }

    private static formatHTML(input: string, options: any): ProviderResult {
        let tab = ' '.repeat(options.tabWidth || 2);
        let result = input
            .replace(/>\s*</g, '>\n<')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join('\n');

        let depth = 0;
        const finalLines = result.split('\n').map(line => {
            if (line.startsWith('</')) depth--;
            const indented = tab.repeat(Math.max(0, depth)) + line;
            if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) depth++;
            return indented;
        });

        return { result: finalLines.join('\n') };
    }

    private static formatCSS(input: string, options: any): ProviderResult {
        let tab = ' '.repeat(options.tabWidth || 2);
        let result = input
            .replace(/\s*{\s*/g, ' {\n' + tab)
            .replace(/;\s*/g, ';\n' + tab)
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/;\n\s*}/g, ';\n}')
            .trim();
        return { result };
    }

    public static async minify(input: string, language: string): Promise<string> {
        try {
            switch (language.toLowerCase()) {
                case 'json':
                    return JSON.stringify(JSON.parse(input));
                case 'sql':
                case 'duckdb':
                    const CodeFormatterService = await this.loadSqlFormatter();
                    return CodeFormatterService.minify(input);
                default:
                    return input.replace(/\s+/g, ' ').trim();
            }
        } catch (e) {
            return input.replace(/\s+/g, ' ').trim();
        }
    }
}
