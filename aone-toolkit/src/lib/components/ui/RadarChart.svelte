<script lang="ts">
    interface Props {
        data: number[];           // 0-10 之间的数值
        labels: string[];         // 对应的标签
        size?: number;            // 图表大小
        color?: string;           // 填充颜色
        maxValue?: number;        // 最大值，默认 10
    }

    let { 
        data = [], 
        labels = [], 
        size = 300, 
        color = '#6366F1',
        maxValue = 10 
    }: Props = $props();

    let center = $derived(size / 2);
    let radius = $derived((size / 2) * 0.8);
    let angleStep = $derived((Math.PI * 2) / (data.length || 1));

    // 计算坐标
    function getCoordinates(value: number, index: number, max: number, currentCenter: number, currentRadius: number, currentAngleStep: number) {
        const r = (value / max) * currentRadius;
        const angle = index * currentAngleStep - Math.PI / 2;
        return {
            x: currentCenter + r * Math.cos(angle),
            y: currentCenter + r * Math.sin(angle)
        };
    }

    // 生成背景多边形 (网格)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    let gridPaths = $derived(gridLevels.map(level => {
        return data.map((_, i) => {
            const { x, y } = getCoordinates(maxValue * level, i, maxValue, center, radius, angleStep);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ') + ' Z';
    }));

    // 生成轴线
    let axes = $derived(data.map((_, i) => {
        const { x, y } = getCoordinates(maxValue, i, maxValue, center, radius, angleStep);
        return { x1: center, y1: center, x2: x, y2: y };
    }));

    // 生成数据多边形
    let dataPath = $derived(() => {
        if (data.length === 0) return '';
        return data.map((val, i) => {
            const { x, y } = getCoordinates(val, i, maxValue, center, radius, angleStep);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ') + ' Z';
    });

    // 标签位置
    let labelPositions = $derived(labels.map((label, i) => {
        const { x, y } = getCoordinates(maxValue * 1.15, i, maxValue, center, radius, angleStep);
        // 微调文本对齐
        let textAnchor = 'middle';
        if (x < center - 10) textAnchor = 'end';
        if (x > center + 10) textAnchor = 'start';
        
        return { x, y, label, textAnchor };
    }));
</script>

<div class="radar-chart" style="width: {size}px; height: {size}px;">
    <svg width={size} height={size} viewBox="0 0 {size} {size}">
        <!-- 背景网格 -->
        {#each gridPaths as path}
            <path 
                d={path} 
                fill="none" 
                stroke="currentColor" 
                stroke-width="1" 
                class="text-slate-200 dark:text-slate-800"
            />
        {/each}

        <!-- 轴线 -->
        {#each axes as axis}
            <line 
                x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2} 
                stroke="currentColor" 
                stroke-width="1" 
                class="text-slate-200 dark:text-slate-800"
            />
        {/each}

        <!-- 数据区域 -->
        <path 
            d={dataPath()} 
            fill={color} 
            fill-opacity="0.2" 
            stroke={color} 
            stroke-width="2"
            class="transition-all duration-500 ease-out"
        />

        <!-- 数据点 -->
        {#each data as val, i}
            {@const { x, y } = getCoordinates(val, i, maxValue, center, radius, angleStep)}
            <circle 
                cx={x} cy={y} r="4" 
                fill={color}
                class="transition-all duration-500 ease-out"
            />
        {/each}

        <!-- 标签 -->
        {#each labelPositions as lp}
            <text 
                x={lp.x} y={lp.y} 
                text-anchor={lp.textAnchor} 
                dominant-baseline="middle"
                class="text-[10px] font-medium fill-slate-500 dark:fill-slate-400"
            >
                {lp.label}
            </text>
        {/each}
    </svg>
</div>

<style>
    .radar-chart {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    svg {
        overflow: visible;
    }
</style>
