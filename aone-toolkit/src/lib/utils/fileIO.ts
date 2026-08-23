/**
 * fileIO.ts - Common utilities for reading and writing files in the browser.
 */

export function downloadBlob(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadJson(data: any, filename: string = 'data.json') {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    downloadBlob(jsonStr, filename, 'application/json');
}

export function downloadYaml(yamlStr: string, filename: string = 'data.yaml') {
    downloadBlob(yamlStr, filename, 'text/yaml');
}

export function triggerFileInput(accept: string = '*/*'): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            resolve(file || null);
        };
        // Handle cancellation
        input.oncancel = () => {
            resolve(null);
        };
        input.click();
    });
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            resolve(evt.target?.result as string);
        };
        reader.onerror = (err) => {
            reject(err);
        };
        reader.readAsText(file);
    });
}
