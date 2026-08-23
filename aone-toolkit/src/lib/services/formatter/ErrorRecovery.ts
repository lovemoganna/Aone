import { v4 as uuidv4 } from 'uuid';

export class ErrorRecovery {
    private static brokenFragments = new Map<string, string>();

    /**
     * 残片句法（Broken Syntax）的错误恢复 (Feature 07)
     * 在无法格式化前，尝试预处理掉明显的结尾残片，并在格式化后还原。
     */
    public static salvage(sql: string): string {
        // 简单实现：由于很多由于缺失闭合括号或者分号导致的排版报错，
        // 以及诸如 "SELECT * FROM users WH" 这样写到一半的情况
        let processedSql = sql;

        // 1. 处理常见结尾半截词
        const trailingWordRegex = /(\b(WH|WHE|WHER|SE|SEL|SELE|SELEC|FR|FRO|OR|OB|GROUP|HAV|HAVI)\s*)$/i;
        const match = trailingWordRegex.exec(processedSql);

        if (match) {
            const fragment = match[1];
            const uuid = `__BROKEN_${uuidv4().replace(/-/g, '')}__`;
            this.brokenFragments.set(uuid, fragment);
            // 剥离出去以防止污染 sql-formatter
            processedSql = processedSql.substring(0, processedSql.length - fragment.length) + `\n/*${uuid}*/`;
        }

        // 可以进一步增加对于未闭合引号的检测并补全
        const singleQuotesCount = (processedSql.match(/'/g) || []).length;
        if (singleQuotesCount % 2 !== 0) {
            // 如果单引号不闭合，补全它
            processedSql += "'";
            this.brokenFragments.set('__MISSING_QUOTE__', 'true');
        }

        return processedSql;
    }

    /**
     * 恢复由于救火补全引入的副作用
     */
    public static rollbackSalvage(sql: string): string {
        let restoredSql = sql;

        this.brokenFragments.forEach((originalFragment, uuid) => {
            if (uuid === '__MISSING_QUOTE__') {
                // 如果结尾有补入的单引号，直接去掉
                if (restoredSql.trimEnd().endsWith("'")) {
                    restoredSql = restoredSql.replace(/'\s*$/, '');
                }
            } else {
                // 恢复残片
                const placeholder = `/*${uuid}*/`;
                restoredSql = restoredSql.replace(placeholder, originalFragment);
            }
        });

        this.brokenFragments.clear();
        return restoredSql;
    }
}
