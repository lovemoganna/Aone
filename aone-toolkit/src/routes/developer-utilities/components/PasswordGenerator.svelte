<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw, Check } from "lucide-svelte";

    let length = $state(16);
    let useUpper = $state(true);
    let useLower = $state(true);
    let useNumbers = $state(true);
    let useSymbols = $state(true);
    let password = $state("");
    let copied = $state(false);

    const CHARSETS = {
        upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lower: "abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        symbols: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
    };

    function generate() {
        let chars = "";
        if (useUpper) chars += CHARSETS.upper;
        if (useLower) chars += CHARSETS.lower;
        if (useNumbers) chars += CHARSETS.numbers;
        if (useSymbols) chars += CHARSETS.symbols;

        if (chars.length === 0) {
            password = "";
            return;
        }

        let result = "";
        const bytes = new Uint32Array(length);
        crypto.getRandomValues(bytes);

        for (let i = 0; i < length; i++) {
            result += chars[bytes[i] % chars.length];
        }
        password = result;
    }

    // Auto generate on init
    $effect(() => {
        if (!password) generate();
    });

    async function copy() {
        if (!password) return;
        await navigator.clipboard.writeText(password);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }
</script>

<div class="max-w-xl mx-auto space-y-8 py-8">
    <!-- Display -->
    <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4"
    >
        <div
            class="flex-1 font-mono text-2xl md:text-3xl text-slate-800 dark:text-slate-100 break-all text-center tracking-wider min-h-[48px] flex items-center justify-center"
        >
            {password || "Select options..."}
        </div>
        <div class="shrink-0 flex gap-2">
            <Button size="sm" onclick={generate} title="Regenerate">
                <RefreshCw size={18} />
            </Button>
            <Button size="sm" variant="primary" onclick={copy} title="Copy">
                {#if copied}
                    <Check size={18} class="text-white" />
                {:else}
                    <Copy size={18} />
                {/if}
            </Button>
        </div>
    </div>

    <!-- Controls -->
    <div
        class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6"
    >
        <!-- Length -->
        <div class="space-y-4">
            <div class="flex justify-between items-center">
                <label
                    for="pwd-len"
                    class="text-sm font-bold text-slate-700 dark:text-slate-300"
                    >Length: {length}</label
                >
            </div>
            <input
                id="pwd-len"
                type="range"
                min="6"
                max="64"
                bind:value={length}
                oninput={generate}
                class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <label
                class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-500 transition-colors"
            >
                <input
                    type="checkbox"
                    bind:checked={useUpper}
                    onchange={generate}
                    class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span
                    class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >Uppercase (A-Z)</span
                >
            </label>
            <label
                class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-500 transition-colors"
            >
                <input
                    type="checkbox"
                    bind:checked={useLower}
                    onchange={generate}
                    class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span
                    class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >Lowercase (a-z)</span
                >
            </label>
            <label
                class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-500 transition-colors"
            >
                <input
                    type="checkbox"
                    bind:checked={useNumbers}
                    onchange={generate}
                    class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span
                    class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >Numbers (0-9)</span
                >
            </label>
            <label
                class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-500 transition-colors"
            >
                <input
                    type="checkbox"
                    bind:checked={useSymbols}
                    onchange={generate}
                    class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span
                    class="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >Symbols (!@#$)</span
                >
            </label>
        </div>
    </div>
</div>
