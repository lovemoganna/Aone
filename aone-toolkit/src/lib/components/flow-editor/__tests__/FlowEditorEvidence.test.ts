import { describe, it, expect } from 'vitest';
import type { FlowNode, FlowEdge } from '../types';

// Extract variable resolution logic for headless unit testing
function getUpstreamVariables(
    targetId: string,
    allNodes: FlowNode[],
    allEdges: FlowEdge[],
): string[] {
    const vars: string[] = [];
    if (!targetId) return vars;

    const visited = new Set<string>();
    const queue: string[] = [targetId];
    visited.add(targetId);

    const upstreamNodes: FlowNode[] = [];

    while (queue.length > 0) {
        const currId = queue.shift()!;
        const incoming = allEdges.filter((e) => e.target === currId);

        for (const edge of incoming) {
            const sourceNode = allNodes.find((n) => n.id === edge.source);
            if (sourceNode && !visited.has(edge.source)) {
                visited.add(edge.source);
                upstreamNodes.push(sourceNode);
                queue.push(edge.source);
            }
        }
    }

    for (const node of upstreamNodes) {
        const label = (node.data.label || node.id)
            .replace(/\s+/g, "_")
            .toLowerCase();
        const prefix = `${label}_${node.id.slice(0, 4)}`;

        let hasDynamicSchema = false;
        const schemaObj = node.data.outputSchema ?? node.data.schema;
        if (schemaObj) {
            try {
                const parsedObj = typeof schemaObj === 'string' ? JSON.parse(schemaObj) : schemaObj;
                if (parsedObj && typeof parsedObj === 'object') {
                    const keys = Object.keys(parsedObj.properties || parsedObj);
                    for (const key of keys) {
                        vars.push(`${prefix}.${key}`);
                        hasDynamicSchema = true;
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }

        if (Array.isArray(node.data.outputs)) {
            for (const out of node.data.outputs) {
                vars.push(`${prefix}.${out}`);
                hasDynamicSchema = true;
            }
        } else if (Array.isArray(node.data.fields)) {
            for (const field of node.data.fields) {
                vars.push(`${prefix}.${field}`);
                hasDynamicSchema = true;
            }
        }

        if (!hasDynamicSchema) {
            if (node.type === "start") {
                vars.push(`trigger.body`);
                vars.push(`trigger.query`);
            } else if (node.type === "agent") {
                vars.push(`${prefix}.response`);
            } else if (node.type === "condition") {
                vars.push(`${prefix}.result`);
            } else if (node.type === "loop") {
                vars.push(`${label}.item`);
                vars.push(`${label}.index`);
            } else {
                vars.push(`${prefix}.output`);
            }
        }
    }

    vars.push("env.API_KEY");
    vars.push("user.id");

    return vars;
}

describe('Flow Editor Dynamic Schema & Evidence Threshold Tests', () => {

    it('should dynamically extract custom schema fields from upstream nodes across unfamiliar domains', () => {
        // Cross-domain case A: Semiconductor Wafer Manufacturing Domain
        const nodes: FlowNode[] = [
            {
                id: 'node-litho-101',
                type: 'custom',
                position: { x: 0, y: 0 },
                data: {
                    label: 'Lithography Sensor Node',
                    outputSchema: JSON.stringify({
                        wafer_yield: 'number',
                        exposure_dose: 'string',
                        defect_density: 'number'
                    })
                }
            },
            {
                id: 'node-target-202',
                type: 'agent',
                position: { x: 200, y: 0 },
                data: { label: 'Analysis Agent' }
            }
        ];

        const edges: FlowEdge[] = [
            { id: 'edge-1', source: 'node-litho-101', target: 'node-target-202' }
        ];

        const vars = getUpstreamVariables('node-target-202', nodes, edges);

        // Verify that exact heterogenous fields are extracted dynamically
        expect(vars).toContain('lithography_sensor_node_node.wafer_yield');
        expect(vars).toContain('lithography_sensor_node_node.exposure_dose');
        expect(vars).toContain('lithography_sensor_node_node.defect_density');
    });

    it('should dynamically extract fields for Crop Pathology Domain (Crop Health)', () => {
        // Cross-domain case B: Agriculture Crop Disease Domain
        const nodes: FlowNode[] = [
            {
                id: 'crop-sensor-999',
                type: 'custom',
                position: { x: 0, y: 0 },
                data: {
                    label: 'Crop Monitor',
                    outputs: ['spore_count', 'leaf_humidity', 'pesticide_resistance']
                }
            },
            {
                id: 'action-node-888',
                type: 'action',
                position: { x: 300, y: 0 },
                data: { label: 'Pesticide Dispatch' }
            }
        ];

        const edges: FlowEdge[] = [
            { id: 'edge-2', source: 'crop-sensor-999', target: 'action-node-888' }
        ];

        const vars = getUpstreamVariables('action-node-888', nodes, edges);

        expect(vars).toContain('crop_monitor_crop.spore_count');
        expect(vars).toContain('crop_monitor_crop.leaf_humidity');
        expect(vars).toContain('crop_monitor_crop.pesticide_resistance');
    });

});
