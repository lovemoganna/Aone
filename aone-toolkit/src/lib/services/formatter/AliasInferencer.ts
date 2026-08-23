/**
 * 冗长实体的自动别名推断与重载降噪 (Feature 05)
 * 以及 ES6+ 大规模解构导入的按引用频次排序 (Frequency-Based Import Sorcery)
 */
export class AliasInferencer {
    /**
     * 应用别名推断
     */
    public static applyAliases(sql: string): string {
        // 简单实现：提取非常长的表名并生成别名
        // 例如 SELECT user_action_transaction_history.amount -> uath

        // 我们找出可能过长的表名修饰符
        // 此正则表达式查找 "长单词." 的模式
        const longIdentifierRegex = /([a-zA-Z0-9_]{15,})\./g;

        const aliases = new Map<string, string>();
        let processedSql = sql;
        let match;

        // 第一遍扫描：收集长标识符并生成短别名
        while ((match = longIdentifierRegex.exec(sql)) !== null) {
            const longName = match[1];
            if (!aliases.has(longName)) {
                const alias = this.generateAlias(longName);
                aliases.set(longName, alias);
            }
        }

        // 如果没有找到长别名，直接返回
        if (aliases.size === 0) return sql;

        // 第二遍扫描：替换所有长标识符为其别名
        aliases.forEach((alias, longName) => {
            // 替换作为前缀的情况 (例如 长表名.字段 -> 别名.字段)
            const prefixRegex = new RegExp(`\\b${longName}\\.`, 'g');
            processedSql = processedSql.replace(prefixRegex, `${alias}.`);

            // 尝试在 FROM / JOIN 后面为表加上别名
            // 这是一个比较粗糙的正则，完整的应当由 AST 提供支持
            const tableDeclarationRegex = new RegExp(`\\b(FROM|JOIN)\\s+${longName}\\b(?!\\s+(AS\\s+)?${alias})`, 'gi');
            processedSql = processedSql.replace(tableDeclarationRegex, `$1 ${longName} AS ${alias}`);
        });

        return processedSql;
    }

    /**
     * 基于下划线和驼峰生成短别名
     * 例如 user_action_transaction_history -> uath
     * userActionHistory -> uAH -> uah
     */
    private static generateAlias(longName: string): string {
        if (longName.includes('_')) {
            return longName.split('_')
                .filter(part => part.length > 0)
                .map(part => part[0].toLowerCase())
                .join('');
        }

        // 驼峰命名法
        const chars = longName.split('');
        const caps = chars.filter(c => c >= 'A' && c <= 'Z');
        if (caps.length > 0) {
            return (chars[0] + caps.join('')).toLowerCase();
        }

        // 如果都没有，直接截取前三个字符
        return longName.substring(0, 3).toLowerCase();
    }

    /**
     * ES6+ 大规模解构导入的按引用频次排序 (Frequency-Based Import Sorcery - Feature 5)
     * 将 import { a, b, c } from 'xyz' 中的变量按在此文件中的使用频次降序重排。
     * @param code JS/TS 宿主文件代码
     */
    public static sortImportsByUsage(code: string): string {
        // 匹配命名解构导入: import { a, b as c } from 'lib'
        const importRegex = /import\s+type\s*\{([^}]+)\}\s+from\s+['"][^'"]+['"];?|import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];?/g;

        let processedCode = code;

        // 我们不希望统计到 import 语句本身里的单词，所以仅在除去 imports 的主干代码里寻找
        const codeWithoutImports = code.replace(importRegex, '');

        processedCode = processedCode.replace(importRegex, (match, typeGroup, normalGroup) => {
            const innerFields = typeGroup || normalGroup;
            if (!innerFields || innerFields.trim().length === 0) return match;

            // 切分 import 变量，例如 " a ", " b as c"
            const fields = innerFields.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);

            // 只有一个就不排了
            if (fields.length <= 1) return match;

            const usageCounts = fields.map((field: string) => {
                // 如果有 as 别名，取最终使用的名字，如 "b as c" -> "c"
                const parts = field.split(/\s+as\s+/);
                const actualName = parts.length > 1 ? parts[1].trim() : parts[0].trim();

                // 统计此标志符在整个文件中使用的次数
                const usageRegex = new RegExp(`\\b${actualName}\\b`, 'g');
                const matches = codeWithoutImports.match(usageRegex);
                const count = matches ? matches.length : 0;

                return { field, actualName, count };
            });

            // 按引用频次降序排序，频次相同按字母顺序
            usageCounts.sort((a: { count: number; actualName: string }, b: { count: number; actualName: string }) => {
                if (b.count !== a.count) {
                    return b.count - a.count; // 降序
                }
                return a.actualName.localeCompare(b.actualName);
            });

            const sortedFieldsStr = usageCounts.map((item: { field: string }) => item.field).join(', ');

            // 组装回原本形式
            return match.replace(innerFields, ` ${sortedFieldsStr} `);
        });

        return processedCode;
    }
}
