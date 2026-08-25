<script lang="ts">
    import { Panel, Button, EmptyState, CodeEditor } from "$lib/components/ui";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { snippetStore, type Snippet, type SnippetVariable } from "$lib/stores/snippets.svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Search,
        Plus,
        Pencil,
        Star,
        Code2,
        Trash2,
        Copy,
        Tag,
        Clock,
        ChevronRight,
        ChevronDown,
        X,
        Info,
        RotateCcw,
        FileJson,
        FileText,
        Globe,
        Lock,
        Briefcase,
        Users
    } from "lucide-svelte";
    import { onMount } from "svelte";

    // Filtering & Sorting states
    let searchQuery = $state("");
    let selectedLanguage = $state("");
    let selectedTag = $state("");
    let selectedScope = $state("");
    let onlyFavorites = $state(false);
    let sortBy = $state("updatedAt"); // "updatedAt" | "usageCount" | "lastUsedAt"

    // Selected and editing states
    let selectedId = $state<string | null>(null);
    let editingSnippet = $state<Snippet | null>(null);
    let confirmingDelete = $state(false);
    let newTagInput = $state("");
    let showShortcutsModal = $state(false);

    // Variable values dictionary for active snippet
    let variableValues = $state<Record<string, string>>({});

    // Import file input reference
    let fileInput = $state<HTMLInputElement | null>(null);

    // Dynamic extraction of languages and tags present in current store
    let allLanguages = $derived(
        [...new Set(snippetStore.snippets.map(s => s.language))].filter(Boolean).sort()
    );
    let allTags = $derived(
        [...new Set(snippetStore.snippets.flatMap(s => s.tags || []))].filter(Boolean).sort()
    );

    // Filtered & Sorted list
    let filteredSnippets = $derived(
        snippetStore.snippets.filter(s => {
            const query = searchQuery.toLowerCase().trim();
            if (query) {
                const matchesTitle = s.title.toLowerCase().includes(query);
                const matchesLang = s.language.toLowerCase().includes(query);
                const matchesDesc = s.description.toLowerCase().includes(query);
                const matchesCode = s.code.toLowerCase().includes(query);
                const matchesTags = s.tags.some(t => t.toLowerCase().includes(query));
                if (!matchesTitle && !matchesLang && !matchesDesc && !matchesCode && !matchesTags) {
                    return false;
                }
            }
            if (selectedLanguage && s.language !== selectedLanguage) return false;
            if (selectedTag && !s.tags.includes(selectedTag)) return false;
            if (selectedScope && s.scope !== selectedScope) return false;
            if (onlyFavorites && !s.isFavorite) return false;
            return true;
        }).sort((a, b) => {
            if (sortBy === "usageCount") {
                return (b.usageCount ?? 0) - (a.usageCount ?? 0);
            }
            if (sortBy === "lastUsedAt") {
                const timeA = a.lastUsedAt ?? 0;
                const timeB = b.lastUsedAt ?? 0;
                if (timeA !== timeB) return timeB - timeA;
                return b.updatedAt - a.updatedAt;
            }
            // default: updatedAt desc
            return b.updatedAt - a.updatedAt;
        })
    );

    let activeSnippet = $derived(
        selectedId ? snippetStore.getSnippetById(selectedId) : null
    );

    // Reactive determination if variables are present
    let hasVars = $derived(
        activeSnippet ? Object.keys(variableValues).length > 0 : false
    );

    // Duplicate detection in Edit Mode
    let isDuplicateCode = $derived.by(() => {
        if (!editingSnippet || !editingSnippet.code.trim()) return false;
        return snippetStore.snippets.some(s => 
            s.id !== editingSnippet!.id && 
            s.code.trim() === editingSnippet!.code.trim()
        );
    });
    let duplicateSnippetName = $derived.by(() => {
        if (!editingSnippet || !editingSnippet.code.trim()) return "";
        const dup = snippetStore.snippets.find(s => 
            s.id !== editingSnippet!.id && 
            s.code.trim() === editingSnippet!.code.trim()
        );
        return dup ? dup.title : "";
    });

    // Reset variable values when the active snippet changes
    $effect(() => {
        if (activeSnippet) {
            const vals: Record<string, string> = {};
            // Extract placeholders like $NAME$, ${NAME}, or ${1:NAME} from code
            const dollarMatches = (activeSnippet.code.match(/\$[A-Z0-9_]+\$/g) || []).map(m => m.slice(1, -1));
            const braceMatches = (activeSnippet.code.match(/\$\{[0-9]+:([A-Za-z0-9_]+)\}/g) || []).map(m => {
                const inner = m.slice(2, -1);
                return inner.split(":")[1] || inner;
            });
            const simpleBraceMatches = (activeSnippet.code.match(/\$\{([A-Za-z0-9_]+)\}/g) || []).map(m => m.slice(2, -1));

            const parsedNames = [...new Set([...dollarMatches, ...braceMatches, ...simpleBraceMatches])];
            
            parsedNames.forEach(name => {
                const matchedVar = activeSnippet.variables?.find(v => v.name === name);
                vals[name] = matchedVar?.defaultValue ?? "";
            });
            variableValues = vals;
        } else {
            variableValues = {};
        }
    });

    // Replaced preview code computation
    let previewCode = $derived.by(() => {
        if (!activeSnippet) return "";
        let replaced = activeSnippet.code;
        Object.entries(variableValues).forEach(([name, val]) => {
            const finalVal = val || `$${name}$`;
            replaced = replaced.replaceAll(`$${name}$`, finalVal);
            replaced = replaced.replaceAll(new RegExp(`\\$\\{[0-9]+:${name}\\}`, "g"), val || name);
            replaced = replaced.replaceAll(`\${${name}}`, val || name);
        });
        return replaced;
    });

    // Helpers
    function getScopeLabel(scope: string): string {
        const mapping: Record<string, string> = {
            global: "全局 (Global)",
            project: "项目 (Project)",
            private: "私有 (Private)",
            shared: "共享 (Shared)"
        };
        return mapping[scope] || scope || "私有";
    }

    function getScopeIcon(scope: string) {
        switch (scope) {
            case "global": return Globe;
            case "project": return Briefcase;
            case "shared": return Users;
            default: return Lock;
        }
    }

    function resetFilters() {
        searchQuery = "";
        selectedLanguage = "";
        selectedTag = "";
        selectedScope = "";
        onlyFavorites = false;
        sortBy = "updatedAt";
        toastStore.info("已重置所有过滤和排序");
    }

    function createNew() {
        const newSnippet = snippetStore.addSnippet({
            title: "新建代码片段",
            code: "",
            language: "javascript",
            description: "",
            tags: ["草稿"],
            scope: "private",
            usageScenario: "",
            variables: []
        });
        selectedId = newSnippet.id;
        startEditing();
    }

    function startEditing() {
        if (activeSnippet) {
            editingSnippet = { 
                ...activeSnippet, 
                tags: [...activeSnippet.tags],
                variables: activeSnippet.variables ? activeSnippet.variables.map(v => ({ ...v })) : []
            };
        }
    }

    function saveEdit() {
        if (editingSnippet) {
            if (!editingSnippet.title.trim()) {
                toastStore.warning("代码片段标题不能为空");
                return;
            }
            snippetStore.updateSnippet(editingSnippet.id, editingSnippet);
            editingSnippet = null;
            toastStore.success("代码片段保存成功");
        }
    }

    // Cancel editing
    function cancelEdit() {
        editingSnippet = null;
    }

    // Sync variables list dynamically as user edits code
    function syncVariables(codeText: string) {
        if (!editingSnippet) return;
        const detected = [...new Set((codeText.match(/\$[A-Z0-9_]+\$/g) || []).map(m => m.slice(1, -1)))];
        const newVars = detected.map(name => {
            const existing = editingSnippet!.variables.find(v => v.name === name);
            return existing || { name, defaultValue: "", description: "", required: true };
        });
        editingSnippet.variables = newVars;
    }

    function removeTag(index: number) {
        if (editingSnippet) {
            editingSnippet.tags = editingSnippet.tags.filter((_, i) => i !== index);
        }
    }

    function addTag() {
        const tag = newTagInput.trim();
        if (tag && editingSnippet && !editingSnippet.tags.includes(tag)) {
            editingSnippet.tags = [...editingSnippet.tags, tag];
            newTagInput = "";
        }
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    function highlightMatch(text: string, query: string): { before: string; match: string; after: string } | null {
        if (!query) return null;
        const lower = text.toLowerCase();
        const idx = lower.indexOf(query.toLowerCase());
        if (idx === -1) return null;
        return {
            before: text.slice(0, idx),
            match: text.slice(idx, idx + query.length),
            after: text.slice(idx + query.length),
        };
    }

    // Variable operations in View Mode
    function resetVariables() {
        if (activeSnippet) {
            Object.keys(variableValues).forEach(k => {
                const matchedVar = activeSnippet!.variables?.find(v => v.name === k);
                variableValues[k] = matchedVar?.defaultValue ?? "";
            });
            toastStore.info("已重置变量为默认值");
        }
    }

    // Copy actions with Usage Tracking
    function copyReplacedCode() {
        if (!previewCode || !activeSnippet) return;
        copyToClipboard(previewCode, "代码片段（已替换变量）");
        snippetStore.incrementUsage(activeSnippet.id);
    }

    function copyAsMarkdown() {
        if (!previewCode || !activeSnippet) return;
        const md = `\`\`\`${activeSnippet.language}\n${previewCode}\n\`\`\``;
        copyToClipboard(md, "Markdown 代码块");
        snippetStore.incrementUsage(activeSnippet.id);
    }

    function copyOriginalTemplate() {
        if (!activeSnippet) return;
        copyToClipboard(activeSnippet.code, "原始代码模板");
        snippetStore.incrementUsage(activeSnippet.id);
    }

    // Backup & Migrations
    function exportJSON() {
        try {
            const data = JSON.stringify(snippetStore.snippets, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `aone-snippets-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toastStore.success("成功导出 JSON 备份文件");
        } catch (err) {
            toastStore.error("导出 JSON 失败");
        }
    }

    function exportMarkdown() {
        try {
            let mdContent = `# 代码片段导出备份 - ${new Date().toLocaleDateString()}\n\n`;
            snippetStore.snippets.forEach(s => {
                mdContent += `## ${s.title}\n\n`;
                mdContent += `- **语言**: ${s.language}\n`;
                mdContent += `- **作用域**: ${getScopeLabel(s.scope)}\n`;
                if (s.tags && s.tags.length > 0) {
                    mdContent += `- **标签**: ${s.tags.map(t => `#${t}`).join(', ')}\n`;
                }
                if (s.description) {
                    mdContent += `- **功能描述**: ${s.description}\n`;
                }
                if (s.usageScenario) {
                    mdContent += `- **适用场景**: ${s.usageScenario}\n`;
                }
                mdContent += `\n\`\`\`${s.language}\n${s.code}\n\`\`\`\n\n`;
                if (s.variables && s.variables.length > 0) {
                    mdContent += `### 模板变量定义\n\n`;
                    mdContent += `| 变量名 | 默认值 | 变量用途 | 是否必填 |\n`;
                    mdContent += `| --- | --- | --- | --- |\n`;
                    s.variables.forEach(v => {
                        mdContent += `| ${v.name} | \`${v.defaultValue || ''}\` | ${v.description || ''} | ${v.required ? '是' : '否'} |\n`;
                    });
                    mdContent += `\n`;
                }
                mdContent += `---\n\n`;
            });
            
            const blob = new Blob([mdContent], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `aone-snippets-${new Date().toISOString().slice(0, 10)}.md`;
            a.click();
            URL.revokeObjectURL(url);
            toastStore.success("成功导出 Markdown 备份文件");
        } catch (err) {
            toastStore.error("导出 Markdown 失败");
        }
    }

    // Helper to format VS Code placeholders
    function convertToVSCodeBody(codeText: string, variables: SnippetVariable[]): string[] {
        let replaced = codeText;
        variables.forEach((v, index) => {
            const num = index + 1;
            const placeholder = `\${${num}:${v.defaultValue || v.name}}`;
            replaced = replaced.replaceAll(`$${v.name}$`, placeholder);
        });
        return replaced.split("\n");
    }

    function exportVSCode() {
        try {
            const vscodeSnippets: Record<string, any> = {};
            
            snippetStore.snippets.forEach(s => {
                const bodyLines = convertToVSCodeBody(s.code, s.variables || []);
                const prefix = s.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
                
                vscodeSnippets[s.title] = {
                    scope: s.language === "typescript" ? "typescript,javascript" : s.language,
                    prefix: prefix || "snippet",
                    body: bodyLines,
                    description: s.description || s.usageScenario || ""
                };
            });
            
            const data = JSON.stringify(vscodeSnippets, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `aone-vscode-snippets-${new Date().toISOString().slice(0, 10)}.code-snippets`;
            a.click();
            URL.revokeObjectURL(url);
            toastStore.success("已导出为 VS Code Snippets 格式 (.code-snippets)");
        } catch (err) {
            toastStore.error("导出 VS Code 格式失败");
        }
    }

    function triggerImport() {
        fileInput?.click();
    }

    function handleFileImport(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = JSON.parse(text);
                
                let listToImport: Snippet[] = [];
                
                if (Array.isArray(parsed)) {
                    // Standard JSON Array format
                    listToImport = parsed.map(s => ({
                        id: "",
                        title: s.title || "未命名导入片段",
                        code: s.code || "",
                        language: s.language || "javascript",
                        description: s.description || "",
                        tags: Array.isArray(s.tags) ? s.tags : ["Imported"],
                        scope: s.scope || "private",
                        usageScenario: s.usageScenario || "",
                        variables: Array.isArray(s.variables) ? s.variables : [],
                        isFavorite: !!s.isFavorite,
                        createdAt: s.createdAt || Date.now(),
                        updatedAt: s.updatedAt || Date.now(),
                        usageCount: 0
                    }));
                } else if (typeof parsed === "object" && parsed !== null) {
                    // VS Code Snippet JSON Object format
                    for (const [key, val] of Object.entries(parsed)) {
                        if (val && typeof val === "object") {
                            const body = (val as any).body;
                            const code = Array.isArray(body) ? body.join("\n") : (typeof body === "string" ? body : "");
                            const desc = (val as any).description || "";
                            const prefix = (val as any).prefix || "";
                            const scopeVal = (val as any).scope || "";
                            
                            let lang = "javascript";
                            if (scopeVal) {
                                const scopes = scopeVal.split(",").map((s: string) => s.trim().toLowerCase());
                                if (scopes.length > 0) lang = scopes[0];
                            }
                            
                            // Parse VS Code placeholder variables like ${1:VAR} -> $VAR$
                            let cleanCode = code;
                            const varRegex = /\$\{\d+:([a-zA-Z0-9_]+)\}/g;
                            const variablesArr: SnippetVariable[] = [];
                            
                            let match;
                            while ((match = varRegex.exec(code)) !== null) {
                                const varName = match[1].toUpperCase();
                                if (!variablesArr.some(v => v.name === varName)) {
                                    variablesArr.push({
                                        name: varName,
                                        defaultValue: "",
                                        description: `VS Code 导入变量 ${match[1]}`,
                                        required: true
                                    });
                                }
                            }
                            
                            cleanCode = cleanCode.replace(varRegex, (m, g1) => `$${g1.toUpperCase()}$`);
                            cleanCode = cleanCode.replace(/\$\d+/g, ""); // Clean numbered placeholders like $1

                            listToImport.push({
                                id: "",
                                title: key,
                                code: cleanCode,
                                language: lang,
                                description: desc || `前缀触发词: ${prefix}`,
                                tags: ["VS Code", prefix].filter(Boolean),
                                scope: "global",
                                usageScenario: "从 VS Code Snippets 导入",
                                variables: variablesArr,
                                isFavorite: false,
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                                usageCount: 0
                            });
                        }
                    }
                } else {
                    throw new Error("文件格式不支持，解析结果既非 JSON 数组也非 VS Code 片段对象");
                }
                
                if (listToImport.length === 0) {
                    toastStore.warning("导入文件中未发现有效的代码片段数据");
                    return;
                }
                
                const count = snippetStore.importSnippets(listToImport);
                toastStore.success(`成功导入 ${count} 个代码片段`);
                
                if (snippetStore.snippets.length > 0) {
                    selectedId = snippetStore.snippets[0].id;
                }
                input.value = "";
            } catch (err: any) {
                toastStore.error(`导入失败: ${err.message || "文件解析错误"}`);
                input.value = "";
            }
        };
        reader.onerror = () => {
            toastStore.error("文件读取遇到物理错误");
            input.value = "";
        };
        reader.readAsText(file);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.ctrlKey && e.key === "s") {
            e.preventDefault();
            if (editingSnippet) saveEdit();
        } else if (e.ctrlKey && e.key === "n") {
            e.preventDefault();
            createNew();
        } else if (e.key === "Escape") {
            if (showShortcutsModal) {
                showShortcutsModal = false;
            } else if (confirmingDelete) {
                confirmingDelete = false;
            } else if (editingSnippet) {
                cancelEdit();
            }
        }
    }

    const LANGUAGES = [
        "javascript",
        "typescript",
        "html",
        "css",
        "python",
        "java",
        "cpp",
        "go",
        "rust",
        "sql",
        "yaml",
        "json",
        "bash",
    ];

    onMount(() => {
        if (snippetStore.snippets.length > 0 && !selectedId) {
            selectedId = snippetStore.snippets[0].id;
        }
    });
</script>

<svelte:head>
    <title>代码片段库 - Aone Toolkit</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<ToolWorkspace sidebarPosition="left" class="w-full h-full">
    {#snippet sidebar()}
        <!-- Sidebar Title Header -->
        <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
            <h2 class="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Code2 size={14} class="text-slate-500" />
                <span>代码片段库</span>
                <span class="text-[11px] font-normal text-slate-400">({snippetStore.snippets.length})</span>
            </h2>
            <div class="flex items-center gap-1">
                <button 
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    onclick={() => showShortcutsModal = true}
                    title="快捷键说明"
                >
                    <Info size={13} />
                </button>
                <Button variant="ghost" size="sm" onclick={createNew} title="新建代码片段 (Ctrl+N)" class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800">
                    <Plus size={15} />
                </Button>
            </div>
        </div>

        <!-- Filters section -->
        <div class="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
            <!-- Search bar -->
            <div class="relative">
                <Search class="absolute left-2.5 top-2 text-slate-400" size={12} />
                <input
                    type="search"
                    bind:value={searchQuery}
                    placeholder="搜索片段、代码、标签..."
                    class="w-full pl-7 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
            </div>

            <!-- Favorite toggle & Scope select -->
            <div class="flex gap-1.5">
                <button
                    class="flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer select-none {onlyFavorites ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                    onclick={() => onlyFavorites = !onlyFavorites}
                >
                    <Star size={10} class={onlyFavorites ? 'fill-amber-500 text-amber-500' : ''} />
                    <span>收藏</span>
                </button>

                <select
                    bind:value={selectedScope}
                    class="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                    <option value="">所有作用域</option>
                    <option value="global">全局 (Global)</option>
                    <option value="project">项目 (Project)</option>
                    <option value="private">私有 (Private)</option>
                    <option value="shared">共享 (Shared)</option>
                </select>
            </div>

            <!-- Language, Tag, and Sort selects -->
            <div class="flex gap-1.5">
                <select
                    bind:value={selectedLanguage}
                    class="w-[32%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                    <option value="">语言</option>
                    {#each allLanguages as lang}
                        <option value={lang}>{lang}</option>
                    {/each}
                </select>

                <select
                    bind:value={selectedTag}
                    class="w-[32%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                    <option value="">标签</option>
                    {#each allTags as tag}
                        <option value={tag}>#{tag}</option>
                    {/each}
                </select>

                <select
                    bind:value={sortBy}
                    class="w-[36%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                    title="排序方式"
                >
                    <option value="updatedAt">更新时间</option>
                    <option value="usageCount">使用频次</option>
                    <option value="lastUsedAt">最近使用</option>
                </select>
            </div>

            <!-- Filter Status & Clear Button -->
            {#if searchQuery || selectedLanguage || selectedTag || selectedScope || onlyFavorites || sortBy !== "updatedAt"}
                <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                    <span class="text-slate-400">已筛出 {filteredSnippets.length} 项</span>
                    <button
                        class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                        onclick={resetFilters}
                    >
                        重置条件
                    </button>
                </div>
            {/if}
        </div>

        <!-- Snippets scroll list -->
        <div class="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-950 custom-scrollbar">
            {#if filteredSnippets.length > 0}
                {#each filteredSnippets as snippet (snippet.id)}
                    {@const titleHighlight = highlightMatch(snippet.title, searchQuery)}
                    {@const ScopeIcon = getScopeIcon(snippet.scope)}
                    <button
                        class="w-full p-3 text-left border-b border-slate-100 dark:border-slate-800/80 border-l-2 transition-colors cursor-pointer {selectedId ===
                        snippet.id
                            ? 'bg-slate-100/90 dark:bg-slate-800/80 border-l-slate-900 dark:border-l-slate-100'
                            : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900'}"
                        onclick={() => {
                            selectedId = snippet.id;
                            cancelEdit();
                            confirmingDelete = false;
                        }}
                    >
                        <div class="flex justify-between items-start gap-2 mb-1">
                            <h3
                                class="text-xs font-medium truncate flex-1 pr-1 {selectedId === snippet.id ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-700 dark:text-slate-300'}"
                            >
                                {#if titleHighlight && searchQuery}
                                    {titleHighlight.before}<mark class="bg-amber-100 dark:bg-amber-800/40 text-inherit rounded px-0.5">{titleHighlight.match}</mark>{titleHighlight.after}
                                {:else}
                                    {snippet.title}
                                {/if}
                            </h3>
                            <span class="badge badge-slate font-mono text-[9px] px-1 py-0 truncate flex-shrink-0">
                                {snippet.language}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-relaxed">
                            {snippet.description || "暂无片段描述"}
                        </p>
                        
                        <div class="mt-2 flex items-center justify-between">
                            <div class="flex gap-1 flex-wrap max-w-[70%]">
                                {#each (snippet.tags || []).slice(0, 2) as tag}
                                    <span class="text-[9px] text-slate-400 font-mono">#{tag}</span>
                                {/each}
                                {#if (snippet.tags || []).length > 2}
                                    <span class="text-[9px] text-slate-400">+{snippet.tags.length - 2}</span>
                                {/if}
                            </div>
                            <div class="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                <ScopeIcon size={10} />
                                <span class="text-[9px]">{getScopeLabel(snippet.scope).split(" ")[0]}</span>
                                {#if snippet.usageCount > 0}
                                    <span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded" title="使用次数: {snippet.usageCount}">{snippet.usageCount}次</span>
                                {/if}
                                {#if snippet.isFavorite}
                                    <Star size={10} class="fill-amber-500 text-amber-500" />
                                {/if}
                            </div>
                        </div>
                    </button>
                {/each}
            {:else}
                <div class="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Code2 size={32} class="mb-2 text-slate-300 dark:text-slate-700" />
                    <p class="text-xs font-medium">未找到符合条件的代码片段</p>
                    {#if snippetStore.snippets.length > 0}
                        <button
                            class="text-xs text-slate-700 dark:text-slate-300 font-medium hover:underline mt-2 cursor-pointer"
                            onclick={resetFilters}
                        >
                            重置过滤条件
                        </button>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Sidebar footer Actions (Import/Export) -->
        <div class="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 grid grid-cols-2 gap-1.5">
            <input
                type="file"
                accept=".json"
                bind:this={fileInput}
                onchange={handleFileImport}
                class="hidden"
            />
            <button
                class="py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center transition-colors cursor-pointer"
                onclick={triggerImport}
                title="导入 Snippet 备份 JSON，或导入 VS Code 片段"
            >
                导入 JSON
            </button>
            <button
                class="py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center transition-colors cursor-pointer"
                onclick={exportJSON}
                title="导出所有片段数据为 JSON 备份"
            >
                导出 JSON
            </button>
            <button
                class="py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center transition-colors cursor-pointer"
                onclick={exportVSCode}
                title="将所有片段导出为 VS Code Snippets JSON"
            >
                导出 VS Code
            </button>
            <button
                class="py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-300 font-medium text-center transition-colors cursor-pointer"
                onclick={exportMarkdown}
                title="导出所有片段为可读 Markdown"
            >
                导出 MD
            </button>
        </div>
    {/snippet}

    {#snippet header()}
        {#if editingSnippet}
            <div class="flex items-center justify-between w-full h-full">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <Pencil size={12} />
                    </div>
                    <span class="font-semibold text-xs text-slate-900 dark:text-white">
                        编辑代码片段
                    </span>
                </div>
                <div class="flex gap-1.5">
                    <Button variant="ghost" onclick={cancelEdit} size="sm" class="text-xs">取消</Button>
                    <Button onclick={saveEdit} size="sm" class="text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">保存片段</Button>
                </div>
            </div>
        {:else if activeSnippet}
            <div class="flex items-center justify-between w-full h-full">
                {#if confirmingDelete}
                    <div class="flex items-center justify-between w-full">
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">确定要删除该代码片段吗？（无法恢复）</span>
                        <div class="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                class="text-xs font-medium"
                                onclick={() => (confirmingDelete = false)}
                            >取消</Button>
                            <Button
                                size="sm"
                                class="bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                                onclick={() => {
                                    snippetStore.deleteSnippet(activeSnippet!.id);
                                    selectedId = null;
                                    confirmingDelete = false;
                                    toastStore.success("已删除代码片段");
                                }}
                            >确定删除</Button>
                        </div>
                    </div>
                {:else}
                    <div class="flex items-center gap-2.5">
                        <h2 class="font-semibold text-slate-900 dark:text-white text-sm">
                            {activeSnippet.title}
                        </h2>
                        <div class="flex gap-1">
                            {#each activeSnippet.tags as tag}
                                <span class="badge badge-slate text-[10px] py-0">#{tag}</span>
                            {/each}
                        </div>
                    </div>
                    <div class="flex gap-1.5 items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                                snippetStore.toggleFavorite(activeSnippet!.id);
                                toastStore.success(activeSnippet!.isFavorite ? "已取消收藏" : "已加入收藏");
                            }}
                            class="hover:text-amber-500 {activeSnippet.isFavorite ? 'text-amber-500' : 'text-slate-400'}"
                            title={activeSnippet.isFavorite ? '取消收藏' : '加入收藏'}
                        >
                            <Star size={13} class={activeSnippet.isFavorite ? 'fill-current' : ''} />
                        </Button>
                        
                        <Button
                            variant="secondary"
                            size="sm"
                            onclick={startEditing}
                            class="text-xs"
                        >编辑片段</Button>
                        
                        <Button
                            variant="ghost-danger"
                            size="sm"
                            onclick={() => (confirmingDelete = true)}
                            title="删除片段"
                        >
                            <Trash2 size={13} />
                        </Button>
                    </div>
                {/if}
            </div>
        {/if}
    {/snippet}

    <!-- Main Workspace Content Panel -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
        {#if editingSnippet}
            <!-- Snippet Editor view -->
            <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                <!-- Basic fields grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600 dark:text-slate-300" for="snippet-title-input">片段名称 / 标题</label>
                        <input
                            id="snippet-title-input"
                            type="text"
                            bind:value={editingSnippet.title}
                            placeholder="如: debounce 防抖函数"
                            class="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                        />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600 dark:text-slate-300" for="snippet-lang-select">编程语言</label>
                        <select
                            id="snippet-lang-select"
                            bind:value={editingSnippet.language}
                            class="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 cursor-pointer"
                        >
                            {#each LANGUAGES as lang}
                                <option value={lang}>{lang}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600 dark:text-slate-300" for="snippet-scope-select">使用作用域</label>
                        <select
                            id="snippet-scope-select"
                            bind:value={editingSnippet.scope}
                            class="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 cursor-pointer"
                        >
                            <option value="private">私有 (Private) - 个人开发片段</option>
                            <option value="global">全局 (Global) - 通用</option>
                            <option value="project">项目 (Project) - 项目工程依赖</option>
                            <option value="shared">共享 (Shared) - 团队共用方法</option>
                        </select>
                    </div>
                </div>

                <!-- Descriptions -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600 dark:text-slate-300" for="snippet-desc-textarea">功能说明</label>
                        <textarea
                            id="snippet-desc-textarea"
                            bind:value={editingSnippet.description}
                            placeholder="说明该代码片段的作用及输入输出..."
                            class="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 min-h-[60px] resize-none leading-relaxed"
                        ></textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600 dark:text-slate-300" for="snippet-scenario-textarea">适用场景</label>
                        <textarea
                            id="snippet-scenario-textarea"
                            bind:value={editingSnippet.usageScenario}
                            placeholder="如: 在输入搜索、窗口 resize 调整等场景调用..."
                            class="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 min-h-[60px] resize-none leading-relaxed"
                        ></textarea>
                    </div>
                </div>

                <!-- Tag editor -->
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600 dark:text-slate-300" for="new-tag-input">标签分类</label>
                    <div class="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md min-h-[34px]">
                        {#each editingSnippet.tags as tag, i}
                            <span class="badge badge-slate text-[10px] flex items-center gap-1">
                                {tag}
                                <button
                                    type="button"
                                    class="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                    onclick={() => removeTag(i)}
                                    title="移除标签"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        {/each}
                        <div class="flex items-center gap-1 ml-1">
                            <input
                                id="new-tag-input"
                                type="text"
                                bind:value={newTagInput}
                                placeholder="输入标签名..."
                                class="bg-transparent border-none outline-none text-xs w-20 placeholder:text-slate-400 py-0.5"
                                onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                            />
                            <button
                                type="button"
                                class="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                onclick={addTag}
                                title="添加标签"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Code Content area with CodeEditor -->
                <div class="space-y-1.5 flex flex-col min-h-[280px]">
                    <div class="flex justify-between items-center px-1">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
                                代码模板内容
                            </span>
                            {#if isDuplicateCode}
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    与「{duplicateSnippetName}」代码重复
                                </span>
                            {/if}
                        </div>
                        <span class="text-[11px] text-slate-400 font-mono">
                            支持 <code>$变量名$</code> 占位符
                        </span>
                    </div>
                    <div class="flex-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden h-[260px]">
                        <CodeEditor 
                            bind:value={editingSnippet.code} 
                            language={editingSnippet.language}
                            onChange={(newVal) => syncVariables(newVal)}
                        />
                    </div>
                </div>

                <!-- Dynamic Variables configuration form -->
                {#if editingSnippet.variables && editingSnippet.variables.length > 0}
                    <div class="space-y-2.5 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div>
                            <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Info size={13} class="text-slate-400" />
                                <span>检测到模板占位符 ({editingSnippet.variables.length})</span>
                            </h3>
                            <p class="text-[11px] text-slate-400 mt-0.5">为提取到的变量设定默认值和使用说明：</p>
                        </div>
                        
                        <div class="divide-y divide-slate-200 dark:divide-slate-800">
                            {#each editingSnippet.variables as variable}
                                <div class="py-2 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
                                    <div class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        ${variable.name}$
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            bind:value={variable.defaultValue}
                                            placeholder="默认值"
                                            class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                    <div class="sm:col-span-2 flex gap-2 items-center">
                                        <input
                                            type="text"
                                            bind:value={variable.description}
                                            placeholder="用途说明"
                                            class="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                        />
                                        <label class="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 select-none shrink-0 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                bind:checked={variable.required}
                                                class="rounded border-slate-300 text-slate-900"
                                            />
                                            <span>必填</span>
                                        </label>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeSnippet}
            {@const ScopeIcon = getScopeIcon(activeSnippet.scope)}
            <!-- Snippet Detail View -->
            <div class="flex-1 overflow-y-auto p-5 space-y-4 h-full custom-scrollbar">
                <!-- Metadata bar -->
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1.5 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span class="font-mono bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold">{activeSnippet.language}</span>
                    <span>•</span>
                    <div class="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <ScopeIcon size={11} class="text-slate-400" />
                        <span>作用域: {getScopeLabel(activeSnippet.scope)}</span>
                    </div>
                    <span>•</span>
                    <span>更新: {formatDate(activeSnippet.updatedAt)}</span>
                    {#if activeSnippet.usageCount > 0}
                        <span>•</span>
                        <span>使用: {activeSnippet.usageCount} 次</span>
                    {/if}
                </div>

                <!-- Explanations layout -->
                {#if activeSnippet.description || activeSnippet.usageScenario}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#if activeSnippet.description}
                            <div class="bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">功能描述</p>
                                <p class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{activeSnippet.description}</p>
                            </div>
                        {/if}
                        {#if activeSnippet.usageScenario}
                            <div class="bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">适用场景</p>
                                <p class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{activeSnippet.usageScenario}</p>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Variables and preview layout -->
                <div class="flex-1 flex flex-col md:flex-row gap-4 min-h-[340px]">
                    {#if hasVars}
                        <!-- Variable inputs panel -->
                        <div class="w-full md:w-64 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 overflow-y-auto">
                            <div>
                                <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                                    <Clock size={11} class="text-slate-400" />
                                    <span>模板变量替换</span>
                                </h3>
                                <p class="text-[11px] text-slate-400 mt-0.5">填入变量值实时替换右侧代码：</p>
                            </div>
                            
                            <div class="space-y-2.5 flex-1">
                                {#each Object.keys(variableValues) as name}
                                    {@const varMeta = activeSnippet.variables?.find(v => v.name === name)}
                                    <div class="space-y-1">
                                        <div class="flex justify-between items-center">
                                            <label class="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300" for="var-input-{name}">
                                                ${name}$
                                                {#if varMeta?.required}
                                                    <span class="text-red-500" title="必填">*</span>
                                                {/if}
                                            </label>
                                            {#if varMeta?.required && !variableValues[name]}
                                                <span class="text-[9px] text-red-500">必填</span>
                                            {/if}
                                        </div>
                                        <input
                                            id="var-input-{name}"
                                            type="text"
                                            bind:value={variableValues[name]}
                                            placeholder={varMeta?.defaultValue || `输入 ${name}...`}
                                            class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                                        />
                                        {#if varMeta?.description}
                                            <p class="text-[10px] text-slate-400 leading-normal">{varMeta.description}</p>
                                        {/if}
                                    </div>
                                {/each}
                            </div>

                            <div class="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    class="w-full py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    onclick={resetVariables}
                                >
                                    <RotateCcw size={11} />
                                    <span>重置默认值</span>
                                </button>
                            </div>
                        </div>
                    {/if}

                    <!-- Code Preview Panel -->
                    <div class="flex-1 flex flex-col min-h-0">
                        <div class="flex justify-between items-center mb-1 px-1">
                            <span class="text-[11px] font-medium text-slate-500">
                                {#if hasVars}
                                    实时预览 (变量替换后)
                                {:else}
                                    代码正文
                                {/if}
                            </span>
                        </div>

                        <!-- CodeMirror View -->
                        <div class="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden h-[260px]">
                            <CodeEditor value={previewCode} language={activeSnippet.language} readOnly={true} />
                        </div>

                        <div class="flex flex-wrap gap-2 mt-3">
                            <Button onclick={copyReplacedCode} size="sm" class="font-medium text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                                <Copy size={12} class="mr-1.5" /> 复制代码
                            </Button>
                            <Button variant="secondary" onclick={copyAsMarkdown} size="sm" class="font-medium text-xs">
                                复制为 Markdown
                            </Button>
                            {#if hasVars}
                                <Button variant="ghost" onclick={copyOriginalTemplate} size="sm" class="font-medium text-xs text-slate-500">
                                    复制原始模板
                                </Button>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Full page empty state if no snippets exist -->
            <EmptyState
                icon={Code2}
                title="代码片段管理器"
                description="集中保存和整理常用配置块、脚本或复杂查询。支持变量插值、一键复制和 VS Code 片段导入。"
                actionLabel="创建第一个代码片段"
                onAction={createNew}
            />
        {/if}
    </div>
</ToolWorkspace>

<!-- Keyboard Shortcuts Helper Overlay Dialog -->
{#if showShortcutsModal}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs"
        onclick={() => showShortcutsModal = false}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onkeydown={(e) => { if (e.key === 'Escape') showShortcutsModal = false; }}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            class="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden border border-slate-200 dark:border-slate-800"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <h3 class="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Info size={13} class="text-slate-400" />
                    <span>快捷键指南</span>
                </h3>
                <button 
                    onclick={() => showShortcutsModal = false}
                    class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                >
                    <X size={13} />
                </button>
            </div>
            
            <div class="p-4 space-y-3">
                <div class="space-y-2">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 dark:text-slate-400">新建代码片段</span>
                        <kbd class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-700 dark:text-slate-300 text-[11px]">Ctrl + N</kbd>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 dark:text-slate-400">保存编辑片段</span>
                        <kbd class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-700 dark:text-slate-300 text-[11px]">Ctrl + S</kbd>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 dark:text-slate-400">退出编辑 / 取消</span>
                        <kbd class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-700 dark:text-slate-300 text-[11px]">Esc</kbd>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
