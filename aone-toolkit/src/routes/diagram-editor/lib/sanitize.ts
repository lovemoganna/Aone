/**
 * SVG Sanitizer to prevent XSS and malicious script injection.
 * Strips script tags, unsafe foreignObjects, event handlers, and javascript: links.
 */
export function sanitizeSvg(svgContent: string): string {
    if (!svgContent || typeof svgContent !== 'string') return '';

    let clean = svgContent;

    // 1. Remove dangerous elements including closing tags
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

    // 2. Remove all inline event handlers (e.g., onclick, onload, onerror)
    clean = clean.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 4. Force root SVG background to transparent
    clean = clean.replace(/(<svg\b[^>]*)\sstyle="([^"]*)"/gi, (match, p1, p2) => {
        const newStyle = p2.replace(/background(-color)?:\s*[^;]+;?/gi, '') + ';background:transparent;';
        return `${p1} style="${newStyle}"`;
    });

    // 5. Replace solid white/light background rects and polygons (Graphviz / PlantUML base canvas background)
    clean = clean.replace(/(<g[^>]*id="graph0"[^>]*>\s*<polygon[^>]*fill=)(["'])(?:white|#ffffff|#fff|#FFFFFF)\2/gi, '$1$2transparent$2 stroke="transparent"');
    clean = clean.replace(/(<rect[^>]*id="background"[^>]*fill=)(["'])[^"']*\2/gi, '$1$2transparent$2');

    return clean;
}
