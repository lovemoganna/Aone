// @ts-nocheck
import { writable, get } from 'svelte/store';
import { orchestrationEngine } from './engine';
import type { OrchestrationWorkflow } from './types';

export interface WorkflowRecord {
    id: string;
    name: string;
    description: string;
    workflow: OrchestrationWorkflow;
    tags: string[];  // P2-4: 工作流标签
    createdAt: number;
    updatedAt: number;
}

// P2-4: 标签管理
export interface WorkflowTag {
    id: string;
    name: string;
    color: string;
    count: number;
}

// P2-5: 用户偏好设置
export interface WorkflowPreferences {
    gridEnabled: boolean;
    snapToGrid: boolean;
    gridSize: number;
    showMinimap: boolean;
    showRulers: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    theme: 'light' | 'dark' | 'system';
    language: string;
    defaultNodeColor: string;
    edgeType: 'bezier' | 'step' | 'straight';
}

export const DEFAULT_PREFERENCES: WorkflowPreferences = {
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 20,
    showMinimap: true,
    showRulers: true,
    autoSave: true,
    autoSaveInterval: 30000,
    theme: 'system',
    language: 'zh-CN',
    defaultNodeColor: '#3B82F6',
    edgeType: 'bezier'
};

// 编辑状态 - 用于页面刷新后恢复编辑上下文
export interface WorkflowEditState {
    workflowId: string;
    selectedNodeIds: string[];
    viewport: { x: number; y: number; zoom: number };
    openPanels: string[];
    lastModified: number;
}

function createWorkflowStore() {
    const STORAGE_KEY = 'aone_workflows_v1';
    const EDIT_STATE_KEY = 'aone_workflow_edit_state_v1';
    const TEMPLATE_KEY = 'aone_workflow_templates_v1';
    const TAGS_KEY = 'aone_workflow_tags_v1';
    const PREFERENCES_KEY = 'aone_workflow_preferences_v1';

    // P2-4: 标签存储
    function loadTags(): WorkflowTag[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(TAGS_KEY);
            return stored ? JSON.parse(stored) : getDefaultTags();
        } catch {
            return getDefaultTags();
        }
    }

    function getDefaultTags(): WorkflowTag[] {
        return [
            { id: 'project', name: '项目', color: '#3B82F6', count: 0 },
            { id: 'experiment', name: '实验', color: '#8B5CF6', count: 0 },
            { id: 'production', name: '生产', color: '#22C55E', count: 0 },
            { id: 'draft', name: '草稿', color: '#F59E0B', count: 0 },
        ];
    }

    function saveTags(tags: WorkflowTag[]) {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
        } catch (e) {
            console.error('Failed to save tags:', e);
        }
    }

    // P2-5: 用户偏好设置加载
    function loadPreferences(): WorkflowPreferences {
        if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
        try {
            const stored = localStorage.getItem(PREFERENCES_KEY);
            return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
        } catch {
            return DEFAULT_PREFERENCES;
        }
    }

    function savePreferences(prefs: WorkflowPreferences) {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
        } catch (e) {
            console.error('Failed to save preferences:', e);
        }
    }

    // Helper to load from storage
    function loadFromStorage(): WorkflowRecord[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    // Helper to save to storage with fallback compression and error protection
    function saveToStorage(workflows: WorkflowRecord[]) {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
        } catch (e: any) {
            console.warn('Direct LocalStorage save failed, attempting graceful fallback compression:', e);
            try {
                // Tier 1: Sanitize and remove heavy transient fields
                const sanitized = workflows.map(wf => ({
                    ...wf,
                    workflow: {
                        ...wf.workflow,
                    }
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            } catch (err2) {
                console.error('LocalStorage quota critical. Fallback to latest records to avoid total data loss:', err2);
                try {
                    // Tier 2: Preserve latest 8 workflows
                    const recentOnly = workflows.slice(-8);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentOnly));
                } catch (err3) {
                    console.error('Fatal: Unable to persist workflows to localStorage:', err3);
                }
            }
        }
    }

    // 编辑状态存储
    function loadEditState(): WorkflowEditState | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(EDIT_STATE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    function saveEditState(state: WorkflowEditState | null) {
        if (typeof window === 'undefined') return;
        try {
            if (state) {
                localStorage.setItem(EDIT_STATE_KEY, JSON.stringify(state));
            } else {
                localStorage.removeItem(EDIT_STATE_KEY);
            }
        } catch (e) {
            console.warn('Failed to save edit state (ignoring quota limit for transient edit state):', e);
        }
    }

    const { subscribe, set, update } = writable<WorkflowRecord[]>(loadFromStorage());

    // 编辑状态 store
    const editState = writable<WorkflowEditState | null>(loadEditState());

    // Auto-save
    subscribe(value => saveToStorage(value));

    // 编辑状态自动保存
    editState.subscribe(value => saveEditState(value));

    // 模板存储
    function loadTemplates(): WorkflowRecord[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(TEMPLATE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    // 内置示例工作流
    function getBuiltInExamples(): WorkflowRecord[] {
        const now = Date.now();
        return [
            {
                id: 'example_sequential',
                name: '顺序执行',
                description: '最简单的顺序执行流程：输入 -> 处理 -> 输出',
                workflow: {
                    id: 'example_sequential',
                    name: '顺序执行',
                    description: '最简单的顺序执行流程',
                    nodes: [
                        {
                            id: 'start_1',
                            type: 'start',
                            name: '开始',
                            position: { x: 100, y: 200 },
                            data: { label: '开始', color: '#22C55E' }
                        },
                        {
                            id: 'agent_1',
                            type: 'agent',
                            name: '处理节点',
                            position: { x: 300, y: 200 },
                            data: {
                                label: '处理',
                                color: '#3B82F6',
                                config: { agentId: '' }
                            }
                        },
                        {
                            id: 'end_1',
                            type: 'end',
                            name: '结束',
                            position: { x: 500, y: 200 },
                            data: { label: '结束', color: '#EF4444' }
                        }
                    ],
                    edges: [
                        { id: 'e1', source: 'start_1', target: 'agent_1' },
                        { id: 'e2', source: 'agent_1', target: 'end_1' }
                    ],
                    entryNodeId: 'start_1',
                    version: '1.0',
                    tags: ['示例', '入门'],
                    isBuiltIn: true
                },
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'example_parallel',
                name: '并行执行',
                description: '并行处理多个任务，最后合并结果',
                workflow: {
                    id: 'example_parallel',
                    name: '并行执行',
                    description: '并行处理多个任务',
                    nodes: [
                        {
                            id: 'start_2',
                            type: 'start',
                            name: '开始',
                            position: { x: 100, y: 200 },
                            data: { label: '开始', color: '#22C55E' }
                        },
                        {
                            id: 'parallel_1',
                            type: 'parallel',
                            name: '并行处理',
                            position: { x: 300, y: 200 },
                            data: {
                                label: '并行处理',
                                color: '#8B5CF6',
                                config: { nodeIds: ['agent_a', 'agent_b', 'agent_c'] }
                            }
                        },
                        {
                            id: 'agent_a',
                            type: 'agent',
                            name: '任务A',
                            position: { x: 500, y: 100 },
                            data: { label: '任务A', color: '#3B82F6' }
                        },
                        {
                            id: 'agent_b',
                            type: 'agent',
                            name: '任务B',
                            position: { x: 500, y: 200 },
                            data: { label: '任务B', color: '#3B82F6' }
                        },
                        {
                            id: 'agent_c',
                            type: 'agent',
                            name: '任务C',
                            position: { x: 500, y: 300 },
                            data: { label: '任务C', color: '#3B82F6' }
                        },
                        {
                            id: 'end_2',
                            type: 'end',
                            name: '结束',
                            position: { x: 700, y: 200 },
                            data: { label: '结束', color: '#EF4444' }
                        }
                    ],
                    edges: [
                        { id: 'e3', source: 'start_2', target: 'parallel_1' },
                        { id: 'e4', source: 'parallel_1', target: 'agent_a' },
                        { id: 'e5', source: 'parallel_1', target: 'agent_b' },
                        { id: 'e6', source: 'parallel_1', target: 'agent_c' },
                        { id: 'e7', source: 'agent_a', target: 'end_2' },
                        { id: 'e8', source: 'agent_b', target: 'end_2' },
                        { id: 'e9', source: 'agent_c', target: 'end_2' }
                    ],
                    entryNodeId: 'start_2',
                    version: '1.0',
                    tags: ['示例', '并行'],
                    isBuiltIn: true
                },
                createdAt: now,
                updatedAt: now
            },
            {
                id: 'example_condition',
                name: '条件分支',
                description: '根据条件选择不同的处理路径',
                workflow: {
                    id: 'example_condition',
                    name: '条件分支',
                    description: '根据条件选择不同路径',
                    nodes: [
                        {
                            id: 'start_3',
                            type: 'start',
                            name: '开始',
                            position: { x: 100, y: 200 },
                            data: { label: '开始', color: '#22C55E' }
                        },
                        {
                            id: 'condition_1',
                            type: 'condition',
                            name: '判断条件',
                            position: { x: 300, y: 200 },
                            data: {
                                label: '判断',
                                color: '#F59E0B',
                                condition: { variable: 'input', operator: 'contains', value: '?' }
                            }
                        },
                        {
                            id: 'agent_yes',
                            type: 'agent',
                            name: '是',
                            position: { x: 500, y: 100 },
                            data: { label: '满足条件', color: '#22C55E' }
                        },
                        {
                            id: 'agent_no',
                            type: 'agent',
                            name: '否',
                            position: { x: 500, y: 300 },
                            data: { label: '不满足条件', color: '#EF4444' }
                        },
                        {
                            id: 'end_3',
                            type: 'end',
                            name: '结束',
                            position: { x: 700, y: 200 },
                            data: { label: '结束', color: '#EF4444' }
                        }
                    ],
                    edges: [
                        { id: 'e10', source: 'start_3', target: 'condition_1' },
                        { id: 'e11', source: 'condition_1', target: 'agent_yes', label: '是' },
                        { id: 'e12', source: 'condition_1', target: 'agent_no', label: '否' },
                        { id: 'e13', source: 'agent_yes', target: 'end_3' },
                        { id: 'e14', source: 'agent_no', target: 'end_3' }
                    ],
                    entryNodeId: 'start_3',
                    version: '1.0',
                    tags: ['示例', '条件'],
                    isBuiltIn: true
                },
                createdAt: now,
                updatedAt: now
            }
        ];
    }

    function saveTemplates(templates: WorkflowRecord[]) {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
        } catch (e) {
            console.error('Failed to save templates:', e);
        }
    }

    const { subscribe: templateSubscribe, set: templateSet, update: templateUpdate } = writable<WorkflowRecord[]>(loadTemplates());
    templateSubscribe(value => saveTemplates(value));

    // P2-4: 标签 store
    const { subscribe: tagsSubscribe, set: tagsSet, update: tagsUpdate } = writable<WorkflowTag[]>(loadTags());
    tagsSubscribe(value => saveTags(value));

    // P2-5: 用户偏好设置 store
    const { subscribe: prefsSubscribe, set: prefsSet, update: prefsUpdate } = writable<WorkflowPreferences>(loadPreferences());
    prefsSubscribe(value => savePreferences(value));

    // 更新标签计数
    function updateTagCounts() {
        const workflows = get({ subscribe });
        const counts = new Map<string, number>();

        workflows.forEach(w => {
            (w.tags || []).forEach(tag => {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            });
        });

        tagsUpdate(tags =>
            tags.map(t => ({
                ...t,
                count: counts.get(t.id) || 0
            }))
        );
    }

    // Execution State
    const activeExecution = writable<{
        workflowId: string | null;
        isRunning: boolean;
        currentNodeId: string | null;
        logs: any[];
        error: string | null;
    }>({
        workflowId: null,
        isRunning: false,
        currentNodeId: null,
        logs: [],
        error: null
    });

    const engine = orchestrationEngine;

    return {
        subscribe,
        activeExecution,
        editState,

        // 保存编辑状态
        saveEditState: (state: Omit<WorkflowEditState, 'lastModified'>) => {
            editState.set({
                ...state,
                lastModified: Date.now()
            });
        },

        // 清除编辑状态
        clearEditState: () => {
            editState.set(null);
        },

        // 获取编辑状态
        getEditState: (): WorkflowEditState | null => {
            return get(editState);
        },

        // CRUD
        saveWorkflow: (data: { id?: string, name: string; description: string; workflow: OrchestrationWorkflow, tags?: string[] }) => {
            const now = Date.now();
            update(workflows => {
                if (data.id) {
                    // Update existing
                    return workflows.map(w => w.id === data.id ? { ...w, ...data, updatedAt: now } : w);
                } else {
                    // Create new
                    const newWorkflow: WorkflowRecord = {
                        id: crypto.randomUUID(),
                        name: data.name,
                        description: data.description,
                        workflow: data.workflow,
                        tags: data.tags || [],
                        createdAt: now,
                        updatedAt: now
                    };
                    return [...workflows, newWorkflow];
                }
            });
            updateTagCounts();
        },

        deleteWorkflow: (id: string) => {
            update(workflows => workflows.filter(w => w.id !== id));
            updateTagCounts();
        },

        // P1 #9: Clone workflow
        cloneWorkflow: (id: string): WorkflowRecord | undefined => {
            const original = get({ subscribe }).find(w => w.id === id);
            if (!original) return undefined;

            const now = Date.now();
            const clone: WorkflowRecord = {
                ...JSON.parse(JSON.stringify(original)),
                id: crypto.randomUUID(),
                name: `${original.name} - 副本`,
                workflow: {
                    ...JSON.parse(JSON.stringify(original.workflow)),
                    id: crypto.randomUUID(),
                },
                tags: [...(original.tags || [])],
                createdAt: now,
                updatedAt: now,
            };
            update(workflows => [...workflows, clone]);
            updateTagCounts();
            return clone;
        },

        getWorkflow: (id: string): WorkflowRecord | undefined => {
            return get({ subscribe }).find(w => w.id === id);
        },

        // ====== P2-4: 标签管理 ======
        tagsSubscribe,

        // 获取所有标签
        getAllTags: (): WorkflowTag[] => {
            return get(tagsSubscribe);
        },

        // 添加新标签
        addTag: (name: string, color: string) => {
            const newTag: WorkflowTag = {
                id: `tag_${Date.now()}`,
                name,
                color,
                count: 0
            };
            tagsUpdate(tags => [...tags, newTag]);
            return newTag;
        },

        // 删除标签
        deleteTag: (tagId: string) => {
            // 从所有工作流中移除此标签
            update(workflows =>
                workflows.map(w => ({
                    ...w,
                    tags: (w.tags || []).filter(t => t !== tagId)
                }))
            );
            // 删除标签
            tagsUpdate(tags => tags.filter(t => t.id !== tagId));
        },

        // 更新工作流标签
        updateWorkflowTags: (workflowId: string, tags: string[]) => {
            update(workflows =>
                workflows.map(w => w.id === workflowId ? { ...w, tags } : w)
            );
            updateTagCounts();
        },

        // ====== P2-5: 用户偏好设置 ======
        prefsSubscribe,

        // 获取偏好设置
        getPreferences: (): WorkflowPreferences => {
            return get(prefsSubscribe);
        },

        // 更新偏好设置
        updatePreferences: (prefs: Partial<WorkflowPreferences>) => {
            prefsUpdate(current => ({ ...current, ...prefs }));
        },

        // 重置为默认设置
        resetPreferences: () => {
            prefsSet(DEFAULT_PREFERENCES);
        },

        // ====== 模板管理 ======
        templateSubscribe,

        // 保存为模板
        saveAsTemplate: (data: { name: string; description: string; workflow: OrchestrationWorkflow }) => {
            const now = Date.now();
            const template: WorkflowRecord = {
                id: `template_${crypto.randomUUID()}`,
                name: data.name,
                description: data.description,
                workflow: {
                    ...data.workflow,
                    id: `template_${crypto.randomUUID()}`,
                    isBuiltIn: false
                },
                createdAt: now,
                updatedAt: now
            };
            templateUpdate(templates => [...templates, template]);
            return template;
        },

        // 删除模板
        deleteTemplate: (id: string) => {
            templateUpdate(templates => templates.filter(t => t.id !== id));
        },

        // 获取所有模板
        getAllTemplates: (): WorkflowRecord[] => {
            return get(templateSubscribe);
        },

        // 从模板克隆
        cloneFromTemplate: (templateId: string): WorkflowRecord | undefined => {
            const template = get(templateSubscribe).find(t => t.id === templateId);
            if (!template) return undefined;

            const now = Date.now();
            const clone: WorkflowRecord = {
                ...template,
                id: crypto.randomUUID(),
                name: `${template.name} (副本)`,
                workflow: {
                    ...template.workflow,
                    id: crypto.randomUUID()
                },
                createdAt: now,
                updatedAt: now
            };
            update(workflows => [...workflows, clone]);
            return clone;
        },

        // P3-1: 获取内置示例
        getBuiltInExamples: (): WorkflowRecord[] => {
            return getBuiltInExamples();
        },

        // P3-1: 从示例克隆
        cloneFromExample: (exampleId: string): WorkflowRecord | undefined => {
            const example = getBuiltInExamples().find(e => e.id === exampleId);
            if (!example) return undefined;

            const now = Date.now();
            const clone: WorkflowRecord = {
                ...example,
                id: crypto.randomUUID(),
                name: `${example.name} (副本)`,
                workflow: {
                    ...example.workflow,
                    id: crypto.randomUUID(),
                    isBuiltIn: false
                },
                createdAt: now,
                updatedAt: now
            };
            update(workflows => [...workflows, clone]);
            return clone;
        },

        // Execution
        executeWorkflow: async (id: string, input: string) => {
            const record = get({ subscribe }).find(w => w.id === id);
            if (!record) return;

            activeExecution.set({
                workflowId: id,
                isRunning: true,
                currentNodeId: record.workflow.entryNodeId,
                logs: [],
                error: null
            });

            try {
                // Real implementation would hook into engine events
                const context = {
                    workflowId: id,
                    sessionId: crypto.randomUUID(),
                    userInput: input,
                    variables: {},
                    history: []
                };

                const result = await engine.execute(
                    record.workflow,
                    context,
                    (log) => {
                        activeExecution.update(s => ({
                            ...s,
                            currentNodeId: log.nodeId,
                            logs: [...s.logs, { type: 'node', content: log }]
                        }));
                    }
                );

                activeExecution.update(s => ({
                    ...s,
                    isRunning: false,
                    currentNodeId: null,
                    logs: [...s.logs, { type: 'result', content: result }]
                }));
            } catch (e: any) {
                activeExecution.update(s => ({
                    ...s,
                    isRunning: false,
                    error: e.message
                }));
            }
        }
    };
}

export const workflowStore = createWorkflowStore();
