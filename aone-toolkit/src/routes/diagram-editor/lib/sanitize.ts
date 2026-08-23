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

    // 3. Remove javascript: and data: text/html in href / xlink:href
    clean = clean.replace(/\s(xlink:)?href\s*=\s*["']?\s*javascript:[^"'>\s]+/gi, '');
    clean = clean.replace(/\s(xlink:)?href\s*=\s*["']?\s*data:text\/html[^"'>\s]+/gi, '');

    return clean;
}
