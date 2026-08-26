<script lang="ts">
    import QRCode from "qrcode";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        QrCode,
        Download,
        Copy,
        Sparkles,
        Trash2,
        Sliders,
        FileCode,
        Check,
        AlertCircle
    } from "lucide-svelte";
    import { CodeEditor } from "$lib/components/ui";

    let text = $state("https://aone.local/workflow");
    let size = $state(256);
    let margin = $state(2);
    let errorCorrection = $state<"L" | "M" | "Q" | "H">("M");
    let darkColor = $state("#0f172a");
    let lightColor = $state("#ffffff");
    let dataUrl = $state("");
    let svgMarkup = $state("");
    let error = $state("");

    const PRESETS = [
        {
            name: "官方网址 (URL)",
            val: "https://lovemoganna.github.io/Aone"
        },
        {
            name: "WiFi 快捷连接",
            val: "WIFI:S:Aone_Office_5G;T:WPA;P:developer_pass_2026;;"
        },
        {
            name: "vCard 电子名片",
            val: "BEGIN:VCARD\nVERSION:3.0\nN:Aone;Developer;;;\nFN:Aone Dev Team\nEMAIL:dev@aone.io\nURL:https://aone.dev\nEND:VCARD"
        },
        {
            name: "邮件唤起 (mailto)",
            val: "mailto:support@aone.dev?subject=Feedback&body=Hello%20Aone"
        }
    ];

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
            error = e instanceof Error ? e.message : "无法生成二维码";
            dataUrl = "";
            svgMarkup = "";
        }
    }

    $effect(() => {
        // Read dependencies
        const _t = text;
        const _s = size;
        const _m = margin;
        const _ec = errorCorrection;
        const _dc = darkColor;
        const _lc = lightColor;
        generate();
    });

    function applyPreset(p: typeof PRESETS[0]) {
        text = p.val;
        toastStore.info(`已载入预设：${p.name}`);
    }

    function copySvg() {
        if (!svgMarkup) return;
        copyToClipboard(svgMarkup, "SVG 代码");
        toastStore.success("已复制 SVG 二维码源码");
    }

    function downloadPng() {
        if (!dataUrl) return;
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `qrcode-${Date.now()}.png`;
        link.click();
        toastStore.success("已导出 PNG 图片");
    }

    function downloadSvg() {
        if (!svgMarkup) return;
        const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qrcode-${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        toastStore.success("已导出 SVG 矢量文件");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <QrCode size={13} class="text-sky-500" />
                二维码生成与矢量导出器
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设模版:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => applyPreset(p)}
                >
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium disabled:opacity-40"
                onclick={copySvg}
                disabled={!svgMarkup}
                title="复制 SVG 源码"
            >
                <FileCode size={12} />
                <span>复制 SVG</span>
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium disabled:opacity-40"
                onclick={downloadSvg}
                disabled={!svgMarkup}
                title="导出 SVG 矢量图"
            >
                <Download size={12} />
                <span>导出 SVG</span>
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold disabled:opacity-40"
                onclick={downloadPng}
                disabled={!dataUrl}
                title="导出 PNG 图片"
            >
                <Download size={12} />
                <span>导出 PNG</span>
            </button>
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                onclick={() => (text = "")}
                title="清空"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Text Input & QR Configuration (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-2.5 min-h-0">
            <!-- Text/Payload Input Area -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-[140px]">
                <div class="h-8 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    <span>二维码编码内容 (URL / 文本 / 载荷)</span>
                    <span class="text-[10px] text-slate-400 font-mono">{text.length} 字符</span>
                </div>
                <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                    <CodeEditor
                        bind:value={text}
                        placeholder="在此输入文本、网址或 WiFi/名片编码..."
                    />
                </div>
            </div>

            <!-- Parameters Grid Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3 shadow-2xs shrink-0">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                    二维码生成参数配置
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <!-- Error Correction Level -->
                    <div class="space-y-1">
                        <span class="font-medium text-slate-500 block text-[11px]">容错率级别</span>
                        <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                            {#each ["L", "M", "Q", "H"] as lvl}
                                <button
                                    type="button"
                                    class="flex-1 py-0.5 text-center rounded font-medium transition cursor-pointer {errorCorrection === lvl ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs' : 'text-slate-500'}"
                                    onclick={() => (errorCorrection = lvl as any)}
                                >
                                    {lvl}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <!-- Size -->
                    <div class="space-y-1">
                        <div class="flex justify-between items-center text-[11px]">
                            <span class="font-medium text-slate-500">渲染尺寸</span>
                            <span class="font-mono font-bold text-slate-700 dark:text-slate-300">{size}px</span>
                        </div>
                        <input
                            type="range"
                            min="128"
                            max="512"
                            step="32"
                            bind:value={size}
                            class="w-full accent-sky-600 cursor-pointer"
                        />
                    </div>

                    <!-- Foreground Color -->
                    <div class="space-y-1">
                        <span class="font-medium text-slate-500 block text-[11px]">前景色 (Dark)</span>
                        <div class="flex items-center gap-1.5 p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <input
                                type="color"
                                bind:value={darkColor}
                                class="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span class="font-mono text-[10px] text-slate-700 dark:text-slate-300 uppercase">{darkColor}</span>
                        </div>
                    </div>

                    <!-- Background Color -->
                    <div class="space-y-1">
                        <span class="font-medium text-slate-500 block text-[11px]">背景色 (Light)</span>
                        <div class="flex items-center gap-1.5 p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <input
                                type="color"
                                bind:value={lightColor}
                                class="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span class="font-mono text-[10px] text-slate-700 dark:text-slate-300 uppercase">{lightColor}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Live QR Preview Panel (5 cols) -->
        <div class="lg:col-span-5 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>实时二维码预览</span>
                <span class="text-[10px] text-slate-400 font-mono">{size} x {size} px</span>
            </div>

            <div class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/40 dark:bg-slate-950/40 min-h-0">
                {#if error}
                    <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle size={14} class="shrink-0" />
                        <span>{error}</span>
                    </div>
                {:else if dataUrl}
                    <div class="p-4 bg-white rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700 max-w-full flex items-center justify-center">
                        <img src={dataUrl} alt="QR Code Preview" class="max-h-56 max-w-full object-contain" />
                    </div>
                    <span class="text-[11px] text-slate-400 mt-3">手机相机或扫码器可直接识别</span>
                {:else}
                    <div class="text-center text-xs text-slate-400 italic">
                        在左侧输入内容以生成二维码
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

