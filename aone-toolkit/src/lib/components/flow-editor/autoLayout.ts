/**
 * Auto Layout Service for Flow Canvas
 * 
 * Implements hierarchical topological layout (Sugiyama-style)
 * Supports horizontal (Left-to-Right) and vertical (Top-to-Bottom) flow directions.
 */

import { flowState } from './flowState.svelte';
import type { FlowNode, FlowEdge } from './types';

export interface LayoutOptions {
  direction?: 'horizontal' | 'vertical';
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  startX?: number;
  startY?: number;
}

export function applyAutoLayout(options: LayoutOptions = {}): boolean {
  const {
    direction = 'horizontal',
    nodeWidth = 220,
    nodeHeight = 110,
    horizontalSpacing = 80,
    verticalSpacing = 60,
    startX = 100,
    startY = 100
  } = options;

  const nodes = [...flowState.nodes];
  const edges = [...flowState.edges];

  if (nodes.length === 0) return false;

  // 1. Build adjacency graph & in-degree map
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();
  const nodeMap = new Map<string, FlowNode>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
    nodeMap.set(n.id, n);
  });

  edges.forEach(e => {
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
    if (outEdges.has(e.source)) {
      outEdges.get(e.source)!.push(e.target);
    }
  });

  // 2. Layer assignment using BFS / Kahn's algorithm
  const layers: string[][] = [];
  const nodeLayer = new Map<string, number>();
  const visited = new Set<string>();

  // Find root nodes (inDegree === 0 or 'start' type)
  let currentLayer = nodes
    .filter(n => (inDegree.get(n.id) === 0) || n.type === 'start')
    .map(n => n.id);

  if (currentLayer.length === 0 && nodes.length > 0) {
    currentLayer = [nodes[0].id];
  }

  let layerIndex = 0;
  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    currentLayer.forEach(id => {
      nodeLayer.set(id, layerIndex);
      visited.add(id);
    });

    const nextLayerSet = new Set<string>();
    currentLayer.forEach(id => {
      const targets = outEdges.get(id) || [];
      targets.forEach(targetId => {
        if (!visited.has(targetId)) {
          nextLayerSet.add(targetId);
        }
      });
    });

    currentLayer = Array.from(nextLayerSet);
    layerIndex++;
    if (layerIndex > 100) break; // Safety break
  }

  // Handle any orphaned / unvisited nodes by placing them in the last layer
  const unvisited = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
  if (unvisited.length > 0) {
    layers.push(unvisited);
  }

  // 3. Compute positions for each layer
  layers.forEach((layerNodeIds, colIndex) => {
    const totalCount = layerNodeIds.length;
    layerNodeIds.forEach((id, rowIndex) => {
      let x = 0;
      let y = 0;

      if (direction === 'horizontal') {
        x = startX + colIndex * (nodeWidth + horizontalSpacing);
        const colCenterY = startY + ((layers[0]?.length || 1) * (nodeHeight + verticalSpacing)) / 2;
        const colTotalHeight = totalCount * nodeHeight + (totalCount - 1) * verticalSpacing;
        const colStartY = Math.max(startY, colCenterY - colTotalHeight / 2);
        y = colStartY + rowIndex * (nodeHeight + verticalSpacing);
      } else {
        y = startY + colIndex * (nodeHeight + verticalSpacing);
        const rowCenterX = startX + ((layers[0]?.length || 1) * (nodeWidth + horizontalSpacing)) / 2;
        const rowTotalWidth = totalCount * nodeWidth + (totalCount - 1) * horizontalSpacing;
        const rowStartX = Math.max(startX, rowCenterX - rowTotalWidth / 2);
        x = rowStartX + rowIndex * (nodeWidth + horizontalSpacing);
      }

      flowState.updateNode(id, {
        position: { x: Math.round(x), y: Math.round(y) }
      });
    });
  });

  return true;
}
