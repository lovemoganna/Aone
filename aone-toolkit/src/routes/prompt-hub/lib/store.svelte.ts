import { type Prompt, type Tag, type Collection, type PromptVersion } from './types';

class PromptStore {
    prompts = $state<Prompt[]>([]);
    tags = $state<Tag[]>([]);
    collections = $state<Collection[]>([]);
    versions = $state<PromptVersion[]>([]);

    searchTerm = $state('');
    activeFilter = $state<'all' | 'favorites' | 'untagged' | 'archived'>('all');
    activeTagId = $state<string | null>(null);
    activeCollectionId = $state<string | null>(null);
    sortOrder = $state<'updated_desc' | 'created_desc' | 'created_asc' | 'title_asc' | 'usage_desc'>('created_desc');

    get filteredPrompts() {
        return this.prompts.filter(p => {
            const isArchived = !!p.archived;
            if (this.activeFilter === 'archived') {
                if (!isArchived) return false;
            } else {
                if (isArchived) return false;
            }

            const term = this.searchTerm.toLowerCase();
            const matchesSearch = p.title.toLowerCase().includes(term) ||
                p.content.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term);

            if (!matchesSearch) return false;

            if (this.activeFilter === 'favorites') return p.favorite;
            if (this.activeFilter === 'untagged') return p.tags.length === 0 && !p.collectionId;

            if (this.activeTagId) {
                return p.tags.includes(this.activeTagId);
            }

            if (this.activeCollectionId) {
                return p.collectionId === this.activeCollectionId;
            }

            return true;
        }).sort((a, b) => {
            switch (this.sortOrder) {
                case 'updated_desc':
                    return b.updatedAt - a.updatedAt;
                case 'created_asc':
                    return a.createdAt - b.createdAt;
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'usage_desc':
                    return (b.usageCount || 0) - (a.usageCount || 0);
                case 'created_desc':
                default:
                    return b.createdAt - a.createdAt;
            }
        });
    }

    constructor() { }

    load() {
        if (typeof localStorage === 'undefined') return;
        try {
            const data = localStorage.getItem('prompthub_data');
            if (data) {
                const parsed = JSON.parse(data);
                this.prompts = parsed.prompts || [];
                this.tags = parsed.tags || [];
                this.collections = parsed.collections || [];
                this.versions = parsed.versions || [];
            } else {
                this.initSampleData();
            }
        } catch (e) {
            console.error("Failed to load data", e);
            this.initSampleData();
        }
    }

    save() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem('prompthub_data', JSON.stringify({
                prompts: this.prompts,
                tags: this.tags,
                collections: this.collections,
                versions: this.versions
            }));
        } catch (e) {
            console.error("Failed to save data", e);
        }
    }

    initSampleData() {
        this.tags = [
            { id: 'work', name: '工作', parentId: null, level: 0 },
            { id: 'personal', name: '个人', parentId: null, level: 0 }
        ];
        this.collections = [
            { id: 'c1', name: 'My Project', createdAt: Date.now() }
        ];
        this.prompts = [
            {
                id: 'p1',
                title: '示例提示词',
                content: '这是一个**示例**提示词。',
                description: '欢迎使用 PromptHub',
                tags: ['work'],
                favorite: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                usageCount: 0
            }
        ];
        this.save();
    }

    // CRUD
    addPrompt(prompt: Prompt) {
        this.prompts.push(prompt);
        this.save();
    }

    updatePrompt(id: string, updates: Partial<Prompt>, createVersion = false) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            if (createVersion) {
                const original = this.prompts[index];
                this.versions.push({
                    versionId: crypto.randomUUID(),
                    promptId: id,
                    content: original.content,
                    timestamp: Date.now(),
                    title: original.title,
                });
            }

            this.prompts[index] = { ...this.prompts[index], ...updates, updatedAt: Date.now() };
            this.save();
        }
    }

    deletePrompt(id: string) {
        this.prompts = this.prompts.filter(p => p.id !== id);
        this.versions = this.versions.filter(v => v.promptId !== id);
        this.save();
    }

    toggleFavorite(id: string) {
        const p = this.prompts.find(p => p.id === id);
        if (p) {
            this.updatePrompt(id, { favorite: !p.favorite });
        }
    }

    toggleArchive(id: string) {
        const p = this.prompts.find(p => p.id === id);
        if (p) {
            this.updatePrompt(id, { archived: !p.archived });
        }
    }

    duplicatePrompt(id: string) {
        const original = this.prompts.find(p => p.id === id);
        if (original) {
            const duplicate: Prompt = {
                ...original,
                id: crypto.randomUUID(),
                title: `${original.title} (Copy)`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                usageCount: 0,
            };
            this.prompts.push(duplicate);
            this.save();
        }
    }

    addTagsToPrompts(ids: Set<string>, tagIds: string[]) {
        for (const id of ids) {
            const p = this.prompts.find(p => p.id === id);
            if (p) {
                const newTags = [...new Set([...p.tags, ...tagIds])];
                this.updatePrompt(id, { tags: newTags });
            }
        }
    }

    // Collection CRUD
    addCollection(name: string) {
        this.collections.push({
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now()
        });
        this.save();
    }

    updateCollection(id: string, updates: Partial<Collection>) {
        const index = this.collections.findIndex(c => c.id === id);
        if (index !== -1) {
            this.collections[index] = { ...this.collections[index], ...updates };
            this.save();
        }
    }

    deleteCollection(id: string) {
        this.collections = this.collections.filter(c => c.id !== id);
        // Also remove collectionId from prompts?
        this.prompts.forEach(p => {
            if (p.collectionId === id) {
                this.updatePrompt(p.id, { collectionId: undefined });
            }
        });
        this.save();
    }

    // Versioning Helpers
    getVersions(promptId: string) {
        return this.versions.filter(v => v.promptId === promptId).sort((a, b) => b.timestamp - a.timestamp);
    }

    restoreVersion(versionId: string) {
        const v = this.versions.find(v => v.versionId === versionId);
        if (v) {
            // Save current state as new version before restoring? Yes.
            this.updatePrompt(v.promptId, { content: v.content, title: v.title }, true);
        }
    }

    // Batch Operations
    archivePrompts(ids: Set<string>, archive: boolean = true) {
        ids.forEach(id => {
            this.updatePrompt(id, { archived: archive });
        });
    }

    movePromptsToCollection(ids: Set<string>, collectionId: string | undefined) {
        ids.forEach(id => {
            this.updatePrompt(id, { collectionId });
        });
    }

    setFavoritePrompts(ids: Set<string>, favorite: boolean) {
        ids.forEach(id => {
            this.updatePrompt(id, { favorite });
        });
    }

    deletePrompts(ids: Set<string>) {
        ids.forEach(id => {
            this.deletePrompt(id);
        });
    }

    // Tag CRUD
    addTag(name: string, parentId: string | null): Tag | null {
        const id = name.toLowerCase().replace(/\s+/g, "-");
        if (this.tags.some(t => t.id === id)) return null;

        const level = parentId ? (this.tags.find(t => t.id === parentId)?.level || 0) + 1 : 0;
        const newTag: Tag = { id, name, parentId, level };
        this.tags.push(newTag);
        this.save();
        return newTag;
    }

    updateTag(id: string, updates: Partial<Tag>) {
        const index = this.tags.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tags[index] = { ...this.tags[index], ...updates };
            this.save();
        }
    }

    deleteTag(id: string) {
        // Collect tag and descendants
        const toDelete = new Set<string>();
        const collect = (tid: string) => {
            toDelete.add(tid);
            this.tags.filter(t => t.parentId === tid).forEach(t => collect(t.id));
        };
        collect(id);

        this.tags = this.tags.filter(t => !toDelete.has(t.id));

        // Remove from prompts
        this.prompts = this.prompts.map(p => ({
            ...p,
            tags: p.tags.filter(t => !toDelete.has(t))
        }));
        this.save();
    }

    // Data Management
    exportData() {
        return JSON.stringify({
            prompts: this.prompts,
            tags: this.tags,
            collections: this.collections,
            versions: this.versions,
            timestamp: Date.now()
        }, null, 2);
    }

    importData(json: string, mode: 'replace' | 'merge') {
        try {
            const data = JSON.parse(json);
            if (!Array.isArray(data.prompts)) throw new Error("Invalid format: missing prompts array");

            if (mode === 'replace') {
                this.prompts = data.prompts || [];
                this.tags = data.tags || [];
                this.collections = data.collections || [];
                this.versions = data.versions || [];
            } else {
                // Merge Logic: Add if ID doesn't exist
                const mergeList = (current: any[], incoming: any[]) => {
                    const ids = new Set(current.map(i => i.id));
                    return [...current, ...incoming.filter(i => !ids.has(i.id))];
                };

                this.prompts = mergeList(this.prompts, data.prompts || []);
                this.tags = mergeList(this.tags, data.tags || []);
                this.collections = mergeList(this.collections, data.collections || []);

                const vIds = new Set(this.versions.map(v => v.versionId));
                this.versions = [...this.versions, ...(data.versions || []).filter((v: any) => !vIds.has(v.versionId))];
            }
            this.save();
            return { success: true };
        } catch (e: any) {
            console.error("Import failed", e);
            return { success: false, error: e.message };
        }
    }
}

export const promptStore = new PromptStore();


