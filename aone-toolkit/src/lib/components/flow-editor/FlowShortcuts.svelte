<script lang="ts">
    import { Keyboard, X } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let { open = $bindable(false) } = $props<{ open?: boolean }>();
    
    let isMac = $derived(
        typeof navigator !== "undefined" &&
        /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform || "")
    );

    // Group shortcuts by category
    let groupedShortcuts = $derived.by(() => {
        const groups: Record<string, typeof shortcuts> = {};
        shortcuts.forEach(s => {
            const displayKey = isMac ? s.key.replace(/Ctrl/g, "⌘") : s.key;
            const item = { ...s, key: displayKey };
            if (!groups[s.category]) {
                groups[s.category] = [];
            }
            groups[s.category].push(item);
        });
        return groups;
    });

    const shortcuts = [
        // Canvas
        { key: "Space + Drag", desc: "平移画布", category: "画布" },
        { key: "Ctrl + Wheel", desc: "缩放", category: "画布" },
        { key: "Ctrl + 0", desc: "适应视图", category: "画布" },
        { key: "Ctrl + 1", desc: "100% 缩放", category: "画布" },
        
        // Selection
        { key: "Click", desc: "选择节点", category: "选择" },
        { key: "Shift + Click", desc: "多选", category: "选择" },
        { key: "Drag", desc: "框选", category: "选择" },
        { key: "Ctrl + A", desc: "全选", category: "选择" },
        { key: "Escape", desc: "取消选择", category: "选择" },
        
        // Edit
        { key: "Backspace", desc: "删除所选", category: "编辑" },
        { key: "Ctrl + C", desc: "复制", category: "编辑" },
        { key: "Ctrl + V", desc: "粘贴", category: "编辑" },
        { key: "Ctrl + Z", desc: "撤销", category: "编辑" },
        { key: "Ctrl + Y", desc: "重做", category: "编辑" },
        { key: "Ctrl + D", desc: "复制粘贴", category: "编辑" },
        
        // Connection
        { key: "Tab", desc: "导航连接模式", category: "连接" },
        { key: "C", desc: "连接模式", category: "连接" },
        { key: "L", desc: "连接两个节点", category: "连接" },
        { key: "O", desc: "顺序连接", category: "连接" },
        
        // Tools
        { key: "D", desc: "快速复制", category: "工具" },
        { key: "Shift + L", desc: "美化连线", category: "工具" },
        
        // Panel
        { key: "Ctrl + K", desc: "搜索", category: "面板" },
        { key: "Ctrl + F", desc: "搜索", category: "面板" },
        { key: "Ctrl + Shift + V", desc: "验证面板", category: "面板" },
        { key: "?", desc: "显示快捷键", category: "面板" },
        
        // Edge
        { key: "Click Edge", desc: "打开边属性", category: "连线" },
    ];
</script>

<div class="absolute top-4 right-4 z-50">
    <button
        class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors"
        onclick={() => (open = !open)}
        title="Keyboard Shortcuts"
    >
        <Keyboard class="w-5 h-5" />
    </button>

    {#if open}
        <div
            transition:fly={{ y: -10, duration: 200 }}
            class="absolute top-12 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
        >
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50"
            >
                <h3
                    class="font-semibold text-xs uppercase tracking-wider text-slate-500"
                >
                    Shortcuts
                </h3>
                <button
                    onclick={() => (open = false)}
                    class="text-slate-400 hover:text-slate-600"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>
            <div class="p-2 max-h-[400px] overflow-y-auto">
                {#each Object.entries(groupedShortcuts) as [category, items]}
                    <div class="mb-3 last:mb-0">
                        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                            {category}
                        </h4>
                        <table class="w-full text-sm">
                            <tbody>
                                {#each items as s}
                                    <tr class="group">
                                        <td
                                            class="py-1.5 px-3 text-slate-500 dark:text-slate-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-l-lg"
                                        >
                                            {s.desc}
                                        </td>
                                        <td
                                            class="py-1.5 px-3 text-right group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-r-lg"
                                        >
                                            <kbd
                                                class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold shadow-sm"
                                            >
                                                {s.key}
                                            </kbd>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
