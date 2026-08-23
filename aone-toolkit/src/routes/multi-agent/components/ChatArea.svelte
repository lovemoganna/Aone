<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { SKILL_DEFINITIONS, type Skill } from "$lib/services/SkillService";
    import { Button } from "$lib/components/ui";
    import MessageBubble from "./MessageBubble.svelte";
    import PlanReview from "./PlanReview.svelte";
    import GovernanceCard from "./GovernanceCard.svelte";
    import ResumePanel from "./ResumePanel.svelte";
    import CollaborationStepper from "./CollaborationStepper.svelte";
    import EntranceSelector from "./EntranceSelector.svelte";
    import { squadEngine } from "$lib/stores/squadEngine.svelte";
    import { warfareEngine } from "$lib/stores/warfareEngine.svelte";
    import { 
        Send, 
        Loader2, 
        Square, 
        Wrench, 
        Network, 
        ChevronRight, 
        AlertTriangle, 
        RotateCcw,
        Bot,
        Swords,
        AtSign,
        Trash2
    } from "lucide-svelte";
    import { tick } from "svelte";
    import { 
        getAgentDisplayName, 
        FALLBACK_SKILL_MAP, 
        SKILL_ALIASES, 
        SKILL_LABELS,
        AGENT_ALIASES
    } from "$lib/constants/agentConstants";

    let input = $state("");
    let draftInput = $state("");
    let isComposing = $state(false);
    let chatContainer = $state<HTMLElement>();
    let textareaRef = $state<HTMLTextAreaElement>();
    let showSkillsMenu = $state(false);
    let showMentionMenu = $state(false);
    let inputHistory: string[] = $state([]);
    let historyIndex: number = $state(-1);

    function displayAgentName(id: string, fallback: string) {
        return getAgentDisplayName(id, fallback);
    }

    const fallbackSkillMap = FALLBACK_SKILL_MAP;
    const skillAliases = SKILL_ALIASES;
    const agentAliases = AGENT_ALIASES;

    let filterAgentId = $derived(agentStore.selectedFilterAgentId);
    let messages = $derived(
        agentStore.currentSession.messages.filter((message) => 
            message.role !== "thought" && 
            (!filterAgentId || message.role === "user" || message.agentId === filterAgentId)
        ),
    );
    let allMessages = $derived(agentStore.currentSession.messages);
    let latestThought = $derived(
        allMessages.filter((message) => message.role === "thought").slice(-1)[0],
    );
    let isThinking = $derived(agentStore.isThinking);
    let activeAgents = $derived(agentStore.getActiveAgents());
    let isRunning = $derived(
        isThinking || 
        agentStore.metaFlowIsRunning || 
        squadEngine.state.isRunning || 
        warfareEngine.state.isRunning
    );

    let activeContextLabel = $derived.by(() => {
        if (agentStore.mode === 'joint_warfare') return "⚔️ 攻坚对抗推演";
        if (activeAgents.length === 1) {
            return `🎯 专家直聊：${displayAgentName(activeAgents[0].id, activeAgents[0].name)}`;
        }
        if (activeAgents.length > 1 && activeAgents.length <= 4) {
            return `💬 ${activeAgents.length} 位专家定向响应`;
        }
        return "🚀 全能小队 5 阶协同";
    });

    // Auto-scroll
    $effect(() => {
        if (messages.length && chatContainer) {
            scrollToBottom();
        }
    });

    // Global keyboard shortcuts & insert events
    $effect(() => {
        function handleGlobalKey(e: KeyboardEvent) {
            if (e.key === "Escape" && isRunning) {
                agentStore.cancelOperation();
            } else if ((e.ctrlKey || e.metaKey) && e.key === ".") {
                e.preventDefault();
                if (agentStore.pipelineState.isPaused) {
                    agentStore.resumeExecution();
                } else {
                    agentStore.pauseExecution();
                }
            }
        }
        window.addEventListener("keydown", handleGlobalKey);

        function onInsertInput(e: any) {
            if (e.detail?.text) {
                input = input ? `${input}\n\n${e.detail.text}` : e.detail.text;
                focusTextarea();
            }
        }
        window.addEventListener("insert-chat-input", onInsertInput);

        return () => {
            window.removeEventListener("keydown", handleGlobalKey);
            window.removeEventListener("insert-chat-input", onInsertInput);
        };
    });

    async function scrollToBottom() {
        await tick();
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    function focusTextarea() {
        tick().then(() => {
            textareaRef?.focus();
        });
    }

    function getMentionedAgentIds(text: string): string[] {
        const allAgents = agentStore.agents;
        const matchedIds: string[] = [];
        for (const ag of allAgents) {
            const alias = agentAliases[ag.id] || ag.name;
            const cleanAlias = alias.replace(/[()]/g, '');
            if (
                text.includes(`@${ag.id}`) ||
                text.includes(`@${ag.name}`) ||
                text.includes(`@${alias}`) ||
                text.includes(`@${cleanAlias}`)
            ) {
                if (!matchedIds.includes(ag.id)) {
                    matchedIds.push(ag.id);
                }
            }
        }
        return matchedIds;
    }

    async function handleSend() {
        if (!input.trim() || isRunning) return;
        
        const text = input.trim();
        inputHistory.push(text);
        historyIndex = -1;
        draftInput = "";
        input = "";
        showMentionMenu = false;
        showSkillsMenu = false;

        const mentionedIds = getMentionedAgentIds(text);

        if (agentStore.mode === 'joint_warfare') {
            await agentStore.runJointWarfare(text);
        } else if (mentionedIds.length > 0) {
            agentStore.addMessage("user", text);
            await agentStore.sendMessage(text, mentionedIds);
        } else if (activeAgents.length <= 4) {
            agentStore.addMessage("user", text);
            await agentStore.sendMessage(text, activeAgents.map(a => a.id));
        } else {
            agentStore.addMessage("user", text);
            await agentStore.runSquadCollaboration(text);
        }
    }

    function handleCancel() {
        if (agentStore.mode === 'joint_warfare') {
            warfareEngine.cancelWarfare();
        } else {
            squadEngine.cancelCollaboration();
            agentStore.cancelOperation();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        // [P0] 中文 IME 组合状态下（选词回车确认）直接阻断，防止误发送
        if (isComposing || e.isComposing || e.keyCode === 229) {
            return;
        }

        if (showMentionMenu) {
            if (e.key === "Escape") {
                showMentionMenu = false;
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === "ArrowUp" && (!input || historyIndex !== -1)) {
            if (inputHistory.length > 0) {
                e.preventDefault();
                if (historyIndex === -1) {
                    draftInput = input;
                    historyIndex = inputHistory.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                input = inputHistory[historyIndex] || "";
            }
        } else if (e.key === "ArrowDown" && historyIndex !== -1) {
            e.preventDefault();
            if (historyIndex < inputHistory.length - 1) {
                historyIndex++;
                input = inputHistory[historyIndex] || "";
            } else {
                historyIndex = -1;
                input = draftInput;
            }
        } else if (e.key === "@") {
            showMentionMenu = true;
        }
    }

    function selectMentionAgent(agentId: string) {
        const agent = agentStore.getAgent(agentId);
        const name = agentAliases[agentId] || agent?.name || agentId;
        const mentionTag = `@${name} `;

        if (textareaRef) {
            const start = textareaRef.selectionStart ?? input.length;
            const end = textareaRef.selectionEnd ?? input.length;
            const textBefore = input.slice(0, start);
            const textAfter = input.slice(end);

            if (textBefore.endsWith('@')) {
                input = textBefore.slice(0, -1) + mentionTag + textAfter;
            } else {
                input = textBefore + mentionTag + textAfter;
            }

            showMentionMenu = false;
            tick().then(() => {
                if (textareaRef) {
                    textareaRef.focus();
                    const newPos = start + mentionTag.length - (textBefore.endsWith('@') ? 1 : 0);
                    textareaRef.setSelectionRange(newPos, newPos);
                }
            });
        } else {
            input = input ? `${input} ${mentionTag}` : mentionTag;
            showMentionMenu = false;
            focusTextarea();
        }
    }

    function callSkill(skillId: string) {
        const skill = SKILL_DEFINITIONS[skillId];
        if (!skill) return;
        const skillPrompt = skill.inputPrompt("请开始执行");

        if (textareaRef) {
            const start = textareaRef.selectionStart ?? input.length;
            const end = textareaRef.selectionEnd ?? input.length;
            const textBefore = input.slice(0, start);
            const textAfter = input.slice(end);
            const separator = textBefore && !textBefore.endsWith('\n\n') ? (textBefore.endsWith('\n') ? '\n' : '\n\n') : '';
            input = textBefore + separator + skillPrompt + (textAfter ? '\n\n' + textAfter : '');
        } else {
            input = input ? `${input}\n\n${skillPrompt}` : skillPrompt;
        }
        showSkillsMenu = false;
        focusTextarea();
    }

    function handleScenarioSelection(prompt: string, mode: 'squad' | 'joint_warfare', autoSend: boolean = false) {
        input = prompt;
        agentStore.setMode(mode);
        focusTextarea();
        if (autoSend) {
            tick().then(() => handleSend());
        }
    }
</script>

<div class="flex flex-col h-full min-h-0 flex-1 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden relative">
    <!-- Compact Top Bar -->
    <div class="px-4 py-2 shrink-0 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 text-xs">
        <div class="flex items-center gap-2">
            <button
                onclick={() => agentStore.openRightDrawer('topology')}
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer font-medium"
                title="在右侧查看小队分工"
            >
                <Network class="h-3.5 w-3.5 text-slate-500" />
                <span>小队拓扑</span>
                <span class="text-slate-400 font-mono">({activeAgents.length})</span>
                <ChevronRight class="h-3 w-3 text-slate-400" />
            </button>

            <span class="text-slate-500 dark:text-slate-400 font-medium">
                {activeContextLabel}
            </span>
        </div>
    </div>

    <!-- Stepper (Single Squad Mode) -->
    {#if agentStore.mode === 'squad' && activeAgents.length >= 5}
        <CollaborationStepper />
    {/if}

    <!-- Messages / Welcome Stream -->
    <div
        bind:this={chatContainer}
        class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
        {#if messages.length === 0}
            <EntranceSelector 
                onSelectScenario={handleScenarioSelection}
            />
        {:else}
            <div class="max-w-3xl mx-auto space-y-4">
                {#each messages as msg (msg.id)}
                    <MessageBubble message={msg} />
                {/each}
            </div>

            {#if isThinking && !messages.some((m) => m.isStreaming)}
                <div class="max-w-3xl mx-auto flex items-center gap-3 p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 text-xs">
                    <Loader2 class="w-4 h-4 animate-spin text-slate-700 dark:text-slate-200 shrink-0" />
                    <div class="text-slate-600 dark:text-slate-300 font-medium">
                        {#if agentStore.pipelineState.stage === 'intent'}
                            <span>正在解构任务意图...</span>
                        {:else if agentStore.pipelineState.stage === 'scene'}
                            <span>正在匹配协同场景...</span>
                        {:else if agentStore.pipelineState.stage === 'strategy'}
                            <span>正在规划执行策略...</span>
                        {:else}
                            <span>智能体推演中...</span>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if agentStore.pipelineState.waitingForReview && agentStore.pipelineState.governanceState}
                <div class="max-w-3xl mx-auto px-1">
                    <GovernanceCard />
                </div>
            {:else if agentStore.pipelineState.waitingForReview && agentStore.pipelineState.taskPlan}
                <div class="max-w-3xl mx-auto px-1">
                    <PlanReview plan={agentStore.pipelineState.taskPlan} />
                </div>
            {/if}

            {#if squadEngine.state.error}
                <div class="max-w-3xl mx-auto p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
                    <div class="flex items-center gap-2 min-w-0">
                        <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0" />
                        <span class="truncate">推演中断：{squadEngine.state.error}</span>
                    </div>
                    <button
                        type="button"
                        onclick={() => squadEngine.retryCurrentPhase()}
                        class="px-2.5 py-1 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-500 transition cursor-pointer shrink-0 flex items-center gap-1"
                    >
                        <RotateCcw class="w-3 h-3" />
                        重试
                    </button>
                </div>
            {/if}

            <ResumePanel />
        {/if}
    </div>

    <!-- Clean, High-Precision Command Console -->
    <div class="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div class="max-w-3xl mx-auto rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/70 dark:bg-slate-850 p-2.5 shadow-2xs focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-0 focus-within:outline-none transition-colors duration-150">
            
            <!-- Textarea with IME protection -->
            <textarea
                bind:this={textareaRef}
                bind:value={input}
                onkeydown={handleKeydown}
                oncompositionstart={() => (isComposing = true)}
                oncompositionend={() => (isComposing = false)}
                aria-label="输入任务内容"
                placeholder={isRunning ? "推演进行中，您可在此输入后续指令..." : "输入目标或技术议题... (@ 提及专家)"}
                class="w-full min-h-[56px] max-h-[220px] bg-transparent border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 resize-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 leading-relaxed shadow-none"
                rows="2"
            ></textarea>

            <!-- Bottom Action Toolbar -->
            <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <!-- Left Tools -->
                <div class="flex items-center gap-1.5 flex-wrap">
                    <!-- @ Mention Trigger -->
                    <div class="relative">
                        <button
                            type="button"
                            onclick={() => (showMentionMenu = !showMentionMenu)}
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="指定特定专家"
                        >
                            <AtSign class="h-3 w-3 text-slate-400" />
                            <span>提及专家</span>
                        </button>

                        {#if showMentionMenu}
                            <div class="fixed inset-0 z-40" onclick={() => (showMentionMenu = false)} role="presentation"></div>
                            <div class="absolute bottom-full mb-1.5 left-0 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-50 text-xs animate-in fade-in duration-100">
                                <div class="px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                                    指定专家主导发言
                                </div>
                                <div class="max-h-48 overflow-y-auto space-y-0.5">
                                    {#each activeAgents as ag}
                                        <button
                                            type="button"
                                            onclick={() => selectMentionAgent(ag.id)}
                                            class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-left cursor-pointer"
                                        >
                                            <span class="font-medium">{agentAliases[ag.id] || ag.name}</span>
                                            <span class="text-[10px] text-slate-400 font-mono">@{ag.id}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Skills / Directive Actions -->
                    <div class="relative">
                        <button
                            type="button"
                            onclick={() => (showSkillsMenu = !showSkillsMenu)}
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="附带分析方法"
                        >
                            <Wrench class="h-3 w-3 text-slate-400" />
                            <span>分析工具</span>
                        </button>

                        {#if showSkillsMenu}
                            <div class="fixed inset-0 z-40" onclick={() => (showSkillsMenu = false)} role="presentation"></div>
                            <div class="absolute left-0 bottom-full mb-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 p-1.5 space-y-0.5 text-xs animate-in fade-in duration-100">
                                <div class="px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    附加分析框架
                                </div>
                                {#each Object.values(SKILL_DEFINITIONS) as sk}
                                    <button
                                        type="button"
                                        onclick={() => callSkill(sk.id)}
                                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition text-left cursor-pointer"
                                    >
                                        <span>{sk.icon}</span>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-medium truncate">{sk.name}</div>
                                            <div class="text-[10px] text-slate-400 truncate">{sk.description}</div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    {#if input.trim()}
                        <button
                            type="button"
                            onclick={() => { input = ""; draftInput = ""; }}
                            class="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="清空内容"
                        >
                            <Trash2 class="h-3 w-3" />
                        </button>
                    {/if}

                    <span class="hidden sm:inline-block text-[10px] text-slate-400 font-mono ml-1">
                        Enter 发送 · Shift+Enter 换行
                    </span>
                </div>

                <!-- Right Action -->
                <div class="flex items-center gap-2">
                    {#if isRunning}
                        <button
                            type="button"
                            onclick={handleCancel}
                            class="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium text-xs hover:bg-rose-100 transition cursor-pointer"
                        >
                            <Square class="w-3 h-3 fill-current" />
                            <span>中止推演</span>
                        </button>
                    {:else}
                        <button
                            type="button"
                            onclick={handleSend}
                            disabled={!input.trim()}
                            class="h-7 px-3.5 flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white font-semibold text-xs shadow-xs transition cursor-pointer active:scale-98"
                        >
                            <span>发送</span>
                            <Send class="w-3 h-3" />
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
