<script lang="ts">
    import { X, Plus, Trash2, Key, Search } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";
    import { onMount, tick } from "svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen?: boolean;
        onClose?: () => void;
    }>();

    type Environment = "dev" | "staging" | "prod";
    let currentEnv = $state<Environment>("dev");

    let allEnvVariables = $state<
        Record<Environment, { id: string; key: string; value: string; secret: boolean }[]>
    >({
        dev: [],
        staging: [],
        prod: []
    });

    let variables = $derived(allEnvVariables[currentEnv] || []);
    let searchQuery = $state("");

    onMount(() => {
        const stored = localStorage.getItem("aone_flow_globals_v2");
        if (stored) {
            try {
                allEnvVariables = JSON.parse(stored);
            } catch (e) {}
        } else {
            // Backward compatibility with v1 flat array
            const legacy = localStorage.getItem("aone_flow_globals");
            if (legacy) {
                try {
                    allEnvVariables.dev = JSON.parse(legacy);
                } catch (e) {}
            }
        }
    });

    $effect(() => {
        if (allEnvVariables) {
            localStorage.setItem(
                "aone_flow_globals_v2",
                JSON.stringify(allEnvVariables),
            );
            window.dispatchEvent(new CustomEvent("aone_globals_updated"));
        }
    });

    function addVariable() {
        const newVar = {
            id: crypto.randomUUID(),
            key: "NEW_VAR",
            value: "",
            secret: false,
        };
        allEnvVariables[currentEnv] = [...(allEnvVariables[currentEnv] || []), newVar];
    }

    function removeVariable(id: string) {
        allEnvVariables[currentEnv] = (allEnvVariables[currentEnv] || []).filter((v) => v.id !== id);
    }

    let filteredVars = $derived(
        variables.filter(
            (v) =>
                v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.value.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="absolute inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]"
        transition:fade={{ duration: 150 }}
        onclick={onClose}
    ></div>

    <div
        class="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
        transition:fly={{ x: 100, duration: 250 }}
    >
        <!-- Header -->
        <div
            class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
            <h2
                class="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
                <Key size={16} class="text-amber-500" />
                全局环境变量 (Vault)
            </h2>
            <button
                class="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                onclick={onClose}
            >
                <X size={16} />
            </button>
        </div>

        <!-- P3-20: Environment Tabs -->
        <div class="px-4 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex gap-1 bg-slate-50/50 dark:bg-slate-900/50">
            {#each [
                { key: 'dev', label: '开发 (Dev)' },
                { key: 'staging', label: '预发 (Staging)' },
                { key: 'prod', label: '生产 (Prod)' }
            ] as env}
                <button
                    class="flex-1 py-1 text-xs font-medium rounded-md transition-all {currentEnv === env.key ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}"
                    onclick={() => currentEnv = env.key as Environment}
                >
                    {env.label}
                </button>
            {/each}
        </div>

        <!-- Search & Add -->
        <div
            class="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3"
        >
            <div class="relative">
                <Search
                    size={14}
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search variables..."
                    class="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50"
                />
            </div>

            <button
                class="w-full flex items-center justify-center gap-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                onclick={addVariable}
            >
                <Plus size={14} />
                添加变量
            </button>
        </div>

        <!-- Variable List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each filteredVars as v (v.id)}
                <div
                    class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 group transition-all"
                    transition:fly={{ y: 10, duration: 150 }}
                >
                    <div class="flex items-center justify-between gap-2">
                        <input
                            type="text"
                            bind:value={v.key}
                            placeholder="KEY"
                            class="flex-1 bg-transparent border-none text-sm font-mono text-amber-600 dark:text-amber-400 placeholder:text-slate-400 focus:ring-0 p-0"
                            spellcheck="false"
                        />
                        <button
                            class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            onclick={() => removeVariable(v.id)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div class="relative">
                        <input
                            type={v.secret ? "password" : "text"}
                            bind:value={v.value}
                            placeholder="Value"
                            class="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono pr-8"
                        />
                        <button
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-1"
                            onclick={() => (v.secret = !v.secret)}
                        >
                            {v.secret ? "Show" : "Hide"}
                        </button>
                    </div>
                </div>
            {/each}

            {#if filteredVars.length === 0}
                <div class="text-center py-8">
                    <p class="text-sm text-slate-400">无变量</p>
                </div>
            {/if}
        </div>

        <div
            class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
        >
            <p class="text-xs text-slate-500 text-center">
                These variables can be extracted using `$$GLOBAL.YOUR_KEY` in
                nodes.
            </p>
        </div>
    </div>
{/if}
