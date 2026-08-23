<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        X,
        Plus,
        Sparkles,
        Code2,
        Pencil,
        MessageSquare,
        FileText,
        Lightbulb,
        Check
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import type { VariableDef } from "../../lib/types";

    let { isOpen = false, onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    const templates = [
        {
            icon: "Sparkles",
            category: "创意构思",
            taskType: "写作",
            scene: "创意策划",
            title: "头脑风暴助手",
            description: "针对任意业务主题多维度生成创意和落地建议",
            content: `帮我围绕以下主题进行头脑风暴：{{topic}}。

请从以下维度展开：
1. 创新且具差异化的切入角度
2. 实施过程中潜在的痛点与风险
3. 短期速赢策略与长期规划权衡

请提供至少 5 个具体创意方案，并附带简要实施路径。`,
            tags: ["writing"],
            variableDefs: [
                { name: "topic", description: "头脑风暴主题", required: true, exampleValue: "提升开发者工具的用户留存率", inputType: "text" }
            ] as VariableDef[],
        },
        {
            icon: "Code2",
            category: "研发效能",
            taskType: "编程",
            scene: "代码审查",
            title: "代码审查专家",
            description: "对代码段进行深度安全、性能与规范审查",
            content: `请对以下 {{language}} 代码进行系统性 Code Review：

\`\`\`{{language}}
{{code}}
\`\`\`

重点审查以下维度：
1. 逻辑 Bug 与潜在边界条件
2. 性能瓶颈与优化空间
3. 架构设计与代码风格规范
4. 安全漏洞（注入、越权等）

请按严重程度输出修改建议，并附带重构后的代码片段。`,
            tags: ["dev"],
            variableDefs: [
                { name: "language", description: "编程语言", required: true, defaultValue: "TypeScript", exampleValue: "TypeScript", inputType: "text" },
                { name: "code", description: "待审查代码", required: true, exampleValue: "function compute(list) { return list.map(x => x * 2); }", inputType: "textarea" }
            ] as VariableDef[],
        },
        {
            icon: "Pencil",
            category: "文字精炼",
            taskType: "写作",
            scene: "内容创作",
            title: "专业文本润色",
            description: "将草稿重写为高可读性、指定风格的正式内容",
            content: `请将以下草稿重写为 {{style}} 风格：

原文：
{{text}}

要求：
- 严格保持核心事实与主旨不变
- 目标受众：{{audience}}
- 提升语言的凝练度与说服力，去除冗余表达`,
            tags: ["writing"],
            variableDefs: [
                { name: "style", description: "文风要求", required: true, defaultValue: "专业正式", exampleValue: "专业正式", inputType: "text" },
                { name: "audience", description: "目标受众", required: true, defaultValue: "企业决策层", exampleValue: "企业决策层", inputType: "text" },
                { name: "text", description: "待润色原文", required: true, exampleValue: "我们的产品挺好的，能帮大家省时间。", inputType: "textarea" }
            ] as VariableDef[],
        },
        {
            icon: "MessageSquare",
            category: "商务协作",
            taskType: "写作",
            scene: "商务沟通",
            title: "商务邮件起草",
            description: "根据核心意图快速起草规范严谨的商务沟通邮件",
            content: `请根据以下沟通背景起草一封商务邮件：

沟通目的：{{purpose}}
关键要点：
{{key_points}}

要求：
- 语气礼貌、干练、清晰
- 包含清晰的 Call to Action (行动号召)`,
            tags: ["writing"],
            variableDefs: [
                { name: "purpose", description: "邮件目的", required: true, exampleValue: "项目进度同步与联调时间确认", inputType: "text" },
                { name: "key_points", description: "关键要点", required: true, exampleValue: "接口已就绪；需要在本周四前完成联合测试；有问题随时沟通", inputType: "textarea" }
            ] as VariableDef[],
        },
        {
            icon: "FileText",
            category: "工程文档",
            taskType: "编程",
            scene: "开源与文档",
            title: "规范 README 生成器",
            description: "为开源项目或技术组件快速生成标准的 README 文档",
            content: `请根据以下信息生成一份规范的 README.md 文档：

项目名称：{{project_name}}
项目定位：{{description}}
核心技术栈：{{tech_stack}}
主要功能特性：
{{features}}

请包含：项目简介、架构亮点、快速上手、配置说明与开源协议。`,
            tags: ["dev"],
            variableDefs: [
                { name: "project_name", description: "项目名称", required: true, exampleValue: "Aone Toolkit", inputType: "text" },
                { name: "description", description: "项目简述", required: true, exampleValue: "一站式本地化轻量研发工具套件", inputType: "text" },
                { name: "tech_stack", description: "技术栈", required: true, exampleValue: "SvelteKit + Tailwind CSS + TypeScript", inputType: "text" },
                { name: "features", description: "主要特性", required: true, exampleValue: "无依赖本地运行；提示词沉淀；多智能体协同", inputType: "textarea" }
            ] as VariableDef[],
        },
        {
            icon: "Lightbulb",
            category: "知识科普",
            taskType: "分析",
            scene: "技术培训",
            title: "深度概念通俗化",
            description: "通过生动类比和结构化拆解将复杂概念讲透",
            content: `请向 {{level}} 水平的读者讲解概念：{{concept}}。

要求：
1. 用一个贴近日常生活的生动类比破题
2. 拆解其核心运行机制与关键要素
3. 列举一个真实的工业界应用场景
4. 总结一句话核心记忆点`,
            tags: ["writing"],
            variableDefs: [
                { name: "concept", description: "需要解释的概念", required: true, exampleValue: "RAG (检索增强生成)", inputType: "text" },
                { name: "level", description: "受众知识水平", required: true, defaultValue: "非技术背景初学者", exampleValue: "非技术背景初学者", inputType: "text" }
            ] as VariableDef[],
        },
    ];

    const iconMap: Record<string, typeof Sparkles> = {
        Sparkles,
        Code2,
        Pencil,
        MessageSquare,
        FileText,
        Lightbulb,
    };

    function addTemplate(template: (typeof templates)[0]) {
        promptStore.addPrompt({
            id: crypto.randomUUID(),
            title: template.title,
            content: template.content,
            description: template.description,
            taskType: template.taskType,
            scene: template.scene,
            tags: template.tags || [],
            variableDefs: template.variableDefs || [],
            favorite: false,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
        });
        toastStore.success(`已添加「${template.title}」至提示词库`);
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
        transition:fade={{ duration: 120 }}
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        }}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col"
            transition:scale={{ duration: 150, start: 0.97 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0"
            >
                <div class="flex items-center gap-2.5">
                    <div
                        class="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60"
                    >
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            精选提示词模版库
                        </h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            预置包含变量占位符与场景定义的工业级 Prompt 模板
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onclick={onClose}
                    class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="关闭模版库"
                    title="关闭模版库"
                >
                    <X size={16} />
                </button>
            </div>

            <!-- Template Grid -->
            <div class="flex-1 overflow-y-auto p-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {#each templates as template}
                        {@const IconComponent = iconMap[template.icon]}
                        <div
                            class="group border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer bg-white dark:bg-slate-800/40 flex flex-col justify-between"
                            onclick={() => addTemplate(template)}
                            onkeydown={(e) => e.key === "Enter" && addTemplate(template)}
                            role="button"
                            tabindex="0"
                        >
                            <div>
                                <div class="flex items-start justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div
                                            class="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0"
                                        >
                                            <IconComponent size={15} />
                                        </div>
                                        <div class="min-w-0">
                                            <span class="text-[10px] text-slate-400 block font-medium">
                                                {template.category} · {template.scene}
                                            </span>
                                            <h3 class="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                                {template.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onclick={(event) => {
                                            event.stopPropagation();
                                            addTemplate(template);
                                        }}
                                        class="p-1 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 text-slate-500 transition-colors shrink-0"
                                        title="添加到我的提示词库"
                                        aria-label={`添加模版 ${template.title}`}
                                    >
                                        <Plus size={13} />
                                    </button>
                                </div>

                                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                                    {template.description}
                                </p>
                            </div>

                            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                                <span>{template.variableDefs.length} 个变量占位</span>
                                <span class="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline flex items-center gap-0.5">
                                    一键导入 <Plus size={11} />
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}
