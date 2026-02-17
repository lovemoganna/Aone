import lzString from "lz-string";

/**
 * Compresses the diagram code into a URL-friendly hash string.
 * @param code The PlantUML or Graphviz source code.
 * @returns The full share URL (current input + hash).
 */
export function generateShareUrl(code: string): string {
    const compressed = lzString.compressToEncodedURIComponent(code);
    const url = new URL(window.location.href);
    url.hash = `code=${compressed}`;
    return url.toString();
}

/**
 * Decodes the shared diagram code from the URL hash.
 * @returns The decompressed code, or null if no valid hash found.
 */
export function decodeShareUrl(): string | null {
    if (typeof window === "undefined") return null;

    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash.startsWith("code=")) return null;

    const compressed = hash.replace("code=", "");
    try {
        return lzString.decompressFromEncodedURIComponent(compressed);
    } catch (e) {
        console.error("Failed to decompress share URL", e);
        return null;
    }
}
