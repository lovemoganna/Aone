<script lang="ts">
    import { onMount } from "svelte";
    import { Panel, Button, EmptyState } from "$lib/components/ui";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import {
        Code2,
        Image as ImageIcon,
        Copy,
        Download,
        Trash2,
        Sliders,
        Check,
        FileCode,
        Grid3X3,
        DownloadCloud,
        Upload,
        AlertCircle,
        CheckCircle2,
        ChevronRight,
        ChevronDown,
        Eye,
        GitCompare,
        List,
        RefreshCw,
        Palette
    } from "lucide-svelte";
    import { slide, fade } from "svelte/transition";


    // ─── State ───────────────────────────────────────────────────────────────
    let svgCode = $state("");
    let isDragging = $state(false);
    let fileInputEl = $state<HTMLInputElement | null>(null);
    let importToast = $state(""); // brief status message after file import
    let importToastTimeout: ReturnType<typeof setTimeout> | null = null;

    function showToast(msg: string) {
        importToast = msg;
        if (importToastTimeout) clearTimeout(importToastTimeout);
        importToastTimeout = setTimeout(() => { importToast = ""; }, 2200);
    }

    // Active tab: 'preview' | 'source' | 'structure' | 'compare'
    type Tab = "preview" | "source" | "structure" | "compare";
    let activeTab = $state<Tab>("preview");

    // Preview background
    let bgMode = $state<"grid" | "light" | "dark">("grid");
    let zoom = $state(160);

    // Optimization toggles
    let removeXml = $state(true);
    let removeComments = $state(true);
    let removeMetadata = $state(true);
    let removeEditorGarbage = $state(true);
    let useCurrentColor = $state(false);
    let removeSize = $state(false);
    let minify = $state(true);

    onMount(() => {
        const handoff = dataBridge.consume("/svg-studio");
        if (handoff && handoff.payload) {
            svgCode = handoff.payload;
            showToast(`已从 ${handoff.sourceTool} 载入 SVG 源码`);
        }
    });

    let extractedColors = $derived.by(() => {
        if (!svgCode.trim()) return [];
        const matches = svgCode.match(/#(?:[0-9a-fA-F]{3}){1,2}\b|rgb\([^)]+\)|hsl\([^)]+\)/gi) || [];
        const unique = Array.from(new Set(matches.map((c) => c.toLowerCase())));
        return unique.filter((c) => c !== "none" && c !== "transparent");
    });

    function replaceColor(oldColor: string, newColor: string) {
        if (!oldColor || !newColor || oldColor.toLowerCase() === newColor.toLowerCase()) return;
        const escaped = oldColor.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(escaped, "gi");
        svgCode = svgCode.replace(regex, newColor);
        showToast(`已将 ${oldColor} 替换为 ${newColor}`);
    }


    // Copy feedback
    let copyTarget = $state("");
    let copyTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleCopy(text: string, label: string) {
        if (!text) return;
        copyToClipboard(text, label);
        copyTarget = label;
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
            copyTarget = "";
        }, 1800);
    }

    // ─── File Import ─────────────────────────────────────────────────────────
    function triggerFileInput() {
        fileInputEl?.click();
    }

    function handleFileChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && (file.name.endsWith(".svg") || file.type === "image/svg+xml")) {
            const reader = new FileReader();
            reader.onload = () => {
                svgCode = reader.result as string;
                expandedNodes = new Set(["root"]); // auto-expand root on new file
                activeTab = "preview";
                showToast(`已导入 ${file.name}`);
            };
            reader.readAsText(file);
        } else if (file) {
            showToast("仅支持 .svg 文件");
        }
        // Reset so same file can be re-imported
        if (fileInputEl) fileInputEl.value = "";
    }

    // ─── Drag & Drop ─────────────────────────────────────────────────────────
    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        const file = e.dataTransfer?.files[0];
        if (file && (file.name.endsWith(".svg") || file.type === "image/svg+xml")) {
            const reader = new FileReader();
            reader.onload = () => {
                svgCode = reader.result as string;
                expandedNodes = new Set(["root"]);
                activeTab = "preview";
                showToast(`已导入 ${file.name}`);
            };
            reader.readAsText(file);
        } else if (file) {
            showToast("仅支持 .svg 文件");
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }
    function handleDragLeave() { isDragging = false; }

    // ─── Example SVG ─────────────────────────────────────────────────────────
    function loadExample() {
        svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <!-- Sample SVG icon: star -->
  <path fill="#f97316" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`;
        expandedNodes = new Set(["root"]);
        activeTab = "preview";
        showToast("已加载示例 SVG");
    }

    // ─── SVG Validation ──────────────────────────────────────────────────────
    interface ValidationIssue {
        type: "error" | "warn";
        message: string;
        detail: string;
        fix: string;
    }

    let validation = $derived.by((): { issues: ValidationIssue[]; valid: boolean } => {
        if (!svgCode.trim()) return { issues: [], valid: true };
        const issues: ValidationIssue[] = [];

        // 1. Parse XML
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, "image/svg+xml");
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
            issues.push({
                type: "error",
                message: "XML 解析失败",
                detail: parseError.textContent?.slice(0, 120) ?? "未知错误",
                fix: "检查是否有未闭合标签、非法字符或属性引号不匹配"
            });
            return { issues, valid: false };
        }

        const svgEl = doc.querySelector("svg");

        // 2. No root <svg>
        if (!svgEl) {
            issues.push({
                type: "error",
                message: "缺少 <svg> 根节点",
                detail: "文档必须以 <svg> 为根节点",
                fix: "确保内容以 <svg ...> 开头，以 </svg> 结尾"
            });
        } else {
            // 3. Missing viewBox
            if (!svgEl.getAttribute("viewBox")) {
                issues.push({
                    type: "warn",
                    message: "缺少 viewBox 属性",
                    detail: "没有 viewBox 时，SVG 无法响应式缩放",
                    fix: `添加 viewBox=\"0 0 ${svgEl.getAttribute("width") || "24"} ${svgEl.getAttribute("height") || "24"}\"`
                });
            }

            // 4. Missing xmlns
            if (!svgEl.getAttribute("xmlns")) {
                issues.push({
                    type: "warn",
                    message: "缺少 xmlns 声明",
                    detail: "在 HTML 内联时通常无问题，但独立 .svg 文件需要 xmlns",
                    fix: `在 <svg> 上添加 xmlns="http://www.w3.org/2000/svg"`
                });
            }

            // 5. Empty path d attributes
            const emptyPaths = Array.from(svgEl.querySelectorAll("path")).filter(
                (p) => !p.getAttribute("d")?.trim()
            );
            if (emptyPaths.length > 0) {
                issues.push({
                    type: "warn",
                    message: `${emptyPaths.length} 个 <path> 的 d 属性为空`,
                    detail: "空路径不会渲染，可能是编辑器残留",
                    fix: "删除 d 属性为空的 <path> 元素"
                });
            }

            // 6. Script tags (security)
            if (svgEl.querySelectorAll("script").length > 0) {
                issues.push({
                    type: "error",
                    message: "包含 <script> 标签",
                    detail: "SVG 中的 script 标签有 XSS 安全风险",
                    fix: "删除所有 <script> 元素"
                });
            }

            // 7. External references
            const hasExtRef = svgCode.includes("http://") || svgCode.includes("https://");
            if (hasExtRef) {
                issues.push({
                    type: "warn",
                    message: "包含外部资源引用",
                    detail: "SVG 中引用了外部 URL，可能导致加载失败或隐私问题",
                    fix: "将外部资源内联，或移除外部引用"
                });
            }

            // 8. Check referenced IDs (use, clip-path, mask, filter)
            const definedIds = new Set(
                Array.from(svgEl.querySelectorAll("[id]")).map((el) => el.id)
            );
            const refAttrs = ["clip-path", "mask", "filter", "fill", "stroke", "marker-start", "marker-end"];
            const missingRefs: string[] = [];
            svgEl.querySelectorAll("*").forEach((el) => {
                refAttrs.forEach((attr) => {
                    const val = el.getAttribute(attr);
                    const match = val?.match(/url\(#([^)]+)\)/);
                    if (match && !definedIds.has(match[1])) {
                        missingRefs.push(`#${match[1]}`);
                    }
                });
                const href = el.getAttribute("href") || el.getAttribute("xlink:href");
                if (href?.startsWith("#") && !definedIds.has(href.slice(1))) {
                    missingRefs.push(href);
                }
            });
            if (missingRefs.length > 0) {
                issues.push({
                    type: "error",
                    message: `引用了未定义的 ID: ${[...new Set(missingRefs)].join(", ")}`,
                    detail: "这些 ID 在 <defs> 或文档中不存在",
                    fix: "检查 clipPath、mask、filter、linearGradient 等是否有对应定义"
                });
            }
        }

        return { issues, valid: issues.filter((i) => i.type === "error").length === 0 };
    });

    // ─── Stats ───────────────────────────────────────────────────────────────
    let stats = $derived.by(() => {
        if (!svgCode) return { nodes: 0, paths: 0, viewBox: "—", originalSize: 0, width: "—", height: "—" };
        try {
            const originalSize = new Blob([svgCode]).size;
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgCode, "image/svg+xml");
            const svgEl = doc.querySelector("svg");
            if (!svgEl) return { nodes: 0, paths: 0, viewBox: "—", originalSize, width: "—", height: "—" };
            const nodes = svgEl.querySelectorAll("*").length + 1;
            const paths = svgEl.querySelectorAll("path").length;
            const viewBox = svgEl.getAttribute("viewBox") || "未设置";
            const width = svgEl.getAttribute("width") || "未设置";
            const height = svgEl.getAttribute("height") || "未设置";
            return { nodes, paths, viewBox, originalSize, width, height };
        } catch {
            return { nodes: 0, paths: 0, viewBox: "—", originalSize: 0, width: "—", height: "—" };
        }
    });

    // ─── DOM Tree ────────────────────────────────────────────────────────────
    interface TreeNode {
        tag: string;
        id: string;
        attrs: Record<string, string>;
        children: TreeNode[];
        depth: number;
    }

    function buildTree(el: Element, depth = 0): TreeNode {
        const attrs: Record<string, string> = {};
        Array.from(el.attributes).forEach((a) => { attrs[a.name] = a.value; });
        return {
            tag: el.tagName.toLowerCase(),
            id: el.id || "",
            attrs,
            children: Array.from(el.children).map((c) => buildTree(c, depth + 1)),
            depth
        };
    }

    let domTree = $derived.by((): TreeNode | null => {
        if (!svgCode) return null;
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgCode, "image/svg+xml");
            const svgEl = doc.querySelector("svg");
            if (!svgEl) return null;
            return buildTree(svgEl);
        } catch {
            return null;
        }
    });

    // Root auto-expanded; re-initialise on SVG change via the effect below
    let expandedNodes = $state<Set<string>>(new Set(["root"]));
    function toggleNode(path: string) {
        const next = new Set(expandedNodes);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        expandedNodes = next;
    }

    // ─── Optimization ────────────────────────────────────────────────────────
    let optimizedCode = $derived.by(() => {
        if (!svgCode) return "";
        let optimized = svgCode;

        if (removeXml) {
            optimized = optimized.replace(/<\?xml[\s\S]*?\?>/gi, "");
        }
        if (removeComments) {
            optimized = optimized.replace(/<!--[\s\S]*?-->/gi, "");
        }
        if (removeMetadata) {
            optimized = optimized.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
            optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(optimized, "image/svg+xml");
            const svgEl = doc.querySelector("svg");
            if (!svgEl) return optimized;

            if (removeEditorGarbage) {
                Array.from(svgEl.attributes).forEach((attr) => {
                    if (
                        attr.name.startsWith("xmlns:") &&
                        !["xmlns:xlink", "xmlns:svg", "xmlns"].includes(attr.name)
                    ) {
                        svgEl.removeAttribute(attr.name);
                    }
                    if (attr.name.startsWith("sodipodi:") || attr.name.startsWith("inkscape:")) {
                        svgEl.removeAttribute(attr.name);
                    }
                });
                const garbageTags = ["sodipodi:namedview", "metadata", "desc", "i:pgf"];
                garbageTags.forEach((tag) => {
                    svgEl.querySelectorAll(tag).forEach((el) => el.remove());
                });
                svgEl.querySelectorAll("*").forEach((el) => {
                    Array.from(el.attributes).forEach((attr) => {
                        if (attr.name.startsWith("sodipodi:") || attr.name.startsWith("inkscape:")) {
                            el.removeAttribute(attr.name);
                        }
                    });
                });
            }

            if (useCurrentColor) {
                svgEl.querySelectorAll("*").forEach((el) => {
                    const fill = el.getAttribute("fill");
                    const stroke = el.getAttribute("stroke");
                    if (fill && fill !== "none" && fill !== "transparent") el.setAttribute("fill", "currentColor");
                    if (stroke && stroke !== "none" && stroke !== "transparent") el.setAttribute("stroke", "currentColor");
                });
                const svgFill = svgEl.getAttribute("fill");
                const svgStroke = svgEl.getAttribute("stroke");
                if (svgFill && svgFill !== "none" && svgFill !== "transparent") svgEl.setAttribute("fill", "currentColor");
                if (svgStroke && svgStroke !== "none" && svgStroke !== "transparent") svgEl.setAttribute("stroke", "currentColor");
            }

            if (removeSize) {
                svgEl.removeAttribute("width");
                svgEl.removeAttribute("height");
            }

            let result = svgEl.outerHTML;

            if (minify) {
                result = result.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
            } else {
                result = result.replace(/></g, ">\n<");
            }

            return result;
        } catch {
            return optimized;
        }
    });

    let optimizedSize = $derived(new Blob([optimizedCode]).size);
    let savedPercent = $derived(
        stats.originalSize > 0 ? Math.round((1 - optimizedSize / stats.originalSize) * 100) : 0
    );

    // ─── Sanitizer ───────────────────────────────────────────────────────────
    function sanitizeSvg(svg: string): string {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        if (!svgEl) return "";
        ["script", "foreignObject", "iframe", "object", "embed"].forEach((tag) => {
            svgEl.querySelectorAll(tag).forEach((el) => el.remove());
        });
        svgEl.querySelectorAll("*").forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
                if (attr.name.startsWith("on") || attr.value.includes("javascript:")) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        return svgEl.outerHTML;
    }

    // ─── Component Generation ────────────────────────────────────────────────
    let componentType = $state<"svelte" | "react" | "vue">("react");

    function toReactComponent(body: string, viewBox: string): string {
        const reactBody = body
            .replace(/class=/g, "className=")
            .replace(/stroke-width=/g, "strokeWidth=")
            .replace(/stroke-linecap=/g, "strokeLinecap=")
            .replace(/stroke-linejoin=/g, "strokeLinejoin=")
            .replace(/fill-rule=/g, "fillRule=")
            .replace(/clip-rule=/g, "clipRule=");
        return [
            "import React from 'react';",
            "",
            "export const SvgIcon = ({ size = 24, color = 'currentColor', ...props }) => (",
            "  <svg",
            "    width={size}",
            "    height={size}",
            `    viewBox="${viewBox}"`,
            "    fill={color}",
            "    {...props}",
            "  >",
            "    " + reactBody.trim(),
            "  </svg>",
            ");",
            "",
            "export default SvgIcon;"
        ].join("\n");
    }

    function toSvelteComponent(body: string, viewBox: string): string {
        return [
            "<" + "script lang=\"ts\">",
            "  let { size = 24, color = 'currentColor', ...restProps } = $props();",
            "<" + "/script>",
            "",
            "<svg",
            "  width={size}",
            "  height={size}",
            `  viewBox="${viewBox}"`,
            "  fill={color}",
            "  {...restProps}",
            ">",
            "  " + body.trim(),
            "</svg>"
        ].join("\n");
    }

    function toVueComponent(body: string, viewBox: string): string {
        return [
            "<" + "template>",
            "  <svg :width=\"size\" :height=\"size\"",
            `    viewBox="${viewBox}"`,
            "    :fill=\"color\" v-bind=\"$attrs\">",
            "    " + body.trim(),
            "  </svg>",
            "<" + "/template>",
            "",
            "<" + "script setup lang=\"ts\">",
            "const props = withDefaults(defineProps<{",
            "  size?: number | string;",
            "  color?: string;",
            "}>(), { size: 24, color: 'currentColor' });",
            "<" + "/script>"
        ].join("\n");
    }

    let componentCode = $derived.by(() => {
        if (!optimizedCode) return "";
        const body = optimizedCode.replace(/<svg[^>]*>/i, "").replace(/<\/svg>/i, "");
        const viewBox = stats.viewBox === "—" ? "0 0 24 24" : stats.viewBox;
        if (componentType === "svelte") return toSvelteComponent(body, viewBox);
        if (componentType === "react") return toReactComponent(body, viewBox);
        return toVueComponent(body, viewBox);
    });

    // ─── Download ─────────────────────────────────────────────────────────────
    function downloadSvg() {
        if (!optimizedCode) return;
        const blob = new Blob([optimizedCode], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "optimized.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ─── Tree helpers ─────────────────────────────────────────────────────────────
    function collectAllPaths(node: TreeNode, path: string): Set<string> {
        const paths = new Set<string>();
        function walk(n: TreeNode, p: string) {
            if (n.children.length > 0) {
                paths.add(p);
                n.children.forEach((c, i) => walk(c, `${p}-${i}`));
            }
        }
        walk(node, path);
        return paths;
    }

    // ─── Format bytes ─────────────────────────────────────────────────────────
    function fmtBytes(b: number): string {
        if (b === 0) return "0 B";
        if (b < 1024) return `${b} B`;
        return `${(b / 1024).toFixed(1)} KB`;
    }

    // ─── Safe Base64 (handles Unicode SVG content) ────────────────────────────
    function safeBase64(str: string): string {
        try {
            // encodeURIComponent escapes non-ASCII, then unescape converts %XX back to chars
            return btoa(unescape(encodeURIComponent(str)));
        } catch {
            return "";
        }
    }
</script>

<svelte:head>
    <title>SVG Studio — 导入、编辑、优化和导出 SVG</title>
</svelte:head>

<input
    bind:this={fileInputEl}
    type="file"
    accept=".svg,image/svg+xml"
    class="hidden"
    onchange={handleFileChange}
/>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Command Toolbar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">SVG Studio</span>
            {#if svgCode}
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
                    {svgCode.length} 字符
                </span>
            {/if}
        </div>

        <div class="flex items-center gap-1.5">
            <HandoffDropdown
                sourceTool="SVG 工作室"
                dataType="text"
                getData={() => optimizedCode || svgCode}
            />

            {#if svgCode}
                <button
                    type="button"
                    class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                    onclick={() => { svgCode = ""; activeTab = "preview"; expandedNodes = new Set(["root"]); }}
                    title="清空内容"
                >
                    <Trash2 size={13} />
                </button>
            {/if}
        </div>
    </div>

    <div class="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-2 min-h-0 h-full w-full overflow-hidden">
        <!-- ── 左侧：输入区 (xl:col-span-5) ───────────────────────────────── -->
        <div class="xl:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <!-- 面板头 -->
            <div class="h-8 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 shrink-0 text-xs">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload size={13} class="text-orange-500" />
                    SVG 输入
                </span>
                <div class="flex items-center gap-1.5">
                    <button
                        onclick={triggerFileInput}
                        class="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
                    >
                        <Upload size={11} /> 导入文件
                    </button>
                    <button
                        onclick={loadExample}
                        class="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md transition-all"
                    >
                        加载示例
                    </button>
                </div>
            </div>

            <!-- 粘贴区 / 拖放区 -->
            <div
                class="relative flex-none h-[200px] border-b border-slate-200 dark:border-slate-800 transition-colors {isDragging ? 'bg-orange-500/5' : ''}"
                ondragover={handleDragOver}
                ondragenter={handleDragOver}
                ondragleave={handleDragLeave}
                ondrop={handleDrop}
                role="region"
                aria-label="SVG 粘贴和拖放区域"
            >
                <textarea
                    bind:value={svgCode}
                    class="w-full h-full p-3 bg-transparent resize-none font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 placeholder:text-slate-400"
                    placeholder="在此粘贴 SVG 源码...&#10;&#10;也可以将 .svg 文件拖拽到这里，或点击右上角「导入文件」。"
                    spellcheck="false"
                ></textarea>

                {#if isDragging}
                    <div class="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-dashed border-orange-500 m-1.5 rounded-lg z-10" transition:fade={{ duration: 100 }}>
                        <div class="flex flex-col items-center gap-2 text-orange-500">
                            <DownloadCloud size={28} />
                            <span class="text-xs font-semibold">松开即可导入</span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- 校验结果 -->
            {#if svgCode}
                <div class="border-b border-slate-200 dark:border-slate-800 shrink-0" transition:slide={{ duration: 150 }}>
                    {#if validation.issues.length === 0}
                        <div class="px-3 py-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                            <CheckCircle2 size={12} />
                            <span class="font-medium">SVG 结构正常，未发现问题</span>
                        </div>
                    {:else}
                        <div class="max-h-[160px] overflow-y-auto">
                            {#each validation.issues as issue}
                                <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0 {issue.type === 'error' ? 'bg-red-500/5' : 'bg-amber-500/5'}">
                                    <div class="flex items-start gap-2">
                                        <AlertCircle size={12} class="mt-0.5 shrink-0 {issue.type === 'error' ? 'text-red-500' : 'text-amber-500'}" />
                                        <div class="min-w-0">
                                            <span class="text-[11px] font-semibold {issue.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}">{issue.message}</span>
                                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{issue.detail}</p>
                                            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                <span class="font-medium">修复：</span>{issue.fix}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- SVG 信息条 -->
            {#if svgCode}
                <div class="px-3 py-2 bg-slate-50/60 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-slate-500" transition:slide={{ duration: 150 }}>
                    <span>原始大小: <strong class="text-slate-700 dark:text-slate-300">{fmtBytes(stats.originalSize)}</strong></span>
                    <span>节点数: <strong class="text-slate-700 dark:text-slate-300">{stats.nodes}</strong></span>
                    <span>路径数: <strong class="text-slate-700 dark:text-slate-300">{stats.paths}</strong></span>
                    <span>viewBox: <strong class="text-slate-700 dark:text-slate-300">{stats.viewBox}</strong></span>
                    <span>尺寸: <strong class="text-slate-700 dark:text-slate-300">{stats.width} × {stats.height}</strong></span>
                </div>
            {/if}

            <!-- 标签页导航 -->
            <div class="px-3 pt-2 border-b border-slate-200 dark:border-slate-800 shrink-0 flex gap-0.5 bg-slate-50/30 dark:bg-slate-900/10">
                {#each [
                    { id: 'preview', label: '实时预览', icon: Eye },
                    { id: 'source', label: '源码编辑', icon: Code2 },
                    { id: 'structure', label: '元素结构', icon: List },
                    { id: 'compare', label: '对比结果', icon: GitCompare }
                ] as tab}
                    {@const Icon = tab.icon}
                    <button
                        onclick={() => (activeTab = tab.id as Tab)}
                        class="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-t-md border border-transparent transition-all {activeTab === tab.id ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-b-white dark:border-b-[#0c0c0e] text-orange-500 -mb-px' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                    >
                        <Icon size={11} />
                        {tab.label}
                    </button>
                {/each}
            </div>

            <!-- 标签页内容 -->
            <div class="flex-1 overflow-hidden min-h-0">

                <!-- 实时预览 -->
                {#if activeTab === 'preview'}
                    <div class="h-full flex flex-col">
                        <!-- 预览控制条 -->
                        <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 bg-slate-50/40 dark:bg-slate-900/10">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] text-slate-400 font-medium">背景:</span>
                                {#each [{ k: 'grid', l: '网格' }, { k: 'light', l: '白' }, { k: 'dark', l: '黑' }] as b}
                                    <button
                                        onclick={() => (bgMode = b.k as any)}
                                        class="px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all {bgMode === b.k ? 'bg-slate-800 dark:bg-slate-600 border-slate-700 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                                    >{b.l}</button>
                                {/each}
                            </div>
                            <div class="flex items-center gap-2 ml-auto">
                                <span class="text-[10px] text-slate-400 font-medium">尺寸:</span>
                                <input type="range" bind:value={zoom} min="32" max="320" class="w-16 accent-orange-500 cursor-pointer" />
                                <span class="text-[10px] font-mono text-slate-500 w-10">{zoom}px</span>
                            </div>
                        </div>

                        <!-- 预览画布 -->
                        <div
                            class="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
                            class:checkerboard-bg={bgMode === 'grid'}
                            style:background-color={bgMode === 'light' ? '#ffffff' : bgMode === 'dark' ? '#09090b' : ''}
                        >
                            {#if svgCode}
                                {#if validation.issues.some(i => i.type === 'error')}
                                    <div class="flex flex-col items-center gap-3 text-center">
                                        <AlertCircle size={32} class="text-red-400" />
                                        <div>
                                            <p class="text-sm font-semibold text-red-500">SVG 包含错误，无法渲染</p>
                                            <p class="text-xs text-slate-400 mt-1">请查看上方校验结果，修复错误后预览将自动刷新</p>
                                        </div>
                                    </div>
                                {:else}
                                    <div
                                        class="border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain transition-all"
                                        style="width: {zoom}px; height: {zoom}px;"
                                    >
                                        {@html sanitizeSvg(svgCode)}
                                    </div>
                                {/if}
                            {:else}
                                <div class="flex flex-col items-center gap-3 text-slate-400 select-none">
                                    <ImageIcon size={36} class="opacity-30" />
                                    <div class="text-center">
                                        <p class="text-xs font-medium">还没有 SVG</p>
                                        <p class="text-[11px] text-slate-400 mt-1">在上方粘贴源码，或导入 .svg 文件</p>
                                        <button onclick={loadExample} class="mt-3 px-3 py-1.5 text-xs text-orange-500 border border-orange-500/30 rounded-lg hover:bg-orange-500/5 transition-all">加载示例 SVG</button>
                                    </div>
                                </div>
                            {/if}

                            <!-- 左下角属性标签 -->
                            {#if svgCode}
                                <div class="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-[9px] font-mono text-slate-500">
                                    <Grid3X3 size={9} />
                                    <span>{stats.viewBox}</span>
                                    <span>·</span>
                                    <span>DOM: {stats.nodes}</span>
                                </div>
                            {/if}
                        </div>
                    </div>

                <!-- 源码编辑 -->
                {:else if activeTab === 'source'}
                    <div class="h-full flex flex-col">
                        <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/40 dark:bg-slate-900/10">
                            <span class="text-[11px] text-slate-500">直接编辑 SVG 源码，预览将实时更新</span>
                            <button
                                onclick={() => {
                                    try {
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
                                        const s = doc.querySelector('svg');
                                        if (s) {
                                            const formatted = s.outerHTML.replace(/></g, '>\n<');
                                            svgCode = formatted;
                                        }
                                    } catch {}
                                }}
                                class="text-[11px] text-slate-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
                            >
                                <RefreshCw size={11} /> 格式化
                            </button>
                        </div>
                        <textarea
                            bind:value={svgCode}
                            class="flex-1 p-3 bg-transparent resize-none font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 scrollbar-thin"
                            spellcheck="false"
                            placeholder="SVG 源码将显示在这里，可直接编辑"
                        ></textarea>
                    </div>

                <!-- 元素结构 -->
                {:else if activeTab === 'structure'}
                    <div class="h-full flex flex-col">
                        <!-- 结构面板控制条 -->
                        {#if svgCode && domTree}
                            <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/30 dark:bg-slate-900/10">
                                <span class="text-[10px] text-slate-400">点击节点展开/折叠</span>
                                <div class="flex items-center gap-2">
                                    <button
                                        onclick={() => { if (domTree) expandedNodes = collectAllPaths(domTree, 'root'); }}
                                        class="text-[10px] text-slate-400 hover:text-orange-500 transition-colors"
                                    >全部展开</button>
                                    <span class="text-slate-300 dark:text-slate-700">|</span>
                                    <button
                                        onclick={() => { expandedNodes = new Set(['root']); }}
                                        class="text-[10px] text-slate-400 hover:text-orange-500 transition-colors"
                                    >折叠子节点</button>
                                </div>
                            </div>
                        {/if}
                        <div class="flex-1 overflow-y-auto p-3 scrollbar-thin">
                        {#if !svgCode}
                            <div class="h-full flex items-center justify-center text-slate-400 text-xs">
                                <p>导入 SVG 后查看元素结构</p>
                            </div>
                        {:else if !domTree}
                            <div class="flex items-center gap-2 text-xs text-red-400 p-2">
                                <AlertCircle size={14} />
                                SVG 解析失败，请先修复错误
                            </div>
                        {:else}
                            <div class="text-[11px] font-mono">
                                {#snippet renderTree(node: TreeNode, path: string)}
                                    {@const hasChildren = node.children.length > 0}
                                    {@const isExpanded = expandedNodes.has(path)}
                                    {@const attrKeys = Object.keys(node.attrs).slice(0, 4)}
                                    <div class="select-none">
                                        <div
                                            class="flex items-start gap-1 py-0.5 px-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer group"
                                            role="button"
                                            tabindex="0"
                                            onclick={() => hasChildren && toggleNode(path)}
                                            onkeydown={(e) => e.key === 'Enter' && hasChildren && toggleNode(path)}
                                        >
                                            <span class="shrink-0 mt-0.5 text-slate-400 w-3 text-center">
                                                {#if hasChildren}
                                                    {#if isExpanded}<ChevronDown size={10} />{:else}<ChevronRight size={10} />{/if}
                                                {:else}
                                                    <span class="w-3 inline-block"></span>
                                                {/if}
                                            </span>
                                            <span>
                                                <span class="text-orange-500">&lt;{node.tag}</span>
                                                {#each attrKeys as k}
                                                    <span class="text-slate-500"> {k}=</span><span class="text-emerald-600 dark:text-emerald-400">"{node.attrs[k].slice(0, 24)}{node.attrs[k].length > 24 ? '…' : ''}"</span>
                                                {/each}
                                                {#if Object.keys(node.attrs).length > 4}
                                                    <span class="text-slate-400"> +{Object.keys(node.attrs).length - 4} attrs</span>
                                                {/if}
                                                {#if !hasChildren}<span class="text-orange-500">/&gt;</span>{:else}<span class="text-orange-500">&gt;</span>{/if}
                                            </span>
                                        </div>
                                        {#if hasChildren && isExpanded}
                                            <div class="ml-4 border-l border-slate-200 dark:border-slate-800 pl-2">
                                                {#each node.children as child, i}
                                                    {@render renderTree(child, `${path}-${i}`)}
                                                {/each}
                                            </div>
                                            <div class="pl-4 text-[10px] text-orange-500/60 py-0.5 px-1">&lt;/{node.tag}&gt;</div>
                                        {/if}
                                    </div>
                                {/snippet}
                                {@render renderTree(domTree, 'root')}
                            </div>
                        {/if}
                        </div>
                    </div>

                <!-- 优化对比 -->
                {:else if activeTab === 'compare'}
                    <div class="h-full flex flex-col">
                        {#if !svgCode}
                            <div class="flex-1 flex items-center justify-center text-slate-400 text-xs">
                                <p>导入 SVG 后查看优化前后对比</p>
                            </div>
                        {:else}
                            <!-- 大小对比 -->
                            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/40 dark:bg-slate-900/10">
                                <div class="flex items-center gap-4">
                                    <div class="text-center">
                                        <div class="text-[10px] text-slate-400 mb-1">优化前</div>
                                        <div class="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">{fmtBytes(stats.originalSize)}</div>
                                    </div>
                                    <div class="flex-1 flex flex-col items-center">
                                        <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 relative">
                                            <div
                                                class="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all"
                                                style="width: {Math.max(0, savedPercent)}%"
                                            ></div>
                                        </div>
                                        <div class="text-[11px] font-bold mt-1 {savedPercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : savedPercent < 0 ? 'text-red-500' : 'text-slate-400'}">
                                            {savedPercent > 0 ? `减少 ${savedPercent}%` : savedPercent < 0 ? `增大 ${-savedPercent}%` : '无变化'}
                                        </div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-[10px] text-slate-400 mb-1">优化后</div>
                                        <div class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{fmtBytes(optimizedSize)}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 视觉对比 -->
                            <div class="flex-1 grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden min-h-0 relative">
                                <div class="flex flex-col items-center justify-center gap-2 p-4 checkerboard-bg relative">
                                    <div class="absolute top-2 left-2 text-[9px] font-bold text-slate-500 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded">原始</div>
                                    {#if sanitizeSvg(svgCode)}
                                        <div class="w-20 h-20 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain">
                                            {@html sanitizeSvg(svgCode)}
                                        </div>
                                    {/if}
                                </div>
                                <div class="flex flex-col items-center justify-center gap-2 p-4 checkerboard-bg relative">
                                    <div class="absolute top-2 left-2 text-[9px] font-bold text-emerald-600 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded">优化后</div>
                                    {#if optimizedCode && sanitizeSvg(optimizedCode)}
                                        <div class="w-20 h-20 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain">
                                            {@html sanitizeSvg(optimizedCode)}
                                        </div>
                                    {/if}
                                </div>
                                <!-- 底部说明 -->
                                <div class="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 text-center">
                                    {#if svgCode.trim() === optimizedCode.trim()}
                                        <span class="text-slate-400">当前设置未改变 SVG 内容 — 可在左侧「优化选项」调整规则</span>
                                    {:else}
                                        <span>对比两侧预览，确认视觉效果无差异后再复制或下载</span>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <!-- ── 中间：优化配置 (xl:col-span-3) ──────────────────────────────── -->
        <div class="xl:col-span-3 flex flex-col min-h-0 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders size={13} class="text-orange-500" />
                    优化选项
                </span>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">

                <!-- 优化结果摘要 -->
                {#if svgCode && stats.originalSize > 0}
                    <div class="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800/80 flex items-center gap-3" transition:slide>
                        <div class="relative w-12 h-12 shrink-0 flex items-center justify-center">
                            <svg class="w-full h-full -rotate-90" viewBox="0 0 32 32">
                                <circle cx="16" cy="16" r="13" stroke="currentColor" class="text-slate-200 dark:text-slate-800" stroke-width="3" fill="transparent" />
                                <circle cx="16" cy="16" r="13" stroke="currentColor" class="text-emerald-500" stroke-width="3" fill="transparent"
                                    stroke-dasharray={2 * Math.PI * 13}
                                    stroke-dashoffset={2 * Math.PI * 13 * (1 - Math.max(0, savedPercent) / 100)}
                                    style="transition: stroke-dashoffset 0.4s ease-out;"
                                />
                            </svg>
                            <span class="absolute text-[9px] font-bold font-mono text-emerald-600 dark:text-emerald-400">{savedPercent}%</span>
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">体积压缩</p>
                            <p class="text-[10px] text-slate-400 mt-0.5 font-mono">{fmtBytes(stats.originalSize)} → {fmtBytes(optimizedSize)}</p>
                        </div>
                    </div>
                {/if}

                <!-- 清理选项 -->
                <div class="space-y-3">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">清理规则</h4>
                    <div class="space-y-2.5">
                        {#each [
                            { bind: 'removeXml', label: '删除 XML 声明', desc: '移除顶部 <?xml ?> 行' },
                            { bind: 'removeComments', label: '删除注释', desc: '移除 <!-- --> 注释块' },
                            { bind: 'removeMetadata', label: '删除元数据', desc: '移除 <metadata> 和 DOCTYPE' },
                            { bind: 'removeEditorGarbage', label: '清理编辑器残留', desc: '删除 Inkscape/Illustrator 私有属性' }
                        ] as opt}
                            <label class="flex items-start gap-2 cursor-pointer text-xs group">
                                {#if opt.bind === 'removeXml'}
                                    <input type="checkbox" bind:checked={removeXml} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                                {:else if opt.bind === 'removeComments'}
                                    <input type="checkbox" bind:checked={removeComments} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                                {:else if opt.bind === 'removeMetadata'}
                                    <input type="checkbox" bind:checked={removeMetadata} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                                {:else}
                                    <input type="checkbox" bind:checked={removeEditorGarbage} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                                {/if}
                                <div>
                                    <span class="font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
                                    <p class="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                                </div>
                            </label>
                        {/each}
                    </div>
                </div>

                <div class="h-px bg-slate-100 dark:bg-slate-800"></div>

                <!-- 转换选项 -->
                <div class="space-y-3">
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">转换选项</h4>
                    <div class="space-y-2.5">
                        <label class="flex items-start gap-2 cursor-pointer text-xs group">
                            <input type="checkbox" bind:checked={useCurrentColor} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                            <div>
                                <span class="font-medium text-slate-700 dark:text-slate-300">颜色替换为 currentColor</span>
                                <p class="text-[10px] text-slate-400 mt-0.5">将 fill/stroke 硬编码色替换为继承色</p>
                            </div>
                        </label>
                        <label class="flex items-start gap-2 cursor-pointer text-xs group">
                            <input type="checkbox" bind:checked={removeSize} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                            <div>
                                <span class="font-medium text-slate-700 dark:text-slate-300">删除 width/height</span>
                                <p class="text-[10px] text-slate-400 mt-0.5">保留 viewBox，通过 CSS 控制尺寸</p>
                            </div>
                        </label>
                        <label class="flex items-start gap-2 cursor-pointer text-xs group">
                            <input type="checkbox" bind:checked={minify} class="mt-0.5 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 dark:border-slate-700 bg-transparent shrink-0" />
                            <div>
                                <span class="font-medium text-slate-700 dark:text-slate-300">压缩代码（Minify）</span>
                                <p class="text-[10px] text-slate-400 mt-0.5">删除换行和多余空格</p>
                            </div>
                        </label>
                    </div>
                </div>

                {#if extractedColors.length > 0}
                    <div class="h-px bg-slate-100 dark:bg-slate-800"></div>
                    <div class="space-y-3">
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Palette size={12} class="text-orange-500" />
                            提取调色盘 ({extractedColors.length})
                        </h4>
                        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {#each extractedColors as col}
                                <div class="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <input
                                            type="color"
                                            value={col.startsWith('#') && col.length === 7 ? col : '#000000'}
                                            onchange={(e) => replaceColor(col, (e.target as HTMLInputElement).value)}
                                            class="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                                            title="点击修改并在 SVG 源码中全局替换此颜色"
                                        />
                                        <span class="font-mono text-[11px] truncate text-slate-700 dark:text-slate-300">{col}</span>
                                    </div>
                                    <button
                                        class="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-orange-500 transition-colors shrink-0"
                                        onclick={() => replaceColor(col, 'currentColor')}
                                    >
                                        转为继承色
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

        </div>

        <!-- ── 右侧：导出与组件 (xl:col-span-4) ─────────────────────────────── -->
        <div class="xl:col-span-4 flex flex-col min-h-0 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Download size={13} class="text-orange-500" />
                    导出结果
                </span>

                <!-- 主要：复制优化后的SVG -->
                {#if optimizedCode}
                    <button
                        onclick={() => handleCopy(optimizedCode, 'svg')}
                        class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all shadow-sm"
                    >
                        {#if copyTarget === 'svg'}
                            <Check size={12} class="text-white" /> 已复制
                        {:else}
                            <Copy size={12} /> 复制 SVG
                        {/if}
                    </button>
                {/if}
            </div>

            <div class="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto scrollbar-thin">

                {#if !svgCode}
                    <div class="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                        <Download size={28} class="opacity-20" />
                        <p>导入 SVG 后可进行导出</p>
                    </div>
                {:else}
                    <!-- 优化后代码预览 -->
                    <div class="flex-1 flex flex-col min-h-0 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <div class="px-3 py-2 bg-slate-50/60 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">优化后的 SVG 代码</span>
                            <button
                                onclick={() => handleCopy(optimizedCode, 'optimized-preview')}
                                class="text-[10px] text-slate-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
                            >
                                {#if copyTarget === 'optimized-preview'}
                                    <Check size={10} class="text-emerald-500" /> 已复制
                                {:else}
                                    <Copy size={10} /> 复制
                                {/if}
                            </button>
                        </div>
                        <div class="flex-1 overflow-auto p-3 font-mono text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-[#08080a] whitespace-pre scrollbar-thin min-h-0">
                            {optimizedCode || "（尚无内容）"}
                        </div>
                    </div>

                    <!-- 组件代码生成 -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">生成组件代码</h4>
                            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                {#each ['react', 'svelte', 'vue'] as type}
                                    <button
                                        onclick={() => (componentType = type as any)}
                                        class="px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors {componentType === type ? 'bg-white dark:bg-slate-700 text-orange-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                                    >{type}</button>
                                {/each}
                            </div>
                        </div>
                        <div class="relative border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden group">
                            <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onclick={() => handleCopy(componentCode, 'component')}
                                    class="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm"
                                    title="复制组件代码"
                                >
                                    {#if copyTarget === 'component'}
                                        <Check size={12} class="text-emerald-500" />
                                    {:else}
                                        <Copy size={12} class="text-slate-500" />
                                    {/if}
                                </button>
                            </div>
                            <div class="p-3 font-mono text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-[#08080a] max-h-40 overflow-y-auto whitespace-pre scrollbar-thin">
                                {componentCode}
                            </div>
                        </div>
                    </div>

                    <!-- 下载按钮 -->
                    <div class="space-y-2">
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">下载文件</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                onclick={downloadSvg}
                                disabled={!optimizedCode}
                                class="py-2.5 px-3 border border-slate-200 dark:border-slate-700 hover:border-orange-500/40 rounded-lg flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-orange-500/5 transition-all text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium"
                            >
                                <FileCode size={14} class="text-orange-500" /> 下载 SVG
                            </button>
                            <button
                                onclick={() => handleCopy(`<img src="data:image/svg+xml;base64,${safeBase64(optimizedCode)}" alt="" />`, 'datauri')}
                                disabled={!optimizedCode}
                                class="py-2.5 px-3 border border-slate-200 dark:border-slate-700 hover:border-orange-500/40 rounded-lg flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-orange-500/5 transition-all text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium"
                            >
                                {#if copyTarget === 'datauri'}
                                    <Check size={14} class="text-emerald-500" /> 已复制
                                {:else}
                                    <Copy size={14} class="text-slate-400" /> 复制为 &lt;img&gt; 标签
                                {/if}
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .checkerboard-bg {
        background-color: #ffffff;
        background-image: radial-gradient(#e2e8f0 20%, transparent 20%),
                          radial-gradient(#e2e8f0 20%, transparent 20%);
        background-size: 16px 16px;
        background-position: 0 0, 8px 8px;
    }
    :global(.dark) .checkerboard-bg {
        background-color: #09090b;
        background-image: radial-gradient(#1e293b 20%, transparent 20%),
                          radial-gradient(#1e293b 20%, transparent 20%);
        background-size: 16px 16px;
        background-position: 0 0, 8px 8px;
    }

    .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.25); border-radius: 3px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.4); }
</style>
