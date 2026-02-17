<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { BarChart, LineChart, PieChart, Trash2, Copy, Download, Upload, FileText } from "lucide-svelte";

    let dataInput = $state(
        '[\n  {"label": "Jan", "value": 45},\n  {"label": "Feb", "value": 52},\n  {"label": "Mar", "value": 38},\n  {"label": "Apr", "value": 65},\n  {"label": "May", "value": 48}\n]',
    );
    let chartType = $state<"bar" | "line" | "pie">("bar");
    let chartData = $state<any[]>([]);
    let chartTitle = $state("My Chart");
    let hoveredIndex = $state<number | null>(null);
    let inputMode = $state<"json" | "csv">("json");
    let svgRef = $state<SVGSVGElement | null>(null);

    // Pie chart colors
    const pieColors = [
        "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
        "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6"
    ];

    function parseData() {
        try {
            if (inputMode === "json") {
                chartData = JSON.parse(dataInput);
            } else {
                chartData = parseCSV(dataInput);
            }
        } catch (e) {
            // Silent fail during typing
        }
    }

    function parseCSV(csv: string): any[] {
        const lines = csv.trim().split("\n");
        if (lines.length < 2) return [];
        const headers = lines[0].split(",").map(h => h.trim());
        const labelIdx = headers.findIndex(h => h.toLowerCase() === "label" || h.toLowerCase() === "name");
        const valueIdx = headers.findIndex(h => h.toLowerCase() === "value" || h.toLowerCase() === "amount");
        
        if (labelIdx === -1 || valueIdx === -1) {
            // Assume first col is label, second is value
            return lines.slice(1).map(line => {
                const cols = line.split(",").map(c => c.trim());
                return { label: cols[0] || "", value: parseFloat(cols[1]) || 0 };
            });
        }
        
        return lines.slice(1).map(line => {
            const cols = line.split(",").map(c => c.trim());
            return { label: cols[labelIdx] || "", value: parseFloat(cols[valueIdx]) || 0 };
        });
    }

    $effect(() => {
        parseData();
    });

    function switchInputMode(mode: "json" | "csv") {
        inputMode = mode;
        if (mode === "csv" && dataInput.startsWith("[")) {
            // Convert JSON to CSV
            try {
                const data = JSON.parse(dataInput);
                dataInput = "label,value\n" + data.map((d: any) => `${d.label},${d.value}`).join("\n");
            } catch (e) {
                dataInput = "label,value\nJan,45\nFeb,52\nMar,38";
            }
        } else if (mode === "json" && !dataInput.startsWith("[")) {
            // Convert CSV to JSON
            const data = parseCSV(dataInput);
            dataInput = JSON.stringify(data, null, 2);
        }
    }

    function downloadSVG() {
        if (!svgRef) return;
        const svgData = new XMLSerializer().serializeToString(svgRef);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${chartTitle.replace(/\s+/g, "_")}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadPNG() {
        if (!svgRef) return;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svgRef);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            canvas.width = 800;
            canvas.height = 400;
            ctx!.fillStyle = "#ffffff";
            ctx!.fillRect(0, 0, canvas.width, canvas.height);
            ctx!.drawImage(img, 0, 0, 800, 400);
            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `${chartTitle.replace(/\s+/g, "_")}.png`;
            a.click();
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    let maxVal = $derived(Math.max(...chartData.map((d) => d.value), 1));
    let totalVal = $derived(chartData.reduce((sum, d) => sum + d.value, 0));
    
    // Generate Y-axis labels
    let yAxisLabels = $derived(() => {
        const labels = [];
        const step = maxVal / 4;
        for (let i = 0; i <= 4; i++) {
            labels.push(Math.round(step * i));
        }
        return labels;
    });

    // Pie chart path calculation
    function getPieSlicePath(startAngle: number, endAngle: number, cx: number, cy: number, r: number): string {
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    let pieSlices = $derived(() => {
        if (totalVal === 0) return [];
        let currentAngle = -Math.PI / 2;
        return chartData.map((d, i) => {
            const sliceAngle = (d.value / totalVal) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;
            return {
                path: getPieSlicePath(startAngle, endAngle, 200, 100, 80),
                color: pieColors[i % pieColors.length],
                label: d.label,
                value: d.value,
                percentage: ((d.value / totalVal) * 100).toFixed(1)
            };
        });
    });
</script>

<svelte:head>
    <title>Data Insights - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <FileText size={16} />
                        </div>
                        <h2 class="font-semibold text-slate-900 dark:text-white">Data Source</h2>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <button
                                class="px-2 py-1 text-xs font-medium rounded transition-all {inputMode === 'json' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}"
                                onclick={() => switchInputMode('json')}
                            >JSON</button>
                            <button
                                class="px-2 py-1 text-xs font-medium rounded transition-all {inputMode === 'csv' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}"
                                onclick={() => switchInputMode('csv')}
                            >CSV</button>
                        </div>
                        <Button variant="ghost" size="sm" onclick={() => (dataInput = "")}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            {/snippet}
            <textarea
                bind:value={dataInput}
                class="flex-1 p-6 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-300"
                placeholder={inputMode === 'json' ? 'Paste JSON array of objects here...' : 'Paste CSV data (with headers label,value)...'}
            ></textarea>
            <div class="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/10">
                <div class="flex items-center gap-4 text-xs text-slate-500">
                    <span>{chartData.length} items</span>
                    <span>Total: {totalVal.toLocaleString()}</span>
                    <span>Max: {maxVal.toLocaleString()}</span>
                </div>
            </div>
        </Panel>

        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-3">
                        <input
                            type="text"
                            bind:value={chartTitle}
                            class="font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 -ml-1"
                            placeholder="Chart Title"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <button
                                class="px-2 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 {chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}"
                                onclick={() => (chartType = "bar")}>
                                <BarChart size={12} /> Bar
                            </button>
                            <button
                                class="px-2 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 {chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}"
                                onclick={() => (chartType = "line")}>
                                <LineChart size={12} /> Line
                            </button>
                            <button
                                class="px-2 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 {chartType === 'pie' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500'}"
                                onclick={() => (chartType = "pie")}>
                                <PieChart size={12} /> Pie
                            </button>
                        </div>
                        <div class="flex gap-1">
                            <Button variant="ghost" size="sm" onclick={downloadSVG} title="Download SVG">
                                <Download size={14} />
                            </Button>
                        </div>
                    </div>
                </div>
            {/snippet}

            <div class="flex-1 flex items-center justify-center p-8 bg-slate-50/30 dark:bg-black/10 relative">
                {#if chartData.length > 0}
                    <!-- Tooltip -->
                    {#if hoveredIndex !== null && chartData[hoveredIndex]}
                        <div class="absolute top-4 left-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 z-10">
                            <div class="text-xs font-semibold text-slate-900 dark:text-white">{chartData[hoveredIndex].label}</div>
                            <div class="text-sm font-bold text-primary-600">{chartData[hoveredIndex].value.toLocaleString()}</div>
                            {#if chartType === "pie"}
                                <div class="text-[10px] text-slate-500">{((chartData[hoveredIndex].value / totalVal) * 100).toFixed(1)}%</div>
                            {/if}
                        </div>
                    {/if}

                    <svg bind:this={svgRef} viewBox="0 0 400 200" class="w-full h-full max-w-2xl">
                        <!-- Title -->
                        <text x="200" y="15" text-anchor="middle" class="text-[10px] fill-slate-600 dark:fill-slate-400 font-semibold">{chartTitle}</text>

                        {#if chartType !== "pie"}
                            <!-- Y-axis -->
                            <line x1="50" y1="25" x2="50" y2="170" stroke="currentColor" stroke-width="1" class="text-slate-300 dark:text-slate-700" />
                            <!-- X-axis -->
                            <line x1="50" y1="170" x2="380" y2="170" stroke="currentColor" stroke-width="1" class="text-slate-300 dark:text-slate-700" />
                            
                            <!-- Y-axis labels & grid lines -->
                            {#each yAxisLabels() as label, i}
                                {@const y = 170 - (i / 4) * 140}
                                <text x="45" {y} text-anchor="end" dominant-baseline="middle" class="text-[7px] fill-slate-400 font-mono">{label}</text>
                                <line x1="50" y1={y} x2="380" y2={y} stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-slate-200 dark:text-slate-800" />
                            {/each}
                        {/if}

                        {#if chartType === "bar"}
                            {#each chartData as d, i}
                                {@const barWidth = 320 / chartData.length}
                                {@const h = (d.value / maxVal) * 140}
                                <rect
                                    x={55 + i * barWidth}
                                    y={170 - h}
                                    width={barWidth * 0.7}
                                    height={h}
                                    fill={hoveredIndex === i ? "rgb(99, 102, 241)" : "url(#grad)"}
                                    rx="3"
                                    class="transition-all duration-300 cursor-pointer"
                                    onmouseenter={() => hoveredIndex = i}
                                    onmouseleave={() => hoveredIndex = null}
                                />
                                <text
                                    x={55 + i * barWidth + barWidth * 0.35}
                                    y="183"
                                    text-anchor="middle"
                                    class="text-[7px] fill-slate-500 font-mono"
                                >{d.label}</text>
                            {/each}
                        {:else if chartType === "line"}
                            {@const barWidth = chartData.length > 1 ? 320 / (chartData.length - 1) : 320}
                            <!-- Area fill -->
                            <path
                                d={chartData.map((d, i) => `${i === 0 ? "M" : "L"} ${55 + i * barWidth} ${170 - (d.value / maxVal) * 140}`).join(" ") + ` L ${55 + (chartData.length - 1) * barWidth} 170 L 55 170 Z`}
                                fill="url(#areaGrad)"
                                class="transition-all duration-500"
                            />
                            <!-- Line -->
                            <path
                                d={chartData.map((d, i) => `${i === 0 ? "M" : "L"} ${55 + i * barWidth} ${170 - (d.value / maxVal) * 140}`).join(" ")}
                                fill="none"
                                stroke="rgb(79, 70, 229)"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <!-- Points -->
                            {#each chartData as d, i}
                                <circle
                                    cx={55 + i * barWidth}
                                    cy={170 - (d.value / maxVal) * 140}
                                    r={hoveredIndex === i ? 6 : 4}
                                    class="fill-indigo-500 stroke-white stroke-2 cursor-pointer transition-all"
                                    onmouseenter={() => hoveredIndex = i}
                                    onmouseleave={() => hoveredIndex = null}
                                />
                                <text
                                    x={55 + i * barWidth}
                                    y="183"
                                    text-anchor="middle"
                                    class="text-[7px] fill-slate-500 font-mono"
                                >{d.label}</text>
                            {/each}
                        {:else if chartType === "pie"}
                            <!-- Pie Chart -->
                            {#each pieSlices() as slice, i}
                                <path
                                    d={slice.path}
                                    fill={slice.color}
                                    class="cursor-pointer transition-all duration-200 {hoveredIndex === i ? 'opacity-100' : 'opacity-80'}"
                                    style="transform-origin: 200px 100px; transform: scale({hoveredIndex === i ? 1.05 : 1});"
                                    onmouseenter={() => hoveredIndex = i}
                                    onmouseleave={() => hoveredIndex = null}
                                />
                            {/each}
                            <!-- Legend -->
                            <g transform="translate(300, 40)">
                                {#each chartData.slice(0, 6) as d, i}
                                    <rect x="0" y={i * 18} width="10" height="10" fill={pieColors[i % pieColors.length]} rx="2" />
                                    <text x="15" y={i * 18 + 8} class="text-[8px] fill-slate-600 dark:fill-slate-400">{d.label}</text>
                                {/each}
                            </g>
                        {/if}

                        <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:rgb(79, 70, 229);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:rgb(139, 92, 246);stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:rgb(79, 70, 229);stop-opacity:0.3" />
                                <stop offset="100%" style="stop-color:rgb(139, 92, 246);stop-opacity:0.05" />
                            </linearGradient>
                        </defs>
                    </svg>
                {:else}
                    <div class="text-center opacity-30">
                        <BarChart size={64} />
                        <p class="mt-4 text-sm">Paste data to visualize</p>
                    </div>
                {/if}
            </div>

            <div class="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/10 flex justify-between items-center">
                <div class="flex gap-2">
                    <Button variant="secondary" size="sm" onclick={downloadSVG}>
                        <Download size={14} class="mr-1" /> SVG
                    </Button>
                    <Button variant="secondary" size="sm" onclick={downloadPNG}>
                        <Download size={14} class="mr-1" /> PNG
                    </Button>
                </div>
                <span class="text-xs text-slate-400">Hover for details</span>
            </div>
        </Panel>
    </div>
</div>
