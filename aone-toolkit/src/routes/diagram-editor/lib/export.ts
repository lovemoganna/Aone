import plantumlEncoder from 'plantuml-encoder';

export interface ExportOptions {
    format: "png" | "jpg" | "svg";
    scale?: number;
    watermark?: string;
    watermarkType?: 'corner' | 'tiled';
    includeA11y?: boolean;
    title?: string;
    description?: string;
}

/**
 * Enriches SVG with semantic accessibility tags (WCAG AA).
 */
export function injectAccessibilityAttributes(
    svgContent: string,
    title: string = "Architecture Diagram",
    description: string = "System architecture topology and flow visual representation"
): string {
    if (!svgContent) return '';

    let clean = svgContent;
    // Ensure svg tag has role and aria attributes
    if (!clean.includes('role="img"')) {
        clean = clean.replace(/<svg\b/i, '<svg role="img" aria-roledescription="architecture diagram" ');
    }

    const a11yTags = `\n  <title id="diagram-title">${title}</title>\n  <desc id="diagram-desc">${description}</desc>\n`;
    if (!clean.includes('<title>')) {
        clean = clean.replace(/<svg[^>]*>/i, `$&\n${a11yTags}`);
    }

    return clean;
}

export async function exportToBlob(
    svgContent: string,
    format: "png" | "jpg",
    scale: number = 2,
    watermark?: string,
    watermarkType: 'corner' | 'tiled' = 'corner'
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const enrichedSvg = injectAccessibilityAttributes(svgContent);
        const svgBlob = new Blob([enrichedSvg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const width = img.width || 800;
                const height = img.height || 600;

                canvas.width = width * scale;
                canvas.height = height * scale;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Fill white background for JPG or non-transparent PNG
                if (format === "jpg") {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);

                // Draw Watermark
                if (watermark) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);

                    if (watermarkType === 'tiled') {
                        // Tiled diagonal watermark for confidential documents
                        ctx.font = `${16 * scale}px sans-serif`;
                        ctx.fillStyle = "rgba(160, 160, 160, 0.18)";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        const stepX = 220 * scale;
                        const stepY = 140 * scale;

                        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                            for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                                ctx.save();
                                ctx.translate(x, y);
                                ctx.rotate((-28 * Math.PI) / 180);
                                ctx.fillText(watermark, 0, 0);
                                ctx.restore();
                            }
                        }
                    } else {
                        // Corner single watermark
                        const fontSize = 14 * scale;
                        ctx.font = `${fontSize}px sans-serif`;
                        ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
                        ctx.textAlign = "right";
                        ctx.textBaseline = "bottom";

                        const padding = 10 * scale;
                        ctx.fillText(watermark, canvas.width - padding, canvas.height - padding);
                    }
                }

                const mime = format === "png" ? "image/png" : "image/jpeg";
                const quality = format === "jpg" ? 0.95 : undefined;

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Canvas toBlob failed"));
                        }
                        URL.revokeObjectURL(url);
                    },
                    mime,
                    quality
                );
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG image"));
        };
        img.src = url;
    });
}

export function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Creates a standalone offline HTML viewer package with Pan/Zoom interaction.
 */
export function exportStandaloneHtml(svgContent: string, title: string = "Architecture Diagram"): Blob {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
        header { padding: 12px 20px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 16px; font-weight: 600; color: #38bdf8; }
        .hint { font-size: 12px; color: #94a3b8; }
        #canvas-container { flex: 1; position: relative; overflow: hidden; cursor: grab; display: flex; justify-content: center; align-items: center; }
        #canvas-container:active { cursor: grabbing; }
        #viewport { transform-origin: center center; transition: transform 0.05s ease-out; }
        .controls { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 8px; background: rgba(30,41,59,0.85); backdrop-filter: blur(8px); padding: 6px; border-radius: 8px; border: 1px solid #334155; }
        button { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }
        button:hover { background: #475569; }
    </style>
</head>
<body>
    <header>
        <h1>${title}</h1>
        <div class="hint">Scroll to Zoom • Drag to Pan • Standalone Offline Viewer</div>
    </header>
    <div id="canvas-container">
        <div id="viewport">
            ${svgContent}
        </div>
        <div class="controls">
            <button onclick="zoom(1.2)">Zoom In (+)</button>
            <button onclick="zoom(0.8)">Zoom Out (-)</button>
            <button onclick="reset()">Reset</button>
        </div>
    </div>
    <script>
        let scale = 1, panX = 0, panY = 0, isDragging = false, startX = 0, startY = 0;
        const viewport = document.getElementById('viewport');
        const container = document.getElementById('canvas-container');

        function update() {
            viewport.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${scale})\`;
        }
        function zoom(factor) {
            scale = Math.max(0.2, Math.min(6, scale * factor));
            update();
        }
        function reset() {
            scale = 1; panX = 0; panY = 0; update();
        }

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoom(delta);
        });

        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
        });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            update();
        });
        window.addEventListener('mouseup', () => isDragging = false);
    </script>
</body>
</html>`;
    return new Blob([html], { type: 'text/html;charset=utf-8' });
}

/**
 * Generates ready-to-use Markdown embedding snippet.
 */
export function generateMarkdownSnippet(code: string, mode: string, serverUrl = 'https://www.plantuml.com/plantuml'): string {
    if (mode === 'plantuml') {
        const encoded = plantumlEncoder.encode(code);
        const cleanBase = serverUrl.replace(/\/$/, '');
        const imgUrl = `${cleanBase}/svg/${encoded}`;
        return `### Architecture Diagram\n\n![Architecture Diagram](${imgUrl})\n\n<details>\n<summary>PlantUML Source Code</summary>\n\n\`\`\`plantuml\n${code.trim()}\n\`\`\`\n</details>`;
    } else {
        return `### Architecture Topology\n\n\`\`\`dot\n${code.trim()}\n\`\`\``;
    }
}
