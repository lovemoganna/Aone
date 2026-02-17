import { renderPlantUML } from './plantuml';
import { renderGraphviz } from './graphviz';
import { generateHeuristicDiagram } from '../lib/ai/heuristics';
import { findDefinitions, extractProperties, type Definition } from './parser';
import { injectColor, injectLabel, injectShape, injectPosition } from './modifier';
import { collabService } from './collaboration';

export type DiagramMode = 'plantuml' | 'graphviz';

export interface Snippet {
    id: string;
    name: string;
    code: string;
    mode: DiagramMode;
    timestamp: number;
}

export interface HistoryItem {
    code: string;
    timestamp: number;
}

export interface DiagramDocument {
    id: string;
    name: string;
    code: string;
    mode: DiagramMode;
    engine: string;
    overrides: Record<string, any>;
    history: HistoryItem[];
}

const STORAGE_KEY = 'aone_diagram_editor_v1';

export class DiagramStore {
    // Core State (Proxied to Active Document)
    get code() {
        return this.documents.find(d => d.id === this.activeDocumentId)?.code || '';
    }
    set code(v: string) {
        const doc = this.documents.find(d => d.id === this.activeDocumentId);
        if (doc) {
            doc.code = v;
            this.saveState();
            if (this.isCollaborating && !this.#isRemoteUpdate) {
                collabService.updateCode(v);
            }
        }
    }

    get mode() {
        return this.documents.find(d => d.id === this.activeDocumentId)?.mode || 'plantuml';
    }
    set mode(v: DiagramMode) {
        const doc = this.documents.find(d => d.id === this.activeDocumentId);
        if (doc) {
            doc.mode = v;
            this.saveState();
        }
    }

    get engine() {
        return this.documents.find(d => d.id === this.activeDocumentId)?.engine || 'dot';
    }
    set engine(v: string) {
        const doc = this.documents.find(d => d.id === this.activeDocumentId);
        if (doc) {
            doc.engine = v;
            this.saveState();
        }
    }

    get overrides() {
        return this.documents.find(d => d.id === this.activeDocumentId)?.overrides || {};
    }
    set overrides(v: Record<string, any>) {
        const doc = this.documents.find(d => d.id === this.activeDocumentId);
        if (doc) {
            doc.overrides = v;
            this.saveState();
        }
    }

    // View State
    svg = $state('');
    isRendering = $state(false);
    error = $state<string | null>(null);
    scale = $state(1);
    pan = $state({ x: 0, y: 0 });
    snippets = $state<Snippet[]>([]);

    autoRender = $state(true);
    previewTheme = $state<'light' | 'dark'>('light');
    pumlTheme = $state<string>(''); // PlantUML theme name (spacelab, united, plain, mars, etc.)

    // Collaboration State
    sessionID = $state<string | null>(null);
    isCollaborating = $state(false);
    collaborators = $state<{ name: string; color: string }[]>([]);
    #isRemoteUpdate = false;

    // Performance Tiering
    qualityLevel = $state<'performance' | 'balanced' | 'high'>('high');

    // Advanced Interactions
    selectedElementId = $state<string | null>(null);
    selectedElementType = $state<'node' | 'edge' | null>(null);

    // UI Panels
    isInspectorOpen = $state(false);
    isSidebarPinned = $state(true);
    isMinimapOpen = $state(true);
    focusMode = $state(false);

    multiSelection = $state<string[]>([]);

    // Layer Management
    activeLayers = $state<string[]>([]);
    availableLayers = $state<string[]>([]);

    toggleLayer(layer: string) {
        if (this.activeLayers.includes(layer)) {
            this.activeLayers = this.activeLayers.filter(l => l !== layer);
        } else {
            this.activeLayers = [...this.activeLayers, layer];
        }
        this.saveState();
    }

    setAvailableLayers(layers: string[]) {
        this.availableLayers = layers;
    }


    // Layout Parameters
    layoutParams = $state({
        nodesep: 0.5,
        ranksep: 0.5,
        rankdir: 'TB',
        overlap: 'false',
        splines: 'true'
    });

    // Multi-Doc State
    documents = $state<DiagramDocument[]>([]);
    activeDocumentId = $state<string>('');

    #renderTimeout: any = null;

    // Settings
    fontSize = $state(14);
    fontFamily = $state("'JetBrains Mono', monospace");
    plantumlServerUrl = $state('https://www.plantuml.com/plantuml');

    constructor(initialCode = '', initialMode: DiagramMode = 'plantuml') {
        this.loadState();
        if (this.documents.length === 0) {
            this.createDocument('Untitled Diagram', initialCode, initialMode);
        }
        this.loadSnippets();
    }

    saveState() {
        if (typeof window === 'undefined') return;
        const state = {
            documents: this.documents,
            activeDocumentId: this.activeDocumentId,
            scale: this.scale,
            pan: this.pan,
            isSidebarPinned: this.isSidebarPinned,
            isMinimapOpen: this.isMinimapOpen,
            qualityLevel: this.qualityLevel,
            layoutParams: this.layoutParams,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            previewTheme: this.previewTheme
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    private loadState() {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.documents = data.documents || [];
                this.activeDocumentId = data.activeDocumentId || '';
                this.scale = data.scale || 1;
                this.pan = data.pan || { x: 0, y: 0 };
                this.isSidebarPinned = data.isSidebarPinned ?? true;
                this.isMinimapOpen = data.isMinimapOpen ?? true;
                this.qualityLevel = data.qualityLevel || 'high';
                if (data.layoutParams) this.layoutParams = data.layoutParams;
                if (data.fontSize) this.fontSize = data.fontSize;
                if (data.fontFamily) this.fontFamily = data.fontFamily;
                if (data.previewTheme) this.previewTheme = data.previewTheme;
            } catch (e) {
                console.error('Failed to load diagram store state', e);
            }
        }
    }

    resetView() {
        this.scale = 1;
        this.pan = { x: 0, y: 0 };
        this.saveState();
    }

    createDocument(name = 'New Diagram', initialCode = '', initialMode: DiagramMode = 'plantuml') {
        const newDoc: DiagramDocument = {
            id: crypto.randomUUID(),
            name,
            code: initialCode,
            mode: initialMode,
            engine: 'dot',
            overrides: {},
            history: []
        };
        this.documents = [...this.documents, newDoc];
        this.switchDocument(newDoc.id);
    }

    switchDocument(id: string) {
        const doc = this.documents.find(d => d.id === id);
        if (doc) {
            this.activeDocumentId = id;
            this.svg = '';
            this.saveState();
            this.render();
        }
    }

    closeDocument(id: string) {
        if (this.documents.length <= 1) return;
        const index = this.documents.findIndex(d => d.id === id);
        this.documents = this.documents.filter(d => d.id !== id);
        if (this.activeDocumentId === id) {
            const nextDoc = this.documents[Math.max(0, index - 1)];
            this.switchDocument(nextDoc.id);
        } else {
            this.saveState();
        }
    }

    takeSnapshot() {
        const active = this.documents.find(d => d.id === this.activeDocumentId);
        if (!active || !this.code) return;
        const lastSnapshot = active.history[active.history.length - 1];
        if (lastSnapshot?.code === this.code) return;
        active.history = [...active.history, {
            code: this.code,
            timestamp: Date.now()
        }].slice(-50);
        this.saveState();
    }

    setOverride(id: string, adjustment: Partial<{ scale: number; color: string; x: number; y: number; shape?: string; focused: boolean }>) {
        const overrides = { ...this.overrides };
        if (!overrides[id]) overrides[id] = {};
        overrides[id] = { ...overrides[id], ...adjustment };
        this.overrides = overrides;
    }

    clearOverride(id: string) {
        const overrides = { ...this.overrides };
        delete overrides[id];
        this.overrides = overrides;
    }

    definitions = $derived(findDefinitions(this.code, this.mode));

    selectedElementProperties = $derived.by(() => {
        if (!this.selectedElementId) return {};
        const def = this.definitions.get(this.selectedElementId);
        if (def) {
            const props = extractProperties(def.raw, this.mode);
            const override = this.overrides[this.selectedElementId] || {};
            return { ...props, ...override };
        }
        return this.overrides[this.selectedElementId] || {};
    });

    updateElementProperty(prop: string, value: any) {
        if (!this.selectedElementId) return;
        if (prop === 'color') {
            this.code = injectColor(this.code, this.selectedElementId, value, this.mode);
        } else if (prop === 'label') {
            this.code = injectLabel(this.code, this.selectedElementId, value, this.mode);
        } else if (prop === 'shape') {
            this.code = injectShape(this.code, this.selectedElementId, value, this.mode);
        } else {
            this.setOverride(this.selectedElementId, { [prop]: value });
        }
    }

    updateNodePosition(id: string, x: number, y: number) {
        if (this.mode === 'graphviz') {
            this.code = injectPosition(this.code, id, x, y, this.mode);
        } else {
            this.setOverride(id, { x, y });
        }
    }

    /**
     * Sets the Graphviz layout engine and injects it into the code.
     */
    setLayoutEngine(engine: 'dot' | 'neato' | 'fdp' | 'twopi' | 'circo') {
        this.engine = engine;
        if (this.mode === 'graphviz') {
            // Inject or update layout=... in the graph
            const layoutRegex = /layout\s*=\s*\w+\s*;?/i;
            if (layoutRegex.test(this.code)) {
                this.code = this.code.replace(layoutRegex, `layout=${engine};`);
            } else {
                // Insert after digraph/graph declaration
                this.code = this.code.replace(
                    /(digraph|graph)\s+\w*\s*\{/i,
                    `$&\n    layout=${engine};`
                );
            }
            this.render();
        }
    }

    /**
     * Sets the graph direction (rankdir) and injects it into the code.
     */
    setDirection(dir: 'TB' | 'LR' | 'BT' | 'RL') {
        this.layoutParams = { ...this.layoutParams, rankdir: dir };
        if (this.mode === 'graphviz') {
            const rankdirRegex = /rankdir\s*=\s*\w+\s*;?/i;
            if (rankdirRegex.test(this.code)) {
                this.code = this.code.replace(rankdirRegex, `rankdir=${dir};`);
            } else {
                // Insert after digraph/graph declaration
                this.code = this.code.replace(
                    /(digraph|graph)\s+\w*\s*\{/i,
                    `$&\n    rankdir=${dir};`
                );
            }
            this.render();
        }
    }

    /**
     * Sets PlantUML theme and injects !theme directive into code.
     */
    setTheme(theme: string) {
        this.pumlTheme = theme;
        if (this.mode === 'plantuml') {
            const themeRegex = /!theme\s+\w+\s*\n?/i;
            if (themeRegex.test(this.code)) {
                // Replace existing theme
                this.code = this.code.replace(themeRegex, theme ? `!theme ${theme}\n` : '');
            } else if (theme) {
                // Insert after @startuml
                this.code = this.code.replace(
                    /(@start\w+)/i,
                    `$1\n!theme ${theme}`
                );
            }
            this.render();
        }
    }

    loadSnippets() {
        if (typeof localStorage === 'undefined') return;
        const data = localStorage.getItem('aone_diagram_snippets');
        if (data) {
            try {
                this.snippets = JSON.parse(data);
            } catch (e) {
                console.error('Failed to load snippets', e);
            }
        }
    }

    saveSnippet(name: string) {
        const newSnippet: Snippet = {
            id: crypto.randomUUID(),
            name,
            code: this.code,
            mode: this.mode,
            timestamp: Date.now()
        };
        this.snippets = [newSnippet, ...this.snippets];
        this.persistSnippets();
    }

    deleteSnippet(id: string) {
        this.snippets = this.snippets.filter(s => s.id !== id);
        this.persistSnippets();
    }

    loadSnippet(id: string) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            this.code = snippet.code;
            this.mode = snippet.mode;
            this.render();
        }
    }

    persistSnippets() {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem('aone_diagram_snippets', JSON.stringify(this.snippets));
    }

    async render() {
        if (this.isRendering) return;
        this.isRendering = true;
        this.error = null;
        try {
            if (this.mode === 'plantuml') {
                this.svg = await renderPlantUML(this.code, this.plantumlServerUrl);
            } else {
                this.svg = await renderGraphviz(this.code, this.engine);
            }
        } catch (e: any) {
            this.error = e.message;
        } finally {
            this.isRendering = false;
        }
    }

    focusOnNode(nodeId: string) {
        if (this.mode !== 'plantuml') return;
        const isFocused = this.overrides[nodeId]?.focused;
        if (isFocused) {
            this.clearOverride(nodeId);
            this.code = this.code.replace(/\nshow\s+[^\n]+\n/g, "").replace(/\nhide\s+[^\n]+\n/g, "");
        } else {
            this.setOverride(nodeId, { focused: true });
            const focusCommands = `\nhide @unlinked\nhide members\nshow ${nodeId}\n`;
            const endMatch = this.code.match(/@enduml/);
            if (endMatch) {
                this.code = this.code.slice(0, endMatch.index) + focusCommands + this.code.slice(endMatch.index);
            } else {
                this.code += focusCommands;
            }
        }
        this.render();
    }

    async generateFromPrompt(prompt: string) {
        if (!prompt.trim()) return;
        this.isRendering = true;
        this.error = null;
        try {
            const result = generateHeuristicDiagram(prompt);
            await new Promise(resolve => setTimeout(resolve, 800));
            this.code = result.code;
            this.mode = result.mode;
            await this.render();
        } catch (e: any) {
            this.error = "AI Generation failed: " + e.message;
        } finally {
            this.isRendering = false;
        }
    }

    restoreHistory(item: HistoryItem) {
        this.code = item.code;
        this.render();
    }

    // Collaboration
    async startCollaboration() {
        const id = await collabService.host();
        this.sessionID = id;
        this.isCollaborating = true;
        return id;
    }

    async joinCollaboration(id: string) {
        await collabService.join(id);
        this.sessionID = id;
        this.isCollaborating = true;
    }

    stopCollaboration() {
        collabService.destroy();
        this.sessionID = null;
        this.isCollaborating = false;
    }

    applyRemoteUpdate(code: string) {
        this.#isRemoteUpdate = true;
        this.code = code;
        this.#isRemoteUpdate = false;
        this.render();
    }

    get useSpatialEffects() {
        return this.qualityLevel !== 'performance';
    }

    get useAnimations() {
        return this.qualityLevel === 'high';
    }
}

export const diagramStore = new DiagramStore('');
