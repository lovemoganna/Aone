<script lang="ts">
    import { promptStore } from "../lib/store.svelte";
    import type { Prompt } from "../lib/types";
    import PromptCard from "./PromptCard.svelte";
    import { FileText } from "lucide-svelte";

    let {
        prompts,
        onEdit,
        selectedIds = new Set<string>(),
        onSelectToggle,
        viewMode = "grid",
        onDeleteRequest,
        onArchive,
        onRun,
    } = $props<{
        prompts: Prompt[];
        onEdit?: (id: string) => void;
        selectedIds?: Set<string>;
        onSelectToggle?: (id: string) => void;
        viewMode?: "grid" | "list";
        onDeleteRequest?: (id: string, title: string) => void;
        onArchive?: (id: string) => void;
        onRun?: (id: string) => void;
    }>();

    function handleDelete(id: string) {
        const prompt = prompts.find((p: Prompt) => p.id === id);
        if (onDeleteRequest && prompt) {
            onDeleteRequest(id, prompt.title);
        } else if (confirm("Are you sure?")) {
            promptStore.deletePrompt(id);
        }
    }

    function handleEdit(id: string) {
        if (onEdit) onEdit(id);
    }

    function handleFavorite(id: string) {
        promptStore.toggleFavorite(id);
    }

    function handleSelect(id: string) {
        if (onSelectToggle) onSelectToggle(id);
    }

    function handleDuplicate(id: string) {
        promptStore.duplicatePrompt(id);
    }

    function handleArchive(id: string) {
        if (onArchive) onArchive(id);
    }

    function handleRun(id: string) {
        if (onRun) onRun(id);
    }
</script>

{#if prompts.length === 0}
    <div class="h-full flex flex-col items-center justify-center text-gray-400">
        <FileText size={64} class="mb-4 opacity-50" />
        <h3 class="text-lg font-medium text-gray-600 dark:text-gray-300">
            No prompts found
        </h3>
        <p>Create your first prompt to get started.</p>
    </div>
{:else}
    <div
        class="p-6 pb-20"
        class:grid={viewMode === "grid"}
        class:grid-cols-1={viewMode === "grid"}
        class:md:grid-cols-2={viewMode === "grid"}
        class:lg:grid-cols-3={viewMode === "grid"}
        class:xl:grid-cols-4={viewMode === "grid"}
        class:gap-6={viewMode === "grid"}
        class:flex={viewMode === "list"}
        class:flex-col={viewMode === "list"}
        class:gap-4={viewMode === "list"}
    >
        {#each prompts as prompt (prompt.id)}
            <PromptCard
                {prompt}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onToggleFavorite={handleFavorite}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onRun={handleRun}
                isSelected={selectedIds.has(prompt.id)}
                onSelect={handleSelect}
            />
        {/each}
    </div>
{/if}
