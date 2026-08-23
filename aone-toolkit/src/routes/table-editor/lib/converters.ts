// Table Data Converters
import type { TableData } from './types';

export type TableRecordValue = string | number | boolean | null;
export type TableRecord = Record<string, TableRecordValue>;

/**
 * Convert table data to Markdown format
 */
export function toMarkdown(data: TableData): string {
    if (data.length === 0) return '';

    const maxCols = Math.max(...data.map(row => row.length));
    const colWidths: number[] = [];

    // Calculate column widths
    for (let col = 0; col < maxCols; col++) {
        colWidths[col] = Math.max(3, ...data.map(row => (row[col] || '').length));
    }

    const lines: string[] = [];

    data.forEach((row, rowIndex) => {
        const cells = [];
        for (let col = 0; col < maxCols; col++) {
            const cell = row[col] || '';
            cells.push(cell.padEnd(colWidths[col]));
        }
        lines.push('| ' + cells.join(' | ') + ' |');

        // Add separator after header row
        if (rowIndex === 0) {
            const separators = colWidths.map(w => '-'.repeat(w));
            lines.push('| ' + separators.join(' | ') + ' |');
        }
    });

    return lines.join('\n');
}

/**
 * Convert table data to CSV format
 */
export function toCSV(data: TableData, delimiter: string = ','): string {
    return data.map(row => {
        return row.map(cell => {
            // Escape quotes and wrap in quotes if necessary
            if (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')) {
                return '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        }).join(delimiter);
    }).join('\n');
}

function normalizeHeader(value: string, fallback: string): string {
    const cleaned = value.trim() || fallback;
    return cleaned.replace(/\s+/g, '_');
}

function getUniqueHeaders(headers: string[]): string[] {
    const seen = new Set<string>();
    return headers.map((header, index) => {
        let name = normalizeHeader(header, `field_${index + 1}`);
        let suffix = 2;
        while (seen.has(name)) {
            name = `${name}_${suffix++}`;
        }
        seen.add(name);
        return name;
    });
}

function inferCellValue(value: string): TableRecordValue {
    const trimmed = value.trim();
    if (trimmed === '') return '';
    if (/^null$/i.test(trimmed)) return null;
    if (/^true$/i.test(trimmed)) return true;
    if (/^false$/i.test(trimmed)) return false;
    if (/^-?(?:\d+|\d*\.\d+)$/.test(trimmed)) return Number(trimmed);
    return value;
}

export function tableToRecords(data: TableData): TableRecord[] {
    if (data.length <= 1) return [];
    const headers = getUniqueHeaders(data[0]);
    return data.slice(1).map((row) =>
        Object.fromEntries(
            headers.map((header, index) => [header, inferCellValue(row[index] ?? '')]),
        ) as TableRecord,
    );
}

export function recordsToTableData(records: Record<string, unknown>[]): TableData {
    if (records.length === 0) return [];
    const headers = [
        ...new Set(
            records.flatMap((record) =>
                record && typeof record === 'object' && !Array.isArray(record)
                    ? Object.keys(record)
                    : [],
            ),
        ),
    ];
    if (headers.length === 0) return [];
    return [
        headers,
        ...records.map((record) =>
            headers.map((header) => {
                const value = record[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            }),
        ),
    ];
}

export function toObjectJSON(data: TableData): string {
    return JSON.stringify(tableToRecords(data), null, 2);
}

export function recordsToJSON(records: Record<string, unknown>[]): string {
    return JSON.stringify(records, null, 2);
}

/**
 * Convert table data to HTML format
 */
export function toHTML(data: TableData): string {
    if (data.length === 0) return '<table></table>';

    const lines: string[] = ['<table>'];

    data.forEach((row, rowIndex) => {
        lines.push('  <tr>');
        const tag = rowIndex === 0 ? 'th' : 'td';
        row.forEach(cell => {
            const escaped = escapeHTML(cell);
            lines.push(`    <${tag}>${escaped}</${tag}>`);
        });
        lines.push('  </tr>');
    });

    lines.push('</table>');
    return lines.join('\n');
}

/**
 * Convert table data to Org Mode format
 */
export function toOrgMode(data: TableData): string {
    if (data.length === 0) return '';

    const maxCols = Math.max(...data.map(row => row.length));
    const colWidths: number[] = [];

    // Calculate column widths
    for (let col = 0; col < maxCols; col++) {
        colWidths[col] = Math.max(1, ...data.map(row => (row[col] || '').length));
    }

    const lines: string[] = [];

    data.forEach((row, rowIndex) => {
        const cells = [];
        for (let col = 0; col < maxCols; col++) {
            const cell = row[col] || '';
            cells.push(cell.padEnd(colWidths[col]));
        }
        lines.push('| ' + cells.join(' | ') + ' |');

        // Add separator after header row
        if (rowIndex === 0) {
            const separators = colWidths.map(w => '-'.repeat(w + 2));
            lines.push('|' + separators.join('+') + '|');
        }
    });

    return lines.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
    const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, char => escapeMap[char] || char);
}

/**
 * Convert table data to JSON format
 */
export function toJSON(data: TableData): string {
    return JSON.stringify(data, null, 2);
}

/**
 * Convert table data to SQL INSERT statements
 */
export function toSQL(data: TableData, tableName: string = 'table_name'): string {
    if (data.length <= 1) return '';

    const headers = data[0];
    const rows = data.slice(1);

    const columns = headers.map(h => `"${h}"`).join(', ');
    const values = rows.map(row => {
        const rowValues = row.map(cell => {
            if (cell === null || cell === undefined) return 'NULL';
            const escaped = cell.replace(/'/g, "''");
            return `'${escaped}'`;
        }).join(', ');
        return `(${rowValues})`;
    }).join(',\n');

    return `INSERT INTO "${tableName}" (${columns}) VALUES\n${values};`;
}

/**
 * Get table statistics
 */
export function getTableStats(data: TableData): { rows: number; cols: number; cells: number } {
    const rows = data.length;
    const cols = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;
    const cells = data.reduce((sum, row) => sum + row.length, 0);
    return { rows, cols, cells };
}
