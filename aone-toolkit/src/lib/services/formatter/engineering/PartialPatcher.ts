import * as jsdiff from 'diff';

export interface EditorChange {
    from: number;
    to: number;
    insert: string;
}

/**
 * PartialPatcher (Incremental AST Patcher) - Feature 14
 * Calculates the minimal set of changes (patches) needed to transform 
 * the original document into the formatted one.
 * Minimizes DOM churn in CodeMirror by avoiding full-document replaces.
 */
export class PartialPatcher {
    /**
     * Calculates a list of changes to be applied as a transaction.
     */
    public static calculatePatches(original: string, formatted: string): EditorChange[] {
        const changes = jsdiff.diffLines(original, formatted);
        const patches: EditorChange[] = [];

        let currentPos = 0;

        for (const change of changes) {
            if (change.added) {
                // An addition at the current position
                patches.push({
                    from: currentPos,
                    to: currentPos,
                    insert: change.value
                });
            } else if (change.removed) {
                // A removal of code starting at current position
                patches.push({
                    from: currentPos,
                    to: currentPos + change.value.length,
                    insert: ''
                });
                currentPos += change.value.length;
            } else {
                // Unchanged part
                currentPos += change.value.length;
            }
        }

        // Optimization: Merge contiguous additions/removals if needed
        // (diff-lines already groups them fairly well)
        return patches;
    }
}
