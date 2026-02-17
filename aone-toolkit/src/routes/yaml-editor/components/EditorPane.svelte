<script lang="ts">
    import { Input, Button } from "$lib/components/ui";
    import TreeView, {
        hasExpandableChildren,
        isObject,
        isArray,
    } from "./TreeView.svelte";
    import type { EditorEvent, NodePath } from "../types";
    import { SvelteSet } from "svelte/reactivity";

    interface Props {
        data: any;
        onAction: (event: EditorEvent) => void;
    }

    let { data, onAction }: Props = $props();

    let searchQuery = $state("");
    let expandedKeys = $state(new SvelteSet<string>());

    // Basic filtering logic
    function filterData(obj: any, query: string): any {
        if (!query) return obj;
        if (typeof obj !== "object" || obj === null) return obj;

        const result: any = Array.isArray(obj) ? [] : {};
        let hasMatch = false;

        for (const [key, value] of Object.entries(obj)) {
            const valueMatch = String(value)
                .toLowerCase()
                .includes(query.toLowerCase());
            const keyMatch = key.toLowerCase().includes(query.toLowerCase());

            if (keyMatch || valueMatch) {
                if (Array.isArray(result)) (result as any[]).push(value);
                else result[key] = value;
                hasMatch = true;
            } else if (typeof value === "object" && value !== null) {
                const filteredChild = filterData(value, query);
                // Check if filtered child has content
                const hasContent = Array.isArray(filteredChild)
                    ? filteredChild.length > 0
                    : Object.keys(filteredChild).length > 0;

                if (hasContent) {
                    if (Array.isArray(result))
                        (result as any[]).push(filteredChild);
                    else result[key] = filteredChild;
                    hasMatch = true;
                }
            }
        }

        return hasMatch ? result : Array.isArray(obj) ? [] : {};
    }

    let filteredData = $derived(
        searchQuery ? filterData(data, searchQuery) : data,
    );

    function getAllObjectPaths(obj: any, path: string[] = []): string[] {
        const paths: string[] = [];
        if (!obj || typeof obj !== "object") return paths;

        for (const [key, val] of Object.entries(obj)) {
            const currentPath = [...path, key];

            // Use shared logic for expandability
            if (hasExpandableChildren(val)) {
                paths.push(currentPath.join("\u0000"));
                // Recursively find children paths
                paths.push(...getAllObjectPaths(val, currentPath));
            }
        }
        return paths;
    }

    function handleExpandAll() {
        const allPaths = getAllObjectPaths(filteredData);
        allPaths.forEach((k) => expandedKeys.add(k));
    }

    function handleCollapseAll() {
        expandedKeys.clear();
    }
</script>

<div
    class="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
>
    <!-- Header -->
    <div
        class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3"
    >
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">
            YAML Editor
        </h2>

        <div class="flex items-center gap-2">
            <div class="flex-1 relative">
                <Input
                    placeholder="Search..."
                    bind:value={searchQuery}
                    class="pr-8 h-8 text-sm"
                />
                {#if searchQuery}
                    <button
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                        onclick={() => (searchQuery = "")}
                    >
                        <!-- X Circle -->
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
                            class="lucide lucide-x-circle shrink-0"
                            ><circle cx="12" cy="12" r="10" /><path
                                d="m15 9-6 6"
                            /><path d="m9 9 6 6" /></svg
                        >
                    </button>
                {/if}
            </div>

            <div class="flex gap-1">
                <Button
                    variant="secondary"
                    size="sm"
                    class="px-2 h-8"
                    title="Expand All"
                    onclick={handleExpandAll}
                >
                    <!-- Expand (Chevrons Up-Down) -->
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
                        class="lucide lucide-chevrons-up-down shrink-0"
                        ><path d="m7 15 5 5 5-5" /><path
                            d="m7 9 5-5 5 5"
                        /></svg
                    >
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    class="px-2 h-8"
                    title="Collapse All"
                    onclick={handleCollapseAll}
                >
                    <!-- Collapse (Chevrons Down-Up) -->
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
                        class="lucide lucide-chevrons-down-up shrink-0"
                        ><path d="m7 20 5-5 5 5" /><path
                            d="m7 4 5 5 5-5"
                        /></svg
                    >
                </Button>
            </div>
        </div>
    </div>

    <!-- Tree Container -->
    <div class="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <TreeView data={filteredData} bind:expandedKeys {onAction} />
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
            variant="primary"
            size="sm"
            class="w-full flex items-center justify-center gap-2"
            onclick={() => onAction({ type: "add", path: [] })}
        >
            <!-- Plus -->
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
                class="lucide lucide-plus shrink-0"
                ><path d="M5 12h14" /><path d="M12 5v14" /></svg
            >
            Add Root Node
        </Button>
    </div>
</div>
