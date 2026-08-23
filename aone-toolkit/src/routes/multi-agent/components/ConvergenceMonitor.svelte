<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { auditEventBus } from "$lib/stores/auditEventBus.svelte";
    import {
        Activity,
        CheckCircle2,
        GitCompare,
        Scale,
        Search,
        Layers
    } from "lucide-svelte";

    let warfareState = $derived(agentStore.jointWarfareState);
    let stage = $derived(warfareState.stage);
    let isRunning = $derived(stage !== 'idle' && stage !== 'completed');

    let conflicts = $derived(auditEventBus.conflictList);
    let evidence = $derived(auditEventBus.evidenceList);
    let arbitration = $derived(warfareState.arbitrationResult);

    /** Qualitative divergence label — honest about what we actually know */
    let divergenceLabel = $derived.by(() => {
        if (stage === 'idle') return { text: '待启动', color: 'text-slate-400', bg: 'bg-slate-200 dark:bg-slate-700' };
        if (stage === 'completed') return { text: '已收敛', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' };
        if (stage === 'unified_arbitration') return { text: '裁决收束中', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' };
        if (stage === 'evidence_grounding') return { text: '趋于收敛', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/40' };
        if (stage === 'conflict_detection') return { text: '分歧定位中', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' };
        if (stage === 'overtime') return { text: '加时深化', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' };
        return { text: '分歧激烈', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' };
    });

    /** Confidence label — only show real number when arbitration actually produced one */
    let confidenceLabel = $derived.by(() => {
        if (stage === 'idle') return { text: '—', color: 'text-slate-400', bg: 'bg-slate-200 dark:bg-slate-700' };
        if (arbitration?.confidenceScore) {
            return { text: `${arbitration.confidenceScore}%`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' };
        }
        if (stage === 'completed') return { text: '推演完成', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' };
        return { text: '推演中', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    });

    let warfareRounds = $derived(warfareState.overtimeRounds ?? 0);
</script>

<div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 text-xs">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
            <Activity class="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span class="font-bold text-slate-800 dark:text-slate-200">收敛态势监控</span>
            {#if warfareRounds > 0}
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    加时 ×{warfareRounds}
                </span>
            {/if}
        </div>

        <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
                <span class="text-slate-400">观点分歧:</span>
                <span class="px-2 py-0.5 rounded-md text-[11px] font-bold {divergenceLabel.color} {divergenceLabel.bg}">
                    {divergenceLabel.text}
                </span>
            </div>

            <div class="flex items-center gap-1.5">
                <span class="text-slate-400">置信度:</span>
                <span class="px-2 py-0.5 rounded-md text-[11px] font-bold {confidenceLabel.color} {confidenceLabel.bg}">
                    {confidenceLabel.text}
                </span>
            </div>
        </div>
    </div>
</div>
