# PLAN-orchestration-v2

## Overview

You have initiated the sequential implementation of the 22 Visual Flow Design enhancements for the Orchestration Center Module. This plan breaks down the 22 items into structured phases for orderly implementation, focusing first on **Phase 1 (Node Interaction)**.

## Phase 1: Node Interaction (Items 1-4)
*Focus: Resolving low-efficiency clicking and frequent switching.*

1. **Bulk Operations (批量框选多选与聚合属性编辑)**
   - **Target**: Implement shift-drag selection for multiple nodes.
   - **Action**: Create a unified property panel for computing and rendering 'intersect properties'.
   - **Dependency**: ReactFlow (or x6) multi-selection state management.

2. **Context-Aware Quick Add Ring (启发式防断点悬浮采单)**
   - **Target**: Add a hover menu on node output anchors.
   - **Action**: Dynamically read source node schemas and suggest the Top-3 downstream nodes.

3. **Inline Parameter Preview (表单级节点核心参数内联透视)**
   - **Target**: Display core parameters inside the node card.
   - **Action**: Modify the custom `Node` component to include an expandable summary section.

4. **Schema-based Typing Guard (基于 AST 的跨节点端口强类型校验机制)**
   - **Target**: Type-safe connections preventing runtime crashes.
   - **Action**: Validate edge connection ends based on JSON Schema and offer auto-insertion of Transform nodes if types mismatch.

## Phase 2: Routing & Connection (Items 5-8)
*Focus: Resolving overlap and spaghetti routing.*

5. **Orthogonal Routing & Auto-Layout (磁性避让与正交自动排版算法)**
   - **Target**: Implement orthogonal 'step' lines and auto-layout formatting.
   - **Action**: Update `FlowEdge.svelte` to use a refined orthogonal step implementation. Incorporate Dagre-based Auto Layout button in the toolbar.

6. **Edge Data-Flow Tooltip (数据流转动态预览与连线气泡)**
   - **Target**: Show a tooltip on edge hover displaying expected data schema.
   - **Action**: Add hover interactions on the `<path>` in `FlowEdge.svelte` to display schema inference data.

7. **Path Isolation Spotlight (大规模复杂条件的“向下路径一键聚光灯”)**
   - **Target**: Alt+Click on a node highlights it and all subsequent downstream nodes, dimming the rest.
   - **Action**: Add a new `highlightedNodes` set in `FlowEditor.svelte`. On Alt+Click, traverse the DAG to populate it, and apply CSS opacity to non-highlighted nodes.

8. **Wormholes / Virtual Edges (远跨度虫洞与虚拟化引脚)**
   - **Target**: Allow nodes to pass variables without physical connecting lines.
   - **Action**: Create new "Broadcast" and "Listen" node types, which bind via a dropdown menu picking up available context variables rather than a drawn edge.

## Phase 3: Canvas & Scalability (Items 9-12)
*Focus: Handling large system scale and improving navigation.*
9. **Minimap with Context Radar (带上下文雷达的鹰眼微缩图)**
   - **Target**: Enhance the minimap to show node types and current viewport context dynamically.
   - **Action**: Update `FlowMinimap` to render colored dots based on node type and improve viewport dragging.
10. **Semantic Semantic Zoom (语义化无极缩放)**
    - **Target**: Hide minor details (like parameters) when zoomed out, showing only high-level labels.
    - **Action**: Bind to `<FlowCanvas>` zoom level to conditionally render `FlowNode` details.
11. **Sub-Flow Encapsulation & Grouping (子流程模块化封装与嵌套层级)**
    - **Target**: Allow users to group nodes into cohesive functional blocks that can be collapsed.
    - **Action**: Enhance `group` nodes to act as drop targets and clip/hide child nodes when collapsed.
12. **Canvas Search & Quick Jump (全局节点与参数秒级检索定位)**
    - **Target**: Pressing Ctrl+F opens a search bar to find nodes by name, ID, or internal variable.
    - **Action**: Implement a `FlowSearch` component that filters the `nodes` JSON and pans the canvas to the selected result.

## Phase 4: Debugging & Traceability (Items 13-16)
*Focus: Interactive breakpoints and time-travel.*
- To be detailed after Phase 3 completion.

## Phase 5: Asset Reusability (Items 17-19)
*Focus: Component snippets and Prompt A/B testing.*
- To be detailed after Phase 4 completion.

## Phase 6: Collaboration & Governance (Items 20-22)
*Focus: Visual Graph Diff, Read-only sandboxes, Annotations.*
- To be detailed after Phase 5 completion.

## Verification Plan

Because this is a major architectural UI change, the verification requires:
1. **Component Tests**: Adding UI tests for new custom nodes and sidebars.
2. **E2E Visual Tests**: Running Playwright tests or manual UI verification using `preview` to ensure node dragging, overlapping, and bulk editing works flawlessly without regressions.
3. **Socratic Cleared**: Ensuring edge cases (mixed-type bulk edit, auto-layout collisions) have determined behavior.
