import { v4 as uuidv4 } from 'uuid';
import type { FormatterOptions } from '../CodeFormatterService';

export class DialectProtector {
    private static protectedOperators = new Map<string, string>();

    /**
     * 方言级专属拓扑特性的非破坏级隔离保护 (Feature 16)
     * 发现 PostgreSQL 或 MySQL 的特有操作符时，我们进行临时替换保护，防止将其解析成算术错误或打碎
     */
    public static maskDialectOperators(sql: string, options: FormatterOptions): string {
        let processedSql = sql;
        const dialect = (options.dialect || 'sql').toLowerCase();

        // If standard 'sql', do not attempt dialect-specific operator masking
        if (dialect === 'sql') {
            return sql;
        }

        // 统一处理现代方言常见非标准算子 (PG, DuckDB, etc.)
        // 1. JSON/Map/List 访问符: ->, ->>, [], [:]
        // 2. 类型强制转换: ::
        // 3. DuckDB 专属: * EXCLUDE, * REPLACE
        const modernOperators = /(->>|->|::|\[.*?\]|\bEXCLUDE\s*\(.*?\)\b|\bREPLACE\s*\(.*?\)\b)/gi;

        let match;
        // 注意：由于我们在循环中修改 string，正则匹配需要配合替换索引或生成映射
        // 这里使用更安全的占位符替换策略，避免正则 lastIndex 不稳定
        const protections: { uuid: string; original: string }[] = [];

        processedSql = processedSql.replace(modernOperators, (match) => {
            const uuid = `__DIALECT_OP_${uuidv4().replace(/-/g, '')}__`;
            protections.push({ uuid, original: match });
            return uuid;
        });

        protections.forEach(p => this.protectedOperators.set(p.uuid, p.original));

        return processedSql;
    }

    /**
     * 恢复专有操作符
     */
    public static restoreDialectOperators(sql: string): string {
        let restoredSql = sql;

        this.protectedOperators.forEach((originalOp, uuid) => {
            const regex = new RegExp(uuid, 'gi');
            restoredSql = restoredSql.replace(regex, originalOp);
        });

        this.protectedOperators.clear();
        return restoredSql;
    }
}
