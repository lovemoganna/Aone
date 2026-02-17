/**
 * Arrow Detection and Direction Utilities
 * Supports PlantUML and Graphviz arrow syntax
 */

export type Direction = 'left' | 'right' | 'up' | 'down' | 'default';
export type DiagramMode = 'plantuml' | 'graphviz';

export interface ArrowMatch {
    start: number;
    end: number;
    original: string;
    direction: Direction;
    lineNumber: number;
}

// PlantUML arrow patterns - simplified for reliability
// Matches: ->, -->, -left->, -right->, -up->, -down->, -l->, -r->, -u->, -d->
// Also matches dotted variants: ..>, .left.>, etc.
// Order matters: check directional first, then simple arrows
const PLANTUML_ARROWS = [
    /-(?:left|right|up|down|l|r|u|d)->/gi,  // Directional solid
    /\.(?:left|right|up|down|l|r|u|d)\.\>/gi, // Directional dotted
    /-->/g,   // Dashed arrow
    /->/g,    // Simple solid arrow
    /\.\.\>/g // Simple dotted arrow
];

// Graphviz doesn't have per-edge direction syntax, but we can detect edges
const GRAPHVIZ_EDGE_REGEX = /(\w+)\s*(->|--)\s*(\w+)/g;

/**
 * Detect arrows in text based on diagram mode
 */
export function detectArrows(text: string, mode: DiagramMode): ArrowMatch[] {
    const matches: ArrowMatch[] = [];

    if (mode === 'plantuml') {
        // Track matched positions to avoid duplicates
        const matchedPositions = new Set<number>();

        for (const pattern of PLANTUML_ARROWS) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;

            while ((match = regex.exec(text)) !== null) {
                // Skip if already matched at this position
                if (matchedPositions.has(match.index)) continue;
                matchedPositions.add(match.index);

                const direction = getDirectionFromArrow(match[0]);
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    original: match[0],
                    direction,
                    lineNumber: getLineNumber(text, match.index)
                });
            }
        }
    } else if (mode === 'graphviz') {
        // For Graphviz, we detect edges but note that direction is controlled globally
        let match;
        const regex = new RegExp(GRAPHVIZ_EDGE_REGEX.source, 'g');

        while ((match = regex.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                original: match[0],
                direction: 'default',
                lineNumber: getLineNumber(text, match.index)
            });
        }
    }

    return matches;
}

/**
 * Get direction from arrow string
 */
export function getDirectionFromArrow(arrow: string): Direction {
    const lower = arrow.toLowerCase();
    if (lower.includes('left') || lower.includes('-l-') || lower.includes('.l.')) return 'left';
    if (lower.includes('right') || lower.includes('-r-') || lower.includes('.r.')) return 'right';
    if (lower.includes('up') || lower.includes('-u-') || lower.includes('.u.')) return 'up';
    if (lower.includes('down') || lower.includes('-d-') || lower.includes('.d.')) return 'down';
    return 'default';
}

/**
 * Get line number for a position in text
 */
function getLineNumber(text: string, position: number): number {
    return text.substring(0, position).split('\n').length;
}

/**
 * Replace arrow with new direction (PlantUML only)
 */
export function replaceArrowDirection(
    original: string,
    newDirection: Direction
): string {
    // Determine if it's dotted or solid
    const isDotted = original.includes('..');
    const prefix = isDotted ? '..' : '--';
    const suffix = isDotted ? '.>' : '>';

    if (newDirection === 'default') {
        // Return simple arrow
        return isDotted ? '..>' : '->';
    }

    // Build directional arrow
    const dirMap: Record<Direction, string> = {
        left: 'left',
        right: 'right',
        up: 'up',
        down: 'down',
        default: ''
    };

    return `${prefix.charAt(0)}${dirMap[newDirection]}${prefix.charAt(0)}${suffix}`;
}

/**
 * Replace all arrows in text with new direction
 */
export function replaceAllArrows(
    text: string,
    matches: ArrowMatch[],
    newDirection: Direction
): string {
    // Sort by position descending to replace from end to start
    const sorted = [...matches].sort((a, b) => b.start - a.start);

    let result = text;
    for (const match of sorted) {
        const replacement = replaceArrowDirection(match.original, newDirection);
        result = result.substring(0, match.start) + replacement + result.substring(match.end);
    }

    return result;
}

/**
 * Direction display info
 */
export const DIRECTION_OPTIONS: Array<{
    id: Direction;
    label: string;
    icon: string;
    syntax: string;
}> = [
        { id: 'right', label: '向右', icon: '→', syntax: '-right->' },
        { id: 'left', label: '向左', icon: '←', syntax: '-left->' },
        { id: 'up', label: '向上', icon: '↑', syntax: '-up->' },
        { id: 'down', label: '向下', icon: '↓', syntax: '-down->' },
        { id: 'default', label: '默认', icon: '○', syntax: '->' },
    ];
