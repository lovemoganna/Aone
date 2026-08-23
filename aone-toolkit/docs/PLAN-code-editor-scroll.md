# Plan: 修复 Code Interpreter 代码编辑器滚动与划选 Bug

针对 `http://localhost:5173/code-interpreter` 中代码编辑区域滚动的两个具体 Bug 进行根因分析与系统化修复方案制定。

---

## 1. 缺陷背景与问题现象

| 编号 | 缺陷现象 | 重现路径 | 用户感知 |
| :--- | :--- | :--- | :--- |
| **Bug 1** | **滚轮失效** | 鼠标滚轮/中键悬停在代码编辑器内容区域或行号区域滚动 | 无法通过滚轮查看超出视口的代码，滚动完全无响应 |
| **Bug 2** | **划选突兀与撕裂跳帧** | 鼠标长按拖拽文本向下/向上划选触发自动滚动 | 画面发生剧烈抖动、DOM 行高与选区反复跳跃、严重撕裂与掉帧 |

---

## 2. 深入根因分析 (Root Cause Analysis)

### 2.1 Bug 1（滚轮失效）根因
1. **非标准绝对定位破坏 CodeMirror 6 布局流**：
   在 `src/lib/components/ui/CodeEditor.svelte` 中，通过全局样式强制注入了：
   ```css
   :global(.cm-editor) { position: absolute !important; ... }
   :global(.cm-scroller) { position: absolute !important; ... overscroll-behavior: contain !important; }
   ```
2. **滚动尺寸测量失真**：
   CodeMirror 6 默认依赖 Flex 容器布局，`.cm-scroller` 负责承载 `.cm-gutters`（行号）和 `.cm-content`（编辑区）。将其强制设置为 `position: absolute` 后，脱离了 CM6 内部 `scrollDOM` 的正常盒模型流，导致滚轮事件触发时 `scrollHeight`、`clientHeight` 与滚动手势无法正常协同。
3. **多层 `overflow: hidden` 嵌套与冲突**：
   `+page.svelte` 与 `CodeEditor.svelte` 容器外层包裹了多层 `absolute inset-0 overflow-hidden`，导致滚轮冒泡被截断或失效。

### 2.2 Bug 2（划选突兀/撕裂跳帧）根因
1. **CM6 虚拟视口与选区测量抖动 (Layout / Measurement Thrashing)**：
   CM6 使用视口虚拟化（Viewport Virtualization），在用户拖拽划选超出可视边缘时会通过 `view.requestMeasure()` 动态计算鼠标相对 `scrollDOM.getBoundingClientRect()` 的偏移以实现平滑自动滚动（Auto-scrolling）。
2. **坐标基准反复重算**：
   由于 `.cm-scroller` 和 `.cm-editor` 被强制绝对定位，加上 `.cm-content { min-height: 100% !important; }` 与外层多重绝对定位嵌套，拖拽选区触发滚动时，每一帧视口虚拟行挂载/卸载时测量的元素坐标出现跳变，导致选区反复拉扯、画面剧烈撕裂与严重掉帧。

---

## 3. 修复方案与技术实现

### 3.1 改造 `CodeEditor.svelte` 样式架构（回归 CM6 标准模式）
1. **移除破坏性的绝对定位样式**：
   - 移除 `:global(.cm-scroller)` 与 `:global(.cm-editor)` 的 `position: absolute !important`。
   - 移除 `:global(.cm-scroller)` 的 `overscroll-behavior: contain !important`（避免滚轮边界锁定）。
2. **规范标准 CodeMirror 6 全高容器样式**：
   - 在 `EditorView.theme` 及组件 CSS 中：
     ```css
     :global(.cm-editor) {
         height: 100% !important;
         width: 100% !important;
         outline: none !important;
     }
     :global(.cm-scroller) {
         overflow: auto !important;
         height: 100% !important;
         font-family: inherit !important;
     }
     :global(.cm-content) {
         padding: 8px 0 !important;
     }
     ```
   - 组件挂载根节点采用 `h-full w-full relative overflow-hidden`。

### 3.2 优化 `+page.svelte` 编辑器容器结构
1. 简化嵌套容器层级，确保父容器提供稳定的 `h-full w-full relative min-h-0`。
2. 保持 DuckDB SQL / Python / JS 各语言模版切换、暗黑模式、快捷键执行（⌘+Enter）、格式化等功能 100% 正常。

---

## 4. 任务拆解与执行步骤

- [ ] **Phase 1: 样式重构与标准 CM6 适配**
  - 重构 [CodeEditor.svelte](file:///c:/Users/luoyu/Downloads/Aone/aone-toolkit/src/lib/components/ui/CodeEditor.svelte) 内部 CSS 与 EditorView 主题配置。
  - 清理冲突的 `position: absolute !important` 及无效覆盖。
- [ ] **Phase 2: 页面级容器与滚动流校验**
  - 校验 [code-interpreter/+page.svelte](file:///c:/Users/luoyu/Downloads/Aone/aone-toolkit/src/routes/code-interpreter/+page.svelte) 的 Flex 布局及高度约束。
  - 检查其他使用 `CodeEditor` 的模块（如 `sql-architect`, `developer-utilities`, `snippets`）确保无回归。
- [ ] **Phase 3: 验证与测试**
  - 滚轮滚动测试：测试长代码下的平滑滚轮上下滚动。
  - 划选拖拽测试：测试长代码拖拽向下自动滚动的平滑度，验证无掉帧与撕裂。
  - 多语言切换与主题切换测试：确认 SQL / Python / JS 切换无闪烁。

---

## 5. 验收标准

1. **Bug 1 验收**：无论鼠标停留在代码区域还是行号区域，滚轮均可顺畅上下滚动。
2. **Bug 2 验收**：鼠标长按拖选代码向底部或顶部滑动时，视口平滑自适应滚动，无闪烁、无撕裂、无选区突兀跳变。
3. **功能回归**：代码高亮、格式化、运行执行、语言切换、错误行高亮等既有功能均正常运作。
