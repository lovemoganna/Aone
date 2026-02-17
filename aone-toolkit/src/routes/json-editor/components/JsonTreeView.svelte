<script module lang="ts">
    export interface EditorNode {
        [key: string]: any;
    }

    export type NodePath = string[];

    export type EditorEvent =
        | {
              type:
                  | "add"
                  | "edit"
                  | "delete"
                  | "up"
                  | "down"
                  | "duplicate"
                  | "copyPath";
              path: NodePath;
              payload?: any;
          }
        | { type: "select"; path: NodePath; payload?: any };

    export function isObject(val: any): boolean {
        return val !== null && typeof val === "object" && !Array.isArray(val);
    }

    export function isArray(val: any): boolean {
        return Array.isArray(val);
    }

    export function getValueDisplay(key: string, val: any) {
        if (isArray(val)) {
            const hasComplexItems = val.some(
                (item: any) => isObject(item) || isArray(item),
            );
            if (hasComplexItems || val.length > 5) {
                return `Array[${val.length}]`;
            }
            return `[${val.map((item: any) => (typeof item === "string" ? item : JSON.stringify(item))).join(", ")}]`;
        }
        if (isObject(val)) return "";
        return String(val);
    }

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
        if (isArray(val)) return "tags";
        if (isObject(val)) {
            if (Object.keys(val).length === 0) return "cube";
            return "sitemap";
        }
        return "key";
    }
</script>

<script lang="ts">
    import { slide } from "svelte/transition";
    import JsonTreeView from "./JsonTreeView.svelte";

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

        // Create a new Set to trigger reactivity
        const newSet = new Set(expandedKeys);

        if (event && event.altKey) {
            if (newSet.has(pKey)) {
                newSet.delete(pKey);
            } else {
                const val = data[key];
                const stack = [{ val, p: [...path, key] }];
                newSet.add(pKey);

                while (stack.length) {
                    const { val, p } = stack.pop()!;
                    if (val && typeof val === "object" && !Array.isArray(val)) {
                        Object.keys(val).forEach((k) => {
                            const childVal = val[k];
                            if (
                                childVal &&
                                typeof childVal === "object" &&
                                !Array.isArray(childVal) &&
                                Object.keys(childVal as object).length > 0
                            ) {
                                const childPath = [...p, k];
                                newSet.add(getNodeKey(childPath));
                                stack.push({ val: childVal, p: childPath });
                            }
                        });
                    }
                }
            }
        } else {
            if (newSet.has(pKey)) {
                newSet.delete(pKey);
            } else {
                newSet.add(pKey);
            }
        }

        // Assignment triggers update
        expandedKeys = newSet;
    }

    function handleAction(type: EditorEvent["type"], key: string) {
        onAction?.({ type, path: [...path, key] });
    }

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
                    // Trigger reactivity
                    const newSet = new Set(expandedKeys);
                    newSet.add(pKey);
                    expandedKeys = newSet;
                } else {
                    moveFocus(e.target as HTMLElement, "next");
                }
            }
        } else if (e.key === "ArrowLeft") {
            if (hasChildren) {
                const pKey = getNodeKey([...path, key]);
                if (expandedKeys.has(pKey)) {
                    // Trigger reactivity
                    const newSet = new Set(expandedKeys);
                    newSet.delete(pKey);
                    expandedKeys = newSet;
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

                    <span
                        class="w-6 h-6 flex items-center justify-center mr-1 shrink-0"
                    >
                        {#if icon === "tags"}
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
                </div>

                {#if hasChildren && isExpanded}
                    <div transition:slide={{ duration: 200, axis: "y" }}>
                        <JsonTreeView
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
