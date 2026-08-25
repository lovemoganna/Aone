<script lang="ts">
    import { onMount } from "svelte";
    import { diagramStore } from "./lib/store.svelte";
    import lzString from "lz-string";
    import { fade } from "svelte/transition";
    import { FileText } from "lucide-svelte";
    import Header from "./components/Header.svelte";
    import Editor from "./components/Editor.svelte";
    import Preview from "./components/Preview.svelte";
    import LayoutControls from "./components/LayoutControls.svelte";
    import Inspector from "./components/Inspector.svelte";
    import TabsBar from "./components/TabsBar.svelte";
    import AIPromptModal from "./components/modals/AIPromptModal.svelte";
    import CollabModal from "./components/modals/CollabModal.svelte";
    import ExportModal from "./components/modals/ExportModal.svelte";
    import SettingsModal from "./components/modals/SettingsModal.svelte";
    import KeyboardShortcutsModal from "./components/modals/KeyboardShortcutsModal.svelte";
    import ShareModal from "./components/modals/ShareModal.svelte";
    import DiffModal from "./components/modals/DiffModal.svelte";
    import IconModal from "./components/modals/IconModal.svelte";
    import PresentationView from "./components/PresentationView.svelte";
    import StatusBar from "./components/StatusBar.svelte";
    import DiagramSidebar from "./components/DiagramSidebar.svelte";
    import CommandPalette from "./components/CommandPalette.svelte";
    import { hotkeyEngine } from "./lib/hotkeys";
    import { dataBridge } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let isSidebarCollapsed = $state(true);

    const EXAMPLES = {
        plantuml: `@startuml
skinparam backgroundColor transparent
skinparam shadowing false
skinparam roundcorner 8

actor User as "用户 / Client"
participant Gateway as "API 网关 / Gateway"
participant Service as "业务服务 / Core Service"
database DB as "数据库 / Database"

User -> Gateway: 1. 发起业务请求 (HTTPS POST)
activate Gateway
Gateway -> Service: 2. 鉴权与路由转发 (gRPC)
activate Service
Service -> DB: 3. 查询与持久化事务
activate DB
DB --> Service: 4. 响应数据记录
deactivate DB
Service --> Gateway: 5. 返回处理结果 (JSON)
deactivate Service
Gateway --> User: 6. 响应客户端 (200 OK)
deactivate Gateway
@enduml`,
        graphviz: `digraph Architecture {
  rankdir=LR;
  node [shape=box, style="rounded,filled", fillcolor="#f8fafc", color="#94a3b8", fontname="sans-serif"];
  edge [color="#64748b", fontname="sans-serif", fontsize=10];

  Client [label="客户端 / App", fillcolor="#eff6ff", color="#3b82f6"];
  CDN [label="边缘节点 / CDN", fillcolor="#f0fdf4", color="#22c55e"];
  Gateway [label="API 网关 / Kong", fillcolor="#fefce8", color="#eab308"];
  ServiceA [label="微服务 A", fillcolor="#faf5ff", color="#a855f7"];
  ServiceB [label="微服务 B", fillcolor="#faf5ff", color="#a855f7"];
  DB [label="主从数据库 / MySQL", shape=cylinder, fillcolor="#fff1f2", color="#f43f5e"];

  Client -> CDN [label="静态资源"];
  Client -> Gateway [label="API 请求"];
  Gateway -> ServiceA;
  Gateway -> ServiceB;
  ServiceA -> DB;
  ServiceB -> DB;
}`,
    };

    let isCollabModalOpen = $state(false);
    let isAIPromptOpen = $state(false);
    let isExportModalOpen = $state(false);
    let isSettingsModalOpen = $state(false);
    let isKeyboardModalOpen = $state(false);
    let isShareModalOpen = $state(false);
    let isDiffModalOpen = $state(false);
    let isIconModalOpen = $state(false);
    let isPresentationMode = $state(false);
    let isCommandPaletteOpen = $state(false);
    let diffOriginal = $state("");
    let diffModified = $state("");

    let sidebarRef = $state<any>(null);
    let editorRef = $state<any>(null);
    let previewRef = $state<any>(null);
    let cursorLine = $state(1);
    let cursorCol = $state(1);

    // Command Actions
    function handleCommandAction(id: string) {
        switch (id) {
            case "render":
                diagramStore.render();
                break;
            case "new":
                diagramStore.createDocument();
                break;
            case "export":
                isExportModalOpen = true;
                break;
            case "share":
                isShareModalOpen = true;
                break;
            case "history":
                sidebarRef?.openTab("history");
                break;
            case "templates":
                sidebarRef?.openTab("templates");
                break;
            case "snippets":
                sidebarRef?.openTab("snippets");
                break;
            case "outline":
                sidebarRef?.openTab("outline");
                break;
            case "find-replace":
                editorRef?.openFind();
                break;
            case "ai-gen":
                isAIPromptOpen = true;
                break;
            case "toggle-sidebar":
                isSidebarCollapsed = !isSidebarCollapsed;
                break;
            case "reset-view":
                diagramStore.resetView();
                break;
            case "focus-mode":
                diagramStore.focusMode = !diagramStore.focusMode;
                break;
            case "presentation":
                isPresentationMode = !isPresentationMode;
                break;
            case "mode-plantuml":
                diagramStore.mode = "plantuml";
                diagramStore.render();
                break;
            case "mode-graphviz":
                diagramStore.mode = "graphviz";
                diagramStore.render();
                break;
            case "settings":
                isSettingsModalOpen = true;
                break;
            case "collab":
                isCollabModalOpen = true;
                break;
            case "shortcuts":
                isKeyboardModalOpen = true;
                break;
        }
    }

    // Keyboard Shortcuts Handler
    function handleKeydown(e: KeyboardEvent) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

        if (!isInput) {
            const handled = hotkeyEngine.handleKeyDown(e, (actionId) => {
                switch (actionId) {
                    case "render":
                        diagramStore.render();
                        break;
                    case "save":
                        diagramStore.takeSnapshot();
                        break;
                    case "command-palette":
                        isCommandPaletteOpen = !isCommandPaletteOpen;
                        break;
                    case "find-replace":
                        editorRef?.openFind();
                        break;
                    case "new-doc":
                        diagramStore.createDocument();
                        break;
                    case "export-modal":
                        isExportModalOpen = true;
                        break;
                    case "history":
                        sidebarRef?.openTab("history");
                        break;
                    case "shortcuts":
                        isKeyboardModalOpen = true;
                        break;
                    case "fit-view":
                        diagramStore.resetView();
                        break;
                }
            });
            if (handled) return;
        }

        if (e.key === "Escape") {
            if (isCommandPaletteOpen) {
                isCommandPaletteOpen = false;
                return;
            }
            if (diagramStore.focusMode) {
                diagramStore.focusMode = false;
                return;
            }
            // Close all open modals
            isExportModalOpen =
                isSettingsModalOpen =
                isKeyboardModalOpen =
                isShareModalOpen =
                isDiffModalOpen =
                isAIPromptOpen =
                isCollabModalOpen =
                    false;
        }
    }

    // Initialize Store
    onMount(async () => {
        // Check for shared URL state (New LZ-String Hash)
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const hashCode = hashParams.get("code");
        if (hashCode) {
            try {
                const { decodeShareUrl } = await import("./lib/share");
                const decoded = decodeShareUrl();
                if (decoded) {
                    diagramStore.code = decoded;
                    diagramStore.render();
                    window.history.replaceState(
                        {},
                        "",
                        window.location.pathname,
                    );
                    return;
                }
            } catch (e) {
                console.error("Failed to load generic share", e);
            }
        }

        const handoff = dataBridge.consume("/diagram-editor");
        if (handoff && handoff.payload) {
            diagramStore.code = handoff.payload;
            diagramStore.render();
            toastStore.success(`已从 ${handoff.sourceTool} 载入图表代码`);
            return;
        }

        // Check for shared URL state
        const urlParams = new URLSearchParams(window.location.search);

        const codeParam = urlParams.get("code");
        const modeParam = urlParams.get("mode");
        const isEmbed = urlParams.get("embed") === "true";

        if (isEmbed) {
            diagramStore.focusMode = true;
        }

        if (codeParam) {
            try {
                const decompressed =
                    lzString.decompressFromEncodedURIComponent(codeParam);
                if (decompressed) {
                    diagramStore.code = decompressed;
                    diagramStore.mode = (modeParam as any) || "plantuml";
                    diagramStore.render();
                    window.history.replaceState(
                        {},
                        "",
                        window.location.pathname,
                    );
                    return;
                }
            } catch (e) {
                console.error("Failed to decompress code", e);
            }
        }

        // Ensure default code is populated if empty
        if (!diagramStore.code || !diagramStore.code.trim()) {
            diagramStore.code = EXAMPLES[diagramStore.mode] || EXAMPLES.plantuml;
        }

        // Always render immediately on mount so the diagram is visible directly
        await diagramStore.render();
    });

    // Resizer Logic
    let splitPercent = $state(50);
    let isResizing = $state(false);
    let splitAreaRef = $state<HTMLElement>();

    function handleMouseDown(e: MouseEvent) {
        e.preventDefault();
        isResizing = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }

    function handleMouseMoveGlobal(e: MouseEvent) {
        if (!isResizing || !splitAreaRef) return;
        const rect = splitAreaRef.getBoundingClientRect();
        if (rect.width <= 0) return;
        const offset = e.clientX - rect.left;
        const percent = (offset / rect.width) * 100;
        splitPercent = Math.max(15, Math.min(85, percent));
    }

    function handleMouseUp() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    }

    // Handlers
    function handleExport() {
        isExportModalOpen = true;
    }

    function handleRender() {
        diagramStore.render();
    }

    function handleFileDrop(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === "string") {
                diagramStore.code = e.target.result;
                const ext = file.name.split(".").pop()?.toLowerCase();
                if (ext && ["dot", "gv"].includes(ext)) {
                    diagramStore.mode = "graphviz";
                } else if (ext && ["puml", "plantuml", "txt"].includes(ext)) {
                    diagramStore.mode = "plantuml";
                }
                diagramStore.render();
            }
        };
        reader.readAsText(file);
    }

    function handleCursorChange(line: number, col: number) {
        cursorLine = line;
        cursorCol = col;
    }

    function handleDiff(originalCode: string) {
        diffOriginal = originalCode;
        diffModified = diagramStore.code;
        isDiffModalOpen = true;
    }

    let isDraggingFile = $state(false);

    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        isDraggingFile = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        if (!e.relatedTarget) {
            isDraggingFile = false;
        }
    }

    function handleGlobalDrop(e: DragEvent) {
        e.preventDefault();
        isDraggingFile = false;
        const file = e.dataTransfer?.files[0];
        if (file) handleFileDrop(file);
    }

    function handleNavigate(line: number) {
        if (editorRef) {
            editorRef.scrollToLine(line);
        }
    }
</script>

<svelte:head>
    <title>Diagram Editor - AONE</title>
</svelte:head>

<svelte:window
    onmousemove={handleMouseMoveGlobal}
    onmouseup={handleMouseUp}
    onkeydown={handleKeydown}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleGlobalDrop}
/>

<div class="h-full w-full flex flex-col {diagramStore.focusMode ? 'p-0' : 'p-2.5 sm:p-3.5'} overflow-hidden bg-slate-50 dark:bg-slate-950">
    <div
        class="h-full w-full flex-1 flex flex-col bg-white dark:bg-[#090d14] text-slate-900 dark:text-slate-100 overflow-hidden font-sans
            {diagramStore.focusMode
            ? 'fixed inset-0 z-50 h-screen rounded-none border-none'
            : 'rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs min-h-0'}"
    >
    {#if !diagramStore.focusMode}
        <Header
            isSidebarOpen={!isSidebarCollapsed}
            onToggleSidebar={() => (isSidebarCollapsed = !isSidebarCollapsed)}
            onRender={handleRender}
            onExport={handleExport}
            onSettings={() => (isSettingsModalOpen = true)}
            onShare={() => (isShareModalOpen = true)}
            onShortcuts={() => (isKeyboardModalOpen = true)}
            onIcons={() => (isIconModalOpen = true)}
            onAIGen={() => (isAIPromptOpen = true)}
            onCollab={() => (isCollabModalOpen = true)}
        />
    {/if}

    <!-- Main Content -->
    <div class="flex-1 flex min-h-0 relative {isResizing ? 'select-none' : ''}">
        {#if !diagramStore.focusMode}
            <DiagramSidebar
                bind:isCollapsed={isSidebarCollapsed}
                bind:this={sidebarRef}
                onDiff={handleDiff}
            />
        {/if}

        <!-- Split Workspace Area (Editor + Resizer + Preview) -->
        <div class="flex-1 flex min-w-0 h-full relative" bind:this={splitAreaRef}>
            <!-- Left Panel: Document Tabs + Editor -->
            <div
                style="width: {diagramStore.focusMode ? 50 : splitPercent}%"
                class="h-full flex flex-col min-w-0 overflow-hidden relative {isResizing ? 'pointer-events-none' : 'transition-[width] duration-150'}"
            >
                <!-- Floating Exit Zen Button -->
                {#if diagramStore.focusMode}
                    <button
                        class="absolute top-4 right-6 z-50 bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-medium hover:shadow-xl transition-all"
                        onclick={() => (diagramStore.focusMode = false)}
                    >
                        Exit Zen Mode (Esc)
                    </button>
                {/if}

                {#if !diagramStore.focusMode}
                    <TabsBar />
                {/if}

                <div class="flex-1 w-full min-h-0 overflow-hidden relative">
                    <Editor
                        bind:this={editorRef}
                        bind:code={diagramStore.code}
                        mode={diagramStore.mode}
                        onRender={handleRender}
                        onCursorChange={handleCursorChange}
                    />
                </div>
            </div>

            <!-- Resizer Handle -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div
                class="w-2.5 relative group hover:cursor-col-resize flex items-center justify-center {isResizing ? 'bg-slate-300 dark:bg-slate-700' : 'hover:bg-slate-200 dark:hover:bg-slate-800'} border-x border-slate-200 dark:border-slate-800 transition-colors z-20 focus:outline-none {diagramStore.focusMode
                    ? 'pointer-events-none opacity-0 w-0'
                    : ''}"
                role="separator"
                aria-label="Resize panels"
                onmousedown={handleMouseDown}
            >
                <div class="w-1 h-8 rounded-full {isResizing ? 'bg-slate-700 dark:bg-slate-300' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-500'} transition-all"></div>
            </div>

            <!-- Right Panel: Canvas Toolbar + Preview -->
            <div class="flex-1 h-full min-w-0 flex flex-col relative {isResizing ? 'pointer-events-none' : ''}">
                {#if !diagramStore.focusMode}
                    <LayoutControls
                        onFit={() => previewRef?.fitToScreen()}
                        onCopySvg={() => previewRef?.copyToClipboard()}
                        onCopyPng={() => previewRef?.copyImageToClipboard()}
                    />
                {/if}
                <div class="flex-1 min-h-0 relative">
                    <Preview
                        bind:this={previewRef}
                        svg={diagramStore.svg}
                        isRendering={diagramStore.isRendering}
                        onExport={(f) => handleExport()}
                        onFileDrop={handleFileDrop}
                        onNavigate={handleNavigate}
                    />
                </div>
            </div>
        </div>

        <!-- Inspector Panel (Right) -->
        {#if diagramStore.isInspectorOpen && !diagramStore.focusMode}
            <Inspector bind:isPinned={diagramStore.isSidebarPinned} />
        {/if}
    </div>

    {#if !diagramStore.focusMode}
        <StatusBar
            line={cursorLine}
            col={cursorCol}
            chars={diagramStore.code.length}
        />
    {/if}

    <!-- Drag Overlay -->
    {#if isDraggingFile}
        <div
            class="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-xs border-2 border-slate-400 dark:border-slate-500 border-dashed m-4 rounded-lg flex items-center justify-center pointer-events-none"
            transition:fade={{ duration: 100 }}
        >
            <div
                class="bg-white dark:bg-[#0b0f17] p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center gap-3 text-center"
            >
                <div
                    class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300"
                >
                    <FileText size={24} />
                </div>
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Drop file to open</h3>
                <p class="text-xs text-slate-400 font-mono">
                    Supports .puml, .plantuml, .dot, .gv, .txt
                </p>
            </div>
        </div>
    {/if}

    <!-- Essential Modals -->
    <AIPromptModal
        bind:isOpen={isAIPromptOpen}
        onClose={() => (isAIPromptOpen = false)}
    />
    <CollabModal
        bind:isOpen={isCollabModalOpen}
        onClose={() => (isCollabModalOpen = false)}
    />
    <ExportModal
        bind:isOpen={isExportModalOpen}
        onClose={() => (isExportModalOpen = false)}
    />
    <SettingsModal
        bind:isOpen={isSettingsModalOpen}
        onClose={() => (isSettingsModalOpen = false)}
    />
    <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => (isKeyboardModalOpen = false)}
    />
    <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => (isShareModalOpen = false)}
    />
    <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => (isDiffModalOpen = false)}
        originalCode={diffOriginal}
        modifiedCode={diffModified}
    />
    <IconModal
        isOpen={isIconModalOpen}
        onSelect={(icon: string) => {
            const insertion = ` <&${icon}> `;
            diagramStore.code += insertion;
            diagramStore.render();
        }}
    />

    <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => (isCommandPaletteOpen = false)}
        onAction={handleCommandAction}
    />

    {#if isPresentationMode}
        <PresentationView onClose={() => (isPresentationMode = false)} />
    {/if}
    </div>
</div>
