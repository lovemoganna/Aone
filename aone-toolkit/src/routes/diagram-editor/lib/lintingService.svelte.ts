import { lintDiagram, type LintResult } from './linting';
import { getAutoFixes } from './autofix';
import { validateDiagram, type QualityMetrics, type ValidationIssue } from './validationService';

export interface LintAnalysis {
    results: LintResult[];
    metrics: QualityMetrics;
    allIssues: ValidationIssue[];
}

export class LintingService {
    lint(code: string, mode: 'plantuml' | 'graphviz'): LintAnalysis {
        // 1. Standard Syntax Linting
        const rawResults = lintDiagram(code, mode);
        const results = rawResults.map((r) => ({
            ...r,
            actions: getAutoFixes(r.message, code, mode)
        }));

        // 2. Advanced Validation & Metrics
        const rawMetrics = validateDiagram(code, mode);

        // Convert syntax errors into unified ValidationIssues
        const syntaxIssues: ValidationIssue[] = results.map((r, i) => ({
            id: `syntax-${r.line}-${r.column}-${i}`,
            severity: r.severity,
            message: r.message,
            line: r.line,
            column: r.column,
            suggestion: r.actions && r.actions.length > 0 ? r.actions[0].description : undefined,
            autoFix: r.actions && r.actions.length > 0 ? r.actions[0].apply : undefined
        }));

        // Merge syntax issues with best-practice issues
        const combinedIssues = [...syntaxIssues, ...rawMetrics.issues];

        // Recalculate metrics score including syntax errors
        let adjustedScore = rawMetrics.score;
        adjustedScore -= syntaxIssues.filter((s) => s.severity === 'error').length * 25;
        adjustedScore -= syntaxIssues.filter((s) => s.severity === 'warning').length * 10;

        const metrics: QualityMetrics = {
            ...rawMetrics,
            score: Math.max(0, adjustedScore),
            issues: combinedIssues
        };

        return {
            results,
            metrics,
            allIssues: combinedIssues
        };
    }
}

export const lintingService = new LintingService();
