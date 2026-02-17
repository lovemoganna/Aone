import { browser } from '$app/environment';

export interface Snippet {
    id: string;
    title: string;
    code: string;
    language: string;
    description: string;
    tags: string[];
    updatedAt: number;
}

function createSnippetStore() {
    let snippets = $state<Snippet[]>([]);
    let isInitialized = false;

    if (browser) {
        const stored = localStorage.getItem('aone_snippets');
        if (stored) {
            try {
                snippets = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse snippets", e);
            }
        }
        isInitialized = true;
    }

    $effect.root(() => {
        $effect(() => {
            if (browser && isInitialized) {
                localStorage.setItem('aone_snippets', JSON.stringify(snippets));
            }
        });
    });

    return {
        get snippets() { return snippets; },
        addSnippet(snippet: Omit<Snippet, 'id' | 'updatedAt'>) {
            const newSnippet = {
                ...snippet,
                id: crypto.randomUUID(),
                updatedAt: Date.now()
            };
            snippets = [newSnippet, ...snippets];
            return newSnippet;
        },
        updateSnippet(id: string, updates: Partial<Snippet>) {
            snippets = snippets.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s);
        },
        deleteSnippet(id: string) {
            snippets = snippets.filter(s => s.id !== id);
        },
        getSnippetById(id: string) {
            return snippets.find(s => s.id === id);
        }
    };
}

export const snippetStore = createSnippetStore();
