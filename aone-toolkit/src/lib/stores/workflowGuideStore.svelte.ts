import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface WorkflowExample {
  id: string;
  name: string;
  description: string;
  category: 'getting-started' | 'data-processing' | 'automation' | 'ai-workflow' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Workflow structure
  nodes: WorkflowNodeConfig[];
  connections: WorkflowConnection[];
  
  // Metadata
  tags: string[];
  author?: string;
  isBuiltIn: boolean;
  usageCount: number;
  createdAt?: number;
}

export interface WorkflowNodeConfig {
  id: string;
  type: 'agent' | 'skill' | 'condition' | 'parallel' | 'input' | 'output';
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Built-in workflow examples
export const BUILT_IN_EXAMPLES: WorkflowExample[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: '最简单的 Agent 调用示例，了解工作流基本概念',
    category: 'getting-started',
    difficulty: 'beginner',
    tags: ['入门', '基础'],
    isBuiltIn: true,
    usageCount: 0,
    nodes: [
      { id: 'input', type: 'input', position: { x: 100, y: 200 }, data: { label: '用户输入' }},
      { id: 'agent', type: 'agent', position: { x: 300, y: 200 }, data: { label: 'Assistant Agent', personaId: 'assistant' }},
      { id: 'output', type: 'output', position: { x: 500, y: 200 }, data: { label: '返回结果' }},
    ],
    connections: [
      { id: 'c1', source: 'input', target: 'agent' },
      { id: 'c2', source: 'agent', target: 'output' },
    ],
  },
  {
    id: 'conditional-branch',
    name: '条件分支',
    description: '根据用户输入内容选择不同的处理路径',
    category: 'getting-started',
    difficulty: 'beginner',
    tags: ['条件', '分支'],
    isBuiltIn: true,
    usageCount: 0,
    nodes: [
      { id: 'input', type: 'input', position: { x: 100, y: 200 }, data: { label: '用户输入' }},
      { id: 'condition', type: 'condition', position: { x: 300, y: 200 }, data: { label: '类型判断', condition: '${input.type}' }},
      { id: 'agent-a', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'A路径 Agent' }},
      { id: 'agent-b', type: 'agent', position: { x: 500, y: 300 }, data: { label: 'B路径 Agent' }},
      { id: 'output', type: 'output', position: { x: 700, y: 200 }, data: { label: '合并输出' }},
    ],
    connections: [
      { id: 'c1', source: 'input', target: 'condition' },
      { id: 'c2', source: 'condition', target: 'agent-a', sourceHandle: 'true' },
      { id: 'c3', source: 'condition', target: 'agent-b', sourceHandle: 'false' },
      { id: 'c4', source: 'agent-a', target: 'output' },
      { id: 'c5', source: 'agent-b', target: 'output' },
    ],
  },
  {
    id: 'parallel-processing',
    name: '并行处理',
    description: '同时调用多个 Agent 处理不同任务，提升效率',
    category: 'automation',
    difficulty: 'intermediate',
    tags: ['并行', '效率'],
    isBuiltIn: true,
    usageCount: 0,
    nodes: [
      { id: 'input', type: 'input', position: { x: 100, y: 200 }, data: { label: '任务输入' }},
      { id: 'parallel', type: 'parallel', position: { x: 250, y: 200 }, data: { label: '并行节点' }},
      { id: 'agent-1', type: 'agent', position: { x: 450, y: 100 }, data: { label: 'Agent 1' }},
      { id: 'agent-2', type: 'agent', position: { x: 450, y: 200 }, data: { label: 'Agent 2' }},
      { id: 'agent-3', type: 'agent', position: { x: 450, y: 300 }, data: { label: 'Agent 3' }},
      { id: 'output', type: 'output', position: { x: 650, y: 200 }, data: { label: '汇总结果' }},
    ],
    connections: [
      { id: 'c1', source: 'input', target: 'parallel' },
      { id: 'c2', source: 'parallel', target: 'agent-1' },
      { id: 'c3', source: 'parallel', target: 'agent-2' },
      { id: 'c4', source: 'parallel', target: 'agent-3' },
      { id: 'c5', source: 'agent-1', target: 'output' },
      { id: 'c6', source: 'agent-2', target: 'output' },
      { id: 'c7', source: 'agent-3', target: 'output' },
    ],
  },
  {
    id: 'ai-analysis-pipeline',
    name: 'AI 分析流水线',
    description: '完整的 AI 数据分析流程：输入 → 分析 → 决策 → 输出',
    category: 'ai-workflow',
    difficulty: 'advanced',
    tags: ['AI', '分析', '流水线'],
    isBuiltIn: true,
    usageCount: 0,
    nodes: [
      { id: 'input', type: 'input', position: { x: 50, y: 250 }, data: { label: '数据输入' }},
      { id: 'skill-analyze', type: 'skill', position: { x: 200, y: 250 }, data: { label: '数据分析 Skill', skillId: 'data_analysis' }},
      { id: 'skill-visualize', type: 'skill', position: { x: 350, y: 150 }, data: { label: '可视化 Skill', skillId: 'visualization' }},
      { id: 'skill-decide', type: 'skill', position: { x: 350, y: 350 }, data: { label: '决策 Skill', skillId: 'decision' }},
      { id: 'condition', type: 'condition', position: { x: 500, y: 250 }, data: { label: '是否通过' }},
      { id: 'agent-review', type: 'agent', position: { x: 650, y: 150 }, data: { label: '人工审核' }},
      { id: 'output', type: 'output', position: { x: 650, y: 350 }, data: { label: '输出结果' }},
    ],
    connections: [
      { id: 'c1', source: 'input', target: 'skill-analyze' },
      { id: 'c2', source: 'skill-analyze', target: 'skill-visualize' },
      { id: 'c3', source: 'skill-analyze', target: 'skill-decide' },
      { id: 'c4', source: 'skill-visualize', target: 'condition' },
      { id: 'c5', source: 'skill-decide', target: 'condition' },
      { id: 'c6', source: 'condition', target: 'agent-review', sourceHandle: 'false' },
      { id: 'c7', source: 'condition', target: 'output', sourceHandle: 'true' },
    ],
  },
  {
    id: 'customer-service-bot',
    name: '客服机器人',
    description: '智能客服流程：理解意图 → 分类处理 → 回复或转人工',
    category: 'ai-workflow',
    difficulty: 'intermediate',
    tags: ['客服', '机器人', '分类'],
    isBuiltIn: true,
    usageCount: 0,
    nodes: [
      { id: 'input', type: 'input', position: { x: 100, y: 250 }, data: { label: '用户消息' }},
      { id: 'skill-intent', type: 'skill', position: { x: 250, y: 250 }, data: { label: '意图识别', skillId: 'intent_classification' }},
      { id: 'condition', type: 'condition', position: { x: 400, y: 250 }, data: { label: '是否可处理' }},
      { id: 'agent-auto', type: 'agent', position: { x: 550, y: 150 }, data: { label: '自动回复' }},
      { id: 'agent-escalate', type: 'agent', position: { x: 550, y: 350 }, data: { label: '转人工' }},
      { id: 'output', type: 'output', position: { x: 700, y: 250 }, data: { label: '回复用户' }},
    ],
    connections: [
      { id: 'c1', source: 'input', target: 'skill-intent' },
      { id: 'c2', source: 'skill-intent', target: 'condition' },
      { id: 'c3', source: 'condition', target: 'agent-auto', sourceHandle: 'true' },
      { id: 'c4', source: 'condition', target: 'agent-escalate', sourceHandle: 'false' },
      { id: 'c5', source: 'agent-auto', target: 'output' },
      { id: 'c6', source: 'agent-escalate', target: 'output' },
    ],
  },
];

const STORAGE_KEY = 'agent-studio-workflow-examples';

function loadFromStorage(): WorkflowExample[] {
  if (!browser) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load workflow examples:', e);
  }
  return [];
}

function saveToStorage(examples: WorkflowExample[]) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
  } catch (e) {
    console.error('Failed to save workflow examples:', e);
  }
}

function createWorkflowGuideStore() {
  const initial = loadFromStorage();
  const { subscribe, update, set } = writable<WorkflowExample[]>(initial);

  subscribe((value) => {
    saveToStorage(value);
  });

  function getExamplesByCategory(category: WorkflowExample['category']): WorkflowExample[] {
    const examples = get({ subscribe });
    return examples.filter(e => e.category === category);
  }

  function getExamplesByDifficulty(difficulty: WorkflowExample['difficulty']): WorkflowExample[] {
    const examples = get({ subscribe });
    return examples.filter(e => e.difficulty === difficulty);
  }

  function getExampleById(id: string): WorkflowExample | undefined {
    const examples = get({ subscribe });
    return examples.find(e => e.id === id);
  }

  function addExample(example: Omit<WorkflowExample, 'id' | 'usageCount' | 'createdAt' | 'isBuiltIn'>) {
    const newExample: WorkflowExample = {
      ...example,
      id: `example-${Date.now()}`,
      usageCount: 0,
      createdAt: Date.now(),
      isBuiltIn: false,
    };

    update((examples) => [...examples, newExample]);
    return newExample.id;
  }

  function incrementUsage(id: string) {
    update((examples) =>
      examples.map(e =>
        e.id === id ? { ...e, usageCount: e.usageCount + 1 } : e
      )
    );
  }

  function deleteExample(id: string) {
    update((examples) => {
      const example = examples.find(e => e.id === id);
      if (example?.isBuiltIn) return examples; // Can't delete built-in
      return examples.filter(e => e.id !== id);
    });
  }

  function searchExamples(query: string): WorkflowExample[] {
    const examples = get({ subscribe });
    const lowerQuery = query.toLowerCase();
    return examples.filter(e =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery) ||
      e.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  function getRecommended(): WorkflowExample[] {
    const examples = get({ subscribe });
    return [...examples]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  }

  return {
    subscribe,
    set,
    getExamplesByCategory,
    getExamplesByDifficulty,
    getExampleById,
    addExample,
    incrementUsage,
    deleteExample,
    searchExamples,
    getRecommended,
  };
}

export const workflowGuideStore = createWorkflowGuideStore();
