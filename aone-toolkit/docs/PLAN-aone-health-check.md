# aone-toolkit 架构健康度自查与代码债修复计划

**Goal:** 作为资深 SvelteKit 架构专家，全面检查 `aone-toolkit` 的架构健康度，识别并修复 SSR 安全性、死代码及类型/逻辑耦合问题，提升整体系统的健壮性和可维护性。

## User Review Required

- **废弃旧 HTML 的备份策略**：在“无用代码清理”阶段，废弃的根目录 `.html` 文件是直接删除，还是移至 `archive/` 目录存放？
- **JSON/YAML 解析器的解耦范围**：提取出的通用解析器需要覆盖多深的逻辑层？是否需要对现有的错误处理进行统一的格式化返回？

## Open Questions

- 是否需要在 CI 流程中集成 `svelte-check`，以防止未来的类型缺失问题引入？
- 对于需要在浏览器环境执行但目前在 `<script>` 顶层的第三方库初始化，是否也统一放置在 `onMount` 或者 `if (browser)` 块内？

## Proposed Changes

以下为具体实施的修复与重构任务分解：

---

### 阶段 1: SSR 安全性自查与修复

SvelteKit 的 SSR（服务端渲染）会在 Node.js 中执行组件的 `<script>` 顶层代码，直接访问 `window`/`document` 会导致 `npm run build` 或服务端抛错。

- **扫描目标**：`src/routes/` 和 `src/lib/` 下的所有 Svelte 组件。
- **任务内容**：
  - 查找顶层的 `window`、`document`、`navigator` 访问。
  - **[MODIFY]** 将这些浏览器特有 API 的调用迁移至 `onMount` 生命周期中。
  - **[MODIFY]** 若涉及反应性声明，考虑使用 `import { browser } from '$app/environment'` 包装。

---

### 阶段 2: 无用代码清理（清理旧 HTML 与残留引用）

项目演进过程中遗留的旧版静态页面及路由引用会导致系统冗余并可能引起混淆。

- **扫描目标**：项目根目录及其子目录下的 `.html` 文件，以及 `src/` 中所有的路由跳转逻辑。
- **任务内容**：
  - **[DELETE]/[MOVE]** 查找根目录下的废弃 `.html` 文件，将其安全移除或打包备份。
  - **[MODIFY]** 搜索 `<a>` 标签和代码中的编程式导航（`goto`），移除任何指向这些旧 `.html` 的硬编码链接，替换为正确的 SvelteKit 内部路由。

---

### 阶段 3: 类型补全与逻辑收敛（Svelte/TS）

目前视图层中可能混杂着数据解析逻辑，并且缺乏强类型约束。

- **扫描目标**：整个项目源码（运行 `svelte-check`）。
- **任务内容**：
  - **[NEW]** 创建 `src/lib/utils/parsers/` 目录结构。
  - **[NEW]** 提取 `jsonParser.ts` 和 `yamlParser.ts` 通用工具函数，封装并规范异常捕获与返回结构。
  - **[MODIFY]** 扫描现有涉及 JSON 和 YAML 解析的 Svelte/TS 文件，将解析逻辑解耦，替换为从上述目录引入的方法。
  - **[MODIFY]** 修复 `svelte-check` 扫描出的任何 Props/Store/Event 类型的 `any` 或缺失，完成端到端的强类型绑定。

## Verification Plan

### Automated Tests
- 执行 `npm run build` 和 `npm run preview`：验证所有的 SSR 问题已被修复，没有任何 `window is not defined` 的构建阻断报错。
- 执行 `npx svelte-check` 或 `npm run check`：确保检查通过，零 TypeScript 和 Svelte 模板错误。

### Manual Verification
- 启动本地开发服务，手动测试涉及 JSON/YAML 解析的关键功能，确保解耦后的解析器工作正常。
- 抽查系统原有的相关跳转路由，验证没有因清理旧 HTML 而引发的 404 错误。
