<script lang="ts">
  import { 
    THEME_PRESETS, 
    activeThemePreset,
    globalNodeStyle,
    globalEdgeStyle,
    applyThemePreset,
    updateGlobalNodeStyle,
    updateGlobalEdgeStyle,
    exportStyles,
    importStyles,
    type NodeStyle,
    type EdgeStyle
  } from './customStyling';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  
  let activeTab: 'themes' | 'nodes' | 'edges' = 'themes';
  let importInput: HTMLInputElement;
  
  // Local state for editing
  let nodeStyle: NodeStyle = { ...$globalNodeStyle };
  let edgeStyle: EdgeStyle = { ...$globalEdgeStyle };
  
  // Sync with store
  $: nodeStyle = { ...$globalNodeStyle };
  $: edgeStyle = { ...$globalEdgeStyle };
  
  function handleThemeChange(presetId: string) {
    applyThemePreset(presetId);
  }
  
  function applyNodeStyle() {
    updateGlobalNodeStyle(nodeStyle);
  }
  
  function applyEdgeStyle() {
    updateGlobalEdgeStyle(edgeStyle);
  }
  
  function handleExport() {
    const json = exportStyles();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow-styles.json';
    a.click();
    URL.revokeObjectURL(url);
    toastStore.success('样式配置已导出');
  }
  
  function handleImportClick() {
    importInput?.click();
  }
  
  function handleImportFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importStyles(content)) {
        toastStore.success('样式导入成功！');
      } else {
        toastStore.error('样式导入失败，格式无效。');
      }
    };
    reader.readAsText(file);
  }
  
  const colorPresets = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];
</script>

<div class="style-settings-panel">
  <!-- Tabs -->
  <div class="tabs">
    <button 
      class="tab" 
      class:active={activeTab === 'themes'}
      onclick={() => activeTab = 'themes'}
    >
      Themes
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'nodes'}
      onclick={() => activeTab = 'nodes'}
    >
      Nodes
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'edges'}
      onclick={() => activeTab = 'edges'}
    >
      Edges
    </button>
  </div>
  
  <!-- Themes Tab -->
  {#if activeTab === 'themes'}
    <div class="tab-content">
      <h3>Theme Presets</h3>
      <div class="theme-grid">
        {#each THEME_PRESETS as preset}
          <button 
            class="theme-card"
            class:active={$activeThemePreset === preset.id}
            onclick={() => handleThemeChange(preset.id)}
          >
            <div class="theme-preview">
              <div class="preview-node" style="background: {preset.node.backgroundColor}; border-color: {preset.node.borderColor}">
                <span style="color: {preset.node.textColor}">Node</span>
              </div>
              <div class="preview-edge" style="background: {preset.edge.strokeColor}"></div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{preset.name}</span>
              <span class="theme-desc">{preset.description}</span>
            </div>
          </button>
        {/each}
      </div>
      
      <div class="import-export">
        <button class="btn" onclick={handleExport}>Export Styles</button>
        <button class="btn" onclick={handleImportClick}>Import Styles</button>
        <input 
          bind:this={importInput}
          type="file" 
          accept=".json" 
          onchange={handleImportFile}
          style="display: none"
        />
      </div>
    </div>
  {/if}
  
  <!-- Nodes Tab -->
  {#if activeTab === 'nodes'}
    <div class="tab-content">
      <h3>Node Styling</h3>
      
      <div class="form-group">
        <div class="control-label">Background Color</div>
        <div class="color-input">
          <input type="color" bind:value={nodeStyle.backgroundColor} onchange={applyNodeStyle} aria-label="Node background color picker" />
          <input type="text" bind:value={nodeStyle.backgroundColor} onblur={applyNodeStyle} aria-label="Node background color value" />
        </div>
      </div>
      
      <div class="form-group">
        <div class="control-label">Border Color</div>
        <div class="color-input">
          <input type="color" bind:value={nodeStyle.borderColor} onchange={applyNodeStyle} aria-label="Node border color picker" />
          <input type="text" bind:value={nodeStyle.borderColor} onblur={applyNodeStyle} aria-label="Node border color value" />
        </div>
      </div>
      
      <div class="form-group">
        <label for="node-border-width">Border Width</label>
        <input id="node-border-width" type="range" min="0" max="10" bind:value={nodeStyle.borderWidth} onchange={applyNodeStyle} />
        <span>{nodeStyle.borderWidth}px</span>
      </div>
      
      <div class="form-group">
        <label for="node-border-radius">Border Radius</label>
        <input id="node-border-radius" type="range" min="0" max="24" bind:value={nodeStyle.borderRadius} onchange={applyNodeStyle} />
        <span>{nodeStyle.borderRadius}px</span>
      </div>
      
      <div class="form-group">
        <div class="control-label">Text Color</div>
        <div class="color-input">
          <input type="color" bind:value={nodeStyle.textColor} onchange={applyNodeStyle} aria-label="Node text color picker" />
          <input type="text" bind:value={nodeStyle.textColor} onblur={applyNodeStyle} aria-label="Node text color value" />
        </div>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={nodeStyle.shadow} onchange={applyNodeStyle} />
          Enable Shadow
        </label>
      </div>
      
      <div class="form-group">
        <label for="node-opacity">Opacity</label>
        <input id="node-opacity" type="range" min="0" max="100" bind:value={nodeStyle.opacity} onchange={applyNodeStyle} />
        <span>{nodeStyle.opacity}%</span>
      </div>
    </div>
  {/if}
  
  <!-- Edges Tab -->
  {#if activeTab === 'edges'}
    <div class="tab-content">
      <h3>Edge Styling</h3>
      
      <div class="form-group">
        <div class="control-label">Line Color</div>
        <div class="color-input">
          <input type="color" bind:value={edgeStyle.strokeColor} onchange={applyEdgeStyle} aria-label="Edge line color picker" />
          <input type="text" bind:value={edgeStyle.strokeColor} onblur={applyEdgeStyle} aria-label="Edge line color value" />
        </div>
      </div>
      
      <div class="form-group">
        <label for="edge-line-width">Line Width</label>
        <input id="edge-line-width" type="range" min="1" max="10" bind:value={edgeStyle.strokeWidth} onchange={applyEdgeStyle} />
        <span>{edgeStyle.strokeWidth}px</span>
      </div>
      
      <div class="form-group">
        <label for="edge-line-style">Line Style</label>
        <select id="edge-line-style" bind:value={edgeStyle.strokeStyle} onchange={applyEdgeStyle}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={edgeStyle.showArrow} onchange={applyEdgeStyle} />
          Show Arrow
        </label>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={edgeStyle.animated} onchange={applyEdgeStyle} />
          Animated Line
        </label>
      </div>
      
      {#if edgeStyle.showArrow}
        <div class="form-group">
          <div class="control-label">Arrow Color</div>
          <div class="color-input">
            <input type="color" bind:value={edgeStyle.arrowColor} onchange={applyEdgeStyle} aria-label="Arrow color picker" />
            <input type="text" bind:value={edgeStyle.arrowColor} onblur={applyEdgeStyle} aria-label="Arrow color value" />
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
<style>
  .style-settings-panel {
    width: 320px;
    background: var(--bg-primary, #1f2937);
    border-left: 1px solid var(--border-color, #374151);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color, #374151);
  }
  
  .tab {
    flex: 1;
    padding: 12px;
    background: none;
    border: none;
    color: var(--text-muted, #9ca3af);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
  }
  
  .tab:hover {
    color: var(--text-primary, #f3f4f6);
  }
  
  .tab.active {
    color: var(--flow-primary, #3b82f6);
    border-bottom: 2px solid var(--flow-primary, #3b82f6);
  }
  
  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  
  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #f3f4f6);
    margin: 0 0 16px;
  }
  
  .theme-grid {
    display: grid;
    gap: 8px;
  }
  
  .theme-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary, #111827);
    border: 1px solid var(--border-color, #374151);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }
  
  .theme-card:hover {
    border-color: var(--flow-primary, #3b82f6);
  }
  
  .theme-card.active {
    border-color: var(--flow-primary, #3b82f6);
    background: var(--bg-hover, #374151);
  }
  
  .theme-preview {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 48px;
  }
  
  .preview-node {
    padding: 6px;
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
    text-align: center;
    font-size: 9px;
    font-weight: 500;
  }
  
  .preview-edge {
    height: 2px;
    border-radius: 1px;
  }
  
  .theme-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .theme-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary, #f3f4f6);
  }
  
  .theme-desc {
    font-size: 11px;
    color: var(--text-muted, #9ca3af);
  }
  
  .import-export {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  
  .btn {
    flex: 1;
    padding: 8px 12px;
    background: var(--bg-secondary, #111827);
    border: 1px solid var(--border-color, #374151);
    border-radius: 6px;
    color: var(--text-primary, #f3f4f6);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  
  .btn:hover {
    background: var(--bg-hover, #374151);
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label,
  .form-group .control-label {
    display: block;
    font-size: 12px;
    color: var(--text-muted, #9ca3af);
    margin-bottom: 6px;
  }
  
  .color-input {
    display: flex;
    gap: 8px;
  }
  
  .color-input input[type="color"] {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .color-input input[type="text"] {
    flex: 1;
    padding: 6px 10px;
    background: var(--bg-secondary, #111827);
    border: 1px solid var(--border-color, #374151);
    border-radius: 4px;
    color: var(--text-primary, #f3f4f6);
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
  
  input[type="range"] {
    width: 100%;
    margin-top: 4px;
  }
  
  .form-group span {
    font-size: 12px;
    color: var(--text-muted, #9ca3af);
    margin-left: 8px;
  }
  
  select {
    width: 100%;
    padding: 8px;
    background: var(--bg-secondary, #111827);
    border: 1px solid var(--border-color, #374151);
    border-radius: 4px;
    color: var(--text-primary, #f3f4f6);
    font-size: 12px;
  }
  
  input[type="checkbox"] {
    margin-right: 6px;
  }
</style>
