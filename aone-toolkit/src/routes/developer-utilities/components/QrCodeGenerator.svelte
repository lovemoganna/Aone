<script lang="ts">
    import QRCode from "qrcode";
    import { Check, Copy, Download } from "lucide-svelte";

    let text = $state("https://aone.local/workflow");
    let size = $state(256);
    let margin = $state(2);
    let errorCorrection = $state<"L" | "M" | "Q" | "H">("M");
    let darkColor = $state("#111827");
    let lightColor = $state("#ffffff");
    let dataUrl = $state("");
    let svgMarkup = $state("");
    let error = $state("");
    let copied = $state(false);

    async function generate() {
        const value = text.trim();
        error = "";

        if (!value) {
            dataUrl = "";
            svgMarkup = "";
            return;
        }

        try {
            const options = {
                errorCorrectionLevel: errorCorrection,
                margin,
                width: size,
                color: {
                    dark: darkColor,
                    light: lightColor,
                },
            };

            dataUrl = await QRCode.toDataURL(value, options);
            svgMarkup = await QRCode.toString(value, {
                ...options,
                type: "svg",
            });
        } catch (e) {
            error = e instanceof Error ? e.message : "Unable to generate QR code.";
            dataUrl = "";
            svgMarkup = "";
        }
    }

    $effect(() => {
        generate();
    });

    async function copySvg() {
        if (!svgMarkup) return;
        await navigator.clipboard.writeText(svgMarkup);
        copied = true;
        setTimeout(() => (copied = false), 1600);
    }

    function downloadPng() {
        if (!dataUrl) return;
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "qr-code.png";
        link.click();
    }
</script>

<div class="w-full flex justify-center items-start h-full">
    <div class="clean-panel p-6 md:p-8 w-full max-w-5xl">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section class="space-y-6">
                <div class="space-y-3">
                    <label
                        for="qr-text"
                        class="label-section"
                    >
                        Text or URL
                    </label>
                    <textarea
                        id="qr-text"
                        bind:value={text}
                        spellcheck="false"
                        class="textarea-editor w-full"
                        style="min-height: 150px !important; height: 150px;"
                        placeholder="Paste a URL, payload, or short text..."
                    ></textarea>
                </div>

        <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Size: {size}px
                </span>
                <input
                    type="range"
                    min="128"
                    max="512"
                    step="16"
                    bind:value={size}
                    class="input text-sm w-full"
                />
            </label>

            <label class="space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Margin: {margin}
                </span>
                <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    bind:value={margin}
                    class="input text-sm w-full"
                />
            </label>

            <label class="space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Error correction
                </span>
                <select
                    bind:value={errorCorrection}
                    class="input py-1.5 px-3 text-sm w-auto cursor-pointer"
                >
                    <option value="L">Low</option>
                    <option value="M">Medium</option>
                    <option value="Q">Quartile</option>
                    <option value="H">High</option>
                </select>
            </label>

            <div class="grid grid-cols-2 gap-3">
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Foreground
                    </span>
                    <input
                        type="color"
                        bind:value={darkColor}
                        class="input text-sm w-full"
                    />
                </label>
                <label class="space-y-2">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Background
                    </span>
                    <input
                        type="color"
                        bind:value={lightColor}
                        class="input text-sm w-full"
                    />
                </label>
            </div>
        </div>

        {#if error}
            <div class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
            </div>
        {/if}
    </section>

    <aside class="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
        <div class="flex min-h-[300px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700">
            {#if dataUrl}
                <img src={dataUrl} alt="Generated QR code" class="max-h-full max-w-full" />
            {:else}
                <div class="text-center text-sm text-slate-400">
                    Enter content to generate a QR code.
                </div>
            {/if}
        </div>

        <div class="grid w-full grid-cols-2 gap-3">
            <button
                class="btn btn-secondary text-sm shadow-sm"
                onclick={copySvg}
                disabled={!svgMarkup}
            >
                {#if copied}
                    <Check size={16} />
                    Copied
                {:else}
                    <Copy size={16} />
                    Copy SVG
                {/if}
            </button>
            <button
                class="btn btn-primary text-sm shadow-sm hover:shadow-md"
                onclick={downloadPng}
                disabled={!dataUrl}
            >
                <Download size={16} />
                PNG
            </button>
        </div>
    </aside>
        </div>
    </div>
</div>
