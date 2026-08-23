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
    <div class="flex flex-col md:flex-row gap-6 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex-1 space-y-2">
            <label
                for="hmac-input"
                class="label-section"
                >Message</label
            >
            <input
                id="hmac-input"
                type="text"
                bind:value={input}
                class="input text-sm w-full"
                placeholder="Message to sign"
            />
        </div>

        <div class="flex-1 space-y-2">
            <label
                for="hmac-secret"
                class="label-section"
                >Secret Key</label
            >
            <input
                id="hmac-secret"
                type="text"
                bind:value={secret}
                class="input text-sm w-full"
                placeholder="Secret key"
            />
        </div>

        <div class="space-y-2 w-full md:w-48">
            <label
                for="hmac-algo"
                class="label-section"
                >Algorithm</label
            >
            <select
                id="hmac-algo"
                bind:value={algo}
                class="input py-1.5 px-3 text-sm w-full cursor-pointer bg-transparent"
            >
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-512">SHA-512</option>
                <option value="SHA-1">SHA-1</option>
            </select>
        </div>
    </div>

    <!-- Output -->
    <div class="flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-center">
            <label
                for="hmac-output"
                class="label-section"
                >HMAC Signature (Hex)</label
            >
            {#if error}
                <span class="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                </span>
            {/if}
        </div>

        <div class="relative min-h-[350px]">
            <textarea
                id="hmac-output"
                value={output}
                readonly
                class="textarea-editor w-full"
                placeholder="Signature will appear here..."
            ></textarea>

            {#if output}
                <div class="absolute top-3 right-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => navigator.clipboard.writeText(output)}
                        class="btn btn-secondary text-sm shadow-sm"
                    >
                        <Copy size={14} class="mr-1" /> Copy
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</div>
