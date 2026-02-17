export interface Tag {
    id: string;
    name: string;
    parentId: string | null;
    level: number;
}

export interface Collection {
    id: string;
    name: string;
    parentId?: string;
    description?: string;
    createdAt: number;
}

export interface PromptVersion {
    versionId: string;
    promptId: string;
    content: string;
    timestamp: number;
    title: string;
    description?: string;
}

export interface Prompt {
    id: string;
    title: string;
    content: string;
    description: string;
    tags: string[]; // Tag IDs
    collectionId?: string; // Collection ID
    favorite: boolean;
    createdAt: number;
    updatedAt: number;
    usageCount: number;
    archived?: boolean;
}

export type SortOption = 'updated' | 'created' | 'usage' | 'title';
export type ViewMode = 'grid' | 'compact';
