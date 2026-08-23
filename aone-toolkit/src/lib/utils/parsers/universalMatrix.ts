/**
 * Universal Data Format Transformer Matrix
 * Converts seamlessly between JSON, YAML, CSV, TSV, Markdown Table, and SQL Insert statements.
 */
import { safeJsonParse, safeYamlParse } from './safeParser';

export type SupportedFormat = 'json' | 'yaml' | 'csv' | 'tsv' | 'markdown' | 'sql-insert';

export interface TransformResult {
    success: boolean;
    data: string;
    error?: string;
    detectedInputFormat?: SupportedFormat;
}

export function detectFormat(input: string): SupportedFormat {
    const trimmed = input.trim();
    if (!trimmed) return 'json';

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return 'json';
    }
    if (trimmed.includes('|') && /^\|?[\s\-:]+\|[\s\-:|]+\|?$/m.test(trimmed)) {
        return 'markdown';
    }
    if (trimmed.includes('\t') && trimmed.split('\n')[0].includes('\t')) {
        return 'tsv';
    }
    if (trimmed.includes(',') && trimmed.split('\n')[0].includes(',')) {
        return 'csv';
    }
    if (/^\s*insert\s+into\b/i.test(trimmed)) {
        return 'sql-insert';
    }
    if (/^[\w-]+:\s*.*$/m.test(trimmed)) {
        return 'yaml';
    }

    return 'json';
}

/**
 * Parses any incoming format into a standard Array<Record<string, any>> structure
 */
export function parseToRecords(input: string, format?: SupportedFormat): Array<Record<string, any>> {
    const detected = format || detectFormat(input);
    const trimmed = input.trim();

    if (detected === 'json') {
        const parsed = safeJsonParse(trimmed);
        if (!parsed.ok || !parsed.data) throw new Error(parsed.error || 'Invalid JSON');
        if (Array.isArray(parsed.data)) {
            return parsed.data.map(item => (typeof item === 'object' && item !== null ? item : { value: item }));
        }
        return [parsed.data];
    }

    if (detected === 'yaml') {
        const parsed = safeYamlParse(trimmed);
        if (!parsed.ok || !parsed.data) throw new Error(parsed.error || 'Invalid YAML');
        if (Array.isArray(parsed.data)) {
            return parsed.data.map(item => (typeof item === 'object' && item !== null ? item : { value: item }));
        }
        return [parsed.data];
    }

    if (detected === 'csv' || detected === 'tsv') {
        const delimiter = detected === 'tsv' ? '\t' : ',';
        const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0) return [];
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
        const rows: Array<Record<string, any>> = [];

        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
            const row: Record<string, any> = {};
            headers.forEach((h, idx) => {
                row[h] = cells[idx] ?? '';
            });
            rows.push(row);
        }
        return rows;
    }

    if (detected === 'markdown') {
        const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const tableLines = lines.filter(l => l.startsWith('|') || l.includes('|'));
        if (tableLines.length < 2) return [];

        const headers = tableLines[0]
            .split('|')
            .map(c => c.trim())
            .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));

        const dataRows = tableLines.slice(2); // skip separator row
        const rows: Array<Record<string, any>> = [];

        for (const line of dataRows) {
            const cells = line
                .split('|')
                .map(c => c.trim())
                .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));

            const row: Record<string, any> = {};
            headers.forEach((h, idx) => {
                row[h] = cells[idx] ?? '';
            });
            rows.push(row);
        }
        return rows;
    }

    return [{ raw: input }];
}

/**
 * Serializes standard records into target format
 */
export function serializeRecords(records: Array<Record<string, any>>, targetFormat: SupportedFormat, tableName = 'data_table'): string {
    if (!records || records.length === 0) return '';

    const keys = Array.from(new Set(records.flatMap(r => Object.keys(r))));

    if (targetFormat === 'json') {
        return JSON.stringify(records, null, 2);
    }

    if (targetFormat === 'yaml') {
        return records.map(r => {
            return Object.entries(r).map(([k, v]) => `  ${k}: ${typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : v}`).join('\n');
        }).map(item => `-\n${item}`).join('\n');
    }

    if (targetFormat === 'csv' || targetFormat === 'tsv') {
        const delimiter = targetFormat === 'tsv' ? '\t' : ',';
        const headerLine = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(delimiter);
        const rowLines = records.map(r => {
            return keys.map(k => {
                const val = r[k] === undefined || r[k] === null ? '' : String(r[k]);
                return `"${val.replace(/"/g, '""')}"`;
            }).join(delimiter);
        });
        return [headerLine, ...rowLines].join('\n');
    }

    if (targetFormat === 'markdown') {
        const headerLine = `| ${keys.join(' | ')} |`;
        const separatorLine = `| ${keys.map(() => '---').join(' | ')} |`;
        const rowLines = records.map(r => {
            return `| ${keys.map(k => (r[k] === undefined || r[k] === null ? '' : String(r[k])).replace(/\|/g, '\\|')).join(' | ')} |`;
        });
        return [headerLine, separatorLine, ...rowLines].join('\n');
    }

    if (targetFormat === 'sql-insert') {
        const cols = keys.map(k => `\`${k}\``).join(', ');
        const valLines = records.map(r => {
            const vals = keys.map(k => {
                const v = r[k];
                if (v === null || v === undefined) return 'NULL';
                if (typeof v === 'number') return v;
                if (typeof v === 'boolean') return v ? '1' : '0';
                return `'${String(v).replace(/'/g, "''")}'`;
            }).join(', ');
            return `  (${vals})`;
        });
        return `INSERT INTO \`${tableName}\` (${cols})\nVALUES\n${valLines.join(',\n')};`;
    }

    return JSON.stringify(records, null, 2);
}

/**
 * End-to-end format converter
 */
export function transformData(input: string, targetFormat: SupportedFormat, sourceFormat?: SupportedFormat, tableName = 'data_table'): TransformResult {
    try {
        const detected = sourceFormat || detectFormat(input);
        const records = parseToRecords(input, detected);
        const output = serializeRecords(records, targetFormat, tableName);
        return {
            success: true,
            data: output,
            detectedInputFormat: detected
        };
    } catch (e: any) {
        return {
            success: false,
            data: '',
            error: e.message || 'Transform failed'
        };
    }
}
