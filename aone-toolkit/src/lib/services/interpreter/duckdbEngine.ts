import type { ConsoleLogEntry, ExecutionResult, TableResult, TableColumn, MountedFile } from './types';
import * as duckdb from '@duckdb/duckdb-wasm';

function formatTimestamp(): string {
    const d = new Date();
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

let dbInstance: duckdb.AsyncDuckDB | null = null;
let connInstance: duckdb.AsyncDuckDBConnection | null = null;
let isInitializing = false;
let initError: Error | null = null;

export async function initDuckDB(): Promise<{ db: duckdb.AsyncDuckDB; conn: duckdb.AsyncDuckDBConnection }> {
    if (dbInstance && connInstance) {
        return { db: dbInstance, conn: connInstance };
    }

    if (isInitializing) {
        // Wait until initialized
        while (isInitializing) {
            await new Promise(r => setTimeout(r, 100));
        }
        if (dbInstance && connInstance) {
            return { db: dbInstance, conn: connInstance };
        }
        if (initError) throw initError;
    }

    isInitializing = true;
    try {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        const worker_url = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
        );

        const worker = new Worker(worker_url);
        const logger = new duckdb.VoidLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(worker_url);

        const conn = await db.connect();
        dbInstance = db;
        connInstance = conn;
        isInitializing = false;

        return { db, conn };
    } catch (err: any) {
        isInitializing = false;
        initError = err;
        console.error('Failed to initialize DuckDB WASM:', err);
        throw new Error(`DuckDB WASM 初始化失败: ${err?.message || String(err)}`);
    }
}

export async function mountFileToDuckDB(file: File): Promise<string> {
    const { db, conn } = await initDuckDB();
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Register file buffer in DuckDB WASM file system
    await db.registerFileBuffer(file.name, uint8Array);

    // Generate safe table name from file name
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    try {
        if (ext === 'csv' || ext === 'tsv') {
            await conn.query(`CREATE OR REPLACE TABLE "${baseName}" AS SELECT * FROM read_csv_auto('${file.name}')`);
        } else if (ext === 'parquet') {
            await conn.query(`CREATE OR REPLACE TABLE "${baseName}" AS SELECT * FROM read_parquet('${file.name}')`);
        } else if (ext === 'json') {
            await conn.query(`CREATE OR REPLACE TABLE "${baseName}" AS SELECT * FROM read_json_auto('${file.name}')`);
        }
    } catch (e) {
        console.warn(`File mounted but auto-table creation skipped for ${file.name}:`, e);
    }

    return baseName;
}

export async function executeDuckDBSQL(sqlQuery: string): Promise<ExecutionResult> {
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
        addLog('info', 'Connecting to DuckDB WASM engine...');
        const { conn } = await initDuckDB();
        addLog('info', 'Executing SQL query...');

        const queryResult = await conn.query(sqlQuery);
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));

        // Convert Apache Arrow Table to TableResult
        const schema = queryResult.schema;
        const columns: TableColumn[] = schema.fields.map(f => ({
            name: f.name,
            type: f.type.toString()
        }));

        const rawRows = queryResult.toArray();
        const rows: any[][] = [];
        const rawObjects: Record<string, any>[] = [];

        for (let i = 0; i < rawRows.length; i++) {
            const rowObj = rawRows[i].toJSON ? rawRows[i].toJSON() : rawRows[i];
            const rowArr = columns.map(c => {
                const val = rowObj[c.name];
                // BigInt handling
                if (typeof val === 'bigint') return val.toString();
                return val;
            });
            rows.push(rowArr);
            rawObjects.push(rowObj);
        }

        const tableResult: TableResult = {
            columns,
            rows,
            rowCount: rows.length,
            rawObjects
        };

        addLog('system', `查询成功: 返回 ${rows.length} 行数据，耗时 ${durationMs} ms`);

        return {
            id: `exec_${Date.now()}`,
            language: 'sql',
            code: sqlQuery,
            status: 'success',
            metrics: {
                durationMs,
                rowCount: rows.length
            },
            logs,
            table: tableResult,
            timestamp: Date.now()
        };
    } catch (err: any) {
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));
        const errMsg = err?.message || String(err);
        addLog('error', `SQL 执行错误: ${errMsg}`);

        return {
            id: `exec_${Date.now()}`,
            language: 'sql',
            code: sqlQuery,
            status: 'error',
            error: errMsg,
            metrics: {
                durationMs
            },
            logs,
            timestamp: Date.now()
        };
    }
}
