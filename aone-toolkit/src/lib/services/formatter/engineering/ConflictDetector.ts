import { DiffStats, type FormattingIntensity } from '../ux/DiffStats';

/**
 * ConflictDetector (3-Way Format Resolver) - Feature 10
 * Detects discrepancies between the current file's formatting 
 * and a reference "ideal" or "remote" version.
 * Helps prevent merge friction by highlighting formatting conflicts.
 */
export class ConflictDetector {
    /**
     * Analyzes if a merge or a save would cause a "Formatting Storm" 
     * (massive changes that are purely formatting related).
     */
    public static detectPotentialStorm(local: string, remote: string): {
        isStorm: boolean;
        stats: FormattingIntensity
    } {
        const stats = DiffStats.calculateIntensity(local, remote);

        // A "Storm" is usually defined by a high intensity score 
        // while being purely whitespace changes.
        const isStorm = stats.whitespaceOnly && stats.intensityScore > 30;

        return {
            isStorm,
            stats
        };
    }

    /**
     * Highlights ranges where local formatting significantly deviates from remote.
     */
    public static findConflictRanges(local: string, remote: string): { from: number; to: number }[] {
        // In a real scenario, this would use a proper AST diff.
        // For this demo, we can use character-level diff segments with high changes.
        const segments = 20;
        const distribution = DiffStats.getChangeDistribution(local, remote, segments);
        const conflicts: { from: number; to: number }[] = [];
        const segmentLen = Math.floor(local.length / segments);

        for (let i = 0; i < segments; i++) {
            if (distribution[i] > segmentLen * 0.5) { // If > 50% of the segment changed
                conflicts.push({
                    from: i * segmentLen,
                    to: (i + 1) * segmentLen
                });
            }
        }

        return conflicts;
    }
}
