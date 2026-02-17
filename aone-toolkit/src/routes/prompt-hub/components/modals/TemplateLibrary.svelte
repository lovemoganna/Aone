<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import {
        X,
        Plus,
        Sparkles,
        Code2,
        Pencil,
        MessageSquare,
        FileText,
        Lightbulb,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { isOpen = false, onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    const templates = [
        {
            icon: "Sparkles",
            category: "General",
            title: "Brainstorming Assistant",
            description: "Generate creative ideas on any topic",
            content: `Help me brainstorm ideas for {{topic}}.

Consider:
- Innovative approaches
- Potential challenges
- Quick wins vs long-term solutions

Provide at least 5 unique ideas with brief explanations.`,
            tags: ["creativity", "brainstorming"],
        },
        {
            icon: "Code2",
            category: "Development",
            title: "Code Reviewer",
            description: "Get thorough code review feedback",
            content: `Review this {{language}} code:

\`\`\`
{{code}}
\`\`\`

Analyze for:
1. Bugs or potential issues
2. Performance improvements
3. Code style and best practices
4. Security concerns

Provide specific suggestions with examples.`,
            tags: ["development", "code-review"],
        },
        {
            icon: "Pencil",
            category: "Writing",
            title: "Content Rewriter",
            description: "Improve and rewrite any text",
            content: `Rewrite the following text to be more {{style}}:

Original:
{{text}}

Requirements:
- Maintain the core message
- Improve clarity and flow
- Target audience: {{audience}}`,
            tags: ["writing", "editing"],
        },
        {
            icon: "MessageSquare",
            category: "Communication",
            title: "Email Composer",
            description: "Draft professional emails quickly",
            content: `Write a {{tone}} email for the following situation:

Purpose: {{purpose}}
Key points to include:
{{key_points}}

Keep it concise and professional.`,
            tags: ["email", "communication"],
        },
        {
            icon: "FileText",
            category: "Documentation",
            title: "README Generator",
            description: "Create project documentation",
            content: `Generate a README.md for a project with these details:

Project Name: {{project_name}}
Description: {{description}}
Tech Stack: {{tech_stack}}
Features: {{features}}

Include sections for: Installation, Usage, Contributing, License.`,
            tags: ["documentation", "development"],
        },
        {
            icon: "Lightbulb",
            category: "Learning",
            title: "Concept Explainer",
            description: "Get clear explanations of complex topics",
            content: `Explain {{concept}} in simple terms.

Requirements:
- Use analogies when helpful
- Provide practical examples
- Target knowledge level: {{level}}

Break down complex parts step by step.`,
            tags: ["learning", "education"],
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
            tags: [],
            favorite: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
        });
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 150 }}
        onclick={onClose}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            transition:scale={{ duration: 150, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    >
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2
                            class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            Template Library
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Pre-built prompts to get you started
                        </p>
                    </div>
                </div>
                <button
                    onclick={onClose}
                    class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close"
                >
                    <X size={18} class="text-gray-500" />
                </button>
            </div>

            <!-- Template Grid -->
            <div class="flex-1 overflow-y-auto p-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each templates as template}
                        {@const IconComponent = iconMap[template.icon]}
                        <div
                            class="group border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-800/50"
                            onclick={() => addTemplate(template)}
                            onkeydown={(e) =>
                                e.key === "Enter" && addTemplate(template)}
                            role="button"
                            tabindex="0"
                        >
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                    >
                                        <IconComponent size={18} />
                                    </div>
                                    <div>
                                        <span
                                            class="text-xs text-gray-400 dark:text-gray-500"
                                            >{template.category}</span
                                        >
                                        <h3
                                            class="font-medium text-gray-900 dark:text-gray-100"
                                        >
                                            {template.title}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onclick={() => addTemplate(template)}
                                    class="opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                                    title="Add to library"
                                    aria-label="Add template to library"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <p
                                class="text-sm text-gray-500 dark:text-gray-400 mb-3"
                            >
                                {template.description}
                            </p>
                            <div class="flex flex-wrap gap-1.5">
                                {#each template.tags as tag}
                                    <span
                                        class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-xs"
                                    >
                                        {tag}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}
