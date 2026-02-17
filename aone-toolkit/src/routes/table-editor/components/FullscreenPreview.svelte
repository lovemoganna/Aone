<script lang="ts">
    import { Button } from "$lib/components/ui";
    import type { TableData } from "../lib/types";

    interface Props {
        open: boolean;
        data: TableData;
        onClose: () => void;
    }

    let { open, data, onClose }: Props = $props();

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    $effect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    });
</script>

{#if open}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="fullscreen-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fullscreen-title"
        tabindex="-1"
        onclick={handleOverlayClick}
        onkeydown={handleKeyDown}
    >
        <div class="fullscreen-header">
            <h2 id="fullscreen-title">📊 全屏表格预览</h2>
            <Button
                variant="ghost"
                size="sm"
                onclick={onClose}
                title="关闭全屏 (Esc)"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line x1="18" x2="6" y1="6" y2="18" />
                    <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
                关闭
            </Button>
        </div>
        <div class="fullscreen-content">
            <div
                class="fullscreen-table-container"
                role="table"
                aria-label="全屏表格预览"
            >
                <table>
                    {#if data.length > 0}
                        <thead>
                            <tr>
                                {#each data[0] as cell}
                                    <th>{cell}</th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.slice(1) as row}
                                <tr>
                                    {#each row as cell}
                                        <td>{cell}</td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    {/if}
                </table>
            </div>
        </div>
    </div>
{/if}

<style>
    .fullscreen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: var(--bg-primary, #ffffff);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    :global(.dark) .fullscreen-overlay {
        background: #181818;
    }

    .fullscreen-header {
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--border-color, #d1d5db);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        background: var(--bg-secondary, #f9fafb);
    }

    :global(.dark) .fullscreen-header {
        border-bottom-color: #4b5563;
        background: #1f2937;
    }

    .fullscreen-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary, #111827);
    }

    :global(.dark) .fullscreen-header h2 {
        color: #f9fafb;
    }

    .fullscreen-content {
        flex: 1;
        overflow: auto;
        padding: 2rem;
    }

    .fullscreen-table-container {
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 0.5rem;
        overflow: auto;
        height: 100%;
        background: var(--bg-primary, #ffffff);
    }

    :global(.dark) .fullscreen-table-container {
        border-color: #4b5563;
        background: #1f2937;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th,
    td {
        border: 1px solid var(--border-color, #d1d5db);
        padding: 0.75rem;
        text-align: left;
        vertical-align: top;
    }

    :global(.dark) th,
    :global(.dark) td {
        border-color: #4b5563;
    }

    th {
        background: #f3f4f6;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    :global(.dark) th {
        background: #374151;
    }

    tr:nth-child(even) td {
        background: #f9fafb;
    }

    :global(.dark) tr:nth-child(even) td {
        background: #1f2937;
    }
</style>
