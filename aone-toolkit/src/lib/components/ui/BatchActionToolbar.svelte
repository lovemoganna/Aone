<script lang="ts">
  import { CheckSquare, Square, Trash2, Tag, FolderOutput, MoreHorizontal } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { selectionStore } from '$lib/stores/selectionStore.svelte';

  interface Props {
    onDelete?: (ids: string[]) => void;
    onMove?: (ids: string[]) => void;
    onTag?: (ids: string[]) => void;
    onExport?: (ids: string[]) => void;
  }

  let { onDelete, onMove, onTag, onExport }: Props = $props();

  let selectedCount = $derived($selectionStore.filter(item => item.selected).length);
  let totalCount = $derived($selectionStore.length);
  let allSelected = $derived($selectionStore.length > 0 && $selectionStore.every(item => item.selected));

  function handleSelectAll() {
    if (allSelected) {
      selectionStore.deselectAll();
    } else {
      selectionStore.selectAll();
    }
  }

  function handleDelete() {
    const ids = selectionStore.getSelected().map(item => item.id);
    onDelete?.(ids);
  }

  function handleMove() {
    const ids = selectionStore.getSelected().map(item => item.id);
    onMove?.(ids);
  }

  function handleTag() {
    const ids = selectionStore.getSelected().map(item => item.id);
    onTag?.(ids);
  }
</script>

{#if selectedCount > 0}
  <div class="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
    <!-- Select All -->
    <button
      class="flex items-center gap-2 px-2 py-1 text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded transition-colors"
      onclick={handleSelectAll}
    >
      {#if allSelected}
        <CheckSquare class="w-4 h-4" />
        <span>取消全选</span>
      {:else}
        <Square class="w-4 h-4" />
        <span>全选</span>
      {/if}
    </button>

    <div class="w-px h-4 bg-indigo-200 dark:bg-indigo-700"></div>

    <!-- Selected Count -->
    <span class="text-sm text-indigo-600 dark:text-indigo-400">
      已选择 {selectedCount} / {totalCount} 项
    </span>

    <div class="flex-1"></div>

    <!-- Batch Actions -->
    <div class="flex items-center gap-1">
      {#if onTag}
        <Button size="sm" variant="ghost" onclick={handleTag}>
          <Tag class="w-4 h-4" />
          <span class="hidden sm:inline">标签</span>
        </Button>
      {/if}

      {#if onMove}
        <Button size="sm" variant="ghost" onclick={handleMove}>
          <FolderOutput class="w-4 h-4" />
          <span class="hidden sm:inline">移动</span>
        </Button>
      {/if}

      {#if onDelete}
        <Button size="sm" variant="ghost" class="text-red-600 hover:text-red-700" onclick={handleDelete}>
          <Trash2 class="w-4 h-4" />
          <span class="hidden sm:inline">删除</span>
        </Button>
      {/if}
    </div>
  </div>
{/if}
