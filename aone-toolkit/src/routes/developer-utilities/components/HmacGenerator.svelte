<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, AlertCircle } from "lucide-svelte";

    let input = $state("");
    let secret = $state("");
    let algo = $state<"SHA-256" | "SHA-512" | "SHA-1">("SHA-256");
    let output = $state("");
    let error = $state<string | null>(null);

    // ... (logic)
    async function generateHMAC() {
        error = null;
        if (!input || !secret) {
            output = "";
            return;
        }

        try {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const msgData = encoder.encode(input);

            const key = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: algo },
                false,
                ["sign"],
            );

            const signature = await crypto.subtle.sign("HMAC", key, msgData);

            const b = new Uint8Array(signature);
            const hex = Array.from(b)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            output = hex;
        } catch (e: any) {
            error = e.message;
            output = "";
        }
    }

    $effect(() => {
        generateHMAC();
        if (input || secret || algo) {
        }
    });
</script>

<div class="h-full flex flex-col gap-6">
    <!-- Controls -->
    <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 space-y-2">
            <label
                for="hmac-input"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Message</label
            >
            <input
                id="hmac-input"
                type="text"
                bind:value={input}
                class="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
                placeholder="Message to sign"
            />
        </div>

        <div class="flex-1 space-y-2">
            <label
                for="hmac-secret"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Secret Key</label
            >
            <input
                id="hmac-secret"
                type="text"
                bind:value={secret}
                class="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"
                placeholder="Secret key"
            />
        </div>

        <div class="space-y-2 w-full md:w-48">
            <label
                for="hmac-algo"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >Algorithm</label
            >
            <div class="relative">
                <select
                    id="hmac-algo"
                    bind:value={algo}
                    class="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                >
                    <option value="SHA-256">SHA-256</option>
                    <option value="SHA-512">SHA-512</option>
                    <option value="SHA-1">SHA-1</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Output -->
    <div class="space-y-2 relative">
        <div class="flex justify-between">
            <label
                for="hmac-output"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >HMAC Signature (Hex)</label
            >
            {#if error}
                <span class="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                </span>
            {/if}
        </div>

        <div class="relative">
            <textarea
                id="hmac-output"
                value={output}
                readonly
                class="w-full h-32 p-4 font-mono text-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none resize-none text-slate-700 dark:text-slate-300"
                placeholder="Signature will appear here..."
            ></textarea>

            {#if output}
                <div class="absolute top-2 right-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => navigator.clipboard.writeText(output)}
                    >
                        <Copy size={14} class="mr-1" /> Copy
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</div>
