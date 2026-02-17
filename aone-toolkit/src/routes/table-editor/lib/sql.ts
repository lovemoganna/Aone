import type { TableData } from './types';

export type SQLDialect = 'mysql' | 'postgresql' | 'duckdb' | 'sqlite';

interface ColumnDef {
    name: string;
    type: string;
    length?: string;
    primaryKey: boolean;
    notNull: boolean;
    defaultValue?: string;
    comment?: string;
}

/**
 * Generate CREATE TABLE SQL from TableData
 * Assumes TableData has specific headers or is treated as [Name, Type, Length, PK, NotNull, Comment]
 */
export function generateSQL(data: TableData, dialect: SQLDialect, tableName: string = 'new_table'): string {
    if (data.length <= 1) return `-- No data to generate SQL`;

    // Remove empty rows
    const rows = data.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
    if (rows.length === 0) return `-- No columns defined`;

    const columns: ColumnDef[] = rows.map(row => parseRowToColumn(row));

    return buildCreateTable(tableName, columns, dialect);
}

function parseRowToColumn(row: string[]): ColumnDef {
    // Expected Layout: [Name, Type, Length, PK, NotNull, Comment]
    // Flexible mapping: Index 0 is Name, 1 is Type, rest are optional
    const name = row[0]?.trim() || 'unnamed_col';
    const type = row[1]?.trim() || 'VARCHAR';
    const length = row[2]?.trim();
    const pkRaw = row[3]?.trim().toLowerCase();
    const notNullRaw = row[4]?.trim().toLowerCase();
    const comment = row[5]?.trim();

    return {
        name,
        type,
        length,
        primaryKey: ['y', 'yes', 'true', '1', 'ok', 'pk'].includes(pkRaw || ''),
        notNull: ['y', 'yes', 'true', '1', 'ok'].includes(notNullRaw || ''),
        comment: comment
    };
}

function buildCreateTable(tableName: string, columns: ColumnDef[], dialect: SQLDialect): string {
    const lines: string[] = [];
    lines.push(`CREATE TABLE ${escapeId(tableName, dialect)} (`);

    const pkColumns: string[] = [];

    const colDefs = columns.map((col, index) => {
        let line = `  ${escapeId(col.name, dialect)} ${mapType(col.type, dialect, col.length)}`;

        if (col.notNull) {
            line += ' NOT NULL';
        }

        // MySQL Comment inline
        if (dialect === 'mysql' && col.comment) {
            line += ` COMMENT '${escapeString(col.comment)}'`;
        }

        if (col.primaryKey) {
            pkColumns.push(col.name);
        }

        return line;
    }).join(',\n');

    lines.push(colDefs);

    if (pkColumns.length > 0) {
        lines.push(`  ,PRIMARY KEY (${pkColumns.map(c => escapeId(c, dialect)).join(', ')})`);
    }

    lines.push(`);`);

    // Postgres/DuckDB Comments (done via COMMENT ON COLUMN)
    if ((dialect === 'postgresql' || dialect === 'duckdb') && columns.some(c => c.comment)) {
        lines.push('');
        columns.forEach(col => {
            if (col.comment) {
                lines.push(`COMMENT ON COLUMN ${escapeId(tableName, dialect)}.${escapeId(col.name, dialect)} IS '${escapeString(col.comment)}';`);
            }
        });
    }

    return lines.join('\n');
}

function escapeId(id: string, dialect: SQLDialect): string {
    if (dialect === 'mysql') return `\`${id}\``;
    return `"${id}"`;
}

function escapeString(str: string): string {
    return str.replace(/'/g, "''");
}

function mapType(type: string, dialect: SQLDialect, length?: string): string {
    const t = type.toLowerCase();

    // Normalize generic types
    if (t.includes('bigint')) return 'BIGINT';
    if (t.includes('int')) return dialect === 'duckdb' ? 'INTEGER' : 'INT';
    if (t.includes('double') || t.includes('float')) return 'DOUBLE';
    if (t.includes('bool')) return 'BOOLEAN';
    if (t === 'string' || t === 'text') return dialect === 'mysql' ? 'TEXT' : 'TEXT';
    if (t === 'varchar' || t === 'char') {
        return `${t.toUpperCase()}(${length || '255'})`;
    }

    // Dialect specific adjustments
    if (dialect === 'postgresql' || dialect === 'duckdb') {
        if (t === 'datetime') return 'TIMESTAMP';
        if (t === 'blob') return 'BYTEA';
    }

    return type.toUpperCase();
}
