import { describe, it, expect } from 'vitest';
import { executeJavaScript } from '../src/lib/services/interpreter/jsEngine';

describe('JavaScript Interpreter Execution Engine', () => {
    it('should execute basic console.log and print without collision', async () => {
        const code = `
            print("Hello from print");
            console.log("Hello from console");
        `;
        const result = await executeJavaScript(code);
        expect(result.status).toBe('success');
        expect(result.logs.length).toBe(2);
        expect(result.logs[0].content).toContain('Hello from print');
        expect(result.logs[1].content).toContain('Hello from console');
    });

    it('should allow user code to declare const print or let print without SyntaxError', async () => {
        const code = `
            const print = (msg) => console.log(\`custom: \${msg}\`);
            print("shadowed print");
        `;
        const result = await executeJavaScript(code);
        expect(result.status).toBe('success');
        expect(result.logs.length).toBe(1);
        expect(result.logs[0].content).toContain('custom: shadowed print');
    });

    it('should auto-return terminal expression and generate table', async () => {
        const code = `
            const data = [
                { id: 1, name: "Alice", score: 95 },
                { id: 2, name: "Bob", score: 88 }
            ];
            data;
        `;
        const result = await executeJavaScript(code);
        expect(result.status).toBe('success');
        expect(result.table).toBeTruthy();
        expect(result.table?.rowCount).toBe(2);
        expect(result.table?.columns.map(c => c.name)).toEqual(['id', 'name', 'score']);
    });

    it('should handle async promises and top-level await seamlessly', async () => {
        const code = `
            const delay = (ms) => new Promise(res => setTimeout(res, ms));
            await delay(20);
            print("Async finished");
            [{ status: "done", time: 20 }];
        `;
        const result = await executeJavaScript(code);
        expect(result.status).toBe('success');
        expect(result.table).toBeTruthy();
        expect(result.table?.rowCount).toBe(1);
    });
});
