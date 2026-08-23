import * as jsdiff from 'diff';

export interface FormattingIntensity {
    additions: number;
    deletions: number;
    whitespaceOnly: boolean;
    intensityScore: number; // 0-100
}

/**
 * DiffStats (Micro-Diff Sparklines) - Feature 6
 * Calculates the intensity and nature of formatting changes.
 * Provides data for sparkline visualization to give users 
 * a "vibe" of the changes before applying them.
 */
export class DiffStats {
    /**
     * Calculates the intensity of formatting between two strings.
     */
    public static calculateIntensity(original: string, formatted: string): FormattingIntensity {
        const diff = jsdiff.diffChars(original, formatted);

        let additions = 0;
        let deletions = 0;
        let nonWhitespaceChange = false;

        for (const part of diff) {
            if (part.added) {
                additions += part.value.length;
                if (part.value.trim().length > 0) nonWhitespaceChange = true;
            } else if (part.removed) {
                deletions += part.value.length;
                if (part.value.trim().length > 0) nonWhitespaceChange = true;
            }
        }

        const totalLen = Math.max(original.length, formatted.length, 1);
        const rawScore = ((additions + deletions) / totalLen) * 100;
        const intensityScore = Math.min(Math.round(rawScore * 10), 100); // Scaled for visibility

        return {
            additions,
            deletions,
            whitespaceOnly: !nonWhitespaceChange,
            intensityScore
        };
    }

    /**
     * Generates a "sparkline" data array representing change distribution.
     * Useful for visualizing WHERE the changes are concentrated.
     */
    public static getChangeDistribution(original: string, formatted: string, segments: number = 20): number[] {
        const diff = jsdiff.diffChars(original, formatted);
        const result = new Array(segments).fill(0);

        let currentPos = 0;
        const totalLen = original.length || 1;

        for (const part of diff) {
            if (part.added) {
                const segmentIdx = Math.min(Math.floor((currentPos / totalLen) * segments), segments - 1);
                result[segmentIdx] += part.value.length;
                // 'added' doesn't advance currentPos in the 'original' reference
            } else if (part.removed) {
                const segmentIdx = Math.min(Math.floor((currentPos / totalLen) * segments), segments - 1);
                result[segmentIdx] += part.value.length;
                currentPos += part.value.length;
            } else {
                currentPos += part.value.length;
            }
        }

        return result;
    }
}
