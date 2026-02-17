// Type definitions for Table Converter

export type InputFormat = 'auto' | 'html' | 'markdown' | 'csv' | 'text';
export type OutputFormat = 'markdown' | 'csv' | 'excel' | 'html' | 'orgmode' | 'sql-mysql' | 'sql-pg' | 'sql-duckdb';

export type TableData = string[][];

export interface ConversionResult {
    content: string;
    format: OutputFormat;
    filename: string;
    mimeType: string;
}

export interface ParseResult {
    data: TableData;
    detectedFormat: InputFormat;
    detectedType?: string; // e.g. 'mysql' or similar if detected
}

export interface TableStats {
    rows: number;
    cols: number;
    cells: number;
}

export interface StatusInfo {
    text: string;
    type: 'success' | 'warning' | 'error';
}

export const FORMAT_CONFIG: Record<OutputFormat, { ext: string; mime: string; label: string }> = {
    markdown: { ext: '.md', mime: 'text/markdown', label: 'Markdown' },
    csv: { ext: '.csv', mime: 'text/csv', label: 'CSV' },
    excel: { ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
    html: { ext: '.html', mime: 'text/html', label: 'HTML' },
    orgmode: { ext: '.org', mime: 'text/plain', label: 'Org Mode' },
    'sql-mysql': { ext: '.sql', mime: 'application/x-sql', label: 'MySQL' },
    'sql-pg': { ext: '.sql', mime: 'application/x-sql', label: 'PostgreSQL' },
    'sql-duckdb': { ext: '.sql', mime: 'application/x-sql', label: 'DuckDB' },
};
