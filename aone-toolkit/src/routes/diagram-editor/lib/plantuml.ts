import plantumlEncoder from 'plantuml-encoder';

const DEFAULT_SERVERS = [
    'https://www.plantuml.com/plantuml',
    'https://kroki.io/plantuml'
];

export function encodePlantUML(code: string): string {
    return plantumlEncoder.encode(code);
}

/**
 * Generates a clean, SVG fallback diagram when all remote servers are unreachable.
 */
export function generateOfflineFallbackSvg(code: string, errorReason: string): string {
    const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('@') && !l.trim().startsWith("'"));
    const safeError = errorReason.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c));

    // Extract basic node / relation names for preview
    const nodes: string[] = [];
    const relations: { from: string; to: string; label?: string }[] = [];

    for (const line of lines) {
        const arrowMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*(?:-->|->|\.\.>)\s*([a-zA-Z0-9_]+)(?:\s*:\s*(.*))?/);
        if (arrowMatch) {
            const [, from, to, label] = arrowMatch;
            if (!nodes.includes(from)) nodes.push(from);
            if (!nodes.includes(to)) nodes.push(to);
            relations.push({ from, to, label });
            continue;
        }

        const nodeMatch = line.match(/^\s*(?:class|component|node|rectangle|database|queue|actor|storage)\s+([a-zA-Z0-9_]+)/);
        if (nodeMatch && !nodes.includes(nodeMatch[1])) {
            nodes.push(nodeMatch[1]);
        }
    }

    const nodeWidth = 140;
    const nodeHeight = 44;
    const paddingX = 40;
    const paddingY = 40;
    const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(Math.max(nodes.length, 1)))));
    const rows = Math.ceil(Math.max(nodes.length, 1) / cols);

    const width = Math.max(560, cols * (nodeWidth + paddingX) + 60);
    const height = Math.max(340, rows * (nodeHeight + paddingY) + 160);

    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 50 + col * (nodeWidth + paddingX);
        const y = 120 + row * (nodeHeight + paddingY);
        nodePositions.set(node, { x, y });
    });

    let edgesSvg = '';
    relations.forEach(rel => {
        const p1 = nodePositions.get(rel.from);
        const p2 = nodePositions.get(rel.to);
        if (p1 && p2) {
            const x1 = p1.x + nodeWidth / 2;
            const y1 = p1.y + nodeHeight / 2;
            const x2 = p2.x + nodeWidth / 2;
            const y2 = p2.y + nodeHeight / 2;
            edgesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)" />`;
            if (rel.label) {
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2 - 6;
                edgesSvg += `<text x="${mx}" y="${my}" fill="#94a3b8" font-size="11" text-anchor="middle" font-family="'Noto Sans SC', system-ui, sans-serif">${rel.label}</text>`;
            }
        }
    });

    let nodesSvg = '';
    nodes.forEach(node => {
        const pos = nodePositions.get(node);
        if (pos) {
            nodesSvg += `
                <g class="node" id="node-${node}" transform="translate(${pos.x}, ${pos.y})">
                    <rect width="${nodeWidth}" height="${nodeHeight}" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
                    <text x="${nodeWidth / 2}" y="${nodeHeight / 2 + 5}" fill="#f8fafc" font-size="13" font-weight="600" text-anchor="middle" font-family="'JetBrains Mono', monospace">${node}</text>
                </g>
            `;
        }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background:#0f172a; border-radius: 8px; font-family: 'Noto Sans SC', system-ui, sans-serif;">
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
        </defs>
        <rect width="${width}" height="60" fill="#f59e0b" fill-opacity="0.15" rx="8"/>
        <text x="24" y="28" fill="#fbbf24" font-size="14" font-weight="bold">⚠️ PlantUML 远程服务器不可达 (离线降级预览)</text>
        <text x="24" y="48" fill="#94a3b8" font-size="11">${safeError} - 已渲染本地拓扑草图</text>
        <g transform="translate(10, 20)">
            ${edgesSvg}
            ${nodesSvg}
        </g>
    </svg>`;
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return res;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

export async function renderPlantUML(code: string, serverUrl = 'https://www.plantuml.com/plantuml'): Promise<string> {
    const encoded = plantumlEncoder.encode(code);
    const candidateServers = Array.from(new Set([serverUrl, ...DEFAULT_SERVERS])).filter(Boolean);

    let lastError: any = null;

    for (const srv of candidateServers) {
        const cleanBase = srv.replace(/\/$/, '');
        const targetUrl = cleanBase.includes('kroki.io')
            ? `${cleanBase}/plantuml/svg/${encoded}`
            : `${cleanBase}/svg/${encoded}`;

        try {
            const response = await fetchWithTimeout(targetUrl, 6000);
            if (response.ok) {
                return await response.text();
            }
            lastError = new Error(`Server ${srv} responded with ${response.status} ${response.statusText}`);
        } catch (e: any) {
            lastError = e;
        }
    }

    console.warn("All PlantUML servers failed. Falling back to offline structural SVG.", lastError);
    return generateOfflineFallbackSvg(code, lastError?.message || 'Network timeout or unreachable');
}

/**
 * Pings a PlantUML server to check connectivity and measure latency.
 */
export async function pingPlantUMLServer(serverUrl: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    const cleanBase = (serverUrl || 'https://www.plantuml.com/plantuml').replace(/\/$/, '');
    const pingCode = '@startuml\nAlice -> Bob : ping\n@enduml';
    const encoded = plantumlEncoder.encode(pingCode);
    const targetUrl = cleanBase.includes('kroki.io')
        ? `${cleanBase}/plantuml/svg/${encoded}`
        : `${cleanBase}/svg/${encoded}`;

    try {
        const res = await fetchWithTimeout(targetUrl, 5000);
        const duration = Math.round(performance.now() - start);
        if (res.ok) {
            return { ok: true, latencyMs: duration };
        }
        return { ok: false, latencyMs: duration, error: `HTTP ${res.status} ${res.statusText}` };
    } catch (e: any) {
        const duration = Math.round(performance.now() - start);
        return { ok: false, latencyMs: duration, error: e?.message || 'Connection timeout or CORS error' };
    }
}
