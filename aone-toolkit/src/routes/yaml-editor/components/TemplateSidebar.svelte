<script lang="ts">
    import { Button, Input } from "$lib/components/ui";
    import TemplateModal from "./TemplateModal.svelte";

    interface Template {
        name: string;
        content: string;
        isCustom: boolean;
    }

    interface Props {
        onInsert: (content: string) => void;
        currentContent: string;
    }

    let { onInsert, currentContent }: Props = $props();

    let searchTerm = $state("");

    // Modal State
    let modalOpen = $state(false);
    let editingTemplate = $state<Template | null>(null);

    // Default templates
    const defaultTemplates: Template[] = [
        {
            name: "Kubernetes Pod",
            isCustom: false,
            content: `apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: my-container
    image: nginx:latest
    ports:
    - containerPort: 80`,
        },
        {
            name: "GitHub Action",
            isCustom: false,
            content: `name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Run a one-line script
      run: echo Hello, world!`,
        },
        {
            name: "Docker Compose",
            isCustom: false,
            content: `version: '3'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
  db:
    image: postgres:latest
    environment:
      POSTGRES_PASSWORD: example`,
        },
    ];

    let customTemplates = $state<Template[]>([]);

    $effect(() => {
        const saved = localStorage.getItem("yamlTemplates");
        if (saved) {
            try {
                customTemplates = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to load templates", e);
            }
        }
    });

    let filteredTemplates = $derived(
        [...defaultTemplates, ...customTemplates].filter((t) =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    // Save templates helper
    function saveTemplates() {
        localStorage.setItem("yamlTemplates", JSON.stringify(customTemplates));
    }

    function openAddModal() {
        editingTemplate = null;
        modalOpen = true;
    }

    function openEditModal(template: Template) {
        editingTemplate = template;
        modalOpen = true;
    }

    function handleSaveTemplate(name: string, content: string) {
        if (editingTemplate) {
            // Edit existing
            // Since we can't easily mutate object in array without svelte reactivity tracking deeply,
            // let's map over array.
            customTemplates = customTemplates.map((t) =>
                t === editingTemplate ? { ...t, name, content } : t,
            );
        } else {
            // Add new
            const newTemplate: Template = {
                name,
                content,
                isCustom: true,
            };
            customTemplates = [...customTemplates, newTemplate];
        }
        saveTemplates();
    }

    function deleteCustomTemplate(t: Template) {
        if (confirm(`Delete template ${t.name}?`)) {
            customTemplates = customTemplates.filter((ct) => ct !== t);
            saveTemplates();
        }
    }

    // Quick Save Current
    function saveCurrentAsTemplate() {
        if (!currentContent || currentContent.trim() === "") {
            return alert("Editor is empty");
        }
        // Prefill modal with current content
        editingTemplate = { name: "", content: currentContent, isCustom: true };
        modalOpen = true;
    }
</script>

<div
    class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64"
>
    <div
        class="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
    >
        <h3 class="font-medium text-slate-700 dark:text-slate-200">
            Templates
        </h3>
        <div class="flex gap-1">
            <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                onclick={saveCurrentAsTemplate}
                title="Save current as template"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-save"
                    ><path
                        d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                    /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg
                >
            </Button>
            <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                onclick={openAddModal}
                title="Add new template"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-plus"
                    ><path d="M5 12h14" /><path d="M12 5v14" /></svg
                >
            </Button>
        </div>
    </div>

    <div class="p-2">
        <Input placeholder="Search..." bind:value={searchTerm} />
    </div>

    <div class="flex-1 overflow-auto p-2 space-y-4">
        <div>
            <div
                class="text-xs font-semibold text-slate-500 uppercase mb-2 px-2"
            >
                Default
            </div>
            <div class="space-y-1">
                {#each defaultTemplates.filter((t) => t.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) as template}
                    <button
                        class="w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        onclick={() => onInsert(template.content)}
                    >
                        {template.name}
                    </button>
                {/each}
            </div>
        </div>

        <div>
            <div
                class="text-xs font-semibold text-slate-500 uppercase mb-2 px-2"
            >
                Custom
            </div>
            <div class="space-y-1">
                {#each customTemplates.filter((t) => t.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) as template}
                    <div
                        class="group flex items-center justify-between w-full px-3 py-2 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <button
                            class="flex-1 text-left text-slate-700 dark:text-slate-300 truncate mr-2"
                            onclick={() => onInsert(template.content)}
                            title="Insert Template"
                        >
                            {template.name}
                        </button>
                        <div
                            class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                class="p-1 text-slate-400 hover:text-primary-500"
                                onclick={() => openEditModal(template)}
                                aria-label="Edit template"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-pencil"
                                    ><path
                                        d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                                    /><path d="m15 5 4 4" /></svg
                                >
                            </button>
                            <button
                                class="p-1 text-slate-400 hover:text-red-500"
                                onclick={() => deleteCustomTemplate(template)}
                                aria-label="Delete template"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-trash-2"
                                    ><path d="M3 6h18" /><path
                                        d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                    /><path
                                        d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                    /><line
                                        x1="10"
                                        x2="10"
                                        y1="11"
                                        y2="17"
                                    /><line
                                        x1="14"
                                        x2="14"
                                        y1="11"
                                        y2="17"
                                    /></svg
                                >
                            </button>
                        </div>
                    </div>
                {/each}
                {#if customTemplates.length === 0}
                    <div class="text-xs text-slate-400 italic px-3">
                        No custom templates
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<TemplateModal
    open={modalOpen}
    initialName={editingTemplate?.name || ""}
    initialContent={editingTemplate?.content || ""}
    onSave={handleSaveTemplate}
    onClose={() => (modalOpen = false)}
/>
