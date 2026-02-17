<script lang="ts">
    import { Button } from "$lib/components/ui";
    import {
        Image as ImageIcon,
        Download,
        Upload,
        ZoomIn,
        Info,
    } from "lucide-svelte";

    let file: File | null = $state(null);
    let previewUrl = $state("");
    let metadata = $state({
        width: 0,
        height: 0,
        size: "",
        type: "",
        aspectRatio: "",
    });

    async function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            processFile(target.files[0]);
        }
    }

    function processFile(f: File) {
        file = f;
        previewUrl = URL.createObjectURL(f);

        const img = new Image();
        img.onload = () => {
            metadata = {
                width: img.width,
                height: img.height,
                size: (f.size / 1024).toFixed(2) + " KB",
                type: f.type,
                aspectRatio: (img.width / img.height).toFixed(2) + ":1",
            };
        };
        img.src = previewUrl;
    }

    function copyBase64() {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            navigator.clipboard.writeText(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
</script>

<div class="space-y-6 pb-8">
    <div class="flex items-center justify-center w-full">
        <label
            class="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative overflow-hidden"
        >
            {#if previewUrl}
                <img
                    src={previewUrl}
                    alt="Preview"
                    class="absolute inset-0 w-full h-full object-contain opacity-20 p-4"
                />
            {/if}
            <div
                class="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 relative z-10"
            >
                <ImageIcon class="w-10 h-10 mb-3 text-slate-400" />
                {#if file}
                    <p
                        class="text-sm text-slate-600 dark:text-slate-300 font-bold truncate max-w-xs"
                    >
                        {file.name}
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                        Click to change image
                    </p>
                {:else}
                    <p class="mb-1 text-sm text-slate-500 dark:text-slate-400">
                        <span class="font-semibold">Drop image</span> or click
                    </p>
                    <p class="text-xs text-slate-400">
                        Analyze EXIF, dimensions, and more
                    </p>
                {/if}
            </div>
            <input
                type="file"
                class="hidden"
                accept="image/*"
                onchange={handleFileChange}
            />
        </label>
    </div>

    {#if file}
        <div
            class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
            <div
                class="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm"
            >
                <span class="text-[10px] font-bold text-slate-400 uppercase"
                    >Dimensions</span
                >
                <p class="text-sm font-semibold">
                    {metadata.width} × {metadata.height}
                </p>
            </div>
            <div
                class="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm"
            >
                <span class="text-[10px] font-bold text-slate-400 uppercase"
                    >File Size</span
                >
                <p class="text-sm font-semibold">{metadata.size}</p>
            </div>
            <div
                class="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm"
            >
                <span class="text-[10px] font-bold text-slate-400 uppercase"
                    >Format</span
                >
                <p class="text-sm font-semibold truncate capitalize">
                    {metadata.type.split("/")[1] || "Unknown"}
                </p>
            </div>
            <div
                class="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm"
            >
                <span class="text-[10px] font-bold text-slate-400 uppercase"
                    >Aspect Ratio</span
                >
                <p class="text-sm font-semibold">{metadata.aspectRatio}</p>
            </div>
        </div>

        <div class="flex gap-2">
            <Button variant="secondary" class="flex-1" onclick={copyBase64}>
                Copy as Base64 Data URI
            </Button>
            <Button
                variant="ghost"
                onclick={() => {
                    file = null;
                    previewUrl = "";
                }}
            >
                Reset
            </Button>
        </div>
    {/if}
</div>
