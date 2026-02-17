<script module lang="ts">
    import type { NodePath, EditorEvent } from "../types";

    export function isObject(val: any): boolean {
        return val !== null && typeof val === "object" && !Array.isArray(val);
    }

    export function isArray(val: any): boolean {
        return Array.isArray(val);
    }

    export function getValueDisplay(key: string, val: any) {
        if (isArray(val)) {
            // Check if array contains complex items (objects/arrays)
            const hasComplexItems = val.some(
                (item: any) => isObject(item) || isArray(item),
            );
            if (hasComplexItems || val.length > 5) {
                return `Array[${val.length}]`;
            }
            return `[${val.map((item: any) => (typeof item === "string" ? item : JSON.stringify(item))).join(", ")}]`;
        }
        if (isObject(val)) return ""; // Object/Container
        return String(val);
    }

    // Check if value has expandable children (object or non-empty array)
    export function hasExpandableChildren(val: any): boolean {
        if (isObject(val)) return Object.keys(val).length > 0;
        if (isArray(val))
            return (
                val.length > 0 &&
                val.some((item: any) => isObject(item) || isArray(item))
            );
        return false;
    }

    export function getNodeIcon(val: any) {
        if (isArray(val)) return "tags"; // array
        if (isObject(val)) {
            if (Object.keys(val).length === 0) return "cube"; // empty
            return "sitemap"; // object
        }
        return "key"; // leaf
    }
</script>

<script lang="ts">
    import { slide } from "svelte/transition";
    import TreeView from "./TreeView.svelte";

    interface Props {
        data: any;
        path?: NodePath;
        level?: number;
        expandedKeys: Set<string>;
        onAction?: (event: EditorEvent) => void;
    }

    let {
        data,
        path = [],
        level = 0,
        expandedKeys = $bindable(),
        onAction,
    }: Props = $props();

    function getNodeKey(p: NodePath) {
        return p.join("\u0000");
    }

    function toggleExpand(key: string, event?: MouseEvent) {
        const pKey = getNodeKey([...path, key]);

        // Recursive Expand (Alt + Click)
        if (event && event.altKey) {
            if (expandedKeys.has(pKey)) {
                expandedKeys.delete(pKey);
            } else {
                // Expand All Recursive
                const val = data[key];
                const stack = [{ val, p: [...path, key] }];

                expandedKeys.add(pKey);

                while (stack.length) {
                    const { val, p } = stack.pop()!;
                    if (val && typeof val === "object" && !Array.isArray(val)) {
                        Object.keys(val).forEach((k) => {
                            const childVal = val[k];
                            // Type check for object to avoid lint error
                            if (
                                childVal &&
                                typeof childVal === "object" &&
                                !Array.isArray(childVal) &&
                                Object.keys(childVal as object).length > 0
                            ) {
                                const childPath = [...p, k];
                                expandedKeys.add(getNodeKey(childPath));
                                stack.push({ val: childVal, p: childPath });
                            }
                        });
                    }
                }
            }
        } else {
            if (expandedKeys.has(pKey)) {
                expandedKeys.delete(pKey);
            } else {
                expandedKeys.add(pKey);
            }
        }
    }

    function handleAction(type: EditorEvent["type"], key: string) {
        onAction?.({ type, path: [...path, key] });
    }

    // Keyboard Nav
    function handleKeydown(
        e: KeyboardEvent,
        key: string,
        hasChildren: boolean,
    ) {
        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (e.key === "ArrowRight") {
            if (hasChildren) {
                const pKey = getNodeKey([...path, key]);
                if (!expandedKeys.has(pKey)) {
                    expandedKeys.add(pKey);
                } else {
                    moveFocus(e.target as HTMLElement, "next");
                }
            }
        } else if (e.key === "ArrowLeft") {
            if (hasChildren) {
                const pKey = getNodeKey([...path, key]);
                if (expandedKeys.has(pKey)) {
                    expandedKeys.delete(pKey);
                } else {
                    moveFocus(e.target as HTMLElement, "parent");
                }
            } else {
                moveFocus(e.target as HTMLElement, "parent");
            }
        } else if (e.key === "ArrowDown") {
            moveFocus(e.target as HTMLElement, "next");
        } else if (e.key === "ArrowUp") {
            moveFocus(e.target as HTMLElement, "prev");
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleAction("edit", key);
        }
    }

    function moveFocus(el: HTMLElement, dir: "next" | "prev" | "parent") {
        const items = Array.from(
            document.querySelectorAll('[role="treeitem"]'),
        ) as HTMLElement[];
        const idx = items.indexOf(el);

        if (dir === "next") {
            if (idx < items.length - 1) items[idx + 1].focus();
        } else if (dir === "prev") {
            if (idx > 0) items[idx - 1].focus();
        } else if (dir === "parent") {
            const parentLi = el.closest("ul")?.closest("li");
            if (parentLi) {
                const parentItem = parentLi.querySelector(
                    '[role="treeitem"]',
                ) as HTMLElement;
                if (parentItem) parentItem.focus();
            }
        }
    }
</script>

<ul
    class={level > 0
        ? "pl-4 border-l border-slate-200 dark:border-slate-700 mt-1"
        : ""}
>
    {#if data && typeof data === "object"}
        {#each Object.entries(data) as [key, value]}
            {@const currentPath = [...path, key]}
            {@const nodeKey = getNodeKey(currentPath)}
            {@const hasChildren = hasExpandableChildren(value)}
            {@const isExpanded = expandedKeys.has(nodeKey)}
            {@const icon = getNodeIcon(value)}

            <li class="my-1.5">
                <div
                    class="group flex items-center hover:bg-primary-50 dark:hover:bg-slate-800 rounded px-2 py-1.5 transition-colors focus:bg-primary-100 dark:focus:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-300"
                    role="treeitem"
                    aria-selected="false"
                    tabindex="0"
                    onkeydown={(e) => handleKeydown(e, key, hasChildren)}
                >
                    <!-- Toggle Button -->
                    <button
                        type="button"
                        class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none shrink-0"
                        onclick={(e) => hasChildren && toggleExpand(key, e)}
                        disabled={!hasChildren}
                        tabindex="-1"
                    >
                        {#if hasChildren}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-4 h-4 transition-transform duration-200 {isExpanded
                                    ? 'rotate-90'
                                    : ''}"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        {/if}
                    </button>

                    <!-- Icon -->
                    <span
                        class="w-6 h-6 flex items-center justify-center mr-1 shrink-0"
                    >
                        {#if icon === "tags"}
                            <!-- Array: Purple -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-4 h-4 text-purple-500"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                                />
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M6 6h.008v.008H6V6Z"
                                />
                            </svg>
                        {:else if icon === "cube"}
                            <!-- Empty Object: Gray -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-4 h-4 text-slate-400"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                                />
                            </svg>
                        {:else if icon === "sitemap"}
                            <!-- Object: Blue -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-4 h-4 text-blue-500"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                                />
                            </svg>
                        {:else}
                            <!-- Leaf: Green -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-4 h-4 text-green-500"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237 1.17.659 1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                                />
                            </svg>
                        {/if}
                    </span>

                    <!-- Text -->
                    <div class="flex-grow font-mono text-sm truncate">
                        <span
                            class="font-medium text-slate-700 dark:text-slate-200"
                            >{key}</span
                        >
                        {#if !isObject(value)}
                            <span class="mx-1 text-slate-400">:</span>
                            <span
                                class={isArray(value)
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-blue-600 dark:text-blue-400"}
                            >
                                {getValueDisplay(key, value)}
                            </span>
                        {/if}
                    </div>

                    <!-- Actions (Opacity 0 by default, 100 on group-hover) -->
                    <div
                        class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2"
                    >
                        <!-- Copy Path -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                            title="Copy Path"
                            onclick={() => handleAction("copyPath", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="w-3.5 h-3.5"
                            >
                                <rect
                                    width="14"
                                    height="14"
                                    x="8"
                                    y="8"
                                    rx="2"
                                    ry="2"
                                />
                                <path
                                    d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                                />
                            </svg>
                        </button>
                        <!-- Add Child -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors"
                            title="Add Child"
                            onclick={() => handleAction("add", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3.5 h-3.5"
                                ><path
                                    d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                                /></svg
                            >
                        </button>

                        <!-- Edit -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center transition-colors"
                            title="Edit Node"
                            onclick={() => handleAction("edit", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3.5 h-3.5"
                                ><path
                                    d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"
                                /><path
                                    d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"
                                /></svg
                            >
                        </button>

                        <!-- Duplicate -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors"
                            title="Duplicate Node"
                            onclick={() => handleAction("duplicate", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3.5 h-3.5"
                            >
                                <path
                                    d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"
                                />
                                <path
                                    d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"
                                />
                            </svg>
                        </button>

                        <!-- Delete -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors"
                            title="Delete Node"
                            onclick={() => handleAction("delete", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3.5 h-3.5"
                                ><path
                                    fill-rule="evenodd"
                                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                    clip-rule="evenodd"
                                /></svg
                            >
                        </button>

                        <!-- Up -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                            title="Move Up"
                            onclick={() => handleAction("up", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3.5 h-3.5"
                                ><path
                                    fill-rule="evenodd"
                                    d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                                    clip-rule="evenodd"
                                /></svg
                            >
                        </button>

                        <!-- Down -->
                        <button
                            type="button"
                            class="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                            title="Move Down"
                            onclick={() => handleAction("down", key)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3.5 h-3.5"
                                ><path
                                    fill-rule="evenodd"
                                    d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                                    clip-rule="evenodd"
                                /></svg
                            >
                        </button>
                    </div>
                </div>

                {#if hasChildren && isExpanded}
                    <div transition:slide={{ duration: 200, axis: "y" }}>
                        <TreeView
                            data={value}
                            path={currentPath}
                            level={level + 1}
                            {expandedKeys}
                            {onAction}
                        />
                    </div>
                {/if}
            </li>
        {/each}
    {/if}
</ul>
