<script lang="ts">
    import { dataBridge, type HandoffDataType } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { 
        Share2, 
        ArrowRight, 
        Braces, 
        Table, 
        FileText, 
        GitCompare, 
        BarChart2, 
        Database, 
        Bot, 
        ShieldAlert,
        Code2,
        Terminal
    } from "lucide-svelte";
    import { onMount } from "svelte";

    let {
        sourceTool = "当前工具",
        dataType = "json" as HandoffDataType,
        getData = () => "",
        title = "",
        buttonClass = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm",
    }: {
        sourceTool?: string;
        dataType?: HandoffDataType;
        getData: () => string;
        title?: string;
        buttonClass?: string;
    } = $props();

    let isOpen = $state(false);
    let dropdownRef: HTMLDivElement | null = $state(null);

    const toolTargets: Record<HandoffDataType, Array<{ href: string; label: string; icon: any; desc: string }>> = {
        json: [
            { href: "/json-editor", label: "JSON 编辑器", icon: Braces, desc: "格式化、校验与结构探查" },
            { href: "/table-editor", label: "表格编辑器", icon: Table, desc: "转为多行表格进行编辑" },
            { href: "/charts", label: "数据洞察图表", icon: BarChart2, desc: "快速可视化生成统计图" },
            { href: "/api-viewer", label: "API 响应查看器", icon: Braces, desc: "生成 TypeScript 类型与接口树" },
            { href: "/diff-viewer", label: "差异对比器", icon: GitCompare, desc: "与本地或基准版本比对" },
        ],
        csv: [
            { href: "/table-editor", label: "表格编辑器", icon: Table, desc: "网格编辑与多格式导出" },
            { href: "/charts", label: "数据洞察图表", icon: BarChart2, desc: "可视化趋势与分布" },
            { href: "/diff-viewer", label: "差异对比器", icon: GitCompare, desc: "比对表格变动" },
        ],
        tsv: [
            { href: "/table-editor", label: "表格编辑器", icon: Table, desc: "网格编辑与多格式导出" },
            { href: "/charts", label: "数据洞察图表", icon: BarChart2, desc: "可视化趋势与分布" },
        ],
        yaml: [
            { href: "/yaml-editor", label: "YAML 编辑器", icon: FileText, desc: "配置校验与 JSON 互转" },
            { href: "/json-editor", label: "JSON 编辑器", icon: Braces, desc: "转换为 JSON 进行结构探查" },
            { href: "/diff-viewer", label: "差异对比器", icon: GitCompare, desc: "配置差异对比" },
        ],
        sql: [
            { href: "/sql-architect", label: "SQL 查询分析器", icon: Database, desc: "审查 SQL 行为与索引建议" },
            { href: "/diff-viewer", label: "差异对比器", icon: GitCompare, desc: "比对查询或迁移语句" },
        ],
        prompt: [
            { href: "/prompt-hub", label: "提示词中心", icon: FileText, desc: "存入模板库并管理变量" },
            { href: "/agent-studio", label: "Agent 工作坊", icon: Bot, desc: "配置到 Agent Persona" },
            { href: "/multi-agent", label: "多 Agent 工作台", icon: Bot, desc: "直接作为任务指令运行" },
        ],
        text: [
            { href: "/diff-viewer", label: "差异对比器", icon: GitCompare, desc: "文本差异对比" },
            { href: "/secret-scanner", label: "敏感信息扫描器", icon: ShieldAlert, desc: "扫描泄漏的 API 密钥" },
            { href: "/code-formatter", label: "代码格式化器", icon: Code2, desc: "按语言标准格式化" },
        ],
        curl: [
            { href: "/curl-converter", label: "cURL 转换器", icon: Terminal, desc: "转为 Fetch / Python / Go 代码" }
        ]
    };

    let availableTargets = $derived(toolTargets[dataType] || toolTargets.text);

    function handleSend(targetHref: string) {
        const text = getData();
        if (!text) {
            toastStore.warning("暂无有效数据可传递");
            return;
        }
        dataBridge.send(sourceTool, targetHref, {
            dataType,
            payload: text,
            title: title || `${sourceTool} 传递数据`,
        }, true);
        isOpen = false;
    }

    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });
</script>

<div class="relative inline-block" bind:this={dropdownRef}>
    <button
        type="button"
        class={buttonClass}
        onclick={(e) => {
            e.stopPropagation();
            isOpen = !isOpen;
        }}
        title="将当前数据无缝传递到其他工具"
    >
        <Share2 class="h-3.5 w-3.5 text-indigo-500" />
        <span>流转至...</span>
    </button>

    {#if isOpen}
        <div
            class="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100"
        >
            <div class="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                发送当前数据至
            </div>
            <div class="space-y-0.5">
                {#each availableTargets as target}
                    {@const Icon = target.icon}
                    <button
                        type="button"
                        class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-indigo-50 dark:hover:bg-indigo-950/40 group"
                        onclick={() => handleSend(target.href)}
                    >
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition">
                                <Icon class="h-3.5 w-3.5" />
                            </div>
                            <div class="min-w-0">
                                <div class="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                                    {target.label}
                                </div>
                                <div class="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    {target.desc}
                                </div>
                            </div>
                        </div>
                        <ArrowRight class="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1" />
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>
