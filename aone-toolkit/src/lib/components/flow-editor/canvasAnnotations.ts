/**
 * Canvas Annotations Service
 * 
 * Problem: No way to add notes or annotations to workflows for documentation
 * Solution: Annotation system for adding notes, comments, and visual markers
 * 
 * Benefits:
 * - Better workflow documentation
 * - Improved collaboration
 * - Visual organization of complex flows
 */

import { writable, derived, get } from 'svelte/store';
import type { FlowNode } from './types';

// Annotation types
export interface CanvasAnnotation {
  id: string;
  type: 'note' | 'comment' | 'highlight' | 'marker' | 'arrow';
  content: string;
  position: { x: number; y: number };
  style: AnnotationStyle;
  linkedNodeId?: string;
  linkedEdgeId?: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
  color?: string;
}

export interface AnnotationStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  opacity?: number;
  arrowStart?: { x: number; y: number };
  arrowEnd?: { x: number; y: number };
}

/**
 * P3-18: Render lightweight Markdown for sticky notes & annotations
 */
export function renderAnnotationMarkdown(markdown: string): string {
  if (!markdown) return '';
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code `code`
  html = html.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono text-[11px]">$1</code>');
  // Unordered list
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-3 list-disc">$1</li>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// Annotation presets
export const ANNOTATION_PRESETS = {
  note: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    textColor: '#92400e',
    fontSize: 14,
  },
  comment: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    textColor: '#1e40af',
    fontSize: 13,
  },
  highlight: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
    borderWidth: 2,
    borderRadius: 4,
    textColor: '#92400e',
    fontSize: 12,
  },
  marker: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 50,
    textColor: '#991b1b',
    fontSize: 12,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderColor: '#6b7280',
    borderWidth: 2,
    borderRadius: 0,
    textColor: '#374151',
    fontSize: 12,
  },
};

// Stores
export const annotations = writable<CanvasAnnotation[]>([]);
export const selectedAnnotationId = writable<string | null>(null);
export const annotationFilter = writable<string | null>(null);

// Filtered annotations
export const filteredAnnotations = derived(
  [annotations, annotationFilter],
  ([$annotations, $filter]) => {
    if (!$filter) return $annotations;
    return $annotations.filter(a => a.type === $filter);
  }
);

// Add annotation
export function addAnnotation(
  type: CanvasAnnotation['type'],
  content: string,
  position: { x: number; y: number },
  options?: Partial<CanvasAnnotation>
): CanvasAnnotation {
  const preset = ANNOTATION_PRESETS[type];
  
  const annotation: CanvasAnnotation = {
    id: `annotation_${Date.now()}`,
    type,
    content,
    position,
    style: { ...preset },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...options,
  };
  
  annotations.update(list => [...list, annotation]);
  
  return annotation;
}

// Update annotation
export function updateAnnotation(
  id: string,
  updates: Partial<CanvasAnnotation>
): boolean {
  let found = false;
  
  annotations.update(list => {
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: Date.now(),
      };
      found = true;
    }
    return list;
  });
  
  return found;
}

// Delete annotation
export function deleteAnnotation(id: string): boolean {
  let found = false;
  
  annotations.update(list => {
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      found = true;
    }
    return list;
  });
  
  if (found && get(selectedAnnotationId) === id) {
    selectedAnnotationId.set(null);
  }
  
  return found;
}

// Select annotation
export function selectAnnotation(id: string | null) {
  selectedAnnotationId.set(id);
}

// Get annotation by ID
export function getAnnotationById(id: string): CanvasAnnotation | undefined {
  return get(annotations).find(a => a.id === id);
}

// Get annotations for node
export function getAnnotationsForNode(nodeId: string): CanvasAnnotation[] {
  return get(annotations).filter(a => a.linkedNodeId === nodeId);
}

// Get annotations for edge
export function getAnnotationsForEdge(edgeId: string): CanvasAnnotation[] {
  return get(annotations).filter(a => a.linkedEdgeId === edgeId);
}

// Link annotation to node
export function linkAnnotationToNode(annotationId: string, nodeId: string): boolean {
  return updateAnnotation(annotationId, { linkedNodeId: nodeId });
}

// Link annotation to edge
export function linkAnnotationToEdge(annotationId: string, edgeId: string): boolean {
  return updateAnnotation(annotationId, { linkedEdgeId: edgeId });
}

// Clear all annotations
export function clearAllAnnotations() {
  annotations.set([]);
  selectedAnnotationId.set(null);
}

// Export annotations
export function exportAnnotations(): string {
  return JSON.stringify(get(annotations), null, 2);
}

// Import annotations
export function importAnnotations(json: string): number {
  try {
    const imported = JSON.parse(json) as CanvasAnnotation[];
    let count = 0;
    
    annotations.update(list => {
      imported.forEach(annotation => {
        list.push({
          ...annotation,
          id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        count++;
      });
      return list;
    });
    
    return count;
  } catch {
    return 0;
  }
}

// Create note at position
export function createNote(
  content: string,
  position: { x: number; y: number }
): CanvasAnnotation {
  return addAnnotation('note', content, position);
}

// Create comment at position
export function createComment(
  content: string,
  position: { x: number; y: number },
  author?: string
): CanvasAnnotation {
  return addAnnotation('comment', content, position, { author });
}

// Create highlight area
export function createHighlight(
  position: { x: number; y: number },
  style?: Partial<AnnotationStyle>
): CanvasAnnotation {
  return addAnnotation('highlight', '', position, { style: { ...ANNOTATION_PRESETS.highlight, ...style } });
}

// Create marker
export function createMarker(
  content: string,
  position: { x: number; y: number },
  color?: string
): CanvasAnnotation {
  return addAnnotation('marker', content, position, { color });
}

// Create arrow annotation
export function createArrow(
  start: { x: number; y: number },
  end: { x: number; y: number },
  content?: string
): CanvasAnnotation {
  return addAnnotation('arrow', content || '', start, {
    style: {
      ...ANNOTATION_PRESETS.arrow,
      arrowStart: start,
      arrowEnd: end,
    },
  });
}

// Duplicate annotation
export function duplicateAnnotation(id: string): CanvasAnnotation | null {
  const original = getAnnotationById(id);
  if (!original) return null;
  
  return addAnnotation(
    original.type,
    original.content,
    {
      x: original.position.x + 20,
      y: original.position.y + 20,
    },
    {
      style: { ...original.style },
      linkedNodeId: original.linkedNodeId,
      linkedEdgeId: original.linkedEdgeId,
      author: original.author,
      color: original.color,
    }
  );
}

export const annotationUtils = {
  ANNOTATION_PRESETS,
  annotations,
  selectedAnnotationId,
  annotationFilter,
  filteredAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  selectAnnotation,
  getAnnotationById,
  getAnnotationsForNode,
  getAnnotationsForEdge,
  linkAnnotationToNode,
  linkAnnotationToEdge,
  clearAllAnnotations,
  exportAnnotations,
  importAnnotations,
  createNote,
  createComment,
  createHighlight,
  createMarker,
  createArrow,
  duplicateAnnotation,
};

export default annotationUtils;
