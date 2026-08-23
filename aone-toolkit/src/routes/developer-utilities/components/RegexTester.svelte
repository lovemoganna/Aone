<script lang="ts">
    import { onMount } from "svelte";
    import { 
        Regex, 
        Flag, 
        Info, 
        AlertTriangle, 
        BookOpen, 
        Copy, 
        Check, 
        ArrowRightLeft,
        Layers,
        Plus,
        Trash2,
        CheckCircle2,
        XCircle,
        ListChecks,
        Code2,
        Sparkles
    } from "lucide-svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let pattern = $state("([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");
    let flags = $state("gm");
    let text = $state("请联系 support@aone.dev 或 sales-team@company.org 获取技术协助。\n其他测试账号：admin@test.com, user123@domain.cn");
    let replacement = $state("[$1] at domain $2");
    let showReplacement = $state(false);
    let activeInspectorTab = $state<"matches" | "explain" | "suite" | "presets">("matches");

    // Multi-case test suite state
    interface TestCase {
        id: string;
        input: string;
        expectedMatch: boolean;
    }

    let testCases = $state<TestCase[]>([
        { id: "1", input: "support@aone.dev", expectedMatch: true },
        { id: "2", input: "not-an-email", expectedMatch: false },
        { id: "3", input: "sales-team@company.org", expectedMatch: true },
        { id: "4", input: "hello@domain", expectedMatch: false }
    ]);
    let newTestCaseInput = $state("");

    onMount(() => {
        const handoff = dataBridge.consume("/regex-tester");
        if (handoff && handoff.payload) {
            text = handoff.payload;
        }
    });

    const commonPresets = [
        {
            category: "账号与通信",
            items: [
                { name: "电子邮箱 (Email)", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
                { name: "中国大陆手机号", pattern: "(?:\\+?86)?1[3-9]\\d{9}", flags: "g" },
                { name: "身份证号 (18位)", pattern: "[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]", flags: "g" },
            ]
        },
        {
            category: "网络与开发",
            items: [
                { name: "URL 网址 (HTTP/HTTPS)", pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)", flags: "g" },
                { name: "IPv4 地址", pattern: "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", flags: "g" },
                { name: "语义化版本号 (SemVer)", pattern: "v?(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[\\da-z\\-]+(?:\\.[\\da-z\\-]+)*)?(?:\\+[\\da-z\\-]+(?:\\.[\\da-z\\-]+)*)?", flags: "gi" },
                { name: "16 进制颜色 (#RGB/#RRGGBB)", pattern: "#(?:[a-fA-F0-9]{3}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})\\b", flags: "g" }
            ]
        },
        {
            category: "文本与格式",
            items: [
                { name: "中文字符", pattern: "[\\u4e00-\\u9fa5]+", flags: "g" },
                { name: "标准日期 (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g" },
                { name: "HTML 标签", pattern: "<\\/?([a-zA-Z0-9]+)(?:\\s+[^>]*)?>", flags: "g" },
            ]
        }
    ];

    const flagOptions = [
        { char: "g", label: "g (全局匹配)", desc: "匹配所有可能的结果" },
        { char: "m", label: "m (多行模式)", desc: "^ 和 $ 匹配每行首尾" },
        { char: "i", label: "i (忽略大小写)", desc: "大小写不敏感" },
        { char: "s", label: "s (单行模式)", desc: ". 匹配换行符" },
        { char: "u", label: "u (Unicode)", desc: "启用 Unicode 转义" },
    ];

    let regexResult = $derived.by(() => {
        if (!pattern) return { matches: [] as RegExpMatchArray[], error: "" };
        try {
            const isGlobal = flags.includes("g");
            const effectiveFlags = isGlobal ? flags : flags + "g";
            const regex = new RegExp(pattern, effectiveFlags);
            const allMatches = Array.from(text.matchAll(regex));
            return {
                matches: isGlobal ? allMatches : allMatches.slice(0, 1),
                error: ""
            };
        } catch (e: any) {
            return {
                matches: [] as RegExpMatchArray[],
                error: e.message
            };
        }
    });

    let replacedText = $derived.by(() => {
        if (!pattern || regexResult.error) return text;
        try {
            const regex = new RegExp(pattern, flags);
            return text.replace(regex, replacement);
        } catch {
            return text;
        }
    });

    // Test Suite Evaluation
    let testSuiteResults = $derived.by(() => {
        if (!pattern || regexResult.error) return [];
        try {
            const regex = new RegExp(pattern, flags);
            return testCases.map(tc => {
                const isMatch = regex.test(tc.input);
                const passed = isMatch === tc.expectedMatch;
                return { ...tc, actualMatch: isMatch, passed };
            });
        } catch {
            return [];
        }
    });

    // Regex Explain Tokenizer
    interface RegexToken {
        token: string;
        desc: string;
    }

    let regexExplanation = $derived.by(() => {
        if (!pattern) return [];
        const tokens: RegexToken[] = [];
        let p = pattern;

        if (p.startsWith("^")) tokens.push({ token: "^", desc: "匹配字符串或行的开头" });
        if (p.endsWith("$")) tokens.push({ token: "$", desc: "匹配字符串或行的末尾" });
        if (p.includes("\\d")) tokens.push({ token: "\\d", desc: "匹配任意数字 (0-9)" });
        if (p.includes("\\w")) tokens.push({ token: "\\w", desc: "匹配字母、数字或下划线" });
        if (p.includes("\\s")) tokens.push({ token: "\\s", desc: "匹配任意空白字符（空格、制表符、换行）" });
        if (p.includes("[a-zA-Z0-9._%+-]")) tokens.push({ token: "[a-zA-Z0-9._%+-]", desc: "字符集：匹配任意字母、数字或特定符号" });
        if (p.includes("+")) tokens.push({ token: "+", desc: "量词：匹配前一项 1 次或多次（贪婪）" });
        if (p.includes("*")) tokens.push({ token: "*", desc: "量词：匹配前一项 0 次或多次" });
        if (p.includes("?")) tokens.push({ token: "?", desc: "量词：匹配前一项 0 次或 1 次（或非贪婪修饰）" });
        if (p.includes("(") && p.includes(")")) tokens.push({ token: "(...)", desc: "捕获组：提取子匹配并在替换中通过 $1, $2 引用" });
        if (p.includes("(?:")) tokens.push({ token: "(?:...)", desc: "非捕获组：仅参与逻辑组合，不保存捕获编号" });

        if (tokens.length === 0) {
            tokens.push({ token: p, desc: "字面量匹配" });
        }
        return tokens;
    });

    function toggleFlag(char: string) {
        if (flags.includes(char)) {
            flags = flags.replace(char, "");
        } else {
            flags += char;
        }
    }

    function loadPreset(item: { name: string; pattern: string; flags: string }) {
        pattern = item.pattern;
        flags = item.flags;
        activeInspectorTab = "matches";
        toastStore.info(`已应用预设：${item.name}`);
    }

    function addTestCase() {
        if (!newTestCaseInput.trim()) return;
        testCases = [
            ...testCases,
            { id: Date.now().toString(), input: newTestCaseInput.trim(), expectedMatch: true }
        ];
        newTestCaseInput = "";
    }

    function removeTestCase(id: string) {
        testCases = testCases.filter(tc => tc.id !== id);
    }

    async function copyToClipboard(content: string, label: string) {
        try {
            await navigator.clipboard.writeText(content);
            toastStore.success(`已复制 ${label}`);
        } catch {
            toastStore.error("复制失败");
        }
    }
</script>

<div class="h-full flex flex-col gap-2 min-h-0">
    <!-- Top Pattern Bar -->
    <div class="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-2 shrink-0 shadow-xs">
        <div class="flex items-center gap-2">
            <div class="flex-1 flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1">
                <span class="text-slate-400 font-mono text-xs font-bold mr-1">/</span>
                <input
                    type="text"
                    bind:value={pattern}
                    placeholder="输入正则表达式 (例如: [a-z0-9]+)..."
                    class="flex-1 bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    spellcheck="false"
                />
                <span class="text-slate-400 font-mono text-xs font-bold ml-1">/{flags}</span>
            </div>

            <!-- Flags Toggles -->
            <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded">
                {#each flagOptions as opt}
                    <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-mono font-semibold rounded transition {flags.includes(opt.char) ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}"
                        onclick={() => toggleFlag(opt.char)}
                        title={opt.desc}
                    >
                        {opt.char}
                    </button>
                {/each}
            </div>

            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 transition flex items-center gap-1"
                onclick={() => showReplacement = !showReplacement}
            >
                <ArrowRightLeft size={12} /> {showReplacement ? "收起替换" : "文本替换"}
            </button>

            <button
                type="button"
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                onclick={() => copyToClipboard(`/${pattern}/${flags}`, "正则表达式")}
                title="复制正则"
            >
                <Copy size={13} />
            </button>
        </div>

        {#if showReplacement}
            <div class="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span class="text-xs text-slate-400 font-medium">替换为:</span>
                <input
                    type="text"
                    bind:value={replacement}
                    placeholder="输入替换模板 (如 $1 或 custom_text)..."
                    class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
            </div>
        {/if}

        {#if regexResult.error}
            <div class="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded flex items-center gap-1.5">
                <AlertTriangle size={12} /> 正则表达式语法错误: {regexResult.error}
            </div>
        {/if}
    </div>

    <!-- 2-Panel Main Workbench -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0">
        <!-- Left: Input & Replaced Text View -->
        <div class="flex flex-col gap-2 min-h-0">
            <!-- Test String Input -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
                <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    <span>测试文本 (Test String)</span>
                    <span class="text-[10px] text-slate-400 font-mono">{text.length} 字符</span>
                </div>
                <textarea
                    bind:value={text}
                    class="flex-1 w-full p-2.5 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200 leading-relaxed"
                    placeholder="在此输入需要测试匹配的文本..."
                    spellcheck="false"
                ></textarea>
            </div>

            <!-- Replaced Output Preview -->
            {#if showReplacement}
                <div class="h-36 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs shrink-0">
                    <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                        <span>替换结果预览</span>
                        <button onclick={() => copyToClipboard(replacedText, "替换结果")} class="text-[10px] text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1">
                            <Copy size={10} /> 复制结果
                        </button>
                    </div>
                    <pre class="flex-1 p-2.5 font-mono text-xs text-slate-700 dark:text-slate-300 overflow-auto bg-slate-50/30 dark:bg-slate-950/40">{replacedText}</pre>
                </div>
            {/if}
        </div>

        <!-- Right: Structured Match & AST Inspector -->
        <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
            <!-- Inspector Tabs -->
            <div class="h-8 px-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'matches' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'matches'}
                    >
                        匹配结果 ({regexResult.matches.length})
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'explain' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'explain'}
                    >
                        语法解析
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'suite' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'suite'}
                    >
                        测试套件 ({testCases.length})
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'presets' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'presets'}
                    >
                        常用字典
                    </button>
                </div>
            </div>

            <!-- Tab Content View -->
            <div class="flex-1 overflow-auto p-2.5 font-mono text-xs bg-slate-50/30 dark:bg-slate-950/40 min-h-0">
                {#if activeInspectorTab === "matches"}
                    {#if regexResult.matches.length > 0}
                        <div class="space-y-2">
                            {#each regexResult.matches as m, idx}
                                <div class="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                                    <div class="flex justify-between items-center text-[11px]">
                                        <span class="font-bold text-slate-900 dark:text-white">Match #{idx + 1}</span>
                                        <span class="text-slate-400 text-[10px]">索引位置: {m.index ?? 0}</span>
                                    </div>
                                    <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold break-all">
                                        {m[0]}
                                    </div>
                                    {#if m.length > 1}
                                        <div class="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                            <span class="text-[10px] text-slate-400">捕获分组 (Capture Groups):</span>
                                            {#each m.slice(1) as group, gIdx}
                                                <div class="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                    <span class="text-slate-500 font-bold">${gIdx + 1}:</span>
                                                    <span class="font-mono text-slate-800 dark:text-slate-200">{group ?? "undefined"}</span>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            无匹配结果
                        </div>
                    {/if}

                {:else if activeInspectorTab === "explain"}
                    <div class="space-y-1.5">
                        <div class="text-[11px] text-slate-500 font-sans mb-2 font-bold">正则表达式语法分解结构：</div>
                        {#each regexExplanation as item}
                            <div class="flex items-start gap-2 p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0">
                                    {item.token}
                                </span>
                                <span class="text-slate-700 dark:text-slate-300 font-sans text-xs flex-1">{item.desc}</span>
                            </div>
                        {/each}
                    </div>

                {:else if activeInspectorTab === "suite"}
                    <div class="space-y-2">
                        <div class="flex gap-1.5">
                            <input
                                type="text"
                                bind:value={newTestCaseInput}
                                placeholder="输入新测试用例..."
                                class="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                onkeydown={(e) => { if (e.key === 'Enter') addTestCase(); }}
                            />
                            <button onclick={addTestCase} class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded text-xs font-semibold flex items-center gap-1">
                                <Plus size={11} /> 添加
                            </button>
                        </div>

                        <div class="space-y-1">
                            {#each testSuiteResults as tc}
                                <div class="flex items-center justify-between p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                                    <div class="flex items-center gap-2 min-w-0">
                                        {#if tc.passed}
                                            <CheckCircle2 size={13} class="text-emerald-500 shrink-0" />
                                        {:else}
                                            <XCircle size={13} class="text-rose-500 shrink-0" />
                                        {/if}
                                        <span class="truncate text-slate-800 dark:text-slate-200">{tc.input}</span>
                                    </div>

                                    <div class="flex items-center gap-2 shrink-0">
                                        <span class="text-[10px] px-1.5 py-0.2 rounded font-bold {tc.actualMatch ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">
                                            {tc.actualMatch ? "匹配" : "不匹配"}
                                        </span>
                                        <button onclick={() => removeTestCase(tc.id)} class="text-slate-400 hover:text-rose-500 p-0.5">
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                {:else if activeInspectorTab === "presets"}
                    <div class="space-y-3 font-sans">
                        {#each commonPresets as cat}
                            <div>
                                <div class="text-[11px] font-bold text-slate-400 uppercase mb-1">{cat.category}</div>
                                <div class="grid grid-cols-1 gap-1">
                                    {#each cat.items as item}
                                        <button
                                            onclick={() => loadPreset(item)}
                                            class="p-1.5 text-left rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 transition"
                                        >
                                            <div class="font-semibold text-xs text-slate-800 dark:text-slate-200">{item.name}</div>
                                            <div class="font-mono text-[10px] text-slate-400 truncate mt-0.5">/{item.pattern}/</div>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
