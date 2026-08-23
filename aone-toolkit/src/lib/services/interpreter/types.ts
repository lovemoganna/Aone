export type SupportedLanguage = 'sql' | 'python' | 'javascript';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'table' | 'system';

export interface ConsoleLogEntry {
    id: string;
    level: LogLevel;
    content: string;
    args?: any[];
    timestamp: number;
    formattedTime: string;
}

export interface TableColumn {
    name: string;
    type?: string;
}

export interface TableResult {
    columns: TableColumn[];
    rows: any[][];
    rowCount: number;
    rawObjects?: Record<string, any>[];
}

export interface ExecutionMetrics {
    durationMs: number;
    rowCount?: number;
    memoryUsedMb?: number;
    byteSize?: number;
}

export interface ExecutionResult {
    id: string;
    language: SupportedLanguage;
    code: string;
    status: 'success' | 'error' | 'running';
    metrics: ExecutionMetrics;
    logs: ConsoleLogEntry[];
    table?: TableResult | null;
    returnValue?: any;
    error?: string;
    timestamp: number;
}

export interface MountedFile {
    id: string;
    name: string;
    size: number;
    type: string; // 'csv' | 'json' | 'parquet' | 'tsv' | 'text'
    tableName: string;
    rowCount?: number;
    fileObject: File;
    uploadedAt: number;
}

export interface SnippetTemplate {
    id: string;
    title: string;
    language: SupportedLanguage;
    category: string;
    description: string;
    code: string;
    tags: string[];
}

export interface HistoryRecord {
    id: string;
    title: string;
    language: SupportedLanguage;
    code: string;
    status: 'success' | 'error' | 'running';
    durationMs: number;
    timestamp: number;
    favorite?: boolean;
    rowCount?: number;
}
