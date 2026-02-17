<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, FileUp, CheckCircle, XCircle } from "lucide-svelte";

    // Web Crypto API
    async function computeHash(
        source: string | File,
        algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
    ) {
        if (!source) return "";
        let buffer: BufferSource;

        if (source instanceof File) {
            buffer = await source.arrayBuffer();
        } else {
            buffer = new TextEncoder().encode(source);
        }

        const hashBuffer = await crypto.subtle.digest(algo, buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    let inputMode = $state<"text" | "file">("text");
    let inputText = $state("");
    let inputFile = $state<File | null>(null);

    let compareHash = $state("");
    let isCalculating = $state(false);

    let hashes = $state({
        "SHA-1": "",
        "SHA-256": "",
        "SHA-384": "",
        "SHA-512": "",
    });

    async function calculate() {
        isCalculating = true;
        const source = inputMode === "text" ? inputText : inputFile;

        if (!source) {
            hashes = {
                "SHA-1": "",
                "SHA-256": "",
                "SHA-384": "",
                "SHA-512": "",
            };
            isCalculating = false;
            return;
        }

        try {
            const [h1, h256, h384, h512] = await Promise.all([
                computeHash(source, "SHA-1"),
                computeHash(source, "SHA-256"),
                computeHash(source, "SHA-384"),
                computeHash(source, "SHA-512"),
            ]);
            hashes = {
                "SHA-1": h1,
                "SHA-256": h256,
                "SHA-384": h384,
                "SHA-512": h512,
            };
        } catch (e) {
            console.error("Hash calculation failed", e);
        } finally {
            isCalculating = false;
        }
    }

    $effect(() => {
        if (inputMode === "text") calculate();
    });

    function handleFileSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files && files[0]) {
            inputFile = files[0];
            calculate();
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files && files[0]) {
            inputFile = files[0];
            inputMode = "file";
            calculate();
        }
    }

    async function copy(text: string) {
        if (text) await navigator.clipboard.writeText(text);
    }
</script>

<div class="space-y-6 max-w-4xl mx-auto">
    <!-- Input Section -->
    <div class="space-y-4">
        <div class="flex gap-4 border-b border-slate-200 dark:border-slate-800">
            <button
                class="px-4 py-2 text-sm font-bold border-b-2 transition-colors {inputMode ===
                'text'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}"
                onclick={() => (inputMode = "text")}
            >
                Text Input
            </button>
            <button
                class="px-4 py-2 text-sm font-bold border-b-2 transition-colors {inputMode ===
                'file'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}"
                onclick={() => (inputMode = "file")}
            >
                File Input
            </button>
        </div>

        {#if inputMode === "text"}
            <div class="relative">
                <textarea
                    bind:value={inputText}
                    class="w-full h-32 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                    placeholder="Enter text to hash..."
                ></textarea>
                <div class="absolute bottom-2 right-2 text-xs text-slate-400">
                    {inputText.length} chars
                </div>
            </div>
        {:else}
            <!-- File Drop Zone -->
            <label
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                ondragover={(e) => e.preventDefault()}
                ondrop={handleDrop}
            >
                <div
                    class="flex flex-col items-center justify-center pt-5 pb-6"
                >
                    {#if inputFile}
                        <div
                            class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2 text-indigo-600"
                        >
                            <FileUp size={24} />
                        </div>
                        <p class="text-sm text-slate-500 font-medium">
                            {inputFile.name}
                        </p>
                        <p class="text-xs text-slate-400">
                            {(inputFile.size / 1024).toFixed(2)} KB
                        </p>
                    {:else}
                        <FileUp size={32} class="mb-3 text-slate-400" />
                        <p class="mb-2 text-sm text-slate-500">
                            <span class="font-semibold">Click to upload</span> or
                            drag and drop
                        </p>
                        <p class="text-xs text-slate-500">
                            Any file type supported
                        </p>
                    {/if}
                </div>
                <input type="file" class="hidden" onchange={handleFileSelect} />
            </label>
        {/if}
    </div>

    <!-- Hashes Grid -->
    <div class="grid gap-4">
        {#each Object.entries(hashes) as [algo, hash]}
            <div
                class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 relative group hover:shadow-md transition-shadow"
            >
                <div class="flex justify-between items-center mb-2">
                    <span
                        class="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                        >{algo}</span
                    >
                    <div class="flex items-center gap-2">
                        {#if isCalculating}
                            <span class="text-xs text-indigo-500 animate-pulse"
                                >Calculating...</span
                            >
                        {/if}
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => copy(hash)}
                            class="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            title="Copy"
                        >
                            <Copy size={14} />
                        </Button>
                    </div>
                </div>
                <div
                    class="font-mono text-xs break-all text-slate-700 dark:text-slate-300 select-all"
                >
                    {hash || (isCalculating ? "..." : "Waiting for input...")}
                </div>
            </div>
        {/each}
    </div>

    <!-- Verification Tool -->
    <div
        class="bg-indigo-50 dark:bg-slate-800/50 p-6 rounded-xl border border-indigo-100 dark:border-slate-700"
    >
        <h3
            class="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4"
        >
            Verify Hash
        </h3>
        <div class="flex gap-4">
            <input
                type="text"
                bind:value={compareHash}
                class="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="Paste a hash to compare..."
            />
        </div>

        {#if compareHash}
            <div class="mt-4 space-y-2">
                {#each Object.entries(hashes) as [algo, hash]}
                    {#if hash && compareHash
                            .trim()
                            .toLowerCase() === hash.toLowerCase()}
                        <div
                            class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-sm font-medium"
                        >
                            <CheckCircle size={16} /> Match found with {algo}
                        </div>
                    {/if}
                {/each}
                {#if !Object.values(hashes).some((h) => h.toLowerCase() === compareHash
                            .trim()
                            .toLowerCase())}
                    <div
                        class="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg text-sm font-medium"
                    >
                        <XCircle size={16} /> No match found
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
