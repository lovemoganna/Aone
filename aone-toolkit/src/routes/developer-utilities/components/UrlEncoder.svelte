<script lang="ts">
    import { Button } from "$lib/components/ui";

    let input = $state("");
    let parsedUrl = $state<URL | null>(null);
    let queryParams = $state<{ key: string; value: string }[]>([]);
    let error = $state<string | null>(null);

    function handleInput() {
        error = null;
        if (!input.trim()) {
            parsedUrl = null;
            queryParams = [];
            return;
        }

        try {
            // If it doesn't have a protocol, assume https for parsing if it looks like a domain
            let urlToParse = input;
            if (
                !input.includes("://") &&
                (input.includes(".") || input.startsWith("localhost"))
            ) {
                urlToParse = "https://" + input;
            }

            const url = new URL(urlToParse);
            parsedUrl = url;

            const params: { key: string; value: string }[] = [];
            url.searchParams.forEach((value, key) => {
                params.push({ key, value });
            });
            queryParams = params;
        } catch (e) {
            parsedUrl = null;
            queryParams = [];
            // Not a valid URL, but might be just a snippet to encode/decode
        }
    }

    function encode() {
        input = encodeURIComponent(input);
        handleInput();
    }

    function decode() {
        try {
            input = decodeURIComponent(input);
            handleInput();
        } catch (e) {
            error = "Invalid encoding";
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    $effect(() => {
        handleInput();
    });
</script>

<div class="space-y-6 pb-8">
    <div class="space-y-2">
        <div class="text-sm font-medium">URL / String Input</div>
        <div class="flex gap-2">
            <textarea
                bind:value={input}
                class="flex-1 h-24 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Paste URL or text to encode/decode..."
            ></textarea>
        </div>
        {#if error}
            <p class="text-red-500 text-sm">{error}</p>
        {/if}
        <div class="flex gap-2">
            <Button variant="secondary" size="sm" onclick={encode}
                >Encode URI Component</Button
            >
            <Button variant="secondary" size="sm" onclick={decode}
                >Decode URI Component</Button
            >
            <Button variant="ghost" size="sm" onclick={() => (input = "")}
                >Clear</Button
            >
        </div>
    </div>

    {#if parsedUrl}
        <div
            class="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    class="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    <h3
                        class="text-xs font-bold text-slate-400 uppercase mb-3 px-1"
                    >
                        Structure
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div
                            class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700"
                        >
                            <span class="text-slate-500">Protocol</span>
                            <span
                                class="font-mono text-primary-600 dark:text-primary-400"
                                >{parsedUrl.protocol}</span
                            >
                        </div>
                        <div
                            class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700"
                        >
                            <span class="text-slate-500">Hostname</span>
                            <span class="font-mono">{parsedUrl.hostname}</span>
                        </div>
                        <div
                            class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700"
                        >
                            <span class="text-slate-500">Path</span>
                            <span class="font-mono">{parsedUrl.pathname}</span>
                        </div>
                        {#if parsedUrl.port}
                            <div
                                class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700"
                            >
                                <span class="text-slate-500">Port</span>
                                <span class="font-mono">{parsedUrl.port}</span>
                            </div>
                        {/if}
                    </div>
                </div>

                <div
                    class="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                    <h3
                        class="text-xs font-bold text-slate-400 uppercase mb-3 px-1"
                    >
                        Query Parameters ({queryParams.length})
                    </h3>
                    {#if queryParams.length > 0}
                        <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {#each queryParams as param}
                                <div
                                    class="flex flex-col p-2 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800"
                                >
                                    <span
                                        class="text-[10px] font-bold text-slate-400 uppercase"
                                        >{param.key}</span
                                    >
                                    <span class="font-mono text-xs break-all"
                                        >{param.value}</span
                                    >
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p
                            class="text-sm text-slate-400 italic py-4 text-center"
                        >
                            No query parameters found
                        </p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
