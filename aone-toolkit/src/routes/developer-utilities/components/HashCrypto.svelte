<script lang="ts">
    import { Button } from "$lib/components/ui";

    let input = $state("");
    let hashResults = $state<
        { name: string; value: string; loading: boolean }[]
    >([
        { name: "SHA-256", value: "", loading: false },
        { name: "SHA-512", value: "", loading: false },
        { name: "SHA-1", value: "", loading: false },
    ]);
    let file: File | null = $state(null);
    let fileHashResults = $state<
        { name: string; value: string; loading: boolean }[]
    >([
        { name: "SHA-256", value: "", loading: false },
        { name: "SHA-512", value: "", loading: false },
    ]);

    async function computeHash(text: string, algorithm: string) {
        if (!text) return "";
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    }

    async function computeFileHash(file: File, algorithm: string) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    }

    async function updateHashes() {
        if (!input) {
            hashResults.forEach((r) => (r.value = ""));
            return;
        }

        for (const result of hashResults) {
            result.loading = true;
            result.value = await computeHash(input, result.name);
            result.loading = false;
        }
    }

    async function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            file = target.files[0];
            for (const result of fileHashResults) {
                result.loading = true;
                result.value = await computeFileHash(file, result.name);
                result.loading = false;
            }
        }
    }

    $effect(() => {
        updateHashes();
    });

    function copyValue(val: string) {
        if (val) navigator.clipboard.writeText(val);
    }
</script>

<div class="space-y-6 pb-8">
    <!-- Text Hashing -->
    <div class="space-y-4">
        <div class="space-y-2">
            <div class="text-sm font-medium">Text Input</div>
            <textarea
                bind:value={input}
                class="w-full h-24 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type or paste text to hash..."
            ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-3">
            {#each hashResults as result}
                <div class="space-y-1">
                    <div
                        class="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase px-1"
                    >
                        <span>{result.name}</span>
                        {#if result.value}
                            <button
                                class="hover:text-primary-500 transition-colors"
                                onclick={() => copyValue(result.value)}
                            >
                                COPY
                            </button>
                        {/if}
                    </div>
                    <div class="relative group">
                        <input
                            type="text"
                            readonly
                            value={result.loading
                                ? "Computing..."
                                : result.value}
                            class="w-full p-2.5 font-mono text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                        />
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- File Hashing -->
    <div class="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div class="text-sm font-medium flex items-center gap-2">
            File Hashing
            <span
                class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase"
                >Verification</span
            >
        </div>

        <div class="flex items-center justify-center w-full">
            <label
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <div
                    class="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4"
                >
                    <svg
                        class="w-8 h-8 mb-3 text-slate-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                    </svg>
                    {#if file}
                        <p
                            class="text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs"
                        >
                            {file.name}
                        </p>
                        <p class="text-xs text-slate-500">
                            {(file.size / 1024).toFixed(2)} KB
                        </p>
                    {:else}
                        <p
                            class="mb-1 text-sm text-slate-500 dark:text-slate-400"
                        >
                            <span class="font-semibold">Click to upload</span> or
                            drag and drop
                        </p>
                        <p class="text-xs text-slate-400">
                            Any file to verify integrity
                        </p>
                    {/if}
                </div>
                <input type="file" class="hidden" onchange={handleFileChange} />
            </label>
        </div>

        {#if file}
            <div
                class="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
                {#each fileHashResults as result}
                    <div class="space-y-1">
                        <div
                            class="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase px-1"
                        >
                            <span>{file.name} [{result.name}]</span>
                            {#if result.value}
                                <button
                                    class="hover:text-primary-500 transition-colors"
                                    onclick={() => copyValue(result.value)}
                                >
                                    COPY
                                </button>
                            {/if}
                        </div>
                        <input
                            type="text"
                            readonly
                            value={result.loading
                                ? "Reading file & computing..."
                                : result.value}
                            class="w-full p-2.5 font-mono text-xs bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg focus:outline-none"
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
