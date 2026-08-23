<script lang="ts">
    import { Play, Pause, StepForward, Square, Search, X, Filter, SkipBack, SkipForward, Rewind, FastForward } from "lucide-svelte";
    import { timeTravelUtils } from './executionTimeMachine';

    // Log entry type
    export interface LogEntry {
        id: string;
        nodeId: string;
        nodeName: string;
        timestamp: number;
        level: 'info' | 'warn' | 'error' | 'debug';
        message: string;
        details?: string;
    }

    let {
        flowState = "idle",
        onPlay,
        onPause,
        onStep,
        onStop,
    } = $props<{
        flowState: "idle" | "running" | "paused";
        onPlay: () => void;
        onPause: () => void;
        onStep: () => void;
        onStop: () => void;
    }>();

    // Local log state
    let logs = $state<LogEntry[]>([]);
    let maxLogs = $state(100);

    // P1-7: Time travel state
    let isTimeTravelMode = $state(false);
    let timeSliderValue = $state(0);
    let totalSteps = $state(0);
    let currentStepLabel = $state('');

    // P1-7: Time travel controls
    function handleTimeSliderInput(e: Event) {
        const value = parseInt((e.target as HTMLInputElement).value);
        timeSliderValue = value;
        timeTravelUtils.navigateToStep(value);
    }

    function jumpToStart() {
        timeTravelUtils.jumpToStart();
        timeSliderValue = 0;
        currentStepLabel = 'Start';
    }

    function stepBack() {
        if (timeTravelUtils.stepBackward()) {
            timeSliderValue = Math.max(0, timeSliderValue - 1);
        }
    }

    function stepForward() {
        if (timeTravelUtils.stepForward()) {
            timeSliderValue = Math.min(totalSteps, timeSliderValue + 1);
        }
    }

    function jumpToEnd() {
        timeTravelUtils.jumpToEnd();
        timeSliderValue = totalSteps;
        currentStepLabel = 'End';
    }

    // Search state
    let searchQuery = $state('');
    let showFilters = $state(false);
    let filterLevel = $state<string>('all');

    // Filtered logs
    let filteredLogs = $derived.by(() => {
        let result = logs;
        
        if (filterLevel !== 'all') {
            result = result.filter(log => log.level === filterLevel);
        }
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log => 
                log.message.toLowerCase().includes(query) ||
                log.nodeName.toLowerCase().includes(query) ||
                (log.details && log.details.toLowerCase().includes(query))
            );
        }
        
        return result;
    });

    // Add a log entry
    export function addLog(nodeId: string, nodeName: string, message: string, level: LogEntry['level'] = 'info', details?: string) {
        const newLog: LogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nodeId,
            nodeName,
            timestamp: Date.now(),
            level,
            message,
            details,
        };
        
        logs = [...logs, newLog];
        
        if (logs.length > maxLogs) {
            logs = logs.slice(-maxLogs);
        }
    }

    // Clear logs
    export function clearLogs() {
        logs = [];
    }

    // Get logs for external use
    export function getLogs(): LogEntry[] {
        return logs;
    }

    // Set logs from external
    export function setLogs(newLogs: LogEntry[]) {
        logs = newLogs;
    }

    function highlightMatch(text: string, query: string): string {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
    }

    function formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', { hour12: false });
    }
</script>

<div
    class="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
>
    {#if flowState === "idle" || flowState === "paused"}
        <button
            class="p-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
            onclick={onPlay}
            title="Run Flow"
        >
            <Play size={18} />
        </button>
    {/if}

    {#if flowState === "running"}
        <button
            class="p-2 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors"
            onclick={onPause}
            title="Pause"
        >
            <Pause size={18} />
        </button>
    {/if}

    <button
        class="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
        onclick={onStep}
        disabled={flowState === "running" || flowState === "idle"}
        title="Step Over"
    >
        <StepForward size={18} />
    </button>

    <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

    <button
        class="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
        onclick={onStop}
        disabled={flowState === "idle"}
        title="Stop"
    >
        <Square size={18} />
    </button>

    <!-- P1-7: Time Travel Controls -->
    <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
    
    <button
        class="p-2 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
        onclick={() => isTimeTravelMode = !isTimeTravelMode}
        title="Time Travel Mode"
        class:bg-purple-100={isTimeTravelMode}
    >
        <Rewind size={18} />
    </button>

    {#if isTimeTravelMode}
        <div class="flex items-center gap-1 mx-2">
            <button
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                onclick={jumpToStart}
                title="Jump to Start"
            >
                <SkipBack size={14} />
            </button>
            <button
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                onclick={stepBack}
                title="Step Back"
            >
                <Rewind size={14} />
            </button>
            <input
                type="range"
                min="0"
                max={totalSteps}
                bind:value={timeSliderValue}
                oninput={handleTimeSliderInput}
                class="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <button
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                onclick={stepForward}
                title="Step Forward"
            >
                <FastForward size={14} />
            </button>
            <button
                class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                onclick={jumpToEnd}
                title="Jump to End"
            >
                <SkipForward size={14} />
            </button>
        </div>
        <span class="text-xs text-slate-500">{currentStepLabel}</span>
    {/if}

    <!-- NEW: Search and Filter Section -->
    <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

    <!-- Search Input -->
    <div class="relative">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search logs..."
            class="w-32 pl-7 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
        {#if searchQuery}
            <button
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onclick={() => searchQuery = ''}
            >
                <X class="w-3 h-3" />
            </button>
        {/if}
    </div>

    <!-- Filter Button -->
    <button
        class="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors {filterLevel !== 'all' ? 'text-blue-500' : 'text-slate-400'}"
        onclick={() => showFilters = !showFilters}
        title="Filter logs"
    >
        <Filter class="w-4 h-4" />
    </button>

    <!-- Log Count Badge -->
    {#if filteredLogs.length !== logs.length}
        <span class="text-xs text-slate-400 px-1">
            {filteredLogs.length}/{logs.length}
        </span>
    {/if}

    <!-- Clear Logs Button -->
    {#if logs.length > 0}
        <button
            class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
            onclick={clearLogs}
            title="Clear logs"
        >
            <X class="w-4 h-4" />
        </button>
    {/if}
</div>

<!-- NEW: Filter Panel (conditional) -->
{#if showFilters}
    <div
        class="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 min-w-40"
    >
        <div class="text-xs font-medium text-slate-500 mb-2">Log Level</div>
        <div class="flex flex-wrap gap-1">
            {#each ['all', 'info', 'warn', 'error', 'debug'] as level}
                <button
                    class="px-2 py-1 text-xs rounded transition-colors {filterLevel === level 
                        ? level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : level === 'warn' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : level === 'debug' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}"
                    onclick={() => filterLevel = level}
                >
                    {level === 'all' ? 'All' : level.toUpperCase()}
                </button>
            {/each}
        </div>
    </div>
{/if}

<!-- NEW: Log Preview Panel (shows when there are logs) -->
{#if logs.length > 0}
    <div
        class="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-40 w-80 max-h-64 overflow-hidden flex flex-col"
    >
        <div class="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500">Execution Logs</span>
            <span class="text-xs text-slate-400">{filteredLogs.length} entries</span>
        </div>
        <div class="overflow-y-auto flex-1 p-2 space-y-1">
            {#each filteredLogs.slice(-10).reverse() as log (log.id)}
                <div
                    class="text-xs p-1.5 rounded {log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                        : log.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        : log.level === 'debug' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                        : 'bg-slate-50 dark:bg-slate-700/50'}"
                >
                    <div class="flex items-center gap-1">
                        <span class="text-slate-400">{formatTime(log.timestamp)}</span>
                        <span class="font-medium">{log.nodeName}</span>
                    </div>
                    <div class="mt-0.5">{@html highlightMatch(log.message, searchQuery)}</div>
                    {#if log.details}
                        <div class="mt-0.5 text-slate-400 truncate">{log.details}</div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}
