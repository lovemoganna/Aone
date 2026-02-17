<script lang="ts">
    import { Button } from "$lib/components/ui";

    // UUID
    let uuids = $state<string[]>([]);
    let count = $state(1);

    function generateUuid() {
        if (count < 1) count = 1;
        if (count > 100) count = 100;

        const newUuids = [];
        for (let i = 0; i < count; i++) {
            newUuids.push(crypto.randomUUID());
        }
        uuids = newUuids;
    }

    // Hash
    let hashInput = $state("");
    let hashes = $state({
        sha1: "",
        sha256: "",
        sha512: "",
    });

    async function calculateHash() {
        if (!hashInput) {
            hashes = { sha1: "", sha256: "", sha512: "" };
            return;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(hashInput);

        const sha1Buf = await crypto.subtle.digest("SHA-1", data);
        const sha256Buf = await crypto.subtle.digest("SHA-256", data);
        const sha512Buf = await crypto.subtle.digest("SHA-512", data);

        hashes = {
            sha1: bufToHex(sha1Buf),
            sha256: bufToHex(sha256Buf),
            sha512: bufToHex(sha512Buf),
        };
    }

    function bufToHex(buffer: ArrayBuffer) {
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    $effect(() => {
        calculateHash();
    });

    // Init UUID
    $effect.root(() => {
        generateUuid();
    });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- UUID Section -->
    <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <div
                class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                </svg>
            </div>
            UUID Generator
        </h3>

        <div class="flex items-center gap-2">
            <input
                type="number"
                min="1"
                max="100"
                bind:value={count}
                class="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <Button onclick={generateUuid}>Generate</Button>
        </div>

        <div
            class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700 max-h-[400px] overflow-auto"
        >
            <pre
                class="font-mono text-sm text-slate-700 dark:text-slate-300">{uuids.join(
                    "\n",
                )}</pre>
        </div>
    </div>

    <!-- Hash Section -->
    <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <div
                class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"
                    />
                </svg>
            </div>
            Hash Calculator
        </h3>

        <div class="space-y-2">
            <label class="text-sm font-medium">Input Text</label>
            <textarea
                bind:value={hashInput}
                class="w-full h-24 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type to hash..."
            ></textarea>
        </div>

        <div class="space-y-3">
            <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-500 uppercase"
                    >SHA-1</label
                >
                <div
                    class="bg-slate-100 dark:bg-slate-900 p-2 rounded border dark:border-slate-800 font-mono text-xs break-all"
                >
                    {hashes.sha1 || "..."}
                </div>
            </div>
            <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-500 uppercase"
                    >SHA-256</label
                >
                <div
                    class="bg-slate-100 dark:bg-slate-900 p-2 rounded border dark:border-slate-800 font-mono text-xs break-all text-green-600 dark:text-green-400"
                >
                    {hashes.sha256 || "..."}
                </div>
            </div>
            <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-500 uppercase"
                    >SHA-512</label
                >
                <div
                    class="bg-slate-100 dark:bg-slate-900 p-2 rounded border dark:border-slate-800 font-mono text-xs break-all"
                >
                    {hashes.sha512 || "..."}
                </div>
            </div>
        </div>
    </div>
</div>
