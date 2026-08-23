import type { ConsoleLogEntry, ExecutionResult, TableResult, TableColumn } from './types';

function formatTimestamp(): string {
    const d = new Date();
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

let pyodideInstance: any = null;
let isInitializing = false;
let initError: Error | null = null;
let scriptLoadPromise: Promise<void> | null = null;

function loadPyodideScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.reject(new Error('Browser environment required'));
    if ((window as any).loadPyodide) return Promise.resolve();
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('无法从 CDN 加载 Pyodide 运行环境，请检查网络连接。'));
        document.head.appendChild(script);
    });

    return scriptLoadPromise;
}

export async function initPyodide(onProgress?: (msg: string) => void): Promise<any> {
    if (pyodideInstance) return pyodideInstance;

    if (isInitializing) {
        while (isInitializing) {
            await new Promise(r => setTimeout(r, 100));
        }
        if (pyodideInstance) return pyodideInstance;
        if (initError) throw initError;
    }

    isInitializing = true;
    try {
        onProgress?.('正在下载 Pyodide Python 解释器核心 (WASM)...');
        await loadPyodideScript();

        onProgress?.('正在初始化 WebAssembly 运行时...');
        const pyodide = await (window as any).loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
        });

        // Set up custom stdout/stderr redirects in Python
        await pyodide.runPythonAsync(`
import sys
import io

class JSOutput(io.StringIO):
    def __init__(self, callback):
        super().__init__()
        self.callback = callback
    def write(self, s):
        if s:
            self.callback(s)
        return len(s)
`);

        pyodideInstance = pyodide;
        isInitializing = false;
        onProgress?.('Python 运行时已就绪！');
        return pyodide;
    } catch (err: any) {
        isInitializing = false;
        initError = err;
        console.error('Failed to init Pyodide:', err);
        throw new Error(`Pyodide 初始化失败: ${err?.message || String(err)}`);
    }
}

function extractTableFromPyResult(result: any): TableResult | null {
    if (!result) return null;
    try {
        // If it's already JS array
        let jsData = result;
        if (typeof result.toJs === 'function') {
            jsData = result.toJs({ dict_converter: Object.fromEntries });
        }

        if (Array.isArray(jsData) && jsData.length > 0 && typeof jsData[0] === 'object' && jsData[0] !== null) {
            const keys = Array.from(new Set(jsData.flatMap(item => (typeof item === 'object' ? Object.keys(item) : []))));
            const columns: TableColumn[] = keys.map(k => ({ name: k, type: typeof jsData[0][k] }));
            const rows = jsData.map(item => keys.map(k => item[k]));
            return {
                columns,
                rows,
                rowCount: rows.length,
                rawObjects: jsData
            };
        }
    } catch (e) {
        // Ignore extraction error
    }
    return null;
}

export async function executePython(code: string): Promise<ExecutionResult> {
    const logs: ConsoleLogEntry[] = [];
    const startTime = performance.now();

    const addLog = (level: ConsoleLogEntry['level'], content: string) => {
        logs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            level,
            content,
            timestamp: Date.now(),
            formattedTime: formatTimestamp()
        });
    };

    try {
        addLog('info', '正在启动 Python (Pyodide) 运行时...');
        const pyodide = await initPyodide(msg => addLog('info', msg));

        // Connect stdout & stderr callback
        (window as any).__aone_py_stdout = (text: string) => {
            const clean = text.replace(/\r\n$/, '').replace(/\n$/, '');
            if (clean) {
                addLog('log', clean);
            }
        };

        (window as any).__aone_py_stderr = (text: string) => {
            const clean = text.replace(/\r\n$/, '').replace(/\n$/, '');
            if (clean) {
                addLog('error', clean);
            }
        };

        await pyodide.runPythonAsync(`
import sys
from js import __aone_py_stdout, __aone_py_stderr

sys.stdout = JSOutput(__aone_py_stdout)
sys.stderr = JSOutput(__aone_py_stderr)
`);

        const result = await pyodide.runPythonAsync(code);
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));

        let jsResult = result;
        if (result && typeof result.toJs === 'function') {
            try {
                jsResult = result.toJs({ dict_converter: Object.fromEntries });
            } catch {
                jsResult = String(result);
            }
        }

        const table = extractTableFromPyResult(result);

        if (jsResult !== undefined && jsResult !== null) {
            addLog('info', `[Return Value]: ${typeof jsResult === 'object' ? JSON.stringify(jsResult, null, 2) : String(jsResult)}`);
        }

        addLog('system', `执行完成，耗时 ${durationMs} ms`);

        return {
            id: `exec_${Date.now()}`,
            language: 'python',
            code,
            status: 'success',
            metrics: {
                durationMs,
                rowCount: table ? table.rowCount : undefined
            },
            logs,
            table,
            returnValue: jsResult,
            timestamp: Date.now()
        };
    } catch (err: any) {
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));
        const errorMsg = err?.message || String(err);
        addLog('error', `Python 异常: ${errorMsg}`);

        return {
            id: `exec_${Date.now()}`,
            language: 'python',
            code,
            status: 'error',
            error: errorMsg,
            metrics: {
                durationMs
            },
            logs,
            timestamp: Date.now()
        };
    }
}
