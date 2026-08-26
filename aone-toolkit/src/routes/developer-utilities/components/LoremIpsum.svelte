<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        FileText,
        Copy,
        RefreshCw,
        Sparkles,
        Trash2,
        Layers,
        Sliders,
        Code
    } from "lucide-svelte";
    import { CodeBlock } from "$lib/components/ui";

    let styleMode = $state<"lorem" | "jargon_cn" | "classic_cn" | "tech_en">("lorem");
    let unit = $state<"paragraphs" | "sentences" | "words">("paragraphs");
    let count = $state(3);
    let wordsPerPara = $state(40);
    let wrapTag = $state<"none" | "p" | "li">("none");

    const LOREM_WORDS = [
        "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
        "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
        "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation",
        "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo", "consequat",
        "duis", "aute", "irure", "in", "reprehenderit", "voluptate", "velit", "esse",
        "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
        "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim"
    ];

    const JARGON_CN_WORDS = [
        "赋能", "抓手", "闭环", "底层逻辑", "顶层设计", "对齐", "颗粒度", "心智模型",
        "矩阵打法", "击穿", "组合拳", "赛道", "痛点", "生态化反", "重构", "打法沉淀",
        "复盘", "端到端", "全链路", "降维打击", "引爆点", "价值转化", "精细化运营",
        "协同共建", "护城河", "方法论", "长效机制", "势能累积", "场景穿透", "商业变现"
    ];

    const CLASSIC_CN_WORDS = [
        "先帝创业未半而中道崩殂", "今天下三分益州疲弊", "此诚危急存亡之秋也", "然侍卫之臣不懈于内",
        "忠志之士忘身于外者", "盖追先帝之殊遇", "欲报之于陛下也", "庆历四年春滕子京谪守巴陵郡",
        "越明年政通人和百废具兴", "乃重修岳阳楼", "增其旧制刻唐贤今人诗赋于其上", "属予作文以记之",
        "晋太元中武陵人捕鱼为业", "缘溪行忘路之远近", "忽逢桃花林夹岸数百步", "中无杂树芳草鲜美"
    ];

    const TECH_EN_WORDS = [
        "kubernetes", "microservices", "distributed", "event-driven", "asynchronous",
        "idempotent", "zero-trust", "containerization", "ci/cd", "observability",
        "load-balancer", "graphql", "serverless", "high-availability", "immutable",
        "redis-cache", "vector-database", "latency-sensitive", "scalability", "resilience"
    ];

    function getRandomItem<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateSentence(pool: string[], isChinese: boolean): string {
        const len = Math.floor(Math.random() * 8) + 6;
        const words: string[] = [];
        for (let i = 0; i < len; i++) {
            words.push(getRandomItem(pool));
        }
        if (isChinese) {
            return words.join("，") + "。";
        } else {
            const sentence = words.join(" ");
            return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
        }
    }

    let output = $derived.by(() => {
        let pool = LOREM_WORDS;
        const isChinese = styleMode === "jargon_cn" || styleMode === "classic_cn";

        if (styleMode === "jargon_cn") pool = JARGON_CN_WORDS;
        else if (styleMode === "classic_cn") pool = CLASSIC_CN_WORDS;
        else if (styleMode === "tech_en") pool = TECH_EN_WORDS;

        const safeCount = Math.min(Math.max(1, count), 50);

        if (unit === "words") {
            const words: string[] = [];
            for (let i = 0; i < safeCount; i++) {
                words.push(getRandomItem(pool));
            }
            const raw = isChinese ? words.join("、") : words.join(" ");
            return wrapTag === "p" ? `<p>${raw}</p>` : wrapTag === "li" ? `<li>${raw}</li>` : raw;
        }

        if (unit === "sentences") {
            const sentences: string[] = [];
            for (let i = 0; i < safeCount; i++) {
                sentences.push(generateSentence(pool, isChinese));
            }
            const raw = isChinese ? sentences.join("") : sentences.join(" ");
            return wrapTag === "p" ? `<p>${raw}</p>` : wrapTag === "li" ? `<li>${raw}</li>` : raw;
        }

        // Paragraphs
        const paras: string[] = [];
        for (let p = 0; p < safeCount; p++) {
            const sentencesInPara = Math.floor(wordsPerPara / (isChinese ? 6 : 10)) + 1;
            const pSentences: string[] = [];
            for (let s = 0; s < sentencesInPara; s++) {
                pSentences.push(generateSentence(pool, isChinese));
            }
            const text = isChinese ? pSentences.join("") : pSentences.join(" ");
            if (wrapTag === "p") {
                paras.push(`<p>${text}</p>`);
            } else if (wrapTag === "li") {
                paras.push(`<li>${text}</li>`);
            } else {
                paras.push(text);
            }
        }
        return wrapTag === "li" ? `<ul>\n  ${paras.join("\n  ")}\n</ul>` : paras.join("\n\n");
    });

    let stats = $derived.by(() => {
        const chars = output.length;
        const words = output.trim().split(/\s+/).filter(Boolean).length;
        const paragraphs = output.split("\n\n").filter(Boolean).length;
        return { chars, words, paragraphs };
    });

    function copyResult() {
        if (!output) return;
        copyToClipboard(output, "占位文本");
        toastStore.success("已复制到剪贴板");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <FileText size={13} class="text-sky-500" />
                Lorem Ipsum 占位文本生成器
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <!-- Style selection -->
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {styleMode === 'lorem' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (styleMode = "lorem")}
                >
                    经典拉美文 (Lorem)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {styleMode === 'jargon_cn' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (styleMode = "jargon_cn")}
                >
                    互联网大厂黑话 (中文)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {styleMode === 'classic_cn' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (styleMode = "classic_cn")}
                >
                    古典诗词文赋 (中文)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {styleMode === 'tech_en' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (styleMode = "tech_en")}
                >
                    云原生与技术栈 (Tech)
                </button>
            </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                onclick={copyResult}
                title="复制占位文本"
            >
                <Copy size={12} />
                <span>复制结果</span>
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Generation Controls (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3.5 shadow-2xs">
                <!-- Unit Selector -->
                <div class="space-y-1.5">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">生成单位</span>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        <button
                            type="button"
                            class="p-2 rounded-lg border text-center transition cursor-pointer {unit === 'paragraphs' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}"
                            onclick={() => (unit = "paragraphs")}
                        >
                            段落 (Paragraphs)
                        </button>
                        <button
                            type="button"
                            class="p-2 rounded-lg border text-center transition cursor-pointer {unit === 'sentences' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}"
                            onclick={() => (unit = "sentences")}
                        >
                            单句 (Sentences)
                        </button>
                        <button
                            type="button"
                            class="p-2 rounded-lg border text-center transition cursor-pointer {unit === 'words' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}"
                            onclick={() => (unit = "words")}
                        >
                            词汇/字数 (Words)
                        </button>
                    </div>
                </div>

                <!-- Count Slider -->
                <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex justify-between items-center text-xs">
                        <label for="lorem-cnt-slider" class="font-bold text-slate-700 dark:text-slate-300">生成数量</label>
                        <span class="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded tabular-nums">
                            {count} {unit === 'paragraphs' ? '段' : unit === 'sentences' ? '句' : '词'}
                        </span>
                    </div>
                    <input
                        id="lorem-cnt-slider"
                        type="range"
                        min="1"
                        max="20"
                        bind:value={count}
                        class="w-full accent-sky-600 cursor-pointer"
                    />
                </div>

                <!-- Words per Para (if paragraphs) -->
                {#if unit === "paragraphs"}
                    <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div class="flex justify-between items-center text-xs">
                            <label for="lorem-words-slider" class="font-bold text-slate-700 dark:text-slate-300">每段大致词量</label>
                            <span class="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tabular-nums">
                                {wordsPerPara} 词
                            </span>
                        </div>
                        <input
                            id="lorem-words-slider"
                            type="range"
                            min="20"
                            max="120"
                            step="10"
                            bind:value={wordsPerPara}
                            class="w-full accent-slate-700 dark:accent-slate-300 cursor-pointer"
                        />
                    </div>
                {/if}

                <!-- HTML Wrap Tag -->
                <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">HTML 标签包裹</span>
                    <div class="grid grid-cols-3 gap-2 text-xs">
                        <button
                            type="button"
                            class="p-2 rounded-lg border text-center transition cursor-pointer {wrapTag === 'none' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}"
                            onclick={() => (wrapTag = "none")}
                        >
                            无标签 (纯文本)
                        </button>
                        <button
                            type="button"
                            class="p-2 rounded-lg border text-center font-mono transition cursor-pointer {wrapTag === 'p' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}"
                            onclick={() => (wrapTag = "p")}
                        >
                            &lt;p&gt; 段落标签
                        </button>
                        <button
                            type="button"
                            class="p-2 rounded-lg border text-center font-mono transition cursor-pointer {wrapTag === 'li' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'}"
                            onclick={() => (wrapTag = "li")}
                        >
                            &lt;li&gt; 列表标签
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 grid grid-cols-3 gap-2 text-center shadow-2xs shrink-0 font-mono">
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">总字符数</div>
                    <div class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{stats.chars}</div>
                </div>
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">词汇统计</div>
                    <div class="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">{stats.words}</div>
                </div>
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">段落数量</div>
                    <div class="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.paragraphs}</div>
                </div>
            </div>
        </div>

        <!-- Right: Generated Output Area (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">
                    实时生成的占位文本
                </span>
                <span class="text-[10px] text-slate-400 font-mono">
                    {stats.chars} 字符 · {stats.words} 词
                </span>
            </div>
            <div class="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-50/30 dark:bg-slate-950/30 min-h-0 custom-scrollbar">
                {#if output}
                    <CodeBlock
                        code={output}
                        language={wrapTag !== "none" ? "html" : "plaintext"}
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 border-0"
                    />
                {:else}
                    <div class="h-full flex items-center justify-center text-slate-400 text-xs italic font-sans">
                        占位文本将在此实时生成
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

