<script lang="ts">
  import { Button } from "$lib/components/ui";
  import type { InputFormat } from "../lib/types";

  interface Props {
    value: string;
    inputFormat: InputFormat;
    isProcessing: boolean;
    onParse: () => void;
    onValueChange: (value: string) => void;
    onFormatChange: (format: InputFormat) => void;
  }

  let { value, inputFormat, isProcessing, onParse, onValueChange, onFormatChange }: Props = $props();

  function handleInput(event: Event) {
    onValueChange((event.target as HTMLTextAreaElement).value);
  }

  function handleFormatChange(event: Event) {
    onFormatChange((event.target as HTMLSelectElement).value as InputFormat);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onParse();
    }
  }
</script>

<div class="pane">
  <div class="form-group">
    <label for="inputFormat" class="form-label">Input format</label>
    <select id="inputFormat" value={inputFormat} onchange={handleFormatChange} aria-label="Select input format">
      <option value="auto">Auto detect</option>
      <option value="html">HTML table</option>
      <option value="markdown">Markdown table</option>
      <option value="csv">CSV data</option>
      <option value="text">Plain text</option>
    </select>
  </div>

  <div class="form-group">
    <label for="tableInput" class="form-label">Table data</label>
    <textarea
      id="tableInput"
      placeholder="Paste HTML, Markdown, CSV, or tabular text here."
      rows="8"
      {value}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      aria-describedby="input-help"
    ></textarea>
    <div id="input-help" class="help-row">
      <span>Use Ctrl+Enter to parse the current input.</span>
      <span>{value.trim().length} chars</span>
    </div>
  </div>

  <Button
    variant="primary"
    size="md"
    onclick={onParse}
    disabled={isProcessing || !value.trim()}
    class="parse-btn"
    title={!value.trim() ? "Paste table data before parsing" : "Parse table data"}
  >
    {#if isProcessing}
      <span class="spinner" aria-hidden="true"></span>
      Parsing...
    {:else}
      Parse table
    {/if}
  </Button>
</div>

<style>
  .pane {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary, #374151);
  }

  :global(.dark) .form-label {
    color: #d1d5db;
  }

  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border-color, #d1d5db);
    border-radius: 0.5rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #111827);
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  :global(.dark) select,
  :global(.dark) textarea {
    border-color: #4b5563;
    background: #374151;
    color: #f9fafb;
  }

  select:focus,
  textarea:focus {
    outline: none;
    border-color: #5d5cde;
    box-shadow: 0 0 0 3px rgba(93, 92, 222, 0.1);
  }

  textarea {
    resize: vertical;
    min-height: 120px;
    font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
  }

  .help-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  @media (max-width: 480px) {
    .help-row {
      flex-direction: column;
      gap: 0.25rem;
    }
  }

  :global(.parse-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 999px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
