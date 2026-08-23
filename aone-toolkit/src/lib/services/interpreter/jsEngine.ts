import type { ConsoleLogEntry, ExecutionResult, TableResult } from './types';

function formatTimestamp(): string {
    const d = new Date();
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function safeStringify(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'string') return val;
    if (typeof val === 'function') return val.toString();
    if (val instanceof Error) return `${val.name}: ${val.message}\n${val.stack || ''}`;
    try {
        return JSON.stringify(val, null, 2);
    } catch {
        return String(val);
    }
}

function extractTableFromData(data: any): TableResult | null {
    if (!Array.isArray(data) || data.length === 0) {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const entries = Object.entries(data);
            if (entries.length > 0 && typeof entries[0][1] === 'object' && entries[0][1] !== null) {
                const firstObj = entries[0][1] as Record<string, any>;
                const columns = [{ name: '_key' }, ...Object.keys(firstObj).map(k => ({ name: k }))];
                const rows = entries.map(([key, val]) => [key, ...Object.keys(firstObj).map(k => (val as Record<string, any>)?.[k])]);
                return { columns, rows, rowCount: rows.length };
            }
        }
        return null;
    }

    // Check if it's an array of objects
    if (typeof data[0] === 'object' && data[0] !== null) {
        const columnNames = Array.from(
            new Set(data.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : [])))
        );
        if (columnNames.length === 0) return null;

        const columns = columnNames.map(name => ({
            name,
            type: typeof data[0][name]
        }));

        const rows = data.map(item =>
            columnNames.map(col => (item && typeof item === 'object' ? item[col] : undefined))
        );

        return {
            columns,
            rows,
            rowCount: rows.length,
            rawObjects: data
        };
    }

    // Array of primitives
    if (typeof data[0] !== 'object') {
        return {
            columns: [{ name: 'index' }, { name: 'value', type: typeof data[0] }],
            rows: data.map((v, i) => [i, v]),
            rowCount: data.length
        };
    }

    return null;
}

export async function executeJavaScript(code: string, timeoutMs: number = 8000): Promise<ExecutionResult> {
    const logs: ConsoleLogEntry[] = [];
    const timers = new Map<string, number>();
    const startTime = performance.now();
    let detectedTable: TableResult | null = null;

    const addLog = (level: ConsoleLogEntry['level'], args: any[]) => {
        const content = args.map(a => (typeof a === 'string' ? a : safeStringify(a))).join(' ');
        logs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            level,
            content,
            args,
            timestamp: Date.now(),
            formattedTime: formatTimestamp()
        });
    };

    const customConsole = {
        log: (...args: any[]) => addLog('log', args),
        info: (...args: any[]) => addLog('info', args),
        warn: (...args: any[]) => addLog('warn', args),
        error: (...args: any[]) => addLog('error', args),
        table: (data: any) => {
            addLog('table', [data]);
            const table = extractTableFromData(data);
            if (table) {
                detectedTable = table;
            }
        },
        time: (label: string = 'default') => {
            timers.set(label, performance.now());
        },
        timeEnd: (label: string = 'default') => {
            const start = timers.get(label);
            if (start !== undefined) {
                const duration = (performance.now() - start).toFixed(2);
                addLog('info', [`${label}: ${duration} ms`]);
                timers.delete(label);
            }
        },
        clear: () => {
            logs.length = 0;
        }
    };

    let returnValue: any = undefined;

    try {
        // Prepare executable code with auto-return for terminal expressions if not explicitly returning
        let executableCode = code.trim();
        const hasExplicitReturn = /^\s*return\b/m.test(executableCode);
        
        let transformedCode = executableCode;
        if (!hasExplicitReturn) {
            const lines = executableCode.split('\n');
            let lastNonEmptyIdx = lines.length - 1;
            while (lastNonEmptyIdx >= 0 && !lines[lastNonEmptyIdx].trim()) {
                lastNonEmptyIdx--;
            }
            if (lastNonEmptyIdx >= 0) {
                let lastLine = lines[lastNonEmptyIdx].trim();
                if (lastLine.endsWith(';')) {
                    lastLine = lastLine.slice(0, -1).trim();
                }
                const isDeclarationOrStatement = /^(const|let|var|function|class|import|export|if|else|for|while|do|switch|case|default|try|catch|finally|throw|break|continue|return|\/\/|\/\*|\*)/.test(lastLine);
                if (!isDeclarationOrStatement && lastLine.length > 0 && !lastLine.endsWith('{') && !lastLine.endsWith('}')) {
                    lines[lastNonEmptyIdx] = `return (${lastLine});`;
                    transformedCode = lines.join('\n');
                }
            }
        }

        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        
        const runPromise = new Promise(async (resolve, reject) => {
            try {
                // Pass sandboxed context without parameter shadowing collision
                const fn = new AsyncFunction('__ctx__', `
                    const console = __ctx__.console;
                    const print = __ctx__.print;
                    const table = __ctx__.table;
                    return (async () => {
                        ${transformedCode}
                    })();
                `);
                const res = await fn({
                    console: customConsole,
                    print: customConsole.log,
                    table: customConsole.table
                });
                resolve(res);
            } catch (err) {
                // Fallback attempt: execute raw code if transformation caused syntax issue
                try {
                    const fallbackFn = new AsyncFunction('__ctx__', `
                        const console = __ctx__.console;
                        const print = __ctx__.print;
                        const table = __ctx__.table;
                        return (async () => {
                            ${executableCode}
                        })();
                    `);
                    const res = await fallbackFn({
                        console: customConsole,
                        print: customConsole.log,
                        table: customConsole.table
                    });
                    resolve(res);
                } catch (fallbackErr) {
                    reject(fallbackErr);
                }
            }
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`执行超时（超过 ${timeoutMs / 1000} 秒），可能存在死循环或未完成的异步任务。`));
            }, timeoutMs);
        });

        returnValue = await Promise.race([runPromise, timeoutPromise]);

        // If returned value is an array or object, also check if table can be extracted
        if (returnValue !== undefined) {
            if (!detectedTable) {
                const tableFromReturn = extractTableFromData(returnValue);
                if (tableFromReturn) {
                    detectedTable = tableFromReturn;
                }
            }
            addLog('info', ['[Return Value]:', returnValue]);
        }

        const durationMs = Math.max(1, Math.round(performance.now() - startTime));

        return {
            id: `exec_${Date.now()}`,
            language: 'javascript',
            code,
            status: 'success',
            metrics: {
                durationMs,
                rowCount: detectedTable ? detectedTable.rowCount : undefined
            },
            logs,
            table: detectedTable,
            returnValue,
            timestamp: Date.now()
        };
    } catch (err: any) {
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));
        const errorMessage = err?.message || String(err);
        addLog('error', [errorMessage]);

        return {
            id: `exec_${Date.now()}`,
            language: 'javascript',
            code,
            status: 'error',
            error: errorMessage,
            metrics: {
                durationMs
            },
            logs,
            timestamp: Date.now()
        };
    }
}
