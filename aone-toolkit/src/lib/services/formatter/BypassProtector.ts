import { v4 as uuidv4 } from 'uuid';

export class BypassProtector {
    private static protectedBlocks = new Map<string, string>();

    /**
     * 特权物理区排版的显性契约豁免保护标签 (Feature 10)
     * 发现 @formatter:off 到 @formatter:on 区域时剥离保护
     */
    public static isolateProtectedBlocks(sql: string): string {
        const offDirectives = ['/* @formatter:off */', '-- @formatter:off', '# @formatter:off'];
        const onDirectives = ['/* @formatter:on */', '-- @formatter:on', '# @formatter:on'];

        let processedSql = sql;

        // 我们遍历所有保护对
        for (let i = 0; i < offDirectives.length; i++) {
            const offTag = offDirectives[i];
            const onTag = onDirectives[i];

            // 简单循环查找配对
            while (processedSql.includes(offTag)) {
                const startIdx = processedSql.indexOf(offTag);
                const endIdx = processedSql.indexOf(onTag, startIdx);

                if (endIdx !== -1) {
                    const blockContent = processedSql.substring(startIdx, endIdx + onTag.length);
                    const uuid = `__PROTECTED_${uuidv4().replace(/-/g, '')}__`;

                    this.protectedBlocks.set(uuid, blockContent);

                    // 用uuid替代该片段以避免排版
                    processedSql = processedSql.substring(0, startIdx) + uuid + processedSql.substring(endIdx + onTag.length);
                } else {
                    // 如果只有 off 没有 on，则从 off 开始保护到末尾
                    const blockContent = processedSql.substring(startIdx);
                    const uuid = `__PROTECTED_${uuidv4().replace(/-/g, '')}__`;
                    this.protectedBlocks.set(uuid, blockContent);
                    processedSql = processedSql.substring(0, startIdx) + uuid;
                    break;
                }
            }
        }

        return processedSql;
    }

    /**
     * 把保护的无定格代码完全按原样重新写回文本流
     */
    public static restoreProtectedBlocks(sql: string): string {
        let restoredSql = sql;

        this.protectedBlocks.forEach((originalBlock, uuid) => {
            restoredSql = restoredSql.replace(uuid, originalBlock);
        });

        this.protectedBlocks.clear();
        return restoredSql;
    }
}
