import { lintDiagram, type LintResult } from './linting';
import { getAutoFixes } from './autofix';
import { validateDiagram, type QualityMetrics } from './validationService';

export class LintingService {
    results = $state<LintResult[]>([]);
    metrics = $state<QualityMetrics | null>(null);

    lint(code: string, mode: 'plantuml' | 'graphviz') {
        // 1. Standard Syntax Linting
        const rawResults = lintDiagram(code, mode);
        this.results = rawResults.map(r => ({
            ...r,
            actions: getAutoFixes(r.message, code, mode)
        }));

        // 2. Advanced Validation & Metrics
        this.metrics = validateDiagram(code, mode);

        // Merge validation issues into results if needed, or keep separate
        // For now, let's keep them separate but maybe append critical ones?
        // Actually, validationService issues are more about "Best Practices" whereas linting is "Errors"

        return this.results;
    }
}

export const lintingService = new LintingService();
