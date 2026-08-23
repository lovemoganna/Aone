import { instance } from '@viz-js/viz';

let vizInstance: any = null;

async function getViz() {
    if (!vizInstance) {
        vizInstance = await instance();
    }
    return vizInstance;
}

export async function renderGraphviz(code: string, engine: string = 'dot'): Promise<string> {
    try {
        const viz = await getViz();
        const svg = viz.renderString(code, { engine, format: 'svg' });
        return svg;
    } catch (e) {
        // Reset instance in case of worker crash
        vizInstance = null;
        throw e;
    }
}
