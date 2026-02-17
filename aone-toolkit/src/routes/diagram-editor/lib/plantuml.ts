import plantumlEncoder from 'plantuml-encoder';

export async function renderPlantUML(code: string, serverUrl = 'https://www.plantuml.com/plantuml'): Promise<string> {
    // Standard plantuml-encoder handles UTF-8 strings correctly in recent versions
    // Passing Uint8Array (from TextEncoder) can cause issues in some environments (like Tauri)
    const encoded = plantumlEncoder.encode(code);

    // Clean trailing slash if present
    const baseUrl = serverUrl.replace(/\/$/, '');
    const url = `${baseUrl}/svg/${encoded}`;

    // Use a timeout or catch error to prevent unhandled promise rejections crashing the app
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`PlantUML Render Failed: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (e: any) {
        console.error("PlantUML Render Error:", e);
        throw new Error(`Connection Failed: ${e.message}`);
    }
}
