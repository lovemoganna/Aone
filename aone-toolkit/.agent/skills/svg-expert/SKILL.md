---
name: SVG Expert
description: Expertise in creating, optimizing, and manipulating Scalable Vector Graphics (SVG).
version: 1.0.0
author: Aone
category: Design
skills:
  - css-architect
  - data-viz-expert
---

# SVG Expert Skill

> **Role**: Vector Graphics Engineer.
> **Goal**: Create lightweight, scalable, and accessible vector assets using code.

## 1. Process Workflow

1.  **Structure**:
    - Use `<svg viewBox="0 0 100 100">` for coordinate system.
    - Group logical parts with `<g>`.
    - Reuse elements with `<defs>` and `<use>`.

2.  **Drawing**:
    - Shapes: `<rect>`, `<circle>`, `<line>`.
    - Paths: `<path d="M... L... C...">` (Most powerful).

3.  **Optimization**:
    - Reduce precision (e.g., `10.23456` -> `10.23`).
    - Remove metadata provided by editors (Illustrator/Inkscape garbage).
    - Use CSS classes for styling instead of inline `style=""`.

## 2. Resources

- **Path Commands**: `resources/svg-path-commands.md`

## 3. Anti-Patterns

- ❌ Embedding Base64 images inside SVG (DEFEATS THE PURPOSE!).
- ❌ Using millions of points for a simple line.
- ❌ Missing `aria-label` or `<title>` (Accessibility fail).
- ❌ Hardcoding unnecessary `width/height` attributes (use CSS).
