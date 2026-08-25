/**
 * Flow Import/Export Service
 * Provides JSON import/export functionality for workflows
 */

import type { FlowNode, FlowEdge } from './types';

export interface FlowExportData {
    version: string;
    exportedAt: number;
    nodes: FlowNode[];
    edges: FlowEdge[];
    metadata?: {
        name?: string;
        description?: string;
        author?: string;
        tags?: string[];
    };
}

// P2-6: 边样式预设
export interface EdgeStylePreset {
    id: string;
    name: string;
    edgeType: 'bezier' | 'step' | 'straight';
    style: 'solid' | 'dashed' | 'dotted';
    animated: boolean;
    strokeColor?: string;
    strokeWidth?: number;
}

export const EDGE_STYLE_PRESETS: EdgeStylePreset[] = [
    { id: 'default', name: '默认', edgeType: 'bezier', style: 'solid', animated: false },
    { id: 'smooth', name: '平滑', edgeType: 'bezier', style: 'solid', animated: true },
    { id: 'step', name: '阶梯', edgeType: 'step', style: 'solid', animated: false },
    { id: 'straight', name: '直线', edgeType: 'straight', style: 'solid', animated: false },
    { id: 'dashed', name: '虚线', edgeType: 'bezier', style: 'dashed', animated: false },
    { id: 'dotted', name: '点线', edgeType: 'bezier', style: 'dotted', animated: false },
    { id: 'animated', name: '流动', edgeType: 'bezier', style: 'solid', animated: true, strokeColor: '#3B82F6' },
    { id: 'error', name: '错误', edgeType: 'bezier', style: 'solid', animated: false, strokeColor: '#EF4444' },
    { id: 'success', name: '成功', edgeType: 'bezier', style: 'solid', animated: false, strokeColor: '#22C55E' },
    { id: 'warning', name: '警告', edgeType: 'bezier', style: 'dashed', animated: false, strokeColor: '#F59E0B' },
];

// 应用边样式预设到单条边
export function applyEdgeStylePreset(edge: FlowEdge, preset: EdgeStylePreset): FlowEdge {
    return {
        ...edge,
        type: preset.edgeType,
        style: preset.style,
        animated: preset.animated,
        strokeColor: preset.strokeColor || edge.strokeColor,
        strokeWidth: preset.strokeWidth || edge.strokeWidth || 2
    };
}

// 批量应用边样式预设
export function applyEdgeStylePresetToAll(edges: FlowEdge[], preset: EdgeStylePreset): FlowEdge[] {
    return edges.map(edge => applyEdgeStylePreset(edge, preset));
}

export interface FlowImportResult {
    success: boolean;
    data?: FlowExportData;
    error?: string;
}

/**
 * Export flow to JSON file
 */
export function exportFlow(
    nodes: FlowNode[],
    edges: FlowEdge[],
    metadata?: FlowExportData['metadata']
): string {
    const exportData: FlowExportData = {
        version: '1.0',
        exportedAt: Date.now(),
      nodes,
      edges,
        metadata
    };
    
    return JSON.stringify(exportData, null, 2);
}

/**
 * Download flow as JSON file
 */
export function downloadFlowAsFile(
    nodes: FlowNode[],
    edges: FlowEdge[],
    filename: string = 'workflow.json',
    metadata?: FlowExportData['metadata']
): void {
    const json = exportFlow(nodes, edges, metadata);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import flow from JSON string
 */
export function importFlow(jsonString: string): FlowImportResult {
    try {
        const data = JSON.parse(jsonString) as FlowExportData;
        
        // Validate structure
        if (!data.nodes || !Array.isArray(data.nodes)) {
            return {
                success: false,
                error: 'Invalid flow data: missing nodes array'
            };
        }
        
        if (!data.edges || !Array.isArray(data.edges)) {
      return {
        success: false,
                error: 'Invalid flow data: missing edges array'
            };
        }
        
        // Generate new IDs to avoid conflicts
        const idMap = new Map<string, string>();
        
        const processedNodes = data.nodes.map(node => {
            const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            idMap.set(node.id, newId);
            return {
                ...node,
                id: newId
            };
        });
        
        const processedEdges = data.edges.map(edge => ({
            ...edge,
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: idMap.get(edge.source) || edge.source,
            target: idMap.get(edge.target) || edge.target
        }));
        
        return {
            success: true,
            data: {
                ...data,
                nodes: processedNodes,
                edges: processedEdges
            }
        };
    } catch (error) {
    return {
      success: false,
            error: `Failed to parse flow data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Read JSON file as text
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * P3-17: Export Flow as Vector SVG Image
 */
export function exportFlowAsSVG(nodes: FlowNode[], edges: FlowEdge[], filename = 'workflow.svg'): string {
    if (nodes.length === 0) return '';
    const bounds = nodes.reduce(
        (acc, n) => ({
            minX: Math.min(acc.minX, n.position.x),
            minY: Math.min(acc.minY, n.position.y),
            maxX: Math.max(acc.maxX, n.position.x + (n.data?.width || 220)),
            maxY: Math.max(acc.maxY, n.position.y + (n.data?.height || 100)),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
    const padding = 60;
    const w = bounds.maxX - bounds.minX + padding * 2;
    const h = bounds.maxY - bounds.minY + padding * 2;

    const nodeElements = nodes.map(n => {
        const x = n.position.x - bounds.minX + padding;
        const y = n.position.y - bounds.minY + padding;
        const nw = n.data?.width || 200;
        const nh = n.data?.height || 80;
        const label = (n.data?.label || n.id).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<g transform="translate(${x},${y})">
            <rect width="${nw}" height="${nh}" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
            <text x="16" y="32" font-family="'Noto Sans SC', system-ui, sans-serif" font-size="13" font-weight="bold" fill="#1e293b">${label}</text>
            <text x="16" y="52" font-family="'Noto Sans SC', system-ui, sans-serif" font-size="10" fill="#64748b">${n.type}</text>
        </g>`;
    }).join('\n');

    const edgeElements = edges.map(e => {
        const src = nodes.find(n => n.id === e.source);
        const tgt = nodes.find(n => n.id === e.target);
        if (!src || !tgt) return '';
        const sx = src.position.x - bounds.minX + padding + (src.data?.width || 200);
        const sy = src.position.y - bounds.minY + padding + (src.data?.height || 80) / 2;
        const tx = tgt.position.x - bounds.minX + padding;
        const ty = tgt.position.y - bounds.minY + padding + (tgt.data?.height || 80) / 2;
        const dx = Math.max(30, (tx - sx) / 2);
        return `<path d="M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}" fill="none" stroke="#94a3b8" stroke-width="2"/>`;
    }).join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <g>${edgeElements}</g>
        <g>${nodeElements}</g>
    </svg>`;

    if (typeof document !== 'undefined' && filename) {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    return svg;
}

