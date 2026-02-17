// Intelligence Service for Diagram Editor
import { diagramStore } from './store.svelte';

export interface GhostSuggestion {
    text: string;
    type: 'completion' | 'prediction';
}

class IntelligenceService {
    private throttleTimer: any = null;
    currentSuggestion = $state<GhostSuggestion | null>(null);

    async getGhostSuggestion(code: string, line: number, col: number) {
        if (this.throttleTimer) clearTimeout(this.throttleTimer);

        return new Promise<GhostSuggestion | null>((resolve) => {
            this.throttleTimer = setTimeout(async () => {
                try {
                    // In a real app, this would call an AI endpoint
                    // For now, we'll use a local logic based on common PlantUML/Graphviz patterns
                    const suggestion = this.predict(code, line, col);
                    this.currentSuggestion = suggestion;
                    resolve(suggestion);
                } catch (e) {
                    console.error('AI Ghost Error:', e);
                    resolve(null);
                }
            }, 300); // 300ms throttle
        });
    }

    private predict(code: string, line: number, col: number): GhostSuggestion | null {
        const lines = code.split('\n');
        const currentLine = lines[line - 1] || '';
        const trimmed = currentLine.trim();

        if (diagramStore.mode === 'plantuml') {
            if (trimmed === '@start') return { text: 'uml', type: 'completion' };
            if (trimmed === '!theme') return { text: ' mars', type: 'completion' };
            if (trimmed === 'skinparam') return { text: ' monochrome true', type: 'completion' };

            if (trimmed.startsWith('Alice ->')) return { text: ' Bob: ', type: 'completion' };
            if (trimmed.startsWith('Bob ->')) return { text: ' Alice: ', type: 'completion' };
            if (trimmed === 'alt') return { text: ' success', type: 'completion' };
            if (trimmed === 'else') return { text: ' failure', type: 'completion' };
            if (trimmed === 'opt') return { text: ' optional', type: 'completion' };
            if (trimmed === 'loop') return { text: ' 10 times', type: 'completion' };

            // Structural predictions based on skill principles
            if (line > 1) {
                const prevLine = lines[line - 2].trim();
                if (prevLine === '@startuml' && trimmed === '') {
                    return { text: '!theme vibrant', type: 'prediction' };
                }
                if (prevLine.includes('->') && trimmed === '') {
                    // Predictive follow-up
                    const actor = prevLine.split('->')[0].trim();
                    return { text: `deactivate ${actor}`, type: 'prediction' };
                }
                if (prevLine.startsWith('activate') && trimmed === '') {
                    const actor = prevLine.split(' ')[1];
                    return { text: `${actor} -> `, type: 'prediction' };
                }
            }
        } else if (diagramStore.mode === 'graphviz') {
            if (trimmed === 'digraph') return { text: ' G {', type: 'completion' };
            if (trimmed === 'subgraph') return { text: ' cluster_1 {', type: 'completion' };
            if (trimmed.includes('->') && !trimmed.includes(';')) return { text: ';', type: 'completion' };
            if (trimmed === 'rankdir=') return { text: 'LR;', type: 'completion' };
            if (trimmed === '{' || trimmed === '') {
                if (line > 1 && lines[line - 2].includes('digraph')) {
                    return { text: '  node [shape=box];', type: 'prediction' };
                }
            }
        }

        return null;
    }

    applySuggestion() {
        if (!this.currentSuggestion) return;

        // This will be handled by the Editor component to insert text at cursor
        const text = this.currentSuggestion.text;
        this.currentSuggestion = null;
        return text;
    }

    clear() {
        this.currentSuggestion = null;
    }
}

export const intelligenceService = new IntelligenceService();
