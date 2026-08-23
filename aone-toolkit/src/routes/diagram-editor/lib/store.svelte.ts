import { renderPlantUML } from './plantuml';
import { generateHeuristicDiagram } from '../lib/ai/heuristics';
import { findDefinitions, extractProperties, type Definition } from './parser';
import { injectColor, injectLabel, injectShape, injectPosition } from './modifier';

export type DiagramMode = 'plantuml' | 'graphviz';
export type GraphvizLoadStatus = 'idle' | 'loading' | 'ready' | 'failed';

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

export interface PalettePreset {
    name: string;
    colors: string[];
}

export const DEFAULT_PALETTES: PalettePreset[] = [
    {
        name: 'Tech Modern',
        colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#1e293b']
    },
    {
        name: 'Enterprise Blue',
        colors: ['#1e40af', '#0284c7', '#0f766e', '#d97706', '#b91c1c', '#334155', '#475569', '#f8fafc']
    },
    {
        name: 'Neon Cyber',
        colors: ['#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#eab308', '#f97316', '#18181b', '#27272a']
    },
    {
        name: 'Pastel Minimal',
        colors: ['#bae6fd', '#ddd6fe', '#fbcfe8', '#bbf7d0', '#fef08a', '#fed7aa', '#f1f5f9', '#334155']
    }
];

const STORAGE_KEY = 'aone_diagram_editor_v1';

export class DiagramStore {
    #collabServicePromise: Promise<typeof import('./collaboration').collabService> | null = null;
    #graphvizRendererPromise: Promise<typeof import('./graphviz')> | null = null;
    #renderQueued = false;

    async getCollabService() {
        this.#collabServicePromise ??= import('./collaboration').then((module) => module.collabService);
        return this.#collabServicePromise;
    }

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
                void this.getCollabService().then((collabService) => collabService.updateCode(v));
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
    renderLabel = $state<string | null>(null);
    error = $state<string | null>(null);
    graphvizLoadStatus = $state<GraphvizLoadStatus>('idle');
    graphvizLoadError = $state<string | null>(null);
    scale = $state(0.85);
    pan = $state({ x: 0, y: 0 });
    snippets = $state<Snippet[]>([]);

    autoRender = $state(true);
    previewTheme = $state<'light' | 'dark'>('light');
    pumlTheme = $state<string>(''); // PlantUML theme name

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
    #isSidebarCollapsed = $state(true);
    get isSidebarCollapsed() {
        return this.#isSidebarCollapsed;
    }
    set isSidebarCollapsed(val: boolean) {
        this.#isSidebarCollapsed = val;
    }

    #activeSidebarTab = $state<'outline' | 'templates' | 'snippets' | 'diagnostics' | 'refactor'>('outline');
    get activeSidebarTab() {
        return this.#activeSidebarTab;
    }
    set activeSidebarTab(val: 'outline' | 'templates' | 'snippets' | 'diagnostics' | 'refactor') {
        this.#activeSidebarTab = val;
    }
    isMinimapOpen = $state(false);
    focusMode = $state(false);

    toggleSidebar(tab?: 'outline' | 'templates' | 'snippets' | 'diagnostics' | 'refactor') {
        if (tab) {
            if (this.activeSidebarTab === tab && !this.isSidebarCollapsed) {
                this.isSidebarCollapsed = true;
            } else {
                this.activeSidebarTab = tab;
                this.isSidebarCollapsed = false;
            }
        } else {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;
        }
    }

    multiSelection = $state<string[]>([]);

    // Layer Management
    activeLayers = $state<string[]>([]);
    availableLayers = $state<string[]>([]);

    // Custom Palettes
    customPalettes = $state<PalettePreset[]>(DEFAULT_PALETTES);
    activePaletteIndex = $state(0);

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

    // Settings
    fontSize = $state(12);
    fontFamily = $state("'JetBrains Mono', 'Noto Sans SC', monospace");
    plantumlServerUrl = $state('https://www.plantuml.com/plantuml');

    constructor(initialCode = '', initialMode: DiagramMode = 'plantuml') {
        this.loadState();
        if (this.documents.length === 0) {
            const defaultCode = initialCode || `@startuml
skinparam backgroundColor transparent
skinparam shadowing false
skinparam roundcorner 8

actor User as "用户 / Client"
participant Gateway as "API 网关 / Gateway"
participant Service as "业务服务 / Core Service"
database DB as "数据库 / Database"

User -> Gateway: 1. 发起业务请求 (HTTPS POST)
activate Gateway
Gateway -> Service: 2. 鉴权与路由转发 (gRPC)
activate Service
Service -> DB: 3. 查询与持久化事务
activate DB
DB --> Service: 4. 响应数据记录
deactivate DB
Service --> Gateway: 5. 返回处理结果 (JSON)
deactivate Service
Gateway --> User: 6. 响应客户端 (200 OK)
deactivate Gateway
@enduml`;
            this.createDocument('架构时序图', defaultCode, initialMode);
        }
        this.loadSnippets();
    }

    saveState() {
        if (typeof window === 'undefined') return;

        const buildState = (historyLimit = 50) => ({
            documents: this.documents.map(d => ({
                ...d,
                history: (d.history || []).slice(-historyLimit)
            })),
            activeDocumentId: this.activeDocumentId,
            scale: this.scale,
            pan: this.pan,
            isSidebarPinned: this.isSidebarPinned,
            isMinimapOpen: this.isMinimapOpen,
            qualityLevel: this.qualityLevel,
            layoutParams: this.layoutParams,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            previewTheme: this.previewTheme,
            customPalettes: this.customPalettes
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(buildState(50)));
        } catch (e: any) {
            console.warn('LocalStorage full, attempting recovery by trimming history...', e);
            try {
                // Tier 1 fallback: trim history to 10 entries
                localStorage.setItem(STORAGE_KEY, JSON.stringify(buildState(10)));
            } catch (e2: any) {
                try {
                    // Tier 2 fallback: strip all history
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildState(0)));
                } catch (e3) {
                    console.error('Failed to save state even after trimming history', e3);
                }
            }
        }
    }

    private loadState() {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.documents = data.documents || [];
                this.activeDocumentId = data.activeDocumentId || '';
                this.scale = 0.85;
                this.pan = { x: 0, y: 0 };
                this.isSidebarPinned = data.isSidebarPinned ?? true;
                this.isMinimapOpen = data.isMinimapOpen ?? true;
                this.qualityLevel = data.qualityLevel || 'high';
                if (data.layoutParams) this.layoutParams = data.layoutParams;
                if (data.fontSize) {
                    this.fontSize = (data.fontSize === 14 ? 12 : data.fontSize);
                } else {
                    this.fontSize = 12;
                }
                if (data.fontFamily && !data.fontFamily.includes('Victor Mono')) {
                    this.fontFamily = data.fontFamily;
                } else {
                    this.fontFamily = "'JetBrains Mono', 'Noto Sans SC', monospace";
                }
                if (data.previewTheme) this.previewTheme = data.previewTheme;
                if (data.customPalettes && Array.isArray(data.customPalettes)) {
                    this.customPalettes = data.customPalettes;
                }
            } catch (e) {
                console.error('Failed to load diagram store state', e);
            }
        }
    }

    resetView() {
        this.scale = 0.85;
        this.pan = { x: 0, y: 0 };
        this.saveState();
    }

    /**
     * Fits diagram content neatly into viewport with margin padding.
     */
    fitToContent(viewportWidth: number, viewportHeight: number, bbox?: { x: number; y: number; width: number; height: number }) {
        if (!bbox || bbox.width <= 0 || bbox.height <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
            this.resetView();
            return;
        }

        const padding = 60;
        const availW = Math.max(100, viewportWidth - padding * 2);
        const availH = Math.max(100, viewportHeight - padding * 2);

        const scaleX = availW / bbox.width;
        const scaleY = availH / bbox.height;
        const targetScale = Math.max(0.15, Math.min(0.85, Math.min(scaleX, scaleY)));

        // Center content
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;

        const panX = -cx * targetScale;
        const panY = -cy * targetScale;

        this.scale = targetScale;
        this.pan = { x: panX, y: panY };
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

    duplicateDocument(id: string) {
        const doc = this.documents.find(d => d.id === id);
        if (!doc) return;
        const cloneDoc: DiagramDocument = {
            id: crypto.randomUUID(),
            name: `${doc.name} (Copy)`,
            code: doc.code,
            mode: doc.mode,
            engine: doc.engine,
            overrides: JSON.parse(JSON.stringify(doc.overrides || {})),
            history: []
        };
        this.documents = [...this.documents, cloneDoc];
        this.switchDocument(cloneDoc.id);
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
        const index = this.documents.findIndex(d => d.id === id);
        if (index === -1) return;

        this.documents = this.documents.filter(d => d.id !== id);

        if (this.documents.length === 0) {
            this.createDocument('Untitled Diagram');
            return;
        }

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

    exportProjectBundle(): string {
        const bundle = {
            version: 1,
            exportedAt: new Date().toISOString(),
            activeDocumentId: this.activeDocumentId,
            documents: this.documents,
            snippets: this.snippets,
            customPalettes: this.customPalettes
        };
        return JSON.stringify(bundle, null, 2);
    }

    importProjectBundle(jsonString: string): { success: boolean; count: number; message: string } {
        try {
            const data = JSON.parse(jsonString);
            if (!data.documents || !Array.isArray(data.documents) || data.documents.length === 0) {
                return { success: false, count: 0, message: 'Invalid bundle format: no documents found.' };
            }

            const validDocs: DiagramDocument[] = data.documents.map((d: any) => ({
                id: d.id || crypto.randomUUID(),
                name: d.name || 'Imported Diagram',
                code: d.code || '',
                mode: d.mode === 'graphviz' ? 'graphviz' : 'plantuml',
                engine: d.engine || 'dot',
                overrides: d.overrides || {},
                history: Array.isArray(d.history) ? d.history.slice(-20) : []
            }));

            // Merge documents
            this.documents = [...this.documents, ...validDocs];
            if (data.snippets && Array.isArray(data.snippets)) {
                this.snippets = [...this.snippets, ...data.snippets];
                this.persistSnippets();
            }
            if (data.customPalettes && Array.isArray(data.customPalettes)) {
                this.customPalettes = data.customPalettes;
            }

            this.switchDocument(validDocs[0].id);
            this.saveState();
            return { success: true, count: validDocs.length, message: `Successfully imported ${validDocs.length} diagrams.` };
        } catch (e: any) {
            return { success: false, count: 0, message: e?.message || 'Failed to parse bundle JSON' };
        }
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

    get definitions() {
        return findDefinitions(this.code, this.mode);
    }

    get selectedElementProperties() {
        if (!this.selectedElementId) return {};
        const def = this.definitions.get(this.selectedElementId);
        if (def) {
            const props = extractProperties(def.raw, this.mode);
            const override = this.overrides[this.selectedElementId] || {};
            return { ...props, ...override };
        }
        return this.overrides[this.selectedElementId] || {};
    }

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

    setLayoutEngine(engine: 'dot' | 'neato' | 'fdp' | 'twopi' | 'circo') {
        this.engine = engine;
        if (this.mode === 'graphviz') {
            const layoutRegex = /layout\s*=\s*\w+\s*;?/i;
            if (layoutRegex.test(this.code)) {
                this.code = this.code.replace(layoutRegex, `layout=${engine};`);
            } else {
                this.code = this.code.replace(
                    /(digraph|graph)\s+\w*\s*\{/i,
                    `$&\n    layout=${engine};`
                );
            }
            this.render();
        }
    }

    setDirection(dir: 'TB' | 'LR' | 'BT' | 'RL') {
        this.layoutParams = { ...this.layoutParams, rankdir: dir };
        if (this.mode === 'graphviz') {
            const rankdirRegex = /rankdir\s*=\s*\w+\s*;?/i;
            if (rankdirRegex.test(this.code)) {
                this.code = this.code.replace(rankdirRegex, `rankdir=${dir};`);
            } else {
                this.code = this.code.replace(
                    /(digraph|graph)\s+\w*\s*\{/i,
                    `$&\n    rankdir=${dir};`
                );
            }
            this.render();
        }
    }

    setTheme(theme: string) {
        this.pumlTheme = theme;
        if (this.mode === 'plantuml') {
            const themeRegex = /!theme\s+\w+\s*\n?/i;
            if (themeRegex.test(this.code)) {
                this.code = this.code.replace(themeRegex, theme ? `!theme ${theme}\n` : '');
            } else if (theme) {
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

    async loadGraphvizRenderer() {
        if (!this.#graphvizRendererPromise) {
            this.graphvizLoadStatus = 'loading';
            this.graphvizLoadError = null;
            this.#graphvizRendererPromise = import('./graphviz')
                .then((module) => {
                    this.graphvizLoadStatus = 'ready';
                    return module;
                })
                .catch((e: any) => {
                    this.graphvizLoadStatus = 'failed';
                    this.graphvizLoadError = e?.message || 'Graphviz renderer failed to load.';
                    this.#graphvizRendererPromise = null;
                    throw e;
                });
        }

        return this.#graphvizRendererPromise;
    }

    async render() {
        if (this.isRendering) {
            this.#renderQueued = true;
            return;
        }

        do {
            this.#renderQueued = false;
            this.isRendering = true;
            this.error = null;

            const code = this.code;
            const mode = this.mode;
            const engine = this.engine;

            try {
                if (mode === 'plantuml') {
                    this.renderLabel = 'Rendering PlantUML diagram...';
                    this.svg = await renderPlantUML(code, this.plantumlServerUrl);
                } else {
                    this.renderLabel =
                        this.graphvizLoadStatus === 'ready'
                            ? 'Rendering Graphviz layout...'
                            : 'Loading Graphviz renderer...';
                    const { renderGraphviz } = await this.loadGraphvizRenderer();
                    this.renderLabel = 'Rendering Graphviz layout...';
                    this.svg = await renderGraphviz(code, engine);
                }
            } catch (e: any) {
                this.error = e?.message || 'Diagram render failed.';
            } finally {
                this.isRendering = false;
                this.renderLabel = null;
            }
        } while (this.#renderQueued);
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
        this.renderLabel = 'Generating diagram draft...';
        this.error = null;
        try {
            const result = generateHeuristicDiagram(prompt);
            await new Promise(resolve => setTimeout(resolve, 800));
            this.code = result.code;
            this.mode = result.mode;
            this.isRendering = false;
            this.renderLabel = null;
            await this.render();
        } catch (e: any) {
            this.error = "AI Generation failed: " + e.message;
        } finally {
            this.isRendering = false;
            this.renderLabel = null;
        }
    }

    restoreHistory(item: HistoryItem) {
        this.code = item.code;
        this.render();
    }

    // Collaboration
    async startCollaboration() {
        const collabService = await this.getCollabService();
        const id = await collabService.host();
        this.sessionID = id;
        this.isCollaborating = true;
        return id;
    }

    async joinCollaboration(id: string) {
        const collabService = await this.getCollabService();
        await collabService.join(id);
        this.sessionID = id;
        this.isCollaborating = true;
    }

    stopCollaboration() {
        void this.getCollabService().then((collabService) => collabService.destroy());
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
