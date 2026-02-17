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
        const result = viz.renderSVGElement(code, { engine });
        return result.outerHTML;
    } catch (e) {
        // Reset instance in case of worker crash
        vizInstance = null;
        throw e;
    }
}
