<script lang="ts">
    import { onMount } from "svelte";
    import { Braces, Bot, Cpu, Variable, Layers, Check } from "lucide-svelte";
    import type { FlowNode, FlowEdge } from "./types";

    let {
        value = $bindable(""),
        placeholder = "输入内容或输入 {{ 引用上游变量...",
        nodes = [] as FlowNode[],
        edges = [] as FlowEdge[],
        currentNodeId = "",
        rows = 1,
        inputClass = ""
    }: {
        value: string;
        placeholder?: string;
        nodes?: FlowNode[];
        edges?: FlowEdge[];
        currentNodeId?: string;
        rows?: number;
        inputClass?: string;
    } = $props();

    let showPicker = $state(false);
    let pickerRef: HTMLDivElement | null = $state(null);
    let inputEl: HTMLInputElement | HTMLTextAreaElement | null = $state(null);
    let cursorPosition = $state(0);

    // Compute upstream ancestor nodes
    let upstreamNodes = $derived.by(() => {
        if (!currentNodeId || !edges.length || !nodes.length) return nodes;

        const ancestors = new Set<string>();
        const queue = [currentNodeId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);

            // Find incoming edges
            const incoming = edges.filter(e => e.target === current);
            for (const edge of incoming) {
                if (!ancestors.has(edge.source)) {
                    ancestors.add(edge.source);
                    queue.push(edge.source);
                }
            }
        }

        // Return ancestor nodes, or all other nodes if no explicit edges yet
        const upstream = nodes.filter(n => n.id !== currentNodeId && (ancestors.has(n.id) || ancestors.size === 0));
        return upstream.length > 0 ? upstream : nodes.filter(n => n.id !== currentNodeId);
    });

    const systemVariables = [
        { label: "system.timestamp", desc: "当前时间戳 (毫秒)" },
        { label: "system.date", desc: "当前日期 (YYYY-MM-DD)" },
        { label: "system.sessionId", desc: "当前运行会话 ID" },
        { label: "input.query", desc: "全局首轮输入 Query" },
    ];

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        value = target.value;
        const pos = target.selectionStart || 0;
        cursorPosition = pos;

        // Check if user just typed {{ or {
        const textBeforeCursor = value.slice(0, pos);
        if (textBeforeCursor.endsWith("{{") || textBeforeCursor.endsWith("{")) {
            showPicker = true;
        }
    }

    function insertVariable(varPath: string) {
        const insertion = varPath.startsWith("{{") ? varPath : `{{${varPath}}}`;
        if (!inputEl) {
            value = value + insertion;
            showPicker = false;
            return;
        }

        const start = inputEl.selectionStart || 0;
        const end = inputEl.selectionEnd || 0;
        const textBefore = value.slice(0, start);
        const textAfter = value.slice(end);

        // Remove trailing '{' or '{{' if already present before cursor
        let cleanBefore = textBefore;
        if (cleanBefore.endsWith("{{")) {
            cleanBefore = cleanBefore.slice(0, -2);
        } else if (cleanBefore.endsWith("{")) {
            cleanBefore = cleanBefore.slice(0, -1);
        }

        value = cleanBefore + insertion + textAfter;
        showPicker = false;

        // Focus back to input
        setTimeout(() => {
            if (inputEl) {
                const newPos = cleanBefore.length + insertion.length;
                inputEl.focus();
                inputEl.setSelectionRange(newPos, newPos);
            }
        }, 50);
    }

    function handleClickOutside(e: MouseEvent) {
        if (pickerRef && !pickerRef.contains(e.target as Node)) {
            showPicker = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });
</script>

<div class="relative w-full" bind:this={pickerRef}>
    <div class="relative flex items-center">
        {#if rows > 1}
            <textarea
                bind:this={inputEl}
                {rows}
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-9 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono {inputClass}"
                {placeholder}
                {value}
                oninput={handleInput}
            ></textarea>
        {:else}
            <input
                bind:this={inputEl}
                type="text"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-9 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono {inputClass}"
                {placeholder}
                {value}
                oninput={handleInput}
            />
        {/if}

        <button
            type="button"
            class="absolute right-2 top-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            onclick={(e) => {
                e.stopPropagation();
                showPicker = !showPicker;
            }}
            title={"选择上游节点输出变量 (输入 {{ 也可触发)"}
        >
            <Braces class="h-4 w-4" />
        </button>
    </div>

    {#if showPicker}
        <div
            class="absolute left-0 top-full mt-1 z-50 w-80 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100"
        >
            <div class="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>插入动态变量</span>
                <span class="text-[10px] font-normal text-indigo-500">点击自动填充</span>
            </div>

            <!-- Upstream Node Variables -->
            <div class="mt-1 space-y-2">
                <div class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                    <Bot class="h-3 w-3 text-indigo-500" />
                    上游节点输出 (Upstream Nodes)
                </div>

                {#if upstreamNodes.length === 0}
                    <div class="px-3 py-2 text-xs text-slate-400 italic">
                        暂无上游连接节点，请先在画布中连线
                    </div>
                {:else}
                    {#each upstreamNodes as node}
                        <div class="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-1.5 space-y-1">
                            <div class="text-[11px] font-semibold text-slate-700 dark:text-slate-200 px-1 truncate flex items-center gap-1.5">
                                <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                {node.data?.label || node.id}
                                <span class="text-[10px] font-mono text-slate-400 font-normal">({node.id})</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    class="text-left px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition truncate"
                                    onclick={() => insertVariable(`${node.id}.output`)}
                                    title={`插入 {{${node.id}.output}}`}
                                >
                                    .output <span class="text-[9px] text-slate-400">(完整)</span>
                                </button>
                                <button
                                    type="button"
                                    class="text-left px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition truncate"
                                    onclick={() => insertVariable(`${node.id}.output.result`)}
                                    title={`插入 {{${node.id}.output.result}}`}
                                >
                                    .result <span class="text-[9px] text-slate-400">(文本)</span>
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}

                <!-- System Variables -->
                <div class="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 flex items-center gap-1">
                        <Cpu class="h-3 w-3 text-emerald-500" />
                        系统与环境变量 (System Variables)
                    </div>
                    <div class="space-y-0.5">
                        {#each systemVariables as sys}
                            <button
                                type="button"
                                class="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs transition"
                                onclick={() => insertVariable(sys.label)}
                            >
                                <span class="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">{`{{${sys.label}}}`}</span>
                                <span class="text-[10px] text-slate-400">{sys.desc}</span>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
