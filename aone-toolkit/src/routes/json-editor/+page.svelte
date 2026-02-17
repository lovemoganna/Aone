<script lang="ts">
    import { Button } from "$lib/components/ui";
    import JsonCodeEditor from "./components/JsonCodeEditor.svelte";
    import JsonTreeView from "./components/JsonTreeView.svelte";
    import JsonPathPanel from "./components/JsonPathPanel.svelte";
    import TypeGenModal from "./components/TypeGenModal.svelte";
    import ToolsModal from "./components/ToolsModal.svelte";
    import yaml from "js-yaml";

    let jsonContent = $state(
        '{\n  "name": "Example",\n  "version": 1,\n  "items": [\n    {"id": 1, "active": true},\n    {"id": 2, "active": false}\n  ]\n}',
    );
    let parsedData = $state<any>(null);
    let error = $state<string | null>(null);
    let isDark = $state(false); // Should be hooked to global theme store ideally
    let showPathQuery = $state(false);
    let showTypeGen = $state(false);
    let showTools = $state(false);
    let expandedKeys = $state(new Set<string>());

    // Theme store subscription mock (ideally import from store)
    import { theme } from "$lib/stores";
    $effect(() => {
        isDark = $theme === "dark";
    });

    // Parse JSON
    function parse(content: string) {
        try {
            parsedData = JSON.parse(content);
            error = null;
        } catch (e: any) {
            error = e.message;
            // distinct from parsedData to allow editing invalid JSON
        }
    }

    $effect(() => {
        parse(jsonContent);
    });

    function handleToolsUpdate(newData: any) {
        if (newData) {
            jsonContent = JSON.stringify(newData, null, 2);
        }
    }

    // Actions
    function format() {
        if (!error && parsedData) {
            jsonContent = JSON.stringify(parsedData, null, 2);
        }
    }

    function minify() {
        if (!error && parsedData) {
            jsonContent = JSON.stringify(parsedData);
        }
    }

    function save() {
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    function convertToYaml() {
        if (!error && parsedData) {
            const yamlStr = yaml.dump(parsedData);
            // Create a blob and download as .yaml (simpler than switching editor mode fully)
            // Or prompt user? For now, let's just download or console log?
            // Specification said "JSON <-> YAML Converter".
            // Let's replace content if user agrees? Or show in a modal?
            // Let's just replace inputs for now (toggle).
            // BUT this is a JSON editor. If we convert to YAML, syntax highlighting breaks.
            // So better to just "Download as YAML" or have a "Copy YAML" action.

            // Strategy: Copy YAML to clipboard
            navigator.clipboard.writeText(yamlStr);
            alert("YAML copied to clipboard!");
        }
    }

    function expandAll() {
        if (!parsedData) return;
        const keys = new Set<string>();

        function traverse(obj: any, path: string[]) {
            if (obj && typeof obj === "object") {
                Object.keys(obj).forEach((k) => {
                    const value = obj[k];
                    if (
                        value &&
                        typeof value === "object" &&
                        Object.keys(value).length > 0
                    ) {
                        const currentPath = [...path, k];
                        keys.add(currentPath.join("\u0000"));
                        traverse(value, currentPath);
                    }
                });
            }
        }

        traverse(parsedData, []);
        expandedKeys = keys;
    }

    // Editor Actions
    function handleTreeAction(event: any) {
        // Implement interaction logic if needed (e.g. sync back to code)
        // For now, read-only visualization of structure
        console.log("Tree Action", event);
    }
</script>

<svelte:head>
    <title>JSON Editor - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)]">
    <div
        class="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-soft"
    >
        <!-- Header -->
        <div
            class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-5 h-5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                            />
                        </svg>
                    </div>
                    <div class="flex flex-col">
                        <h1
                            class="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            JSON Editor
                        </h1>
                        {#if error}
                            <span class="text-xs text-red-500 font-mono"
                                >Invalid JSON</span
                            >
                        {/if}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (showPathQuery = !showPathQuery)}
                    >
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
                            class="lucide lucide-search mr-2"
                            ><circle cx="11" cy="11" r="8" /><path
                                d="m21 21-4.3-4.3"
                            /></svg
                        >
                        Query
                    </Button>
                    <div
                        class="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"
                    ></div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => (showTools = true)}>Tools</Button
                    >
                    <Button variant="secondary" size="sm" onclick={format}
                        >Format</Button
                    >
                    <Button variant="secondary" size="sm" onclick={minify}
                        >Minify</Button
                    >
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => (showTypeGen = true)}>Gen Types</Button
                    >
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={convertToYaml}>Copy YAML</Button
                    >
                    <Button variant="primary" size="sm" onclick={save}
                        >Save</Button
                    >
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Code Editor (Left) -->
            <div
                class="flex-1 border-r border-slate-200 dark:border-slate-800 relative group min-w-0"
            >
                <JsonCodeEditor bind:value={jsonContent} {isDark} />
                <!-- Integrated Error Toast -->
                {#if error}
                    <div
                        class="absolute bottom-4 left-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 rounded text-xs text-red-600 dark:text-red-400 font-mono"
                    >
                        {error}
                    </div>
                {/if}
            </div>

            <!-- Tree View (Right) -->
            <div
                class="w-1/3 min-w-[300px] max-w-[500px] bg-slate-50 dark:bg-slate-900 flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
                <div
                    class="p-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0"
                >
                    <span class="text-xs font-semibold text-slate-500 uppercase"
                        >Structure</span
                    >
                    <div class="flex gap-2">
                        <button
                            class="text-xs text-blue-500 hover:underline"
                            onclick={expandAll}>Expand All</button
                        >
                        <span class="text-slate-300">|</span>
                        <button
                            class="text-xs text-blue-500 hover:underline"
                            onclick={() => (expandedKeys = new Set())}
                            >Collapse All</button
                        >
                    </div>
                </div>
                <div class="flex-1 overflow-auto p-2">
                    {#if !error && parsedData}
                        <JsonTreeView
                            data={parsedData}
                            bind:expandedKeys
                            onAction={handleTreeAction}
                        />
                    {:else}
                        <div
                            class="h-full flex items-center justify-center text-slate-400 text-sm italic"
                        >
                            {error ? "Fix errors to view structure" : "Empty"}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Overlays -->
        <JsonPathPanel
            data={parsedData}
            isHidden={!showPathQuery}
            onClose={() => (showPathQuery = false)}
        />

        <TypeGenModal
            isOpen={showTypeGen}
            jsonData={parsedData}
            onClose={() => (showTypeGen = false)}
        />

        <ToolsModal
            isOpen={showTools}
            jsonData={parsedData}
            onUpdate={handleToolsUpdate}
            onClose={() => (showTools = false)}
        />
    </div>
</div>
