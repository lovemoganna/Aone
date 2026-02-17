export async function exportToBlob(
    svgContent: string,
    format: "png" | "jpg",
    scale: number = 2,
    watermark?: string
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                // Use explicit dimensions or natural dimensions
                // Sometimes SVGs don't map perfectly to img.width/height without explicit attributes
                // But usually safe for PlantUML/Graphviz outputs.

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

                // Enable better smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);

                // Draw Watermark
                if (watermark) {
                    // Reset transform to draw in pixel coordinates
                    ctx.setTransform(1, 0, 0, 1, 0, 0);

                    const fontSize = 14 * scale;
                    ctx.font = `${fontSize}px sans-serif`;
                    ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
                    ctx.textAlign = "right";
                    ctx.textBaseline = "bottom";

                    const padding = 10 * scale;
                    ctx.fillText(watermark, canvas.width - padding, canvas.height - padding);
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
        img.onerror = (e) => {
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
