<script lang="ts">
    import { onMount } from "svelte";
    import { 
        Code2, 
        Layout, 
        Sparkles, 
        Component, 
        Copy, 
        Download, 
        RotateCcw, 
        ArrowRight,
        Trash2,
        Check
    } from "lucide-svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let activeTab = $state<"css-editor" | "layout" | "effects" | "components">("css-editor");

    // CSS Editor State
    let cssEditorText = $state(".box {\n  width: 100px;\n  height: 100px;\n  background: #3b82f6;\n  border-radius: 8px;\n  transition: all 0.3s ease;\n}\n\n.box:hover {\n  transform: scale(1.1) rotate(5deg);\n  background: #10b981;\n}");
    let cssEditorHtml = $state('<div class="box"></div>');
    let cssEditorPreview = $derived(`
        <style>
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: transparent; }
            ${cssEditorText}
        </style>
        ${cssEditorHtml}
    `);

    // Layout Visualizer State
    let layoutType = $state<"flex" | "grid">("flex");
    let flexDirection = $state("row");
    let justifyContent = $state("center");
    let alignItems = $state("center");
    let flexGap = $state(16);

    let gridCols = $state("repeat(3, 1fr)");
    let gridGap = $state(16);

    // Effects Visualizer State
    let effectType = $state<"shadow" | "gradient" | "border-radius">("shadow");
    let hOffset = $state(10);
    let vOffset = $state(10);
    let shadowBlur = $state(15);
    let shadowSpread = $state(-3);
    let shadowOpacity = $state(0.1);
    let shadowInset = $state(false);
    let shadowColor = $state("#000000");
    let shadowCss = $derived(
        `box-shadow: ${shadowInset ? 'inset ' : ''}${hOffset}px ${vOffset}px ${shadowBlur}px ${shadowSpread}px rgba(${parseInt(shadowColor.slice(1,3),16)}, ${parseInt(shadowColor.slice(3,5),16)}, ${parseInt(shadowColor.slice(5,7),16)}, ${shadowOpacity});`
    );

    let gradType = $state<"linear" | "radial" | "conic">("linear");
    let gradAngle = $state(90);
    let gradColor1 = $state("#3b82f6");
    let gradColor2 = $state("#8b5cf6");
    let gradientCss = $derived(
        gradType === 'linear' ? `background: linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2});` :
        gradType === 'radial' ? `background: radial-gradient(circle, ${gradColor1}, ${gradColor2});` :
        `background: conic-gradient(from ${gradAngle}deg, ${gradColor1}, ${gradColor2});`
    );

    let brTL = $state(16);
    let brTR = $state(16);
    let brBR = $state(16);
    let brBL = $state(16);
    let borderRadiusCss = $derived(`border-radius: ${brTL}px ${brTR}px ${brBR}px ${brBL}px;`);

    // Component Preview State
    let compHtml = $state(`<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center gap-x-4">
  <div class="shrink-0">
    <div class="h-12 w-12 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xl">A</div>
  </div>
  <div>
    <div class="text-xl font-medium text-black">ChitChat</div>
    <p class="text-slate-500">You have a new message!</p>
  </div>
</div>`);
    let useTailwind = $state(true);
    let useFA = $state(false);
    let useBsIcons = $state(false);

    let compPreviewSrcdoc = $derived(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            ${useTailwind ? '<script src="https://cdn.tailwindcss.com"><' + '/script>' : ''}
            ${useFA ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' : ''}
            ${useBsIcons ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">' : ''}
            <style>body { padding: 1rem; margin: 0; background: transparent; }</style>
        </head>
        <body>${compHtml}</body>
        </html>
    `);

    const compPresets = [
        { name: "Tailwind Card", html: compHtml },
        { name: "Simple Button", html: `<button class="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm">Click me</button>` }
    ];

    async function copyText(text: string, label: string) {
        try {
            await navigator.clipboard.writeText(text);
            toastStore.success(`已复制 ${label}`);
        } catch {
            toastStore.error("复制失败");
        }
    }

    function downloadHtml() {
        const fullHtml = compPreviewSrcdoc;
        const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "component.html";
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("已下载 HTML");
    }
</script>

<svelte:head>
    <title>CSS Lab - Aone Toolkit</title>
</svelte:head>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Toolbar -->
    <div class="h-10 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded">
            <button
                type="button"
                class="px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 {activeTab === 'css-editor' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                onclick={() => activeTab = 'css-editor'}
            >
                <Code2 size={13} /> CSS 编辑器
            </button>
            <button
                type="button"
                class="px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 {activeTab === 'layout' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                onclick={() => activeTab = 'layout'}
            >
                <Layout size={13} /> 布局可视化
            </button>
            <button
                type="button"
                class="px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 {activeTab === 'effects' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                onclick={() => activeTab = 'effects'}
            >
                <Sparkles size={13} /> 特效可视化
            </button>
            <button
                type="button"
                class="px-2.5 py-1 rounded font-medium transition flex items-center gap-1.5 {activeTab === 'components' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                onclick={() => activeTab = 'components'}
            >
                <Component size={13} /> 组件预览
            </button>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 relative">
        {#if activeTab === 'css-editor'}
            <div class="h-full grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div class="flex flex-col gap-2 min-h-0">
                    <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                        <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                            CSS Code
                            <div class="flex gap-1">
                                <button onclick={() => cssEditorText = ''} class="p-1 text-slate-400 hover:text-rose-500 transition"><Trash2 size={12} /></button>
                                <button onclick={() => copyText(cssEditorText, 'CSS 代码')} class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"><Copy size={12} /></button>
                            </div>
                        </div>
                        <textarea bind:value={cssEditorText} class="flex-1 w-full p-3 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200" spellcheck="false"></textarea>
                    </div>
                    <div class="h-1/3 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                        <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">HTML Code</div>
                        <textarea bind:value={cssEditorHtml} class="flex-1 w-full p-3 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200" spellcheck="false"></textarea>
                    </div>
                </div>
                <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                    <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">Preview</div>
                    <iframe title="css preview" srcdoc={cssEditorPreview} class="flex-1 w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZjBmMGIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmMGYwYjIiPjwvcmVjdD4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMjIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMyMjIiPjwvcmVjdD4KPC9zdmc+')]" sandbox="allow-scripts"></iframe>
                </div>
            </div>
        {:else if activeTab === 'layout'}
            <div class="h-full grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs p-4 overflow-y-auto">
                    <div class="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-xs w-fit">
                        <button class="px-3 py-1 rounded {layoutType === 'flex' ? 'bg-white dark:bg-slate-900 shadow-2xs font-bold' : 'text-slate-500'}" onclick={() => layoutType='flex'}>Flexbox</button>
                        <button class="px-3 py-1 rounded {layoutType === 'grid' ? 'bg-white dark:bg-slate-900 shadow-2xs font-bold' : 'text-slate-500'}" onclick={() => layoutType='grid'}>CSS Grid</button>
                    </div>

                    {#if layoutType === 'flex'}
                        <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                                <label class="block font-semibold mb-1">flex-direction</label>
                                <select bind:value={flexDirection} class="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent">
                                    <option>row</option><option>row-reverse</option><option>column</option><option>column-reverse</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-semibold mb-1">justify-content</label>
                                <select bind:value={justifyContent} class="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent">
                                    <option>flex-start</option><option>flex-end</option><option>center</option><option>space-between</option><option>space-around</option><option>space-evenly</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-semibold mb-1">align-items</label>
                                <select bind:value={alignItems} class="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent">
                                    <option>flex-start</option><option>flex-end</option><option>center</option><option>stretch</option><option>baseline</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-semibold mb-1">gap: {flexGap}px</label>
                                <input type="range" min="0" max="64" bind:value={flexGap} class="w-full accent-slate-600" />
                            </div>
                        </div>
                    {:else}
                        <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                                <label class="block font-semibold mb-1">grid-template-columns</label>
                                <input type="text" bind:value={gridCols} class="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent font-mono" />
                            </div>
                            <div>
                                <label class="block font-semibold mb-1">gap: {gridGap}px</label>
                                <input type="range" min="0" max="64" bind:value={gridGap} class="w-full accent-slate-600" />
                            </div>
                        </div>
                    {/if}
                    
                    <div class="mt-8">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">CSS Code</span>
                            <button onclick={() => copyText(layoutType === 'flex' ? `display: flex;\nflex-direction: ${flexDirection};\njustify-content: ${justifyContent};\nalign-items: ${alignItems};\ngap: ${flexGap}px;` : `display: grid;\ngrid-template-columns: ${gridCols};\ngap: ${gridGap}px;`, 'CSS 代码')} class="text-xs px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded">复制</button>
                        </div>
                        <pre class="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">
{layoutType === 'flex' 
? `display: flex;\nflex-direction: ${flexDirection};\njustify-content: ${justifyContent};\nalign-items: ${alignItems};\ngap: ${flexGap}px;`
: `display: grid;\ngrid-template-columns: ${gridCols};\ngap: ${gridGap}px;`}</pre>
                    </div>
                </div>
                <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs p-4">
                    <div class="w-full h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded" 
                         style={layoutType === 'flex' ? `display: flex; flex-direction: ${flexDirection}; justify-content: ${justifyContent}; align-items: ${alignItems}; gap: ${flexGap}px; padding: 16px;` : `display: grid; grid-template-columns: ${gridCols}; gap: ${gridGap}px; padding: 16px;`}>
                        {#each Array(5) as _, i}
                            <div class="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded shadow flex items-center justify-center font-bold text-lg min-h-[64px] min-w-[64px] p-4">{i + 1}</div>
                        {/each}
                    </div>
                </div>
            </div>
        {:else if activeTab === 'effects'}
            <div class="h-full grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs p-4 overflow-y-auto">
                    <div class="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-xs w-fit">
                        <button class="px-3 py-1 rounded {effectType === 'shadow' ? 'bg-white dark:bg-slate-900 shadow-2xs font-bold' : 'text-slate-500'}" onclick={() => effectType='shadow'}>Box Shadow</button>
                        <button class="px-3 py-1 rounded {effectType === 'gradient' ? 'bg-white dark:bg-slate-900 shadow-2xs font-bold' : 'text-slate-500'}" onclick={() => effectType='gradient'}>Gradient</button>
                        <button class="px-3 py-1 rounded {effectType === 'border-radius' ? 'bg-white dark:bg-slate-900 shadow-2xs font-bold' : 'text-slate-500'}" onclick={() => effectType='border-radius'}>Border Radius</button>
                    </div>

                    {#if effectType === 'shadow'}
                        <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                            <div><label class="block mb-1">H Offset: {hOffset}px</label><input type="range" min="-50" max="50" bind:value={hOffset} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">V Offset: {vOffset}px</label><input type="range" min="-50" max="50" bind:value={vOffset} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Blur: {shadowBlur}px</label><input type="range" min="0" max="100" bind:value={shadowBlur} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Spread: {shadowSpread}px</label><input type="range" min="-50" max="50" bind:value={shadowSpread} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Opacity: {shadowOpacity}</label><input type="range" min="0" max="1" step="0.01" bind:value={shadowOpacity} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Color</label><input type="color" bind:value={shadowColor} class="h-8 rounded cursor-pointer" /></div>
                            <div><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" bind:checked={shadowInset} /> Inset</label></div>
                        </div>
                    {:else if effectType === 'gradient'}
                        <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                                <label class="block mb-1">Type</label>
                                <select bind:value={gradType} class="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent">
                                    <option value="linear">Linear</option><option value="radial">Radial</option><option value="conic">Conic</option>
                                </select>
                            </div>
                            {#if gradType !== 'radial'}
                                <div><label class="block mb-1">Angle: {gradAngle}deg</label><input type="range" min="0" max="360" bind:value={gradAngle} class="w-full accent-slate-600" /></div>
                            {/if}
                            <div class="flex gap-4">
                                <div class="flex-1"><label class="block mb-1">Color 1</label><input type="color" bind:value={gradColor1} class="w-full h-8 rounded cursor-pointer" /></div>
                                <div class="flex-1"><label class="block mb-1">Color 2</label><input type="color" bind:value={gradColor2} class="w-full h-8 rounded cursor-pointer" /></div>
                            </div>
                        </div>
                    {:else}
                        <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                            <div><label class="block mb-1">Top Left: {brTL}px</label><input type="range" min="0" max="150" bind:value={brTL} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Top Right: {brTR}px</label><input type="range" min="0" max="150" bind:value={brTR} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Bottom Right: {brBR}px</label><input type="range" min="0" max="150" bind:value={brBR} class="w-full accent-slate-600" /></div>
                            <div><label class="block mb-1">Bottom Left: {brBL}px</label><input type="range" min="0" max="150" bind:value={brBL} class="w-full accent-slate-600" /></div>
                        </div>
                    {/if}

                    <div class="mt-8">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">CSS Code</span>
                            <button onclick={() => copyText(effectType === 'shadow' ? shadowCss : effectType === 'gradient' ? gradientCss : borderRadiusCss, 'CSS 代码')} class="text-xs px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded">复制</button>
                        </div>
                        <pre class="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all">{effectType === 'shadow' ? shadowCss : effectType === 'gradient' ? gradientCss : borderRadiusCss}</pre>
                    </div>
                </div>
                <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZjBmMGIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmMGYwYjIiPjwvcmVjdD4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMjIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMyMjIiPjwvcmVjdD4KPC9zdmc+')]">
                    <div class="w-48 h-48 bg-white dark:bg-slate-800 transition-all flex items-center justify-center text-slate-400 font-bold"
                         style={effectType === 'shadow' ? shadowCss : effectType === 'gradient' ? gradientCss : borderRadiusCss}>
                        Preview
                    </div>
                </div>
            </div>
        {:else if activeTab === 'components'}
            <div class="h-full grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div class="flex flex-col gap-2 min-h-0">
                    <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs shrink-0 flex flex-col gap-3 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold">Presets:</span>
                            <select class="p-1 border border-slate-200 dark:border-slate-700 rounded bg-transparent text-xs w-48" onchange={(e) => compHtml = compPresets.find(p => p.name === e.currentTarget.value)?.html || ''}>
                                {#each compPresets as p}
                                    <option value={p.name}>{p.name}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" bind:checked={useTailwind} /> Tailwind CSS CDN</label>
                            <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" bind:checked={useFA} /> FontAwesome</label>
                            <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" bind:checked={useBsIcons} /> Bootstrap Icons</label>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                        <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                            HTML Code
                            <div class="flex gap-1">
                                <button onclick={() => copyText(compHtml, 'HTML 代码')} class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"><Copy size={12} /></button>
                            </div>
                        </div>
                        <textarea bind:value={compHtml} class="flex-1 w-full p-3 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200" spellcheck="false"></textarea>
                    </div>
                </div>
                <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                    <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Preview
                        <button onclick={downloadHtml} class="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded flex items-center gap-1"><Download size={11} /> 下载 HTML</button>
                    </div>
                    <iframe title="component preview" srcdoc={compPreviewSrcdoc} class="flex-1 w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZjBmMGIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmMGYwYjIiPjwvcmVjdD4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMjIyIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMyMjIiPjwvcmVjdD4KPC9zdmc+')]" sandbox="allow-scripts"></iframe>
                </div>
            </div>
        {/if}
    </div>
</div>
