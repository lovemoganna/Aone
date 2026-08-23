/**
 * Execution Time Machine Service
 * 
 * Problem: After workflow execution, cannot replay or step through the execution history
 * Solution: Store execution snapshots and provide time-travel debugging
 * 
 * Benefits:
 * - Replay workflow execution step by step
 * - Debug complex flows by stepping back
 * - Understand execution order visually
 */

import { writable, get } from 'svelte/store';
import type { FlowNode, FlowEdge } from './types';

// Execution step snapshot
export interface ExecutionStep {
    id: string;
    timestamp: number;
    stepIndex: number;
    nodeId: string;
    nodeLabel: string;
    status: 'waiting' | 'running' | 'completed' | 'error';
    input?: any;
    output?: any;
    error?: string;
    duration?: number;
}

// Execution snapshot for time travel
export interface ExecutionSnapshot {
    id: string;
    workflowId: string;
    startTime: number;
    endTime?: number;
    steps: ExecutionStep[];
    nodeStates: Map<string, {
        status: 'idle' | 'waiting' | 'running' | 'completed' | 'error';
        input?: any;
        output?: any;
        error?: string;
        timestamp: number;
    }>;
}

// Store for execution history
export const executionHistory = writable<ExecutionSnapshot | null>(null);
export const currentStepIndex = writable<number>(-1);

// Current execution being recorded
let currentExecutionId: string | null = null;
let stepCounter = 0;

// Start recording a new execution
export function startExecutionRecording(workflowId: string): string {
    const executionId = `exec_${Date.now()}`;
    currentExecutionId = executionId;
    stepCounter = 0;
    
    const snapshot: ExecutionSnapshot = {
        id: executionId,
        workflowId,
        startTime: Date.now(),
        steps: [],
        nodeStates: new Map(),
    };
    
    executionHistory.set(snapshot);
    currentStepIndex.set(-1);
    
    return executionId;
}

// Record a step execution
export function recordStep(
    nodeId: string,
    nodeLabel: string,
    status: ExecutionStep['status'],
    input?: any,
    output?: any,
    error?: string,
    duration?: number
): void {
    const history = get(executionHistory);
    if (!history) return;
    
    const step: ExecutionStep = {
        id: `step_${Date.now()}_${stepCounter++}`,
        timestamp: Date.now(),
        stepIndex: stepCounter,
        nodeId,
        nodeLabel,
        status,
        input,
        output,
        error,
        duration,
    };
    
    history.steps.push(step);
    
    // Update node state
    history.nodeStates.set(nodeId, {
        status,
        input,
        output,
        error,
        timestamp: Date.now(),
    });
    
    executionHistory.set(history);
    currentStepIndex.set(history.steps.length - 1);
}

// End execution recording
export function endExecutionRecording(): void {
    const history = get(executionHistory);
    if (history) {
        history.endTime = Date.now();
        executionHistory.set(history);
    }
    currentExecutionId = null;
}

// Get snapshot at specific step
export function getSnapshotAtStep(stepIndex: number): Map<string, ExecutionSnapshot['nodeStates'] extends Map<string, infer V> ? V : never> | null {
    const history = get(executionHistory);
    if (!history || stepIndex < 0 || stepIndex >= history.steps.length) {
        return null;
    }
    
    // Build state up to this step
    const states = new Map();
    for (let i = 0; i <= stepIndex; i++) {
        const step = history.steps[i];
        if (step) {
            states.set(step.nodeId, {
                status: step.status,
                input: step.input,
                output: step.output,
                error: step.error,
                timestamp: step.timestamp,
            });
        }
    }
    
    return states;
}

// Navigate to specific step
export function navigateToStep(stepIndex: number): boolean {
    const history = get(executionHistory);
    if (!history || stepIndex < -1 || stepIndex >= history.steps.length) {
        return false;
    }
    
    currentStepIndex.set(stepIndex);
    return true;
}

// Step forward
export function stepForward(): boolean {
    const history = get(executionHistory);
    const current = get(currentStepIndex);
    
    if (!history || current >= history.steps.length - 1) {
        return false;
    }
    
    currentStepIndex.set(current + 1);
    return true;
}

// Step backward
export function stepBackward(): boolean {
    const current = get(currentStepIndex);
    
    if (current <= 0) {
        currentStepIndex.set(-1); // Go to start (no nodes highlighted)
        return true;
    }
    
    currentStepIndex.set(current - 1);
    return true;
}

// Jump to start
export function jumpToStart(): void {
    currentStepIndex.set(-1);
}

// Jump to end
export function jumpToEnd(): void {
    const history = get(executionHistory);
    if (history) {
        currentStepIndex.set(history.steps.length - 1);
    }
}

// Clear history
export function clearHistory(): void {
    executionHistory.set(null);
    currentStepIndex.set(-1);
}

// Get current step info
export function getCurrentStep(): ExecutionStep | null {
    const history = get(executionHistory);
    const current = get(currentStepIndex);
    
    if (!history || current < 0 || current >= history.steps.length) {
        return null;
    }
    
    return history.steps[current];
}

// Is at end
export function isAtEnd(): boolean {
    const history = get(executionHistory);
    const current = get(currentStepIndex);
    
    if (!history) return true;
    return current >= history.steps.length - 1;
}

// Is at start
export function isAtStart(): boolean {
    const current = get(currentStepIndex);
    return current < 0;
}

// Get progress percentage
export function getProgress(): number {
    const history = get(executionHistory);
    const current = get(currentStepIndex);
    
    if (!history || history.steps.length === 0) return 0;
    
    return Math.round((current / (history.steps.length - 1)) * 100);
}

export const timeTravelUtils = {
    startExecutionRecording,
    recordStep,
    endExecutionRecording,
    getSnapshotAtStep,
    navigateToStep,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    clearHistory,
    getCurrentStep,
    isAtEnd,
    isAtStart,
    getProgress,
    executionHistory,
    currentStepIndex,
};

export default timeTravelUtils;
