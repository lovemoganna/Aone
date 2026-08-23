<script lang="ts">
  import { 
    themeMode, 
    colorScheme, 
    effectiveTheme,
    toggleTheme, 
    setThemeMode, 
    setColorScheme,
    getThemeIcon,
    getThemeLabel,
    initializeTheme,
    type ThemeMode,
    type ColorScheme
  } from './themeService';
  import { onMount, onDestroy } from 'svelte';
  
  let cleanup: (() => void) | null = null;
  
  onMount(() => {
    cleanup = initializeTheme() ?? null;
  });
  
  onDestroy(() => {
    if (cleanup) cleanup();
  });
  
  const themeModes: ThemeMode[] = ['light', 'dark', 'system'];
  const colorSchemes: { value: ColorScheme; label: string; color: string }[] = [
    { value: 'default', label: 'Default Blue', color: '#3b82f6' },
    { value: 'blue', label: 'Ocean Blue', color: '#0ea5e9' },
    { value: 'green', label: 'Forest Green', color: '#22c55e' },
    { value: 'purple', label: 'Royal Purple', color: '#a855f7' },
    { value: 'orange', label: 'Sunset Orange', color: '#f97316' },
  ];
</script>

<div class="theme-toggle">
  <!-- Theme Mode Toggle -->
  <div class="theme-section">
    <div class="section-label">Theme</div>
    <div class="theme-options">
      {#each themeModes as mode}
        <button
          class="theme-option"
          class:active={$themeMode === mode}
          onclick={() => setThemeMode(mode)}
          title={getThemeLabel(mode)}
          aria-pressed={$themeMode === mode}
        >
          <span class="theme-icon">{getThemeIcon(mode)}</span>
          <span class="theme-label">{getThemeLabel(mode)}</span>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Color Scheme -->
  <div class="theme-section">
    <div class="section-label">Accent Color</div>
    <div class="color-schemes">
      {#each colorSchemes as scheme}
        <button
          class="color-scheme-btn"
          class:active={$colorScheme === scheme.value}
          style="--scheme-color: {scheme.color}"
          onclick={() => setColorScheme(scheme.value)}
          title={scheme.label}
          aria-label={scheme.label}
          aria-pressed={$colorScheme === scheme.value}
        >
          <span class="color-dot"></span>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Preview -->
  <div class="theme-preview" class:dark={$effectiveTheme === 'dark'}>
    <div class="preview-node">
      <span class="preview-icon">🔧</span>
      <span class="preview-text">Node Preview</span>
    </div>
    <svg class="preview-edge" viewBox="0 0 100 20">
      <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" stroke-width="2" />
      <polygon points="95,5 100,10 95,15" fill="currentColor" />
    </svg>
  </div>
</div>

<style>
  .theme-toggle {
    padding: 12px;
    background: var(--bg-secondary, #1f2937);
    border-radius: 8px;
    border: 1px solid var(--border-color, #374151);
  }
  
  .theme-section {
    margin-bottom: 16px;
  }
  
  .theme-section:last-of-type {
    margin-bottom: 0;
  }
  
  .section-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted, #9ca3af);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  
  .theme-options {
    display: flex;
    gap: 4px;
  }
  
  .theme-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 8px;
    background: var(--bg-primary, #111827);
    border: 1px solid var(--border-color, #374151);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  
  .theme-option:hover {
    border-color: var(--primary, #3b82f6);
  }
  
  .theme-option.active {
    background: var(--primary-light, rgba(59, 130, 246, 0.1));
    border-color: var(--primary, #3b82f6);
  }
  
  .theme-icon {
    font-size: 18px;
  }
  
  .theme-label {
    font-size: 11px;
    color: var(--text-secondary, #94a3b8);
  }
  
  .theme-option.active .theme-label {
    color: var(--primary, #3b82f6);
  }
  
  .color-schemes {
    display: flex;
    gap: 8px;
  }
  
  .color-scheme-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: var(--bg-primary, #111827);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  
  .color-scheme-btn:hover {
    transform: scale(1.1);
  }
  
  .color-scheme-btn.active {
    border-color: var(--scheme-color);
  }
  
  .color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--scheme-color);
  }
  
  .theme-preview {
    margin-top: 16px;
    padding: 16px;
    background: var(--bg-primary, #111827);
    border-radius: 8px;
    border: 1px solid var(--border-color, #374151);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .theme-preview.dark {
    background: #0f172a;
  }
  
  .preview-node {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--node-default, #374151);
    border-radius: 8px;
    border: 1px solid var(--border-color, #4b5563);
  }
  
  .preview-icon {
    font-size: 16px;
  }
  
  .preview-text {
    font-size: 12px;
    color: var(--text-primary, #f3f4f6);
  }
  
  .preview-edge {
    width: 80px;
    height: 16px;
    color: var(--edge-default, #6b7280);
  }
</style>
