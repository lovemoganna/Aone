<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import {
        Code2,
        Image as ImageIcon,
        Copy,
        Laptop,
        Download,
        Trash2,
    } from "lucide-svelte";

    let svgCode = $state("");
    let optimizedCode = $state("");
    let componentType = $state<"svelte" | "react">("svelte");

    function optimizeSVG() {
        if (!svgCode) return;
        // Basic optimization: strip whitespace, comments, metadata
        let optimized = svgCode
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/<\?xml[\s\S]*?\?>/g, "")
            .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
            .replace(/>\s+</g, "><")
            .trim();
        optimizedCode = optimized;
    }

    function toComponent() {
        if (!optimizedCode) optimizeSVG();
        const body = optimizedCode
            .replace(/<svg[^>]*>/, "")
            .replace(/<\/svg>/, "");
        const viewbox =
            optimizedCode.match(/viewBox="([^"]*)"/)?.[1] || "0 0 24 24";

        if (componentType === "svelte") {
            return [
                "<" + "script>",
                "  export let size = 24;",
                '  export let color = "currentColor";',
                "<" + "/script>",
                "",
                '<svg width={size} height={size} viewBox="' +
                    viewbox +
                    '" fill={color} {...$$restProps}>',
                "  " + body,
                "</svg>",
            ].join("\n");
        } else {
            return [
                "export const Icon = ({ size = 24, color = 'currentColor', ...props }) => (",
                '  <svg width={size} height={size} viewBox="' +
                    viewbox +
                    '" fill={color} {...props}>',
                "    " + body,
                "  </svg>",
                ");",
            ].join("\n");
        }
    }

    function copyResult(text: string) {
        navigator.clipboard.writeText(text);
    }
</script>

<svelte:head>
    <title>SVG Studio - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <!-- Input & Preview -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center"
                        >
                            <ImageIcon size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            SVG Input & Preview
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (svgCode = "")}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            {/snippet}

            <div class="flex-1 flex flex-col min-h-0">
                <textarea
                    bind:value={svgCode}
                    class="h-1/2 p-6 font-mono text-xs bg-transparent border-b border-slate-100 dark:border-slate-800 resize-none focus:outline-none dark:text-slate-400"
                    placeholder="Paste SVG code here..."
                    oninput={optimizeSVG}
                ></textarea>
                <div
                    class="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-black/20 p-8"
                >
                    {#if svgCode}
                        <div class="scale-150 transform">
                            {@html svgCode}
                        </div>
                    {:else}
                        <div class="text-slate-400 text-sm italic">
                            Live preview will appear here
                        </div>
                    {/if}
                </div>
            </div>
        </Panel>

        <!-- Tools & Export -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                        >
                            <Code2 size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Assets Studio
                        </h2>
                    </div>
                </div>
            {/snippet}

            <div class="flex-1 overflow-y-auto p-6 space-y-8">
                <section class="space-y-3">
                    <div
                        class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >
                        Optimized Source
                    </div>
                    <div class="relative group">
                        <textarea
                            readonly
                            value={optimizedCode}
                            class="w-full h-32 p-4 font-mono text-xs bg-slate-100 dark:bg-slate-900 border rounded-xl resize-none outline-none"
                        ></textarea>
                        <button
                            class="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onclick={() => copyResult(optimizedCode)}
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </section>

                <section class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div
                            class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Component Template
                        </div>
                        <div
                            class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                        >
                            <button
                                class="px-3 py-1 text-xs font-medium rounded-md transition-all {componentType ===
                                'svelte'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600'
                                    : 'text-slate-500'}"
                                onclick={() => (componentType = "svelte")}
                                >Svelte</button
                            >
                            <button
                                class="px-3 py-1 text-xs font-medium rounded-md transition-all {componentType ===
                                'react'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600'
                                    : 'text-slate-500'}"
                                onclick={() => (componentType = "react")}
                                >React</button
                            >
                        </div>
                    </div>
                    <div class="relative group">
                        <textarea
                            readonly
                            value={toComponent()}
                            class="w-full h-48 p-4 font-mono text-xs bg-slate-100 dark:bg-slate-900 border rounded-xl resize-none outline-none"
                        ></textarea>
                        <button
                            class="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onclick={() => copyResult(toComponent())}
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </section>
            </div>

            <div
                class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/10 flex justify-end"
            >
                <Button
                    variant="secondary"
                    onclick={() => copyResult(optimizedCode)}
                >
                    <Download size={14} class="mr-2" /> Download SVG
                </Button>
            </div>
        </Panel>
    </div>
</div>
