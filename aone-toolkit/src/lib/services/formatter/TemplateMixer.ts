import { v4 as uuidv4 } from 'uuid';

/**
 * 模板引擎标签与宿主语言的混合包裹安全混排 (Feature 03)
 * 以及多层嵌套微语言 (DSL) 递归格式化 (Feature 3)
 */
export class TemplateMixer {
    private static templatesStore: Map<string, string> = new Map();

    /**
     * 抽取模板如 <if test="...">...</if> 或 {% if xxx %}...{% endif %}
     * 并使用 UUID 占位
     */
    public static extractTemplates(sql: string): string {
        // 假设抽取类似于 MyBatis 或 Jinja2 的模板标签
        // 这里以简单的 <if>...</if> 为例
        const myBatisIfRegex = /<if\b[^>]*>(.*?)<\/if>/gis;

        let processedSql = sql;
        let match;

        while ((match = myBatisIfRegex.exec(sql)) !== null) {
            const templateContent = match[0];
            const uuid = `__TPL_${uuidv4().replace(/-/g, '')}__`;
            this.templatesStore.set(uuid, templateContent);
            processedSql = processedSql.replace(templateContent, uuid);
        }

        // Jinja2 样式的 {% ... %}
        const jinjaRegex = /{%.*?%}/gs;
        while ((match = jinjaRegex.exec(sql)) !== null) {
            const templateContent = match[0];
            const uuid = `__TPL_${uuidv4().replace(/-/g, '')}__`;
            this.templatesStore.set(uuid, templateContent);
            processedSql = processedSql.replace(templateContent, uuid);
        }

        return processedSql;
    }

    /**
     * 将占位的 UUID 恢复为原模板内容
     */
    public static restoreTemplates(sql: string): string {
        let processedSql = sql;

        this.templatesStore.forEach((templateContent, uuid) => {
            // 简单恢复
            processedSql = processedSql.replace(uuid, templateContent);
        });

        // 清除当次存储
        this.templatesStore.clear();

        return processedSql;
    }

    /**
     * 递归格式化内嵌的多层微语言 DSL (例如 sql`...` 或 gql`...`)
     * @param code 宿主语言代码片段 (如 TypeScript)
     * @param formatCallback 由于可能存在循环依赖，回调需由上层注入
     */
    public static processNestedDSLs(
        code: string,
        formatCallback: (innerCode: string, lang: string) => string
    ): string {
        // 匹配 tag`...` 格式的模板字符串
        // 支持的 tags: sql, gql, graphql, css
        const taggedTemplateRegex = /\b(sql|gql|graphql|css)\s*`([\s\S]*?)`/g;

        return code.replace(taggedTemplateRegex, (match, tag, innerText) => {
            try {
                // 仅对内部提取的字符串调用格式化引擎
                const formattedInner = formatCallback(innerText, tag);

                // 由于模板字符串可能有外层缩进，我们将其简单处理
                // 确保新旧字符串的头尾换行符一致性
                if (innerText.startsWith('\n')) {
                    return `${tag}\`\n${formattedInner.trimStart()}\``;
                }

                return `${tag}\`${formattedInner}\``;
            } catch (e) {
                // 降级保护：如果内部解析崩溃，原样返回
                return match;
            }
        });
    }
}
