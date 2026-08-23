import { CodeFormatterService } from '../CodeFormatterService';
import type { FormatterOptions } from '../CodeFormatterService';

export interface PasteContext {
    /** The whitespace prefix on the line where the paste occurs */
    baseIndent: string;
}

/**
 * ContextBridge (Chameleon Paste) - Feature 1
 * Analyzes the AST/Indentation context at the cursor insertion point
 * and intelligently adapts pasted code (formatting it and applying correct base indentation)
 * to prevent breaking the local file's formatting hierarchy.
 */
export class ContextBridge {
    /**
     * Extracts context information from the insertion point.
     * @param fullText The full text of the document before pasting
     * @param insertIndex The index where the text is being pasted
     */
    public static extractContext(fullText: string, insertIndex: number): PasteContext {
        let lineStart = insertIndex;

        // Find the start of the current line
        while (lineStart > 0 && fullText[lineStart - 1] !== '\n') {
            lineStart--;
        }

        const prefix = fullText.substring(lineStart, insertIndex);

        // Extract leading whitespace (spaces and tabs)
        const match = prefix.match(/^([\s\t]*)/);
        const baseIndent = match ? match[1] : '';

        return { baseIndent };
    }

    /**
     * Formats the pasted code and adapts its indentation to fit seamlessly
     * into the extracted context.
     * @param pastedCode The raw code being pasted
     * @param context The context extracted from the document
     * @param options Formatting options
     */
    public static formatAndAdaptPaste(
        pastedCode: string,
        context: PasteContext,
        options: FormatterOptions = {}
    ): string {
        // Early return for empty strings
        if (!pastedCode.trim()) {
            return pastedCode;
        }

        // 1. Format the pasted code natively
        const formattedResult = CodeFormatterService.format(pastedCode, options);
        const formatted = formattedResult.result;

        // 2. Strip common leading indentation from the formatted code (P1 Enhancement)
        // This prevents double-indenting if the formatted code already has internal relative indentation.
        const originalLines = formatted.split(/\r?\n/);
        let commonIndent = Infinity;

        // Find the minimum common indentation of non-empty lines
        originalLines.forEach(line => {
            if (line.trim()) {
                const match = line.match(/^(\s*)/);
                if (match) commonIndent = Math.min(commonIndent, match[1].length);
            }
        });

        const strippedLines = commonIndent === Infinity ? originalLines : originalLines.map(line =>
            line.trim() ? line.substring(commonIndent) : line
        );

        // 3. Adapt the indentation
        if (strippedLines.length === 0) return formatted;

        // The first line is typically glued onto the existing line, so it doesn't need baseIndent.
        // Subsequent lines need to be shifted right by `baseIndent`.
        const adaptedLines = [strippedLines[0]];
        for (let i = 1; i < strippedLines.length; i++) {
            adaptedLines.push(context.baseIndent + strippedLines[i]);
        }

        return adaptedLines.join('\n');
    }
}
