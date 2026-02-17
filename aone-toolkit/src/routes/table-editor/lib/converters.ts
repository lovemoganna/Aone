// Table Data Converters
import type { TableData } from './types';

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
