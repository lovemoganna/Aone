<script lang="ts">
    import { onMount, tick } from "svelte";
    import * as jsyaml from "js-yaml";
    import { Panel } from "$lib/components/ui";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import EditorPane from "./EditorPane.svelte";
    import YamlPreview from "./YamlPreview.svelte";
    import Toolbar from "./Toolbar.svelte";
    import EditNodeModal from "./EditNodeModal.svelte";
    import BatchImportModal from "./BatchImportModal.svelte";
    import ShortcutsModal from "./ShortcutsModal.svelte";
    import CodeEditor from "./CodeEditor.svelte"; // New
    import TemplateSidebar from "./TemplateSidebar.svelte"; // New
    import PathQueryPanel from "./PathQueryPanel.svelte"; // New
    import ValidationPanel from "./ValidationPanel.svelte"; // New
    import type { EditorEvent, NodePath } from "../types";

    const STORAGE_KEY = "yamlEditorState";
    const HISTORY_LIMIT = 50;

    // View Mode State
    let viewMode = $state<"visual" | "code">("visual");
    let isDark = $state(false);

    // State
    let data = $state<any>({});
    let historyPast = $state<any[]>([]);
    let historyFuture = $state<any[]>([]);
    let yamlString = $state("");

    // Path Query State
    let pathQueryOpen = $state(false);

    // Modal State
    let modalOpen = $state(false);
    let batchModalOpen = $state(false);
    let shortcutsModalOpen = $state(false);
    let modalTitle = $state("Edit Node");
    let modalPath = $state<NodePath>([]);
    let modalKey = $state("");
    let modalValue = $state<any>("");
    let modalIsObject = $state(false);
    let isEditing = $state(false);

    // Derived
    let canUndo = $derived(historyPast.length > 0);
    let canRedo = $derived(historyFuture.length > 0);

    // Hidden file input
    let fileInput: HTMLInputElement;

    import { dataBridge } from "$lib/stores/dataBridge";
    import { safeYamlParse } from "$lib/utils/parsers/safeParser";

    onMount(() => {
        // Dark mode detection
        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            isDark = true;
        }
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", (event) => {
                isDark = event.matches;
            });

        // Check dataBridge handoff
        const handoff = dataBridge.consume("/yaml-editor");
        if (handoff && handoff.payload) {
            try {
                if (handoff.dataType === "json") {
                    data = JSON.parse(handoff.payload);
                } else {
                    const res = safeYamlParse(handoff.payload);
                    if (res.ok) data = res.data;
                }
            } catch (e) {
                console.error("Failed to parse handoff data", e);
            }
        } else {
            // Load from local storage
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    data = JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to load state", e);
                }
            }
        }
        updateYamlString();
    });


    // Snapshot for history
    function snapshot() {
        return JSON.parse(JSON.stringify(data));
    }

    // Helper: processArrays for compatibility
    function processArrays(obj: any): any {
        if (!obj || typeof obj !== "object") return obj;
        Object.keys(obj).forEach((key) => {
            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (typeof item === "object") processArrays(item);
                });
            } else if (typeof value === "object") {
                processArrays(value);
            }
        });
        return obj;
    }

    function pushHistory() {
        historyPast = [...historyPast, snapshot()].slice(-HISTORY_LIMIT);
        historyFuture = []; // Clear future
    }

    function handleUndo() {
        if (!canUndo) return;
        const prev = historyPast[historyPast.length - 1];
        historyFuture = [snapshot(), ...historyFuture];
        historyPast = historyPast.slice(0, -1);
        data = prev;
        updateYamlString();
    }

    function handleRedo() {
        if (!canRedo) return;
        const next = historyFuture[0];
        historyFuture = historyFuture.slice(1);
        historyPast = [...historyPast, snapshot()];
        data = next;
        updateYamlString();
    }

    function updateYamlString() {
        try {
            const dump = jsyaml.dump(data, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                quotingType: '"',
                forceQuotes: false,
                flowLevel: -1,
                styles: {
                    "!!null": "empty",
                    "!!map": "block",
                    "!!seq": "block",
                },
            });

            yamlString = dump
                .replace(/^---\n/, "")
                .replace(/\n---$/, "")
                .replace(/\n\n+/g, "\n");

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("YAML Dump error", e);
            yamlString = "Error generating YAML";
        }
    }

    // Handle Code Editor Changes (Two-way bind)
    function handleCodeChange(newValue: string) {
        // We only parse if the user PAUSES or explicitly saves?
        // Or we parse on debounce to update 'data' (and visual tree).
        // BUT updating 'data' triggers updateYamlString() which might reformat the user's text.
        // Issue: Code View edit -> parse -> data update -> re-serialize -> Code View overwrite.
        // Solution: While in Code Mode, do NOT auto-update data from code unless:
        // 1. Switching back to Visual Mode
        // 2. User explicitly clicks "Sync/Save" (if we had one)
        // 3. We use a separate state 'codeString' and only sync when valid.

        // Actually best UX: Live sync if valid, but DON'T overwrite code editor content from state while typing.
        // 'yamlString' is bound to CodeEditor.

        try {
            const parsed = jsyaml.load(newValue);
            // Only update data if different?
            // If we update data, 'yamlString' re-computes.
            // We need to break the loop.
            // CodeEditor takes value={yamlString}.

            // We will rely on 'viewMode' switching to sync state fully.
            // But we want validation to work live.
            // Let's just update 'data' when leaving Code Mode or debounced.
            // For now, let's keep it simple: sync when switching modes.

            // Wait, ValidationPanel needs the string.
            // So yamlString needs to update.
            // CodeEditor bind:value={yamlString} handles that.
        } catch (e) {
            // Invalid YAML, don't update data
        }
    }

    function syncStateFromCode() {
        try {
            const parsed = jsyaml.load(yamlString);
            if (typeof parsed === "object" && parsed !== null) {
                // Check if changed to avoid unnecessary history push?
                // Just push history if we are committing the change (switching view)
                // pushHistory(); // Maybe too aggressive on every switch?
                data = processArrays(parsed) || {};
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
        } catch (e) {
            console.error("Failed to parse YAML from code view", e);
            toastStore.error("无法切换到可视化视图：YAML 格式无效");
        }
    }

    // Use this to intercept tab switching
    function setViewMode(mode: "visual" | "code") {
        if (mode === "visual" && viewMode === "code") {
            try {
                const parsed = jsyaml.load(yamlString);
                if (parsed === undefined) {
                    // empty is fine
                    data = {};
                } else if (typeof parsed !== "object" || parsed === null) {
                    // primitives are valid yaml but our tree expects object/array
                } else {
                    pushHistory();
                    data = processArrays(parsed);
                }
            } catch (e) {
                toastStore.error("切换到可视化模式前请先修复 YAML 语法错误");
                return;
            }
        } else if (mode === "code" && viewMode === "visual") {
            updateYamlString();
        }
        viewMode = mode;
    }

    function handleTemplateInsert(content: string) {
        if (yamlString.trim() !== "") {
            if (!confirm("Replace current content with template?")) {
                return;
            }
        }
        yamlString = content;

        // Sync to visual if needed
        if (viewMode === "visual") {
            try {
                const parsed = jsyaml.load(yamlString);
                data = processArrays(parsed) || {};
                updateYamlString();
            } catch (e) {}
        }
    }

    // --- Tree Actions ---

    function getNode(obj: any, path: NodePath): any {
        let current = obj;
        for (const k of path) {
            if (current && typeof current === "object" && k in current) {
                current = current[k];
            } else {
                return undefined;
            }
        }
        return current;
    }

    function handleAction(event: EditorEvent) {
        const { type, path } = event;
        const parentPath = path.slice(0, -1);
        const key = path[path.length - 1];

        // Add Child / Root
        if (type === "add") {
            openModal("Add Node", path, false);
            return;
        }

        const parent =
            parentPath.length === 0 ? data : getNode(data, parentPath);

        if (type === "edit") {
            const val = getNode(data, path);
            openModal("Edit Node", path, true, key, val);
        } else if (type === "delete") {
            if (confirm("Delete this node?")) {
                pushHistory();
                if (Array.isArray(parent)) {
                    parent.splice(Number(key), 1); // Array splice
                } else {
                    delete parent[key];
                }
                data = { ...data };
                updateYamlString();
            }
        } else if (type === "copyPath") {
            // Copy JSONPath to clipboard
            const jsonPath =
                "$." +
                path
                    .map((p) => {
                        if (typeof p === "number" || /^\d+$/.test(String(p))) {
                            return `[${p}]`;
                        }
                        return p;
                    })
                    .join(".");
            navigator.clipboard
                .writeText(jsonPath)
                .then(() => {
                    // Optional: show toast or feedback
                    console.log("Copied path:", jsonPath);
                })
                .catch((err) => {
                    console.error("Failed to copy path:", err);
                });
        } else if (type === "up" || type === "down") {
            pushHistory();
            if (Array.isArray(parent)) {
                // Array reorder
                const idx = Number(key);
                const newIdx = type === "up" ? idx - 1 : idx + 1;
                if (newIdx >= 0 && newIdx < parent.length) {
                    const item = parent[idx];
                    parent.splice(idx, 1);
                    parent.splice(newIdx, 0, item);
                    data = { ...data };
                    updateYamlString();
                }
            } else {
                // Object reorder (as before)
                const keys = Object.keys(parent);
                const idx = keys.indexOf(key);
                if (idx === -1) return;
                const newIdx = type === "up" ? idx - 1 : idx + 1;
                if (newIdx >= 0 && newIdx < keys.length) {
                    keys.splice(idx, 1);
                    keys.splice(newIdx, 0, key);
                    const newObj: any = {};
                    keys.forEach((k) => (newObj[k] = parent[k]));
                    if (parentPath.length === 0) data = newObj;
                    else {
                        const grandParent = getNode(
                            data,
                            parentPath.slice(0, -1),
                        );
                        const parentKey = parentPath[parentPath.length - 1];
                        grandParent[parentKey] = newObj;
                        data = { ...data };
                    }
                    updateYamlString();
                }
            }
        } else if (type === "duplicate") {
            pushHistory();
            const val = getNode(data, path);

            if (Array.isArray(parent)) {
                const newVal = JSON.parse(JSON.stringify(val));
                parent.splice(Number(key) + 1, 0, newVal);
                data = { ...data };
                updateYamlString();
            } else {
                let newKey = `${key}_copy`;
                let counter = 1;
                while (newKey in parent) {
                    newKey = `${key}_copy_${counter++}`;
                }
                const newVal = JSON.parse(JSON.stringify(val));
                const keys = Object.keys(parent);
                const idx = keys.indexOf(key);
                if (idx !== -1) {
                    const newObj: any = {};
                    keys.forEach((k) => {
                        newObj[k] = parent[k];
                        if (k === key) newObj[newKey] = newVal;
                    });
                    if (parentPath.length === 0) data = newObj;
                    else {
                        const grandParent = getNode(
                            data,
                            parentPath.slice(0, -1),
                        );
                        const parentKey = parentPath[parentPath.length - 1];
                        grandParent[parentKey] = newObj;
                        data = { ...data };
                    }
                } else {
                    parent[newKey] = newVal;
                    data = { ...data };
                }
                updateYamlString();
            }
        }
    }

    // --- Modal Logic ---

    function openModal(
        title: string,
        path: NodePath,
        editMode: boolean,
        key: string = "",
        val: any = "",
    ) {
        modalTitle = title;
        modalPath = path;
        isEditing = editMode;
        modalKey = editMode ? key : "";

        if (editMode) {
            if (
                val !== null &&
                typeof val === "object" &&
                !Array.isArray(val)
            ) {
                modalIsObject = true;
                modalValue = "";
            } else if (Array.isArray(val)) {
                modalIsObject = false;
                modalValue = val.join(", ");
            } else {
                modalIsObject = false;
                modalValue = val;
            }
        } else {
            modalIsObject = false;
            modalValue = "";
        }
        modalOpen = true;
    }

    function handleSaveNode(
        newKey: string,
        newValue: any,
        isObj: boolean,
        explicitType: string = "Auto",
    ) {
        pushHistory();
        const targetPath = isEditing ? modalPath.slice(0, -1) : modalPath;
        let parent = targetPath.length === 0 ? data : getNode(data, targetPath);
        if (!parent) parent = data;

        const isArrayParent = Array.isArray(parent);

        if (!isArrayParent && !newKey.trim()) {
            toastStore.warning("键名不能为空");
            return;
        }
        if (
            !isArrayParent &&
            (!isEditing || newKey !== modalKey) &&
            newKey in parent
        ) {
            toastStore.warning("键名已存在");
            return;
        }

        let finalValue = newValue;
        if (isObj) {
            finalValue = {};
            if (
                isEditing &&
                typeof parent[modalKey] === "object" &&
                !Array.isArray(parent[modalKey])
            ) {
                finalValue = parent[modalKey];
            }
        } else {
            if (explicitType === "String") finalValue = String(newValue);
            else if (explicitType === "Number") finalValue = Number(newValue);
            else if (explicitType === "Boolean")
                finalValue = String(newValue).toLowerCase() === "true";
            else {
                if (!isNaN(Number(newValue)) && newValue !== "")
                    finalValue = Number(newValue);
                else if (String(newValue).toLowerCase() === "true")
                    finalValue = true;
                else if (String(newValue).includes(","))
                    finalValue = String(newValue)
                        .split(",")
                        .map((s) => s.trim());
                else finalValue = String(newValue);
            }
        }

        if (isEditing && newKey !== modalKey) delete parent[modalKey];

        if (isEditing && newKey !== modalKey && !isArrayParent) {
            const keys = Object.keys(parent);
            const idx = keys.indexOf(modalKey);
            if (idx !== -1) {
                const newObj: any = {};
                keys.forEach((k) => {
                    if (k === modalKey) newObj[newKey] = finalValue;
                    else newObj[k] = parent[k];
                });
                if (targetPath.length === 0) data = newObj;
                else {
                    const grandParent = getNode(data, targetPath.slice(0, -1));
                    const pKey = targetPath[targetPath.length - 1];
                    grandParent[pKey] = newObj;
                }
            } else {
                parent[newKey] = finalValue;
            }
        } else {
            if (isArrayParent) {
                if (isEditing)
                    parent[Number(modalKey)] = finalValue; // Edit array item
                else parent.push(finalValue); // Add array item
            } else {
                parent[newKey] = finalValue;
            }
        }

        data = { ...data };
        updateYamlString();
        modalOpen = false;
    }

    // --- Toolbar Actions ---

    function handleClear() {
        if (confirm("Clear all data?")) {
            pushHistory();
            data = {};
            localStorage.removeItem(STORAGE_KEY);
            updateYamlString();
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(yamlString);
        toastStore.success("已复制 YAML 到剪贴板");
    }

    function handleCopyJSON() {
        const jsonStr = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(jsonStr);
        toastStore.success("已复制 JSON 到剪贴板");
    }

    function handleImport() {
        fileInput.click();
    }

    function handleBatchImportOpen() {
        batchModalOpen = true;
    }

    function performBatchImport(content: string) {
        try {
            const clean = content.replace(/^---\n/, "").replace(/\n---$/, "");
            const parsed = jsyaml.load(clean);
            pushHistory();
            data = processArrays(parsed) || {};
            updateYamlString();
            batchModalOpen = false;
            toastStore.success("批量导入成功");
        } catch (err) {
            toastStore.error("YAML 解析错误: " + err);
        }
    }

    function onFileSelected(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const content = evt.target?.result as string;
                const clean = content
                    .replace(/^---\n/, "")
                    .replace(/\n---$/, "");
                const parsed = jsyaml.load(clean);
                pushHistory();
                data = processArrays(parsed) || {};
                updateYamlString();
                toastStore.success("文件导入成功");
            } catch (err) {
                toastStore.error("无效的 YAML 文件");
            }
        };
        reader.readAsText(file);
        (e.target as HTMLInputElement).value = "";
    }

    // --- Format / Beautify ---
    function handleFormat() {
        try {
            const parsed = jsyaml.load(yamlString);
            const formatted = jsyaml.dump(parsed, {
                indent: 2,
                lineWidth: 120,
                noRefs: true,
                sortKeys: false,
            });
            pushHistory();
            yamlString = formatted;
            // Sync to data if in visual mode context
            if (viewMode === "visual") {
                data = processArrays(parsed) || {};
            }
            toastStore.success("格式化完成");
        } catch (err) {
            toastStore.error("无法格式化：YAML 语法错误 " + err);
        }
    }

    // --- Auto-Save to LocalStorage ---
    const AUTO_SAVE_KEY = "yamlEditorAutoSave";
    let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

    $effect(() => {
        const content = yamlString;
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (content.trim()) {
                localStorage.setItem(AUTO_SAVE_KEY, content);
            }
        }, 1000); // Debounce 1 second
    });

    // Load auto-saved content on mount
    onMount(() => {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved && !yamlString.trim()) {
            yamlString = saved;
            try {
                const parsed = jsyaml.load(saved);
                data = processArrays(parsed) || {};
            } catch (e) {
                // Ignore parse errors on load
            }
        }
    });

    function handleExportJSON() {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function handleExport() {
        const blob = new Blob([yamlString], { type: "text/yaml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.yaml";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (modalOpen || batchModalOpen) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            handleRedo();
        }
        // New Root Node shortcut - only in Visual Mode
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === "n" &&
            viewMode === "visual"
        ) {
            e.preventDefault();
            handleAction({ type: "add", path: [] });
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="h-full flex flex-col pt-2 max-w-[1600px] mx-auto">
    <!-- View Switcher Tabs -->
    <div
        class="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 mb-0 px-2"
    >
        <button
            class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-t border-l border-r border-transparent {viewMode ===
            'visual'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-primary-600 dark:text-primary-400 -mb-px'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
            onclick={() => setViewMode("visual")}
        >
            <span class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-network"
                    ><rect x="16" y="16" width="6" height="6" rx="1" /><rect
                        x="2"
                        y="16"
                        width="6"
                        height="6"
                        rx="1"
                    /><rect x="9" y="2" width="6" height="6" rx="1" /><path
                        d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"
                    /><path d="M12 12V8" /></svg
                >
                Visual Editor
            </span>
        </button>
        <button
            class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-t border-l border-r border-transparent {viewMode ===
            'code'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-primary-600 dark:text-primary-400 -mb-px'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
            onclick={() => setViewMode("code")}
        >
            <span class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-code-2"
                    ><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path
                        d="m14.5 4-5 16"
                    /></svg
                >
                Code Editor
            </span>
        </button>
    </div>

    <div
        class="flex-1 flex overflow-hidden rounded-b-lg rounded-tr-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative"
    >
        {#if viewMode === "visual"}
            <!-- Visual Mode -->
            <!-- Left: Editor Pane -->
            <div
                class="w-1/2 min-w-[300px] flex flex-col resize-x overflow-hidden border-r border-slate-200 dark:border-slate-800"
            >
                <EditorPane {data} onAction={handleAction} />
            </div>

            <!-- Right: Preview Pane -->
            <div class="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
                <div
                    class="h-12 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
                >
                    <h3
                        class="font-semibold text-slate-700 dark:text-slate-200"
                    >
                        Preview
                    </h3>
                    <Toolbar
                        {canUndo}
                        {canRedo}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onClear={handleClear}
                        onCopy={handleCopy}
                        onExport={handleExport}
                        onExportJSON={handleExportJSON}
                        onImport={handleImport}
                        onBatch={handleBatchImportOpen}
                        onHelp={() => (shortcutsModalOpen = true)}
                    />
                </div>
                <div class="flex-1 overflow-hidden relative">
                    <YamlPreview value={yamlString} {data} />
                </div>
            </div>
        {:else}
            <!-- Code Mode -->
            <!-- Left: Template Sidebar -->
            <div class="flex-none">
                <TemplateSidebar
                    onInsert={handleTemplateInsert}
                    currentContent={yamlString}
                />
            </div>

            <!-- Right: Code Editor -->
            <div class="flex-1 flex flex-col min-w-0 relative">
                <div
                    class="h-12 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
                >
                    <h3
                        class="font-semibold text-slate-700 dark:text-slate-200"
                    >
                        YAML Source
                    </h3>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => (pathQueryOpen = !pathQueryOpen)}
                            class="text-xs flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="lucide lucide-search"
                                ><circle cx="11" cy="11" r="8" /><path
                                    d="m21 21-4.3-4.3"
                                /></svg
                            >
                            Query
                        </button>
                        <Toolbar
                            {canUndo}
                            {canRedo}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onClear={handleClear}
                            onCopy={handleCopy}
                            onCopyJSON={handleCopyJSON}
                            onExport={handleExport}
                            onExportJSON={handleExportJSON}
                            onImport={handleImport}
                            onBatch={handleBatchImportOpen}
                            onHelp={() => (shortcutsModalOpen = true)}
                            onFormat={handleFormat}
                        />
                    </div>
                </div>

                <div class="flex-1 relative overflow-hidden">
                    <CodeEditor
                        bind:value={yamlString}
                        {isDark}
                        onChange={handleCodeChange}
                    />

                    <PathQueryPanel
                        {data}
                        isHidden={!pathQueryOpen}
                        onClose={() => (pathQueryOpen = false)}
                    />
                </div>

                <ValidationPanel value={yamlString} />
            </div>
        {/if}
    </div>
</div>

<input
    type="file"
    bind:this={fileInput}
    class="hidden"
    accept=".yaml,.yml"
    onchange={onFileSelected}
/>

<!-- Modals -->
<EditNodeModal
    bind:open={modalOpen}
    title={modalTitle}
    nodeKey={modalKey}
    nodeValue={modalValue}
    isObject={modalIsObject}
    isArrayItem={Array.isArray(
        getNode(data, isEditing ? modalPath.slice(0, -1) : modalPath),
    )}
    onSave={handleSaveNode}
    onClose={() => (modalOpen = false)}
/>

<BatchImportModal
    bind:open={batchModalOpen}
    onImport={performBatchImport}
    onClose={() => (batchModalOpen = false)}
/>

<ShortcutsModal
    bind:open={shortcutsModalOpen}
    onClose={() => (shortcutsModalOpen = false)}
/>
