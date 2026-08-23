// Table Data Parsers
import type { TableData, InputFormat, ParseResult } from './types';

/**
 * Auto-detect format and parse content
 */
/**
 * Auto-detect format and parse content
 */
export function autoDetectAndParse(content: string): ParseResult {
    const trimmed = content.trim();
    if (isJSONArrayData(trimmed)) {
        return { data: parseJSONArrayData(trimmed), detectedFormat: 'csv', detectedType: 'json-array' };
    }
    if (isHTMLTable(trimmed)) {
        return { data: parseHTMLTable(trimmed), detectedFormat: 'html' };
    }
    if (isSQLCreateTable(trimmed)) {
        return { data: parseSQLCreateTable(trimmed), detectedFormat: 'csv', detectedType: 'sql-import' };
    }
    if (isMarkdownTable(trimmed)) {
        return { data: parseMarkdownTable(trimmed), detectedFormat: 'markdown' };
    }
    if (isTSVData(trimmed)) {
        return { data: parseTSVData(trimmed), detectedFormat: 'csv', detectedType: 'tsv-excel' };
    }
    if (isCSVData(trimmed)) {
        return { data: parseCSVData(trimmed), detectedFormat: 'csv' };
    }
    return { data: parseTextTable(trimmed), detectedFormat: 'text' };
}

/**
 * Parse by specified format
 */
export function parseByFormat(content: string, format: InputFormat): TableData {
    const parsers: Record<Exclude<InputFormat, 'auto'>, () => TableData> = {
        html: () => parseHTMLTable(content),
        markdown: () => parseMarkdownTable(content),
        csv: () => (isTSVData(content) ? parseTSVData(content) : parseCSVData(content)),
        text: () => parseTextTable(content),
    };

    if (format === 'auto') {
        return autoDetectAndParse(content).data;
    }

    const parser = parsers[format];
    if (!parser) {
        throw new Error(`Unsupported format: ${format}`);
    }
    return parser();
}

// ========================================
// Format Detection
// ========================================

export function isJSONArrayData(content: string): boolean {
    if (!content.startsWith('[') || !content.endsWith(']')) return false;
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null;
    } catch {
        return false;
    }
}

export function parseJSONArrayData(content: string): TableData {
    const parsed = JSON.parse(content) as Array<Record<string, any>>;
    const keySet = new Set<string>();
    parsed.forEach(item => {
        if (item && typeof item === 'object') {
            Object.keys(item).forEach(k => keySet.add(k));
        }
    });

    const headers = Array.from(keySet);
    const rows: TableData = [headers];

    parsed.forEach(item => {
        if (item && typeof item === 'object') {
            const row = headers.map(h => {
                const val = item[h];
                if (val === undefined || val === null) return '';
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
            });
            rows.push(row);
        }
    });

    return rows;
}

export function isTSVData(content: string): boolean {
    const lines = content.trim().split('\n');
    if (lines.length < 1) return false;
    const tabCounts = lines.map(l => (l.match(/\t/g) || []).length);
    return tabCounts[0] > 0 && tabCounts.every(c => Math.abs(c - tabCounts[0]) <= 1);
}

export function parseTSVData(content: string): TableData {
    const lines = content.trim().split('\n');
    return lines.map(line => line.split('\t').map(c => c.trim()));
}

export function isHTMLTable(content: string): boolean {
    return /<table[^>]*>[\s\S]*<\/table>/i.test(content) ||
        /<tr[^>]*>[\s\S]*<\/tr>/i.test(content);
}

export function isMarkdownTable(content: string): boolean {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return false;

    // Check for separator line with dashes and pipes
    const hasSeparator = lines.some(line => /^\|?[\s\-:]+\|[\s\-:|]+\|?$/.test(line.trim()));
    const hasPipes = lines.some(line => line.includes('|'));

    return hasSeparator && hasPipes;
}

export function isCSVData(content: string): boolean {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return false;

    // Check for consistent comma or semicolon separators
    const firstLineCommas = (lines[0].match(/,/g) || []).length;
    const secondLineCommas = (lines[1].match(/,/g) || []).length;

    return firstLineCommas > 0 && firstLineCommas === secondLineCommas;
}


// ========================================
// Parsers
// ========================================

export function parseHTMLTable(content: string): TableData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const tables = doc.querySelectorAll('table');

    if (tables.length === 0) {
        // Try to find standalone tr elements
        const rows = doc.querySelectorAll('tr');
        if (rows.length === 0) {
            throw new Error('No valid HTML table was found.');
        }
        return extractRowsData(rows);
    }

    return extractTableData(tables[0]);
}

function extractTableData(table: Element): TableData {
    const rows: TableData = [];
    const tableRows = table.querySelectorAll('tr');

    tableRows.forEach(tr => {
        const cells: string[] = [];
        const tableCells = tr.querySelectorAll('td, th');

        tableCells.forEach(cell => {
            const colspan = parseInt(cell.getAttribute('colspan') || '1');
            const cellText = cell.textContent?.trim() || '';

            for (let i = 0; i < colspan; i++) {
                cells.push(i === 0 ? cellText : '');
            }
        });

        if (cells.length > 0) {
            rows.push(cells);
        }
    });

    return rows;
}

function extractRowsData(rows: NodeListOf<Element>): TableData {
    const tableData: TableData = [];
    rows.forEach(tr => {
        const cells: string[] = [];
        const tableCells = tr.querySelectorAll('td, th');

        tableCells.forEach(cell => {
            cells.push(cell.textContent?.trim() || '');
        });

        if (cells.length > 0) {
            tableData.push(cells);
        }
    });

    return tableData;
}

export function parseMarkdownTable(content: string): TableData {
    const lines = content.trim().split('\n').filter(line => line.trim());
    const tableData: TableData = [];

    for (const line of lines) {
        // Skip separator lines
        if (/^[\s\-:|\+]+$/.test(line.replace(/\|/g, ''))) {
            continue;
        }

        // Parse cells
        const cells = line
            .split('|')
            .map(cell => cell.trim())
            .filter((_, index, arr) => {
                // Remove empty first/last cells from |col1|col2| format
                if (index === 0 && arr[0] === '') return false;
                if (index === arr.length - 1 && arr[arr.length - 1] === '') return false;
                return true;
            });

        if (cells.length > 0) {
            tableData.push(cells);
        }
    }

    return tableData;
}

export function parseCSVData(content: string): TableData {
    const lines = content.trim().split('\n');
    const tableData: TableData = [];

    // Detect delimiter (comma or semicolon)
    const commaCount = (lines[0].match(/,/g) || []).length;
    const semicolonCount = (lines[0].match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    for (const line of lines) {
        const cells = parseCSVLine(line, delimiter);
        if (cells.length > 0) {
            tableData.push(cells);
        }
    }

    return tableData;
}

function parseCSVLine(line: string, delimiter: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            cells.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    cells.push(current.trim());
    return cells;
}

export function parseTextTable(content: string): TableData {
    const lines = content.trim().split('\n');
    const tableData: TableData = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Try tab-separated first
        let cells = line.split('\t').map(c => c.trim());

        // If only one cell, try multiple spaces
        if (cells.length === 1) {
            cells = line.split(/\s{2,}/).map(c => c.trim());
        }

        // If still one cell, use the whole line
        if (cells.length === 1 && cells[0]) {
            cells = [cells[0]];
        }

        if (cells.length > 0 && cells.some(c => c)) {
            tableData.push(cells.filter(c => c));
        }
    }

    return tableData;
}

// ========================================
// SQL Parser (Reverse Validator)
// ========================================

export function isSQLCreateTable(content: string): boolean {
    return /CREATE\s+TABLE/i.test(content) && /\(/i.test(content) && /\)/i.test(content);
}

export function parseSQLCreateTable(content: string): TableData {
    // 1. Clean up comments and standardizing spaces
    const cleanContent = content
        .replace(/--.*$/gm, '') // Remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Extract column definitions block
    const match = cleanContent.match(/CREATE\s+TABLE\s+(?:["`]?\w+["`]?\.?)?(?:["`]?\w+["`]?)\s*\((.*)\)/i);
    if (!match) {
        throw new Error("Invalid CREATE TABLE syntax");
    }

    const columnBlock = match[1];

    // 3. Split by comma, respecting parentheses (for DECIMAL(10,2))
    const columns: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (const char of columnBlock) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        if (char === ',' && parenDepth === 0) {
            columns.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) columns.push(current.trim());

    // 4. Parse each column
    const tableData: TableData = [
        ["Field", "Type", "Length", "PK", "NotNull", "Comment"]
    ];

    const pkColumns = new Set<string>();

    for (const colDef of columns) {
        if (/PRIMARY\s+KEY/i.test(colDef)) {
            // "PRIMARY KEY (id, code)"
            const pkMatch = colDef.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (pkMatch) {
                pkMatch[1].split(',').forEach(c => pkColumns.add(c.trim().replace(/["`]/g, '')));
            }
            continue; // Skip constraint line, it's not a column
        }

        if (/KEY|INDEX|CONSTRAINT|FOREIGN/i.test(colDef.split(' ')[0])) {
            continue; // Skip other constraints
        }

        const parts = colDef.split(/\s+/);
        const name = parts[0].replace(/["`]/g, ''); // Remove quotes
        let typeRaw = parts[1] || 'VARCHAR';
        let length = '';

        // Extract length/enum from type "VARCHAR(255)"
        const typeMatch = typeRaw.match(/(\w+)\((.+)\)/);
        if (typeMatch) {
            typeRaw = typeMatch[1];
            length = typeMatch[2];
        }

        const isNotNull = /NOT\s+NULL/i.test(colDef) ? 'Y' : '';
        const isPK = /PRIMARY\s+KEY/i.test(colDef) ? 'Y' : ''; // Inline PK

        let comment = '';
        const commentMatch = colDef.match(/COMMENT\s+'([^']+)'/i);
        if (commentMatch) {
            comment = commentMatch[1];
        }

        // Add to Set if inline PK found
        if (isPK === 'Y') pkColumns.add(name);

        tableData.push([
            name,
            typeRaw.toUpperCase(),
            length,
            isPK, // This will be updated later with set check
            isNotNull,
            comment
        ]);
    }

    // 5. Re-verify PKs from constraint set
    for (let i = 1; i < tableData.length; i++) {
        const name = tableData[i][0];
        if (pkColumns.has(name)) {
            tableData[i][3] = 'Y';
        }
    }

    return tableData;
}
