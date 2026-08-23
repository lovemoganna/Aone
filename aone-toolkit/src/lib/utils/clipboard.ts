import { toastStore } from '$lib/stores/toastStore.svelte';

/**
 * Copy text to clipboard with toast feedback.
 * @param text - The text to copy
 * @param label - Optional label for the toast message (e.g. "CSS", "SQL")
 * @returns true if copy succeeded
 */
export async function copyToClipboard(text: string, label?: string): Promise<boolean> {
    if (!text) {
        toastStore.warning('Nothing to copy');
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        const msg = label ? `${label} copied to clipboard` : 'Copied to clipboard';
        toastStore.success(msg, { duration: 2000 });
        return true;
    } catch (err) {
        // Fallback for insecure contexts (HTTP)
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            const msg = label ? `${label} copied to clipboard` : 'Copied to clipboard';
            toastStore.success(msg, { duration: 2000 });
            return true;
        } catch {
            toastStore.error('Failed to copy to clipboard');
            return false;
        }
    }
}
