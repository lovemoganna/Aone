import { browser } from '$app/environment';

export interface ClipboardItem {
    id: string;
    text: string;
    timestamp: number;
    type: 'text' | 'json' | 'code';
}

function createClipboardStore() {
    let history = $state<ClipboardItem[]>([]);
    let isInitialized = false;

    if (browser) {
        const stored = localStorage.getItem('aone_clipboard_history');
        if (stored) {
            try {
                history = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse clipboard history", e);
            }
        }
        isInitialized = true;
    }

    $effect.root(() => {
        $effect(() => {
            if (browser && isInitialized) {
                localStorage.setItem('aone_clipboard_history', JSON.stringify(history.slice(0, 50)));
            }
        });
    });

    return {
        get history() { return history; },
        add(text: string, type: 'text' | 'json' | 'code' = 'text') {
            if (!text || (history.length > 0 && history[0].text === text)) return;

            const item: ClipboardItem = {
                id: crypto.randomUUID(),
                text,
                timestamp: Date.now(),
                type
            };
            history = [item, ...history.slice(0, 49)];
        },
        clear() {
            history = [];
        },
        remove(id: string) {
            history = history.filter(h => h.id !== id);
        }
    };
}

export const clipboardStore = createClipboardStore();

/**
 * Global copy utility that also records to history
 */
export function copyToClipboard(text: string, type: 'text' | 'json' | 'code' = 'text') {
    if (!text) return;
    navigator.clipboard.writeText(text);
    clipboardStore.add(text, type);
}
