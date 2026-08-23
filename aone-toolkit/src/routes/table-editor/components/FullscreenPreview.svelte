<script lang="ts">
  import { Button } from "$lib/components/ui";
  import type { TableData } from "../lib/types";
  import { X, Table2, Hash } from "lucide-svelte";

  interface Props {
    open: boolean;
    data: TableData;
    onClose: () => void;
  }

  let { open, data, onClose }: Props = $props();

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }

  $effect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    role="dialog"
    aria-modal="true"
    aria-labelledby="fullscreen-title"
    onclick={handleOverlayClick}
    onkeydown={handleKeyDown}
    tabindex="-1"
  >
    <div class="m-3 sm:m-6 flex-1 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
      <!-- Fullscreen Header -->
      <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/80 dark:bg-slate-950/80">
        <div class="flex items-center gap-3">
          <div class="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Table2 class="h-4 w-4" />
          </div>
          <div>
            <h2 id="fullscreen-title" class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              表格全屏检视 (Fullscreen View)
            </h2>
            <p class="text-[11px] text-slate-400">
              共 {Math.max(0, data.length - 1)} 行 × {data[0]?.length || 0} 列
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title="关闭全屏 (Esc)"
          aria-label="关闭全屏检视"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Fullscreen Table Grid Content -->
      <div class="flex-1 overflow-auto p-4 select-text">
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table class="w-full border-collapse text-left text-xs font-mono">
            {#if data.length > 0}
              <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="w-12 px-3 py-2 text-center text-[10px] font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    #
                  </th>
                  {#each data[0] as cell}
                    <th class="px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 min-w-[140px]">
                      {cell || "(列名未命名)"}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                {#each data.slice(1) as row, idx}
                  <tr class="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors">
                    <td class="px-3 py-2 text-center text-[10px] text-slate-400 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {idx + 1}
                    </td>
                    {#each row as cell}
                      <td class="px-3.5 py-2 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 min-w-[140px]">
                        {cell || "-"}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            {/if}
          </table>
        </div>
      </div>
    </div>
  </div>
{/if}
