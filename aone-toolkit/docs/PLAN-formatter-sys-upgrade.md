# PLAN-formatter-sys-upgrade

## Task
Systematic upgrade of the Code Formatter module, Phase 1: Intelligent Perception and Intent Understanding.

## Agent Assignments

| Step | Agent | Action |
|------|-------|--------|
| 1 | `backend-specialist` | Implement `ContextBridge.ts` for Chameleon Paste. Enable dynamic formatting depending on paste depth. |
| 2 | `backend-specialist` | Implement `ProjectStyleMiner.ts` for heuristic format inference based on active ASTs. |
| 3 | `backend-specialist` | Extend `TemplateMixer.ts` for Nested DSL formatting. |
| 4 | `frontend-specialist` | Implement `SemanticGrouper.ts` for semantic variable protections. |
| 5 | `backend-specialist` | Enhance `AliasInferencer.ts` with UsageCounter for Frequency-Based sorting. |

## Verification Checklist
- [ ] Automated tests run for `ContextBridge`, `ProjectStyleMiner`, `TemplateMixer`, `SemanticGrouper`, and `AliasInferencer`.
- [ ] `lint_runner.py` passed.
- [ ] `test_runner.py` passed.
- [ ] `security_scan.py` passed.
