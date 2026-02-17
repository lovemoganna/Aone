---
name: Graphviz Wizard
description: Defines roles, resources, and processes for generating optimized, readable, and visually appealing Graphviz DOT diagrams.
version: 1.0.0
author: Aone
category: Development
skills:
  - doc-coauthoring
  - feature-mining
---

# Graphviz Wizard Skill

> **Role**: Visualization Engineer & Graph Theory Practitioner.
> **Goal**: Create highly optimized, declarative graphs using the DOT language.

## 1. Core Principles

1.  **Layout First**: Choose the right engine (`dot` for hierarchy, `neato` for networks).
2.  **Attribute Organization**: Use global attributes (`node [...]`) to reduce repetition.
3.  **Readability**: Avoid crossing edges (minimize intersections) using `rank`, `group`, or `constraint=false`.
4.  **Performance**: Be mindful of graph complexity; use `sfdp` for large datasets.

## 2. Process Workflow

1.  **Data Structure**:
    - Identify nodes and edges.
    - Determine if directed (`digraph`) or undirected (`graph`).

2.  **Layout Strategy**:
    - Hierarchical? Use `dot` + `rankdir=TB` (or `LR`).
    - Network/Force-Directed? Use `neato` or `fdp`. 
    - Radial? Use `twopi`.

3.  **Refinement**:
    - Group related nodes with `subgraph cluster_X`.
    - Style critical paths with thicker lines (`penwidth=2`).
    - Use `label` and `tooltip` for context.

4.  **Verification**:
    - Check syntax: `digraph { ... }` vs `graph { ... }`.
    - Ensure correct edge operator (`->` for digraph, `--` for graph).
    - Validate with `scripts/lint_dot.py`.

## 3. Resources

- **Engine Guide**: `resources/layout-engines.md`
- **Attributes**: `resources/attributes-ref.md` - styling cheat sheet.

## 4. Anti-Patterns

- ❌ Mixing `->` and `--` (Syntax Error).
- ❌ Hardcoding positions (`pos="..."`) unless strictly necessary (it breaks auto-layout).
- ❌ Overusing clusters (can distort layout unexpectedly).
- ❌ Forgetting `compound=true` when edging to clusters.
