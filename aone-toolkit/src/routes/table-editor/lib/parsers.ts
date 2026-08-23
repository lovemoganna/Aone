// Table Data Parsers - Robust & Resilient Engine
import type { TableData, InputFormat, ParseResult } from './types';

/**
 * Auto-detect format and parse content
 */
export function autoDetectAndParse(content: string): ParseResult {
    const trimmed = content.trim();
    if (!trimmed) {
        return { data: [], detectedFormat: 'text' };
    }

    if (isJSONArrayData(trimmed)) {
        return { data: parseJSONArrayData(trimmed), detectedFormat: 'csv', detectedType: 'json-array' };
    }
    if (isHTMLTable(trimmed)) {
        return { data: parseHTMLTable(trimmed), detectedFormat: 'html' };
    }
    if (isSQLCreateTable(trimmed)) {
        return { data: parseSQLCreateTable(trimmed), detectedFormat: 'csv', detectedType: 'sql-import' };
    }
    if (isBoxOrAsciiTable(trimmed)) {
        return { data: parseBoxOrAsciiTable(trimmed), detectedFormat: 'markdown', detectedType: 'ascii-table' };
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
        markdown: () => (isBoxOrAsciiTable(content) ? parseBoxOrAsciiTable(content) : parseMarkdownTable(content)),
        csv: () => (isTSVData(content) ? parseTSVData(content) : parseCSVData(content)),
        text: () => parseTextTable(content),
    };

    if (format === 'auto') {
        return autoDetectAndParse(content).data;
    }

    const parser = parsers[format];
    if (!parser) {
        throw new Error(`不支持的格式: ${format}`);
    }
    return parser();
}

// ========================================
// Format Detection Functions
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

export function isHTMLTable(content: string): boolean {
    return /<table[^>]*>[\s\S]*<\/table>/i.test(content) ||
        /<tr[^>]*>[\s\S]*<\/tr>/i.test(content);
}

export function isSQLCreateTable(content: string): boolean {
    return /CREATE\s+TABLE/i.test(content) && /\(/i.test(content) && /\)/i.test(content);
}

export function isBoxOrAsciiTable(content: string): boolean {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return false;

    // Checks for unicode box drawings or +---+---+ borders
    const hasUnicodeBox = lines.some(l => /[┌┬┐├┼┤└┴┘│─]/.test(l));
    const hasAsciiBox = lines.some(l => /^\+[\-+:=]+\+$/.test(l) || /^\+[\-+=|]+\+$/.test(l));
    return hasUnicodeBox || hasAsciiBox;
}

export function isMarkdownTable(content: string): boolean {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return false;

    // Must have at least one separator line: |---|:---|---:| or :--- | ---:
    const hasSeparator = lines.some(line => {
        const stripped = line.replace(/^\|/, '').replace(/\|$/, '').trim();
        if (!stripped) return false;
        const parts = stripped.split('|').map(p => p.trim());
        return parts.length >= 1 && parts.every(p => /^:?-+:?$/.test(p));
    });

    const hasPipes = lines.filter(l => l.includes('|')).length >= 2;
    return hasSeparator && hasPipes;
}

export function isTSVData(content: string): boolean {
    const lines = content.split(/\r?\n/).filter(l => l.length > 0);
    if (lines.length === 0) return false;
    const tabCounts = lines.map(l => (l.match(/\t/g) || []).length);
    const hasTabs = tabCounts.some(c => c > 0);
    if (!hasTabs) return false;

    const nonZeroCounts = tabCounts.filter(c => c > 0);
    return nonZeroCounts.length >= Math.ceil(lines.length * 0.5);
}

export function isCSVData(content: string): boolean {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return false;

    const commaCounts = lines.slice(0, 5).map(l => (l.match(/,/g) || []).length);
    const semicolonCounts = lines.slice(0, 5).map(l => (l.match(/;/g) || []).length);

    const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length;
    const avgSemicolons = semicolonCounts.reduce((a, b) => a + b, 0) / semicolonCounts.length;

    return avgCommas >= 1 || avgSemicolons >= 1;
}

// ========================================
// High-Precision Parsers
// ========================================

/**
 * Robust RFC 4180 CSV / DSV parser supporting quotes, multiline fields, and empty cells
 */
export function parseCSVData(content: string): TableData {
    if (!content.trim()) return [];

    const delimiter = detectDelimiter(content);
    return parseDelimitedText(content, delimiter);
}

/**
 * TSV Parser (Tab-separated values) with full quote support
 */
export function parseTSVData(content: string): TableData {
    if (!content.trim()) return [];
    return parseDelimitedText(content, '\t');
}

/**
 * Delimited Text Parser with state machine for robust multiline and quote escaping
 */
export function parseDelimitedText(content: string, delimiter: string): TableData {
    const table: TableData = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;
    const len = content.length;

    while (i < len) {
        const char = content[i];

        if (char === '"') {
            if (inQuotes) {
                // Check for escaped quote ""
                if (i + 1 < len && content[i + 1] === '"') {
                    currentCell += '"';
                    i += 2;
                    continue;
                } else {
                    inQuotes = false;
                    i++;
                    continue;
                }
            } else {
                inQuotes = true;
                i++;
                continue;
            }
        }

        if (!inQuotes) {
            // Check for delimiter
            if (content.startsWith(delimiter, i)) {
                currentRow.push(currentCell.trim());
                currentCell = '';
                i += delimiter.length;
                continue;
            }

            // Check for line endings
            if (char === '\r') {
                if (i + 1 < len && content[i + 1] === '\n') {
                    i++;
                }
                currentRow.push(currentCell.trim());
                if (currentRow.some(c => c !== '')) {
                    table.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
                i++;
                continue;
            }

            if (char === '\n') {
                currentRow.push(currentCell.trim());
                if (currentRow.some(c => c !== '')) {
                    table.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
                i++;
                continue;
            }
        }

        currentCell += char;
        i++;
    }

    // Push the final cell and row
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
        table.push(currentRow);
    }

    return normalizeGrid(table);
}

/**
 * Detect delimiter by analyzing consistency across lines
 */
function detectDelimiter(content: string): string {
    const candidates = [',', ';', '\t', '|'];
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 10);
    if (lines.length === 0) return ',';

    let bestDelimiter = ',';
    let bestScore = -1;

    for (const delimiter of candidates) {
        const counts = lines.map(line => countDelimiterOccurrences(line, delimiter));
        const nonZero = counts.filter(c => c > 0);
        if (nonZero.length === 0) continue;

        const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
        const variance = nonZero.reduce((acc, c) => acc + Math.pow(c - avg, 2), 0) / nonZero.length;
        const score = (nonZero.length / lines.length) * 10 - variance;

        if (score > bestScore) {
            bestScore = score;
            bestDelimiter = delimiter;
        }
    }

    return bestDelimiter;
}

function countDelimiterOccurrences(line: string, delimiter: string): number {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === delimiter && !inQuotes) count++;
    }
    return count;
}

/**
 * Parse Markdown Table with escaped pipe support and exact empty cell preservation
 */
export function parseMarkdownTable(content: string): TableData {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tableData: TableData = [];

    for (const line of lines) {
        // Skip markdown separator lines like |---|:---|---:|
        const stripped = line.replace(/^\|/, '').replace(/\|$/, '').trim();
        if (stripped) {
            const separatorParts = stripped.split('|').map(p => p.trim());
            if (separatorParts.length >= 1 && separatorParts.every(p => /^:?-+:?$/.test(p))) {
                continue;
            }
        }

        // Tokenize by unescaped pipes
        const rawCells: string[] = [];
        let current = '';
        let isEscaped = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '\\' && !isEscaped) {
                isEscaped = true;
                continue;
            }

            if (char === '|' && !isEscaped) {
                rawCells.push(current.trim());
                current = '';
            } else {
                if (isEscaped) {
                    if (char === '|') {
                        current += '|';
                    } else {
                        current += '\\' + char;
                    }
                    isEscaped = false;
                } else {
                    current += char;
                }
            }
        }
        if (isEscaped) {
            current += '\\';
        }
        rawCells.push(current.trim());

        // Process leading/trailing markdown pipes
        let cells = rawCells;
        if (line.startsWith('|') && cells.length > 0 && cells[0] === '') {
            cells = cells.slice(1);
        }
        if (line.endsWith('|') && cells.length > 0 && cells[cells.length - 1] === '') {
            cells = cells.slice(0, cells.length - 1);
        }

        if (cells.length > 0) {
            tableData.push(cells);
        }
    }

    return normalizeGrid(tableData);
}

/**
 * Parse Box-drawing / ASCII border tables (+---+---+ and ┌───┬───┐)
 */
export function parseBoxOrAsciiTable(content: string): TableData {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tableData: TableData = [];

    for (const line of lines) {
        // Skip horizontal border lines
        if (/^[+\-:=|┌┬┐├┼┤└┴┘─═]+$/.test(line) && !/[a-zA-Z0-9_\u4e00-\u9fa5]/.test(line)) {
            continue;
        }

        const normalizedLine = line.replace(/[│║]/g, '|');
        if (!normalizedLine.includes('|')) continue;

        let cells = normalizedLine.split('|').map(c => c.trim());
        if (normalizedLine.startsWith('|') && cells.length > 0 && cells[0] === '') {
            cells = cells.slice(1);
        }
        if (normalizedLine.endsWith('|') && cells.length > 0 && cells[cells.length - 1] === '') {
            cells = cells.slice(0, cells.length - 1);
        }

        if (cells.length > 0 && cells.some(c => c !== '')) {
            tableData.push(cells);
        }
    }

    return normalizeGrid(tableData);
}

/**
 * Universal HTML Table Parser with 2D Grid allocation for rowspan and colspan
 */
export function parseHTMLTable(content: string): TableData {
    if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const tables = doc.querySelectorAll('table');

        if (tables.length === 0) {
            const rows = doc.querySelectorAll('tr');
            if (rows.length === 0) {
                throw new Error('未找到有效的 HTML <table> 或 <tr> 结构。');
            }
            return extractTableGrid(rows);
        }

        const tableRows = tables[0].querySelectorAll('tr');
        return extractTableGrid(tableRows);
    }

    // Universal Regex Parser for Node/SSR environments
    return parseHTMLTableUniversal(content);
}

function extractTableGrid(rowsNodeList: NodeListOf<Element>): TableData {
    const grid: string[][] = [];
    const rows = Array.from(rowsNodeList);

    for (let r = 0; r < rows.length; r++) {
        const tr = rows[r];
        const cells = tr.querySelectorAll('td, th');
        if (!grid[r]) grid[r] = [];

        let colIndex = 0;

        for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];

            while (grid[r][colIndex] !== undefined) {
                colIndex++;
            }

            const rowspan = Math.max(1, parseInt(cell.getAttribute('rowspan') || '1', 10));
            const colspan = Math.max(1, parseInt(cell.getAttribute('colspan') || '1', 10));

            const rawText = cell.innerHTML
                .replace(/<br\s*\/?>/gi, ' ')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;/gi, '&')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .replace(/&quot;/gi, '"')
                .trim();

            for (let ri = 0; ri < rowspan; ri++) {
                const targetRow = r + ri;
                if (!grid[targetRow]) grid[targetRow] = [];

                for (let ci = 0; ci < colspan; ci++) {
                    const targetCol = colIndex + ci;
                    grid[targetRow][targetCol] = (ri === 0 && ci === 0) ? rawText : '';
                }
            }

            colIndex += colspan;
        }
    }

    const maxCols = Math.max(0, ...grid.map(r => r.length));
    const result: TableData = grid.map(row => {
        const normalizedRow: string[] = [];
        for (let i = 0; i < maxCols; i++) {
            normalizedRow.push(row[i] ?? '');
        }
        return normalizedRow;
    }).filter(row => row.some(cell => cell !== ''));

    return normalizeGrid(result);
}

function parseHTMLTableUniversal(content: string): TableData {
    const grid: string[][] = [];
    const trMatches = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (!trMatches || trMatches.length === 0) {
        throw new Error('未找到有效的 HTML <tr> 结构。');
    }

    for (let r = 0; r < trMatches.length; r++) {
        const trHtml = trMatches[r];
        if (!grid[r]) grid[r] = [];

        const cellMatches = trHtml.match(/<(td|th)[^>]*>[\s\S]*?<\/\1>/gi) || [];
        let colIndex = 0;

        for (let c = 0; c < cellMatches.length; c++) {
            const cellHtml = cellMatches[c];

            while (grid[r][colIndex] !== undefined) {
                colIndex++;
            }

            const rowspanMatch = cellHtml.match(/rowspan=["']?(\d+)["']?/i);
            const colspanMatch = cellHtml.match(/colspan=["']?(\d+)["']?/i);
            const rowspan = Math.max(1, parseInt(rowspanMatch?.[1] || '1', 10));
            const colspan = Math.max(1, parseInt(colspanMatch?.[1] || '1', 10));

            const rawText = cellHtml
                .replace(/^<(td|th)[^>]*>/i, '')
                .replace(/<\/(td|th)>$/i, '')
                .replace(/<br\s*\/?>/gi, ' ')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;/gi, '&')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .replace(/&quot;/gi, '"')
                .trim();

            for (let ri = 0; ri < rowspan; ri++) {
                const targetRow = r + ri;
                if (!grid[targetRow]) grid[targetRow] = [];

                for (let ci = 0; ci < colspan; ci++) {
                    const targetCol = colIndex + ci;
                    grid[targetRow][targetCol] = (ri === 0 && ci === 0) ? rawText : '';
                }
            }

            colIndex += colspan;
        }
    }

    const maxCols = Math.max(0, ...grid.map(r => r.length));
    const result: TableData = grid.map(row => {
        const normalizedRow: string[] = [];
        for (let i = 0; i < maxCols; i++) {
            normalizedRow.push(row[i] ?? '');
        }
        return normalizedRow;
    }).filter(row => row.some(cell => cell !== ''));

    return normalizeGrid(result);
}

/**
 * Parse JSON Array of Objects with complete key collection and empty field alignment
 */
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

    return normalizeGrid(rows);
}

/**
 * Robust Text Table Parser
 */
export function parseTextTable(content: string): TableData {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    // 1. Try Tab delimiter
    if (lines.some(l => l.includes('\t'))) {
        const rows = lines.map(line => line.split('\t').map(c => c.trim()));
        return normalizeGrid(rows);
    }

    // 2. Check for Space-aligned Fixed Width Table
    const fixedWidthResult = tryParseFixedWidthTable(lines);
    if (fixedWidthResult && fixedWidthResult.length > 0) {
        return normalizeGrid(fixedWidthResult);
    }

    // 3. Fallback: Split on 2 or more whitespace, preserving empty items without filter(c => c)
    const rows: TableData = [];
    for (const line of lines) {
        const cells = line.split(/\s{2,}/).map(c => c.trim());
        if (cells.length > 0 && cells.some(c => c !== '')) {
            rows.push(cells);
        }
    }

    return normalizeGrid(rows);
}

/**
 * Try to infer fixed-width column boundaries from space alignments across rows
 */
function tryParseFixedWidthTable(lines: string[]): TableData | null {
    if (lines.length < 2) return null;

    const sepIndex = lines.findIndex(l => /^[\s\-:=]+$/.test(l) && l.includes('-'));
    if (sepIndex > 0) {
        const sepLine = lines[sepIndex];
        const ranges: Array<{ start: number; end: number }> = [];
        let inBlock = false;
        let start = 0;

        for (let i = 0; i < sepLine.length; i++) {
            const char = sepLine[i];
            if (char === '-' || char === '=' || char === ':') {
                if (!inBlock) {
                    inBlock = true;
                    start = i;
                }
            } else {
                if (inBlock) {
                    ranges.push({ start, end: i });
                    inBlock = false;
                }
            }
        }
        if (inBlock) {
            ranges.push({ start, end: sepLine.length });
        }

        if (ranges.length >= 2) {
            const rows: TableData = [];
            for (let li = 0; li < lines.length; li++) {
                if (li === sepIndex) continue;
                const line = lines[li];
                const row = ranges.map((r, idx) => {
                    const chunk = idx === ranges.length - 1 ? line.slice(r.start) : line.slice(r.start, r.end);
                    return chunk.trim();
                });
                rows.push(row);
            }
            return rows;
        }
    }

    return null;
}

/**
 * SQL CREATE TABLE Reverse Parser
 */
export function parseSQLCreateTable(content: string): TableData {
    const cleanContent = content
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const match = cleanContent.match(/CREATE\s+TABLE\s+(?:["`]?\w+["`]?\.?)?(?:["`]?\w+["`]?)\s*\((.*)\)/i);
    if (!match) {
        throw new Error('无效的 CREATE TABLE SQL 语法');
    }

    const columnBlock = match[1];
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

    const tableData: TableData = [
        ['Field', 'Type', 'Length', 'PK', 'NotNull', 'Comment'],
    ];

    const pkColumns = new Set<string>();

    for (const colDef of columns) {
        if (/PRIMARY\s+KEY/i.test(colDef)) {
            const pkMatch = colDef.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (pkMatch) {
                pkMatch[1].split(',').forEach(c => pkColumns.add(c.trim().replace(/["`]/g, '')));
            }
            continue;
        }

        if (/KEY|INDEX|CONSTRAINT|FOREIGN/i.test(colDef.split(' ')[0])) {
            continue;
        }

        const parts = colDef.split(/\s+/);
        const name = parts[0].replace(/["`]/g, '');
        let typeRaw = parts[1] || 'VARCHAR';
        let length = '';

        const typeMatch = typeRaw.match(/(\w+)\((.+)\)/);
        if (typeMatch) {
            typeRaw = typeMatch[1];
            length = typeMatch[2];
        }

        const isNotNull = /NOT\s+NULL/i.test(colDef) ? 'Y' : '';
        const isPK = /PRIMARY\s+KEY/i.test(colDef) ? 'Y' : '';

        let comment = '';
        const commentMatch = colDef.match(/COMMENT\s+'([^']+)'/i);
        if (commentMatch) {
            comment = commentMatch[1];
        }

        if (isPK === 'Y') pkColumns.add(name);

        tableData.push([
            name,
            typeRaw.toUpperCase(),
            length,
            isPK,
            isNotNull,
            comment,
        ]);
    }

    for (let i = 1; i < tableData.length; i++) {
        const name = tableData[i][0];
        if (pkColumns.has(name)) {
            tableData[i][3] = 'Y';
        }
    }

    return normalizeGrid(tableData);
}

/**
 * Grid Normalizer: Ensures equal row length, handles empty cells, and preserves alignment
 */
export function normalizeGrid(data: TableData): TableData {
    if (!data || data.length === 0) return [];

    const rows = data.map(row => row.map(cell => (cell === undefined || cell === null) ? '' : String(cell)));
    const maxWidth = Math.max(0, ...rows.map(row => row.length));
    if (maxWidth === 0) return [];

    return rows.map(row => {
        if (row.length < maxWidth) {
            return [...row, ...Array(maxWidth - row.length).fill('')];
        }
        return row;
    });
}
