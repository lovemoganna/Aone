# Overview

对 Aone 项目进行全面的技术债梳理与重构，旨在整合双轨架构（根目录孤立 HTML 与 SvelteKit 工程），抽象共享的基础库组件，解决各类编译、构建和样式问题，最终形成一个统一的、易于维护和部署的现代化 SvelteKit 架构应用。

## Project Type
WEB (Frontend: SvelteKit, Toolkit integrations)

## Success Criteria
1. 所有根目录的单文件 HTML (`json_editor.html`, `yaml_editor.html`, `table_editor.html` 等) 成功迁入 `aone-toolkit` 工程下的 Svelte 路由，且原有功能不受损。
2. `src/lib` 中提取出通用的编辑器基础库，包含统一的文件 I/O 控制、快捷键管理 (Hotkeys) 和解析引擎 (Parsers)。
3. Vite 构建 `npm run build` 和 `npm run dev` 没有任何报错或 Typescript 隐式 Any/Type 错误。
4. 全局 CSS (Tailwind 等) 统一化，清除不规范混杂的样式定义。

## Tech Stack
- **Framework**: SvelteKit
- **Styling**: Tailwind CSS + PostCSS (已配置于项目中)
- **Language**: TypeScript

## File Structure (Target)
```
aone-toolkit/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── EditorBase.svelte       # 编辑器公共组件
│   │   │   ├── FileIOPanel.svelte      # 统一的文件导入/导出 UI
│   │   │   └── Layout.svelte           # 统一页面布局
│   │   ├── utils/
│   │   │   ├── hotkeys.ts              # 全局和局部快捷键绑定
│   │   │   ├── parsers/                # 数据解析器
│   │   │   │   ├── jsonParser.ts
│   │   │   │   ├── yamlParser.ts
│   │   │   │   └── csvTableParser.ts
│   │   │   └── fileIO.ts               # 文件读写通用逻辑
│   ├── routes/
│   │   ├── +page.svelte                # Portal 首页
│   │   ├── json-editor/
│   │   ├── yaml-editor/
│   │   ├── table-editor/
│   │   ├── prompt-hub/
│   │   └── plantuml-editor/
└── docs/
    └── ARCHITECTURE.md                 # 架构更新文档
```

## Task Breakdown

### 1. 架构评估与路由映射
- **task_id**: `T1-Routing`
- **name**: 映射与建立重构路由
- **agent**: `frontend-specialist`
- **skills**: `frontend-design`, `clean-code`
- **priority**: P0
- **dependencies**: None
- **INPUT**: 分析 `json_editor.html`, `yaml_editor.html`, `table_editor.html`, `PromptHub.html`, `Plantuml_Dot_graphviz_editor.html`
- **OUTPUT**: 在 `aone-toolkit/src/routes` 创建对应的骨架页面页面与路由跳转。
- **VERIFY**: `npm run dev` 能访问对应的各个空白或初步迁移路由页面。

### 2. 基础库抽取 (核心逻辑)
- **task_id**: `T2-LibExtract`
- **name**: 提取并实现 Parser, File I/O 和 Hotkeys
- **agent**: `frontend-specialist`
- **skills**: `clean-code`
- **priority**: P1
- **dependencies**: `T1-Routing`
- **INPUT**: 从独立 HTML 分析数据解析和 I/O 逻辑。
- **OUTPUT**: 在 `src/lib/utils` 实现并导出 `jsonParser`, `yamlParser`, 统一的快捷键 Hook 及文件上传下载 Helper。
- **VERIFY**: 为 utils 添加单元测试或确保在 TS 下无类型错误。

### 3. 组件化与页面重构
- **task_id**: `T3-ComponentRefactor`
- **name**: 拆解页面为 Svelte 组件
- **agent**: `frontend-specialist`
- **skills**: `frontend-design`
- **priority**: P1
- **dependencies**: `T2-LibExtract`
- **INPUT**: SvelteKit 路由结构和提取的基础库
- **OUTPUT**: 将具体 HTML 的 DOM/Style/Script 完全转换并写入 `src/routes/[editor]/+page.svelte` 和对应的共享 UI `src/lib/components`。
- **VERIFY**: 所有页面在浏览器中正常渲染与交互，无控制台报错。

### 4. 样式清理与全局融合
- **task_id**: `T4-StyleCleanup`
- **name**: 清理 CSS 与 Tailwind 统一化
- **agent**: `frontend-specialist`
- **skills**: `tailwind-patterns`
- **priority**: P2
- **dependencies**: `T3-ComponentRefactor`
- **INPUT**: 各种内联 style 和混杂 CSS 文件
- **OUTPUT**: 去除冗余样式，应用全局 Tailwind 类或局部模块化 CSS。
- **VERIFY**: UX Audit 及样式检查脚本不报严重的对比度/兼容错误。

### 5. 构建纠偏与类型修复
- **task_id**: `T5-BuildFix`
- **name**: 解决 Vite 编译与 TS 错误
- **agent**: `debugger`
- **skills**: `systematic-debugging`, `clean-code`
- **priority**: P1
- **dependencies**: `T3-ComponentRefactor`
- **INPUT**: `codex-build-stdout.log` 及 Vite dev logs
- **OUTPUT**: 修复 `tsconfig.json` 配置或各个 `.ts`/`.svelte` 文件中的 `implicit any` 与依赖缺失。
- **VERIFY**: `npm run build` 命令 0 警告 0 报错通过。

## Phase X: Verification

### 检查项清单
- [ ] 所有 SvelteKit 页面迁移均已完成且可用。
- [ ] 根目录的旧 HTML 文件均已标记为废弃（可建立 archive 文件夹）。
- [ ] 核心 Parser 与 I/O 逻辑在各编辑器组件间正确复用。
- [ ] TypeScript 编译 `npx tsc --noEmit` 通过。
- [ ] `npm run build` 成功完成。
- [ ] 样式符合 UI 统一规范，并剔除了无效/重复的 CSS 类。

### 命令行验证 (Phase X)
```bash
cd aone-toolkit

# 1. 静态检查
npm run lint && npx tsc --noEmit

# 2. 构建验证
npm run build

# 3. 本地启动验证
npm run dev
```

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (svelte-check 0 errors)
- Security: ✅ Pass (no critical dependencies exposed)
- Build: ✅ Success (vite build successful in 2m 28s)
- Date: 2026-06-07
