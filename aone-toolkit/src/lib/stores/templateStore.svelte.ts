import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface CloneTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'agent' | 'skill' | 'workflow';
  data: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  defaultValue?: string;
  description?: string;
  required?: boolean;
}

export interface CloneOptions {
  data: Record<string, any>;
  variables?: Record<string, string>;
  name?: string;
  id?: string;
}

const MAX_TEMPLATES = 100;
const STORAGE_KEY = 'agent-studio-templates';

function loadFromStorage(): CloneTemplate[] {
  if (!browser) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load templates:', e);
  }
  return [];
}

function saveToStorage(templates: CloneTemplate[]) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates:', e);
  }
}

function createTemplateStore() {
  const initial = loadFromStorage();
  const { subscribe, set, update } = writable<CloneTemplate[]>(initial);

  // Auto-save on changes
  subscribe((value) => {
    saveToStorage(value);
  });

  function createTemplate(template: Omit<CloneTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const newTemplate: CloneTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    update((templates) => {
      const updated = [newTemplate, ...templates].slice(0, MAX_TEMPLATES);
      return updated;
    });

    return id;
  }

  function saveAsTemplate(
    data: Record<string, any>,
    name: string,
    type: CloneTemplate['type'],
    options?: {
      description?: string;
      variables?: TemplateVariable[];
      isPublic?: boolean;
    }
  ) {
    return createTemplate({
      name,
      type,
      data,
      description: options?.description,
      variables: options?.variables,
      isPublic: options?.isPublic,
    });
  }

  function updateTemplate(id: string, updates: Partial<CloneTemplate>) {
    update((templates) =>
      templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      )
    );
  }

  function deleteTemplate(id: string) {
    update((templates) => templates.filter((t) => t.id !== id));
  }

  function getTemplate(id: string): CloneTemplate | undefined {
    const templates = get({ subscribe });
    return templates.find((t) => t.id === id);
  }

  function getTemplatesByType(type: CloneTemplate['type']): CloneTemplate[] {
    const templates = get({ subscribe });
    return templates.filter((t) => t.type === type);
  }

  function cloneFromTemplate(
    templateId: string,
    options?: CloneOptions
  ): Record<string, any> | null {
    const template = getTemplate(templateId);
    if (!template) return null;

    let clonedData = JSON.parse(JSON.stringify(template.data));

    // Replace variables
    if (options?.variables) {
      clonedData = replaceVariables(clonedData, options.variables);
    }

    // Replace name if provided
    if (options?.name) {
      clonedData.name = options.name;
    }

    // Replace ID if provided
    if (options?.id) {
      clonedData.id = options.id;
    }

    return clonedData;
  }

  function replaceVariables(
    data: Record<string, any>,
    variables: Record<string, string>
  ): Record<string, any> {
    const jsonString = JSON.stringify(data);
    let result = jsonString;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{\\s*${key}\\s*\\}`, 'g');
      result = result.replace(regex, value);
    });

    return JSON.parse(result);
  }

  function duplicateTemplate(id: string, newName?: string): string | null {
    const template = getTemplate(id);
    if (!template) return null;

    return createTemplate({
      ...template,
      name: newName || `${template.name} (副本)`,
      id: undefined as any,
    });
  }

  function clear() {
    set([]);
  }

  function exportTemplates(ids?: string[]): string {
    const templates = get({ subscribe });
    const toExport = ids
      ? templates.filter((t) => ids.includes(t.id))
      : templates;

    return JSON.stringify(toExport, null, 2);
  }

  function importTemplates(jsonString: string): number {
    try {
      const imported = JSON.parse(jsonString) as CloneTemplate[];
      let count = 0;

      update((templates) => {
        imported.forEach((template) => {
          // Generate new ID to avoid conflicts
          const newTemplate = {
            ...template,
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          templates.push(newTemplate);
          count++;
        });

        return templates.slice(0, MAX_TEMPLATES);
      });

      return count;
    } catch (e) {
      console.error('Failed to import templates:', e);
      return 0;
    }
  }

  return {
    subscribe,
    createTemplate,
    saveAsTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    getTemplatesByType,
    cloneFromTemplate,
    duplicateTemplate,
    clear,
    exportTemplates,
    importTemplates,
  };
}

export const templateStore = createTemplateStore();
