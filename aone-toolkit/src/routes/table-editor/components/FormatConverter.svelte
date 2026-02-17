<script lang="ts">
    import { Button } from "$lib/components/ui";
    import type { OutputFormat } from "../lib/types";

    interface Props {
        disabled: boolean;
        activeFormat: OutputFormat | null;
        onConvert: (format: OutputFormat) => void;
    }

    let { disabled, activeFormat, onConvert }: Props = $props();

    const formats: { id: OutputFormat; label: string; icon: string }[] = [
        { id: "markdown", label: "Markdown", icon: "M" },
        { id: "csv", label: "CSV", icon: "," },
        { id: "excel", label: "Excel", icon: "X" },
        { id: "html", label: "HTML", icon: "<>" },
        { id: "orgmode", label: "Org Mode", icon: "◉" },
        { id: "sql-mysql", label: "MySQL", icon: "🐬" },
        { id: "sql-pg", label: "PostgreSQL", icon: "🐘" },
        { id: "sql-duckdb", label: "DuckDB", icon: "🦆" },
    ];
</script>

<div class="converter-container">
    <h3 class="title">🔄 格式转换</h3>
    <div class="button-grid">
        {#each formats as format}
            <Button
                variant={activeFormat === format.id ? "primary" : "secondary"}
                size="md"
                {disabled}
                onclick={() => onConvert(format.id)}
                class="format-btn"
            >
                <span class="icon">{format.icon}</span>
                {format.label}
            </Button>
        {/each}
    </div>
</div>

<style>
    .converter-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary, #111827);
        margin: 0;
    }

    :global(.dark) .title {
        color: #f9fafb;
    }

    .button-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.75rem;
    }

    @media (max-width: 768px) {
        .button-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 480px) {
        .button-grid {
            grid-template-columns: 1fr;
        }
    }

    :global(.format-btn) {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        min-height: 44px;
    }

    .icon {
        font-weight: 700;
        font-size: 0.875rem;
    }
</style>
