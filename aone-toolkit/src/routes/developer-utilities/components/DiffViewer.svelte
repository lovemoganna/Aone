<script lang="ts">
    import { onMount } from "svelte";
    import * as Diff from "diff";
    import { 
        Split, 
        Trash2, 
        ArrowRightLeft, 
        Copy, 
        Check, 
        GitMerge, 
        Download,
        Columns,
        AlignLeft,
        FileCode,
        Layers
    } from "lucide-svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { CodeBlock } from "$lib/components/ui";

    let { textA = "", textB = "" } = $props<{
        textA?: string;
        textB?: string;
    }>();

    let oldText = $state(textA || "");
    let newText = $state(textB || "");

    $effect(() => {
        if (textA !== undefined && textA !== "") oldText = textA;
        if (textB !== undefined && textB !== "") newText = textB;
    });
    let diffs = $state<Diff.Change[]>([]);
    let mode = $state<"lines" | "words" | "chars">("lines");
    let viewLayout = $state<"unified" | "split" | "patch">("unified");
    let ignoreWhitespace = $state(false);
    let mergedDraft = $state("");
    let showMergeView = $state(false);

    const PRESETS = [
        {
            name: "TS 函数重构",
            oldVal: `export function calculateTax(amount: number): number {\n  // Old legacy implementation\n  var rate = 0.15;\n  var discount = 5;\n  return (amount * rate) - discount;\n}`,
            newVal: `export function calculateTax(amount: number, userTier: string = "standard"): number {\n  // Refactored with tier-based rates\n  const rateMap: Record<string, number> = { standard: 0.15, vip: 0.10, enterprise: 0.08 };\n  const rate = rateMap[userTier] ?? 0.15;\n  return Math.max(0, amount * rate);\n}`
        },
        {
            name: "JSON 配置变更",
            oldVal: `{\n  "appName": "Aone-Toolkit",\n  "version": "1.2.0",\n  "enableTelemetry": true,\n  "maxWorkers": 4\n}`,
            newVal: `{\n  "appName": "Aone-Toolkit",\n  "version": "1.3.0",\n  "enableTelemetry": false,\n  "maxWorkers": 8,\n  "logLevel": "debug"\n}`
        }
    ];

    onMount(() => {
        const handoff = dataBridge.consume("/diff-viewer");
        if (handoff && handoff.payload) {
            if (!oldText) {
                oldText = handoff.payload;
            } else {
                newText = handoff.payload;
            }
            compare();
        } else {
            oldText = PRESETS[0].oldVal;
            newText = PRESETS[0].newVal;
            compare();
        }
    });

    let compareTimer: ReturnType<typeof setTimeout> | null = null;

    function debouncedCompare() {
        if (compareTimer) clearTimeout(compareTimer);
        compareTimer = setTimeout(() => {
            compare();
        }, 150);
    }

    function compare() {
        if (compareTimer) clearTimeout(compareTimer);
        if (!oldText && !newText) {
            diffs = [];
            return;
        }

        if (mode === "lines") {
            diffs = Diff.diffLines(oldText, newText, { ignoreWhitespace }) || [];
        } else if (mode === "words") {
            diffs = (Diff.diffWords(oldText, newText, { ignoreWhitespace } as any) || []) as Diff.Change[];
        } else {
            diffs = Diff.diffChars(oldText, newText) || [];
        }

        mergedDraft = newText || oldText;
    }

    function clear() {
        oldText = "";
        newText = "";
        diffs = [];
        mergedDraft = "";
        toastStore.info("已清空文本");
    }

    function swap() {
        const temp = oldText;
        oldText = newText;
        newText = temp;
        compare();
        toastStore.success("已互换原始与修改版本");
    }

    function loadPreset(p: typeof PRESETS[0]) {
        oldText = p.oldVal;
        newText = p.newVal;
        compare();
        toastStore.info(`已载入示例: ${p.name}`);
    }

    async function copyText(str: string, label = "文本") {
        try {
            await navigator.clipboard.writeText(str);
            toastStore.success(`已复制 ${label}`);
        } catch {
            toastStore.error("复制失败");
        }
    }

    function downloadPatch() {
        const patch = Diff.createPatch("file.txt", oldText, newText, "old", "new");
        const blob = new Blob([patch], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "diff_patch.patch";
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("已导出 Git Patch 补丁文件");
    }

    function downloadText(content: string, filename = "merged.txt") {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success(`已下载 ${filename}`);
    }

    // Split View Lines generator
    interface SplitDiffRow {
        leftLineNo?: number;
        leftText?: string;
        leftType?: "removed" | "normal";
        rightLineNo?: number;
        rightText?: string;
        rightType?: "added" | "normal";
    }

    let splitRows = $derived.by(() => {
        if (!diffs || diffs.length === 0) return [];
        const rows: SplitDiffRow[] = [];
        let leftNo = 1;
        let rightNo = 1;

        let pendingRemoved: string[] = [];

        for (const part of diffs) {
            const lines = part.value.replace(/\n$/, "").split("\n");

            if (part.removed) {
                pendingRemoved.push(...lines);
            } else if (part.added) {
                const maxLen = Math.max(pendingRemoved.length, lines.length);
                for (let i = 0; i < maxLen; i++) {
                    const remLine = pendingRemoved[i];
                    const addLine = lines[i];
                    rows.push({
                        leftLineNo: remLine !== undefined ? leftNo++ : undefined,
                        leftText: remLine,
                        leftType: remLine !== undefined ? "removed" : undefined,
                        rightLineNo: addLine !== undefined ? rightNo++ : undefined,
                        rightText: addLine,
                        rightType: addLine !== undefined ? "added" : undefined
                    });
                }
                pendingRemoved = [];
            } else {
                if (pendingRemoved.length > 0) {
                    for (const remLine of pendingRemoved) {
                        rows.push({
                            leftLineNo: leftNo++,
                            leftText: remLine,
                            leftType: "removed"
                        });
                    }
                    pendingRemoved = [];
                }
                for (const line of lines) {
                    rows.push({
                        leftLineNo: leftNo++,
                        leftText: line,
                        leftType: "normal",
                        rightLineNo: rightNo++,
                        rightText: line,
                        rightType: "normal"
                    });
                }
            }
        }

        if (pendingRemoved.length > 0) {
            for (const remLine of pendingRemoved) {
                rows.push({
                    leftLineNo: leftNo++,
                    leftText: remLine,
                    leftType: "removed"
                });
            }
        }

        return rows;
    });

    let gitPatchText = $derived.by(() => {
        if (!oldText && !newText) return "";
        return Diff.createPatch("workspace_file", oldText, newText, "a/source", "b/modified");
    });
</script>

<svelte:head>
    <title>差异对比与合并 - Aone Toolkit</title>
</svelte:head>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Command Toolbar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">文本差异与补丁</span>
            <div class="flex items-center gap-1">
                <span class="text-[10px] text-slate-400">示例:</span>
                {#each PRESETS as p}
                    <button
                        type="button"
                        class="px-1.5 py-0.5 text-[11px] rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                        onclick={() => loadPreset(p)}
                    >
                        {p.name}
                    </button>
                {/each}
            </div>
        </div>

        <div class="flex items-center gap-1.5">
            <!-- Mode switch -->
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2 py-0.5 rounded font-medium transition {mode === 'lines' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => { mode = 'lines'; compare(); }}
                >
                    按行
                </button>
                <button
                    type="button"
                    class="px-2 py-0.5 rounded font-medium transition {mode === 'words' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => { mode = 'words'; compare(); }}
                >
                    按词
                </button>
                <button
                    type="button"
                    class="px-2 py-0.5 rounded font-medium transition {mode === 'chars' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => { mode = 'chars'; compare(); }}
                >
                    按字符
                </button>
            </div>

            <!-- View layout switch -->
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2 py-0.5 rounded font-medium transition {viewLayout === 'unified' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => viewLayout = 'unified'}
                >
                    <AlignLeft size={11} class="inline mr-1" /> 统一
                </button>
                <button
                    type="button"
                    class="px-2 py-0.5 rounded font-medium transition {viewLayout === 'split' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => viewLayout = 'split'}
                >
                    <Columns size={11} class="inline mr-1" /> 分栏
                </button>
                <button
                    type="button"
                    class="px-2 py-0.5 rounded font-medium transition {viewLayout === 'patch' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => viewLayout = 'patch'}
                >
                    <FileCode size={11} class="inline mr-1" /> Patch
                </button>
            </div>

            <label class="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer select-none ml-1">
                <input
                    type="checkbox"
                    bind:checked={ignoreWhitespace}
                    onchange={compare}
                    class="rounded text-slate-600 text-xs"
                />
                <span>忽略空白</span>
            </label>

            <button
                type="button"
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                onclick={swap}
                title="互换左右内容"
            >
                <ArrowRightLeft size={13} />
            </button>

            <button
                type="button"
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                onclick={downloadPatch}
                title="导出 Git Patch 补丁"
            >
                <Download size={13} />
            </button>

            <HandoffDropdown
                sourceTool="文本差异对比"
                dataType="text"
                getData={() => mergedDraft || newText}
            />

            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                onclick={clear}
                title="清空"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- 2-Panel Main Workbench -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0">
        <!-- Left: Dual Input Textareas -->
        <div class="flex flex-col gap-2 min-h-0">
            <!-- Original Text -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
                <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500"></span> 原始内容 (Old / Original)</span>
                    <span class="text-[10px] text-slate-400 font-mono">{oldText.length} 字符</span>
                </div>
                <textarea
                    bind:value={oldText}
                    oninput={debouncedCompare}
                    class="flex-1 w-full p-2.5 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200 leading-relaxed"
                    placeholder="粘贴原始版本文本..."
                ></textarea>
            </div>

            <!-- Modified Text -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
                <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> 修改版本 (New / Modified)</span>
                    <span class="text-[10px] text-slate-400 font-mono">{newText.length} 字符</span>
                </div>
                <textarea
                    bind:value={newText}
                    oninput={debouncedCompare}
                    class="flex-1 w-full p-2.5 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200 leading-relaxed"
                    placeholder="粘贴修改后版本文本..."
                ></textarea>
            </div>
        </div>

        <!-- Right: Visual Diff Viewer -->
        <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
            <!-- Diff Top Bar -->
            <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 text-xs">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-800 dark:text-slate-200">差异可视化结果</span>
                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {diffs.filter(d => d.added || d.removed).length} 处变动
                    </span>
                </div>

                <div class="flex items-center gap-1.5">
                    <button
                        type="button"
                        onclick={() => showMergeView = !showMergeView}
                        class="px-2 py-0.5 text-xs font-medium rounded border transition flex items-center gap-1 {showMergeView ? 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}"
                    >
                        <GitMerge size={12} /> {showMergeView ? "收起合并结果" : "展开合并结果"}
                    </button>
                </div>
            </div>

            <!-- Merge Drawer (if open) -->
            {#if showMergeView}
                <div class="p-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 space-y-2 shrink-0">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-900 dark:text-white">合并输出预览</span>
                        <div class="flex items-center gap-1.5">
                            <button onclick={() => copyText(mergedDraft, "合并草稿")} class="px-2 py-0.5 text-[11px] rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white font-medium flex items-center gap-1">
                                <Copy size={11} /> 复制
                            </button>
                            <button onclick={() => downloadText(mergedDraft)} class="px-2 py-0.5 text-[11px] rounded bg-slate-800 dark:bg-slate-700 text-white font-medium hover:bg-slate-900 flex items-center gap-1">
                                <Download size={11} /> 下载
                            </button>
                        </div>
                    </div>
                    <textarea
                        bind:value={mergedDraft}
                        rows={3}
                        class="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 font-mono text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-slate-400"
                    ></textarea>
                </div>
            {/if}

            <!-- Diff Content View -->
            <div class="flex-1 overflow-auto font-mono text-xs bg-slate-50/30 dark:bg-slate-950/40 min-h-0">
                {#if viewLayout === "unified"}
                    {#if diffs.length > 0}
                        <div class="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {#each diffs as part}
                                <div
                                    class="px-3 py-1 whitespace-pre-wrap break-all flex items-start group {part.added
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                                        : part.removed
                                          ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 line-through opacity-80'
                                          : 'text-slate-700 dark:text-slate-300'}"
                                >
                                    <span class="select-none font-bold font-mono w-4 shrink-0 {part.added ? 'text-emerald-600' : part.removed ? 'text-rose-600' : 'text-slate-400'}">
                                        {part.added ? "+" : part.removed ? "-" : " "}
                                    </span>
                                    <span class="flex-1">{part.value}</span>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            暂无差异数据，请在左侧输入文本
                        </div>
                    {/if}

                {:else if viewLayout === "split"}
                    {#if splitRows.length > 0}
                        <table class="w-full border-collapse text-xs font-mono">
                            <tbody>
                                {#each splitRows as r}
                                    <tr class="border-b border-slate-100 dark:border-slate-800/40">
                                        <!-- Left Side -->
                                        <td class="w-8 select-none text-right pr-2 text-[10px] text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">{r.leftLineNo ?? ""}</td>
                                        <td class="p-1 pl-2 w-1/2 align-top border-r border-slate-200 dark:border-slate-800 break-all {r.leftType === 'removed' ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 line-through' : 'text-slate-700 dark:text-slate-300'}">
                                            {r.leftText ?? ""}
                                        </td>
                                        <!-- Right Side -->
                                        <td class="w-8 select-none text-right pr-2 text-[10px] text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">{r.rightLineNo ?? ""}</td>
                                        <td class="p-1 pl-2 w-1/2 align-top break-all {r.rightType === 'added' ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}">
                                            {r.rightText ?? ""}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            暂无差异数据
                        </div>
                    {/if}

                {:else if viewLayout === "patch"}
                    <div class="p-3">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-[11px] text-slate-400">标准 Unified Git Patch 格式</span>
                            <button
                                onclick={() => copyText(gitPatchText, "Git Patch")}
                                class="px-2 py-0.5 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded font-medium flex items-center gap-1"
                            >
                                <Copy size={11} /> 复制 Patch
                            </button>
                        </div>
                        <CodeBlock
                            code={gitPatchText || "无差异"}
                            language="diff"
                            showHeader={false}
                            wrapLines={true}
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
