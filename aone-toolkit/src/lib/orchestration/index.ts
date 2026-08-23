/**
 * 编排模块 - 导出
 */

export * from './types';
export { orchestrationEngine, default as OrchestrationEngine } from './engine';
export { BUILT_IN_SCENARIOS } from './types';
export { workflowStore, type WorkflowRecord, type WorkflowEditState } from './workflowStore.svelte';
export { workflowStore as templateStore } from './workflowStore.svelte';

// Dependency Analyzer (NEW)
export * from './dependency-analyzer';

// Skill Set Templates
export * from './skill-set-template';
export * from './skill-set-template-registry';
export { skillSetTemplateRegistry, default as SkillSetTemplateRegistry } from './skill-set-template-registry';

// Compatibility Matrix
export * from './compatibility-matrix';
export { compatibilityMatrixBuilder, default as CompatibilityMatrixBuilder } from './compatibility-matrix';

// Dynamic Skill Composer
export * from './dynamic-skill-composer';
export { dynamicSkillComposer, default as DynamicSkillComposer } from './dynamic-skill-composer';

// Context-Aware Router
export * from './context-aware-router';
export { contextAwareRouter, default as ContextAwareRouter } from './context-aware-router';

// Execution State
export * from './execution-state';
export { executionStateManager, default as ExecutionStateManager } from './execution-state';

// Metrics
export * from './metrics';
export { metricsCollector, default as MetricsCollector } from './metrics';

// Debugger
export * from './debugger';
export { orchestrationDebugger, default as OrchestrationDebugger } from './debugger';

// Version History (NEW)
export * from './versionHistory';
export { versionHistoryUtils, default as VersionHistoryUtils } from './versionHistory';

// P3-3: Log Export
export * from './logExport';

// P3-5: Type Documentation
export * from './typeDocs';
