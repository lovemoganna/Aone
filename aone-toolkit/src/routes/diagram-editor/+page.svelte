<script lang="ts">
    import { onMount } from "svelte";
    import { diagramStore } from "./lib/store.svelte";
    import lzString from "lz-string";
    import { fade } from "svelte/transition";
    import { FileText } from "lucide-svelte";
    import Header from "./components/Header.svelte";
    import TabsBar from "./components/TabsBar.svelte";
    import Editor from "./components/Editor.svelte";
    import Preview from "./components/Preview.svelte";
    import LayoutControls from "./components/LayoutControls.svelte";
    import ThemePicker from "./components/ThemePicker.svelte";
    import Inspector from "./components/Inspector.svelte";
    import SnippetModal from "./components/modals/SnippetModal.svelte";
    import AIPromptModal from "./components/modals/AIPromptModal.svelte";
    import CollabModal from "./components/modals/CollabModal.svelte";
    import ThemeModal from "./components/modals/ThemeModal.svelte";
    import ExportModal from "./components/modals/ExportModal.svelte";
    import TemplatesModal from "./components/modals/TemplatesModal.svelte";
    import SettingsModal from "./components/modals/SettingsModal.svelte";
    import KeyboardShortcutsModal from "./components/modals/KeyboardShortcutsModal.svelte";
    import FindReplaceModal from "./components/modals/FindReplaceModal.svelte";
    import ShareModal from "./components/modals/ShareModal.svelte";
    import DiffModal from "./components/modals/DiffModal.svelte";
    import IconModal from "./components/modals/IconModal.svelte";
    import PresentationView from "./components/PresentationView.svelte";
    import StatusBar from "./components/StatusBar.svelte";
    import DiagramSidebar from "./components/DiagramSidebar.svelte";
    import HistoryModal from "./components/modals/HistoryModal.svelte";
    import AccessibilityViewModal from "./components/modals/AccessibilityViewModal.svelte";
    import CommandPalette from "./components/CommandPalette.svelte";

    let isSidebarCollapsed = $state(false);

    // ... imports ...

    const EXAMPLES = {
        plantuml: `@startuml\nAlice -> Bob: Hello\nBob --> Alice: Hi!\n@enduml`,
        graphviz: `digraph G {\n  rankdir=LR;\n  A -> B -> C;\n  A -> C;\n}`,
    };

    let isSnippetModalOpen = $state(false);
    let isThemeModalOpen = $state(false);
    let isCollabModalOpen = $state(false);
    let isAIPromptOpen = $state(false);
    let isExportModalOpen = $state(false);
    let isTemplatesModalOpen = $state(false);
    let isSettingsModalOpen = $state(false);
    let isKeyboardModalOpen = $state(false);
    let isFindReplaceOpen = $state(false);
    let isShareModalOpen = $state(false);
    let isDiffModalOpen = $state(false);
    let isIconModalOpen = $state(false);
    let isHistoryModalOpen = $state(false);
    let isAccessibilityViewOpen = $state(false);
    let isPresentationMode = $state(false);
    let isCommandPaletteOpen = $state(false);
    let diffOriginal = $state("");
    let diffModified = $state("");

    let sidebarRef = $state<any>(null);
    let editorRef = $state<any>(null); // Reference for Editor component
    let cursorLine = $state(1);
    let cursorCol = $state(1);

    let mousePos = $state({ x: 0, y: 0 });

    function handleMouseMove(e: MouseEvent) {
        mousePos = { x: e.clientX, y: e.clientY };
    }

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
                isHistoryModalOpen = true;
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
            case "toggle-minimap":
                diagramStore.isMinimapOpen = !diagramStore.isMinimapOpen;
                break;
            case "settings":
                isSettingsModalOpen = true;
                break;
            case "theme":
                isThemeModalOpen = true;
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
        const isInput =
            target.tagName === "INPUT" || target.tagName === "TEXTAREA";

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case "k":
                    e.preventDefault();
                    isCommandPaletteOpen = !isCommandPaletteOpen;
                    break;
                case "enter":
                    e.preventDefault();
                    handleCommandAction("render");
                    break;
                case "\\":
                    e.preventDefault();
                    handleCommandAction("toggle-sidebar");
                    break;
                case "s":
                    e.preventDefault();
                    handleCommandAction("share");
                    break;
                case "e":
                    e.preventDefault();
                    handleCommandAction("export");
                    break;
                case "g":
                    e.preventDefault();
                    handleCommandAction("ai-gen");
                    break;
                case "h":
                    e.preventDefault();
                    handleCommandAction("history");
                    break;
                case "m":
                    e.preventDefault();
                    handleCommandAction("toggle-minimap");
                    break;
                case "n":
                    e.preventDefault();
                    handleCommandAction("new");
                    break;
                case "/":
                    e.preventDefault();
                    handleCommandAction("shortcuts");
                    break;
            }
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
            // Close all modals
            isSnippetModalOpen =
                isExportModalOpen =
                isTemplatesModalOpen =
                isSettingsModalOpen =
                isKeyboardModalOpen =
                isFindReplaceOpen =
                isShareModalOpen =
                isDiffModalOpen =
                isHistoryModalOpen =
                isThemeModalOpen =
                isAIPromptOpen =
                isCollabModalOpen =
                isAccessibilityViewOpen =
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
                    // Optional: clear hash
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

        // Check for shared URL state
        const urlParams = new URLSearchParams(window.location.search);

        // 1. New lz-string format
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
                    // Clean URL
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

        // 2. Legacy base64 format
        const sharedState = urlParams.get("s");

        if (sharedState) {
            try {
                const decoded = JSON.parse(
                    decodeURIComponent(escape(atob(sharedState))),
                );
                if (decoded.code) {
                    diagramStore.code = decoded.code;
                    diagramStore.mode = decoded.mode || "plantuml";
                    diagramStore.engine = decoded.engine || "dot";
                    diagramStore.render();

                    // Clear the query param to keep URL clean but it's optional
                    // window.history.replaceState({}, '', window.location.pathname);
                    return;
                }
            } catch (e) {
                console.error("Failed to decode shared state", e);
            }
        }

        // Only set default if empty on mount
        if (!diagramStore.code) {
            diagramStore.code = EXAMPLES[diagramStore.mode];
            diagramStore.render();
        }
    });

    // Resizer Logic
    let splitPercent = $state(50);
    let isResizing = $state(false);
    let container: HTMLElement;

    function handleMouseDown() {
        isResizing = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }

    function handleMouseMoveGlobal(e: MouseEvent) {
        if (!isResizing || !container) return;
        const rect = container.getBoundingClientRect();
        const output = ((e.clientX - rect.left) / rect.width) * 100;
        splitPercent = Math.max(20, Math.min(80, output));
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
        // Only if leaving the window
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
    <title>Diagram Editor</title>
</svelte:head>

<svelte:window
    onmousemove={(e) => {
        handleMouseMove(e);
        handleMouseMoveGlobal(e);
    }}
    onmouseup={handleMouseUp}
    onkeydown={handleKeydown}
    ondragenter={handleDragEnter}
    ondragover={(e) => e.preventDefault()}
    ondragleave={handleDragLeave}
    ondrop={handleGlobalDrop}
/>

<div class="glow-follow-container">
    <div
        class="glow-cursor"
        style="transform: translate(calc({mousePos.x}px - 50%), calc({mousePos.y}px - 50%))"
    ></div>
</div>

<div
    class="spatial-workspace h-[calc(100vh-3rem)] w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans rounded-xl border border-gray-200 dark:border-gray-800 linear-glow transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
        {diagramStore.focusMode
        ? 'fixed inset-0 z-50 h-screen rounded-none border-none scale-100 opacity-100'
        : 'scale-[0.97] mt-4 shadow-2xl'}"
>
    <div
        class="transition-all duration-300 {diagramStore.focusMode
            ? 'hidden'
            : ''}"
    >
        <Header
            onRender={handleRender}
            onExport={handleExport}
            onSettings={() => (isSettingsModalOpen = true)}
            onHelp={() => {}}
            onSnippets={() => (isSnippetModalOpen = true)}
            onTemplates={() => (isTemplatesModalOpen = true)}
            onShare={() => (isShareModalOpen = true)}
            onShortcuts={() => (isKeyboardModalOpen = true)}
            onFindReplace={() => (isFindReplaceOpen = true)}
            onIcons={() => (isIconModalOpen = true)}
            onPresent={() => (isPresentationMode = true)}
            onHistory={() => (isHistoryModalOpen = true)}
            onAccessibility={() => (isAccessibilityViewOpen = true)}
            onTheme={() => (isThemeModalOpen = true)}
            onAIGen={() => (isAIPromptOpen = true)}
            onCollab={() => (isCollabModalOpen = true)}
        />
        <TabsBar />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex min-h-0 relative" bind:this={container}>
        <div
            class="transition-all duration-300 flex-shrink-0"
            style="width: {isSidebarCollapsed
                ? 80
                : 332}px; {diagramStore.focusMode ? 'display: none;' : ''}"
        >
            <DiagramSidebar
                bind:this={sidebarRef}
                bind:isCollapsed={isSidebarCollapsed}
                onDiff={handleDiff}
            />
        </div>

        <!-- Left Panel: Editor -->
        <div
            style="width: {diagramStore.focusMode ? 50 : splitPercent}%"
            class="h-full flex flex-col min-w-0 transition-all duration-300"
        >
            <div class="relative h-full flex flex-col">
                <!-- Floating Exit Zen Button -->
                {#if diagramStore.focusMode}
                    <button
                        class="absolute top-2 right-4 z-50 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm transition-colors"
                        onclick={() => (diagramStore.focusMode = false)}
                    >
                        Exit Zen Mode (Esc)
                    </button>
                {/if}

                <Editor
                    bind:this={editorRef}
                    bind:code={diagramStore.code}
                    mode={diagramStore.mode}
                    onRender={handleRender}
                    onCursorChange={handleCursorChange}
                />
            </div>
        </div>

        <!-- Resizer -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="w-2 hover:bg-indigo-500/50 hover:cursor-col-resize flex items-center justify-center bg-gray-200 dark:bg-gray-800 transition-colors z-10 focus:outline-none {diagramStore.focusMode
                ? 'pointer-events-none opacity-0 w-0'
                : ''}"
            role="separator"
            onmousedown={handleMouseDown}
        >
            <div class="w-0.5 h-8 bg-gray-400 rounded"></div>
        </div>

        <!-- Right Panel: Preview -->
        <div class="flex-1 h-full min-w-0 relative">
            <LayoutControls />
            <ThemePicker />
            <Preview
                svg={diagramStore.svg}
                isRendering={diagramStore.isRendering}
                onExport={(f) => handleExport()}
                onFileDrop={handleFileDrop}
                onNavigate={handleNavigate}
            />
        </div>

        <!-- Inspector Panel (Right) -->
        {#if diagramStore.isInspectorOpen && !diagramStore.focusMode}
            <Inspector bind:isPinned={diagramStore.isSidebarPinned} />
        {/if}
    </div>

    <div
        class="transition-all duration-300 {diagramStore.focusMode
            ? 'hidden'
            : ''}"
    >
        <StatusBar
            line={cursorLine}
            col={cursorCol}
            chars={diagramStore.code.length}
        />
    </div>

    <!-- Drag Overlay -->
    {#if isDraggingFile}
        <div
            class="fixed inset-0 z-[60] bg-indigo-500/20 backdrop-blur-sm border-4 border-indigo-500 border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none"
            transition:fade={{ duration: 150 }}
        >
            <div
                class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4"
            >
                <div
                    class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                >
                    <FileText size={32} />
                </div>
                <h3 class="text-xl font-bold">Drop file to open</h3>
                <p class="text-gray-500">
                    Supports .puml, .plantuml, .dot, .gv, .txt
                </p>
            </div>
        </div>
    {/if}

    <!-- Modals -->
    <SnippetModal
        bind:isOpen={isSnippetModalOpen}
        onClose={() => (isSnippetModalOpen = false)}
    />
    <AIPromptModal
        bind:isOpen={isAIPromptOpen}
        onClose={() => (isAIPromptOpen = false)}
    />
    <ThemeModal
        bind:isOpen={isThemeModalOpen}
        onClose={() => (isThemeModalOpen = false)}
    />

    <CollabModal
        bind:isOpen={isCollabModalOpen}
        onClose={() => (isCollabModalOpen = false)}
    />
    <ExportModal
        bind:isOpen={isExportModalOpen}
        onClose={() => (isExportModalOpen = false)}
    />
    <TemplatesModal bind:isOpen={isTemplatesModalOpen} />
    <SettingsModal
        bind:isOpen={isSettingsModalOpen}
        onClose={() => (isSettingsModalOpen = false)}
    />
    <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => (isKeyboardModalOpen = false)}
    />
    <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => (isFindReplaceOpen = false)}
        code={diagramStore.code}
        onReplace={(newCode) => (diagramStore.code = newCode)}
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
    <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => (isHistoryModalOpen = false)}
        onDiff={(code) => {
            handleDiff(code); // Trigger diff modal
            isHistoryModalOpen = false; // Close history, open diff
        }}
    />
    <AccessibilityViewModal
        isOpen={isAccessibilityViewOpen}
        onClose={() => (isAccessibilityViewOpen = false)}
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
