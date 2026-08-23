/**
 * Infinite Canvas Service for Flow Editor
 * 
 * Problem: Fixed canvas bounds limit workflow size and flexibility
 * Solution: Unlimited canvas with smart viewport management and grid system
 * 
 * Benefits:
 * - Unlimited workflow size
 * - Smooth pan/zoom at any scale
 * - Smart viewport culling for performance
 * - Grid snapping for alignment
 */

import { writable, derived, get } from 'svelte/store';

// Canvas state
export interface InfiniteCanvasState {
  // Viewport
  x: number;
  y: number;
  zoom: number;
  
  // Canvas bounds (virtual infinite)
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  
  // Grid settings
  gridEnabled: boolean;
  gridSize: number;
  gridSnap: boolean;
  
  // Viewport culling
  visibleArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Mini-map
  miniMapEnabled: boolean;
  miniMapPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  // Performance
  virtualizationEnabled: boolean;
  renderThreshold: number;
}

// Default state
const DEFAULT_CANVAS_STATE: InfiniteCanvasState = {
  x: 0,
  y: 0,
  zoom: 1,
  minX: -100000,
  minY: -100000,
  maxX: 100000,
  maxY: 100000,
  gridEnabled: true,
  gridSize: 20,
  gridSnap: true,
  visibleArea: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  },
  miniMapEnabled: true,
  miniMapPosition: 'bottom-right',
  virtualizationEnabled: true,
  renderThreshold: 500,
};

// Create stores
export const canvasState = writable<InfiniteCanvasState>({ ...DEFAULT_CANVAS_STATE });

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

// Derived viewport
export const viewport = derived(canvasState, ($state) => ({
  x: $state.x,
  y: $state.y,
  zoom: $state.zoom,
  width: $state.visibleArea.width / $state.zoom,
  height: $state.visibleArea.height / $state.zoom,
}));

// Pan canvas
export function pan(deltaX: number, deltaY: number) {
  canvasState.update(state => ({
    ...state,
    x: Math.max(state.minX, Math.min(state.maxX, state.x + deltaX)),
    y: Math.max(state.minY, Math.min(state.maxY, state.y + deltaY)),
  }));
}

// Set viewport position
export function setViewport(x: number, y: number, zoom?: number) {
  canvasState.update(state => ({
    ...state,
    x,
    y,
    zoom: zoom !== undefined ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) : state.zoom,
  }));
}

// Zoom in
export function zoomIn(centerX?: number, centerY?: number) {
  canvasState.update(state => {
    const newZoom = Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP);
    return { ...state, zoom: newZoom };
  });
}

// Zoom out
export function zoomOut(centerX?: number, centerY?: number) {
  canvasState.update(state => {
    const newZoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);
    return { ...state, zoom: newZoom };
  });
}

// Zoom to fit nodes
export function zoomToFit(nodes: Array<{ position: { x: number; y: number }; width?: number; height?: number }>, padding = 50) {
  if (nodes.length === 0) return;
  
  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxX: Math.max(acc.maxX, node.position.x + (node.width || 200)),
      maxY: Math.max(acc.maxY, node.position.y + (node.height || 100)),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
  
  const state = get(canvasState);
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  
  const zoomX = state.visibleArea.width / width;
  const zoomY = state.visibleArea.height / height;
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)));
  
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  
  canvasState.update(s => ({
    ...s,
    zoom: newZoom,
    x: centerX - (state.visibleArea.width / newZoom) / 2,
    y: centerY - (state.visibleArea.height / newZoom) / 2,
  }));
}

// Zoom to specific percentage
export function zoomTo(percentage: number) {
  canvasState.update(state => ({
    ...state,
    zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, percentage)),
  }));
}

// Reset zoom to 100%
export function resetZoom() {
  canvasState.update(state => ({ ...state, zoom: 1 }));
}

// Toggle grid
export function toggleGrid() {
  canvasState.update(state => ({ ...state, gridEnabled: !state.gridEnabled }));
}

// Toggle grid snap
export function toggleGridSnap() {
  canvasState.update(state => ({ ...state, gridSnap: !state.gridSnap }));
}

// Set grid size
export function setGridSize(size: number) {
  canvasState.update(state => ({ ...state, gridSize: Math.max(5, Math.min(100, size)) }));
}

// Snap position to grid
export function snapToGrid(position: { x: number; y: number }): { x: number; y: number } {
  const state = get(canvasState);
  if (!state.gridSnap) return position;
  
  return {
    x: Math.round(position.x / state.gridSize) * state.gridSize,
    y: Math.round(position.y / state.gridSize) * state.gridSize,
  };
}

// Update visible area (for culling)
export function updateVisibleArea(width: number, height: number) {
  canvasState.update(state => ({
    ...state,
    visibleArea: {
      ...state.visibleArea,
      width,
      height,
    },
  }));
}

// Check if element is in visible area
export function isInViewport(
  x: number,
  y: number,
  width = 0,
  height = 0,
  margin = 100
): boolean {
  const state = get(canvasState);
  const viewX = state.x - margin;
  const viewY = state.y - margin;
  const viewWidth = state.visibleArea.width / state.zoom + margin * 2;
  const viewHeight = state.visibleArea.height / state.zoom + margin * 2;
  
  return (
    x + width > viewX &&
    x < viewX + viewWidth &&
    y + height > viewY &&
    y < viewY + viewHeight
  );
}

// Get visible nodes (for virtualization)
export function getVisibleNodes<T extends { position: { x: number; y: number }; width?: number; height?: number }>(
  nodes: T[],
  margin = 200
): T[] {
  const state = get(canvasState);
  const viewX = state.x - margin / state.zoom;
  const viewY = state.y - margin / state.zoom;
  const viewWidth = state.visibleArea.width / state.zoom + (margin * 2) / state.zoom;
  const viewHeight = state.visibleArea.height / state.zoom + (margin * 2) / state.zoom;
  
  return nodes.filter(node => {
    const nx = node.position.x;
    const ny = node.position.y;
    const nw = node.width || 200;
    const nh = node.height || 100;
    
    return (
      nx + nw > viewX &&
      nx < viewX + viewWidth &&
      ny + nh > viewY &&
      ny < viewY + viewHeight
    );
  });
}

// Toggle mini-map
export function toggleMiniMap() {
  canvasState.update(state => ({ ...state, miniMapEnabled: !state.miniMapEnabled }));
}

// Set mini-map position
export function setMiniMapPosition(position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') {
  canvasState.update(state => ({ ...state, miniMapPosition: position }));
}

// Convert screen coordinates to canvas coordinates
export function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
  const state = get(canvasState);
  return {
    x: (screenX - state.visibleArea.width / 2) / state.zoom + state.x,
    y: (screenY - state.visibleArea.height / 2) / state.zoom + state.y,
  };
}

// Convert canvas coordinates to screen coordinates
export function canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
  const state = get(canvasState);
  return {
    x: (canvasX - state.x) * state.zoom + state.visibleArea.width / 2,
    y: (canvasY - state.y) * state.zoom + state.visibleArea.height / 2,
  };
}

// Wheel zoom handler
export function handleWheelZoom(event: WheelEvent, containerRect: DOMRect): { zoom: number; panX: number; panY: number } {
  const state = get(canvasState);
  
  const mouseX = event.clientX - containerRect.left;
  const mouseY = event.clientY - containerRect.top;
  
  const canvasX = (mouseX - containerRect.width / 2) / state.zoom + state.x;
  const canvasY = (mouseY - containerRect.height / 2) / state.zoom + state.y;
  
  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom + delta));
  
  const newX = canvasX - (mouseX - containerRect.width / 2) / newZoom;
  const newY = canvasY - (mouseY - containerRect.height / 2) / newZoom;
  
  return {
    zoom: newZoom,
    panX: newX,
    panY: newY,
  };
}

// Reset canvas to default
export function resetCanvas() {
  canvasState.set({ ...DEFAULT_CANVAS_STATE });
}

// Export state
export function exportCanvasState(): string {
  return JSON.stringify(get(canvasState), null, 2);
}

// Import state
export function importCanvasState(json: string): boolean {
  try {
    const state = JSON.parse(json);
    canvasState.set({ ...DEFAULT_CANVAS_STATE, ...state });
    return true;
  } catch {
    return false;
  }
}

export const infiniteCanvasUtils = {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  canvasState,
  viewport,
  pan,
  setViewport,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToFit,
  resetZoom,
  toggleGrid,
  toggleGridSnap,
  setGridSize,
  snapToGrid,
  updateVisibleArea,
  isInViewport,
  getVisibleNodes,
  toggleMiniMap,
  setMiniMapPosition,
  screenToCanvas,
  canvasToScreen,
  handleWheelZoom,
  resetCanvas,
  exportCanvasState,
  importCanvasState,
};

export default infiniteCanvasUtils;
