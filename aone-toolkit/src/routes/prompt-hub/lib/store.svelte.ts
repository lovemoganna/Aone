import { type Prompt, type Tag, type Collection, type PromptVersion, type TestCase } from './types';

class PromptStore {
    prompts = $state<Prompt[]>([]);
    tags = $state<Tag[]>([]);
    collections = $state<Collection[]>([]);
    versions = $state<PromptVersion[]>([]);

    searchTerm = $state('');
    activeFilter = $state<'all' | 'favorites' | 'untagged' | 'archived'>('all');
    activeStatusFilter = $state<string | null>(null); // 'draft' | 'testing' | 'published' | 'deprecated'
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
            if (term) {
                const matchesSearch =
                    p.title.toLowerCase().includes(term) ||
                    p.content.toLowerCase().includes(term) ||
                    p.description?.toLowerCase().includes(term) ||
                    p.scene?.toLowerCase().includes(term) ||
                    p.taskType?.toLowerCase().includes(term) ||
                    p.tags.some(t => {
                        const tag = this.tags.find(tg => tg.id === t);
                        return tag?.name.toLowerCase().includes(term);
                    }) ||
                    p.variableDefs?.some(v =>
                        v.name.toLowerCase().includes(term) ||
                        v.description.toLowerCase().includes(term)
                    );
                if (!matchesSearch) return false;
            }

            if (this.activeFilter === 'favorites' && !p.favorite) return false;
            if (this.activeFilter === 'untagged' && (p.tags.length > 0 || !!p.collectionId)) return false;

            if (this.activeStatusFilter) {
                const status = p.status || 'draft';
                if (status !== this.activeStatusFilter) return false;
            }

            if (this.activeTagId) {
                if (!p.tags.includes(this.activeTagId)) return false;
            }

            if (this.activeCollectionId) {
                if (p.collectionId !== this.activeCollectionId) return false;
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
            { id: 'writing', name: '写作', parentId: null, level: 0 },
            { id: 'dev', name: '开发', parentId: null, level: 0 },
            { id: 'ops', name: '运营', parentId: null, level: 0 },
        ];
        this.collections = [
            { id: 'c1', name: '常用 Prompt', createdAt: Date.now() }
        ];
        this.prompts = [
            {
                id: 'p1',
                title: '邮件润色助手',
                content: '请将以下邮件内容润色，使其更加专业正式，保留原意，不超过 {{max_words}} 字。\n\n原邮件：\n{{email_content}}',
                description: '将草稿邮件润色为专业正式风格，适用于商务沟通场景。',
                tags: ['writing'],
                collectionId: 'c1',
                scene: '商务沟通',
                taskType: '写作',
                targetModel: 'GPT-4o',
                status: 'published',
                variableDefs: [
                    { name: 'email_content', description: '待润色的原始邮件内容', required: true, exampleValue: '你好，关于上次讨论的项目...', inputType: 'textarea' },
                    { name: 'max_words', description: '润色后的最大字数', required: false, defaultValue: '300', exampleValue: '300', inputType: 'number' },
                ],
                outputFormat: '直接输出润色后的邮件正文，不需要额外说明。',
                testCases: [
                    {
                        id: 'tc1',
                        label: '基础测试',
                        inputs: { email_content: '你好，关于上次说的项目，我们需要尽快确认下时间。', max_words: '150' },
                        expectedOutput: '包含正式问候、明确的时间协调请求、专业结尾',
                        passed: true,
                        score: 4,
                    }
                ],
                favorite: true,
                createdAt: Date.now() - 86400000 * 3,
                updatedAt: Date.now() - 86400000,
                usageCount: 12,
            },
            {
                id: 'p2',
                title: '代码 Review 清单',
                content: '你是一名资深工程师，请对以下 {{language}} 代码进行 Code Review，重点关注：\n1. 可读性和命名规范\n2. 潜在的 Bug 或边界条件\n3. 性能问题\n4. 安全风险\n\n代码：\n```{{language}}\n{{code}}\n```\n\n请按优先级列出问题，并给出改进建议。',
                description: '对指定代码进行系统性 Code Review，输出优先级排序的问题清单。',
                tags: ['dev'],
                scene: '代码审查',
                taskType: '编程',
                targetModel: 'Claude 3.5 Sonnet',
                status: 'testing',
                variableDefs: [
                    { name: 'language', description: '编程语言', required: true, defaultValue: 'TypeScript', exampleValue: 'TypeScript', inputType: 'text' },
                    { name: 'code', description: '待 Review 的代码', required: true, exampleValue: 'function add(a, b) { return a + b }', inputType: 'textarea' },
                ],
                outputFormat: '按"高/中/低"优先级分组，每条问题包含：位置、问题说明、改进建议。',
                testCases: [],
                favorite: false,
                createdAt: Date.now() - 86400000 * 7,
                updatedAt: Date.now() - 86400000 * 2,
                usageCount: 5,
            },
            {
                id: 'p3',
                title: '产品文案生成',
                content: '请为以下产品生成一段吸引用户的产品介绍文案。\n\n产品名称：{{product_name}}\n核心卖点：{{key_features}}\n目标用户：{{target_audience}}\n风格要求：{{tone}}\n\n文案长度控制在 150 字以内。',
                description: '根据产品信息生成营销文案，风格可调整。',
                tags: ['writing', 'ops'],
                scene: '营销推广',
                taskType: '写作',
                targetModel: '通用',
                status: 'draft',
                variableDefs: [
                    { name: 'product_name', description: '产品名称', required: true, exampleValue: 'Aone Toolkit', inputType: 'text' },
                    { name: 'key_features', description: '核心卖点，逗号分隔', required: true, exampleValue: '多工具合一、开箱即用、本地运行', inputType: 'textarea' },
                    { name: 'target_audience', description: '目标用户群体', required: true, exampleValue: '开发者和产品经理', inputType: 'text' },
                    { name: 'tone', description: '文案风格', required: false, defaultValue: '专业简洁', options: ['专业简洁', '活泼有趣', '权威严肃', '温暖亲切'], inputType: 'select' },
                ],
                outputFormat: '直接输出文案正文，不超过 150 字。',
                testCases: [],
                favorite: false,
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now(),
                usageCount: 0,
            }
        ];
        this.versions = [];
        this.save();
    }

    // ——— 版本号生成 ———
    generateVersionNumber(promptId: string): string {
        const existing = this.getVersions(promptId);
        if (existing.length === 0) return 'v1.0';
        const last = existing[0].versionNumber || 'v1.0';
        const match = last.match(/v(\d+)\.(\d+)/);
        if (match) {
            return `v${match[1]}.${parseInt(match[2]) + 1}`;
        }
        return `v${existing.length + 1}.0`;
    }

    // ——— Prompt CRUD ———
    addPrompt(prompt: Prompt) {
        this.prompts.push(prompt);
        this.save();
    }

    updatePrompt(id: string, updates: Partial<Prompt>, createVersion = false, changeNote?: string) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            if (createVersion) {
                const original = this.prompts[index];
                this.versions.push({
                    versionId: crypto.randomUUID(),
                    promptId: id,
                    versionNumber: this.generateVersionNumber(id),
                    content: original.content,
                    timestamp: Date.now(),
                    title: original.title,
                    description: original.description,
                    changeNote: changeNote || '手动保存',
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
                title: `${original.title}（副本）`,
                status: 'draft',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                usageCount: 0,
                testCases: [],
            };
            this.prompts.push(duplicate);
            this.save();
        }
    }

    // ——— TestCase CRUD ———
    addTestCase(promptId: string, testCase: TestCase) {
        const p = this.prompts.find(p => p.id === promptId);
        if (p) {
            const currentCases = p.testCases ? [...p.testCases] : [];
            this.updatePrompt(promptId, { testCases: [testCase, ...currentCases] });
        }
    }

    updateTestCase(promptId: string, testCaseId: string, updates: Partial<TestCase>) {
        const p = this.prompts.find(p => p.id === promptId);
        if (p && p.testCases) {
            const updated = p.testCases.map(tc => tc.id === testCaseId ? { ...tc, ...updates } : tc);
            this.updatePrompt(promptId, { testCases: updated });
        }
    }

    deleteTestCase(promptId: string, testCaseId: string) {
        const p = this.prompts.find(p => p.id === promptId);
        if (p && p.testCases) {
            const filtered = p.testCases.filter(tc => tc.id !== testCaseId);
            this.updatePrompt(promptId, { testCases: filtered });
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

    // ——— Collection CRUD ———
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
        this.prompts.forEach(p => {
            if (p.collectionId === id) {
                this.updatePrompt(p.id, { collectionId: undefined });
            }
        });
        this.save();
    }

    // ——— 版本管理 ———
    getVersions(promptId: string) {
        return this.versions
            .filter(v => v.promptId === promptId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    restoreVersion(versionId: string, changeNote?: string) {
        const v = this.versions.find(v => v.versionId === versionId);
        if (v) {
            this.updatePrompt(v.promptId, { content: v.content, title: v.title }, true, changeNote || `回滚至 ${v.versionNumber || '历史版本'}`);
        }
    }

    // ——— 批量操作 ———
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

    // ——— 标签 CRUD ———
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
        const toDelete = new Set<string>();
        const collect = (tid: string) => {
            toDelete.add(tid);
            this.tags.filter(t => t.parentId === tid).forEach(t => collect(t.id));
        };
        collect(id);

        this.tags = this.tags.filter(t => !toDelete.has(t.id));
        this.prompts = this.prompts.map(p => ({
            ...p,
            tags: p.tags.filter(t => !toDelete.has(t))
        }));
        this.save();
    }

    // ——— 数据管理 ———
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
            if (!Array.isArray(data.prompts)) throw new Error("格式无效：缺少 prompts 数组");

            if (mode === 'replace') {
                this.prompts = data.prompts || [];
                this.tags = data.tags || [];
                this.collections = data.collections || [];
                this.versions = data.versions || [];
            } else {
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
