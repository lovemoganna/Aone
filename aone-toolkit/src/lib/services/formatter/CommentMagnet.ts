/**
 * 提取尾随与悬浮注释，并建立锚定关系避免排版挤压破坏 (Feature 04)
 */
export interface CommentContext {
    sqlWithoutComments: string;
    // 简单实现：我们把注释按照原先行号提取出来
    // 在完整的 AST 方案中，需要将其附加到目标节点的 LeadingComments 槽位中
    comments: Array<{
        text: string;
        originalLineIndex: number;
        // 距离下一个非空节点的 Y 轴偏移 (Delta_Y)
        deltaYToNextNode: number;
    }>;
}

export class CommentMagnet {
    /**
     * 提取注释并记录相对位置
     */
    public static extractComments(sql: string): CommentContext {
        const lines = sql.split('\n');
        const comments: CommentContext['comments'] = [];

        // 简单实现：提取整行注释和行尾注释
        // 假设是 -- 开头的注释
        const newLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const commentIndex = line.indexOf('--');

            if (commentIndex !== -1) {
                const commentText = line.substring(commentIndex);
                const codeBefore = line.substring(0, commentIndex).trim();

                // 计算 DeltaY
                let deltaYToNextNode = 1;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() !== '' && !lines[j].trim().startsWith('--')) {
                        deltaYToNextNode = j - i;
                        break;
                    }
                }

                comments.push({
                    text: commentText,
                    originalLineIndex: i,
                    deltaYToNextNode
                });

                if (codeBefore) {
                    newLines.push(codeBefore);
                } else {
                    newLines.push(''); // 保留空行以维持基本结构
                }
            } else {
                newLines.push(line);
            }
        }

        return {
            sqlWithoutComments: newLines.join('\n'),
            comments
        };
    }

    /**
     * 恢复注释并进行磁吸重排
     */
    public static restoreComments(formattedSql: string, context: CommentContext): string {
        // 简单恢复策略：因为格式化后行号全变了，
        // AST 做法是跟节点走，此处简化的正则/文本定位做法容易错位。
        // 作为演示，我们尝试在排版后的相似位置塞回。
        // (在投入生产前，建议完全走 AST 节点绑定，或者依赖 Lezer 解析器，而不是文本暴力替换)

        // 注意：由于格式化会增加减行数，简单的文本插入很难做到 100% 准确
        // 此处暂时采用一种简化附加的方法（仅为第一阶段占位，后续再重构为 AST Tracker）

        const lines = formattedSql.split('\n');
        // 如果没有注释，直接返回
        if (context.comments.length === 0) return formattedSql;

        // 简单将所有注释按原始顺序，先塞回代码顶部或者近似的前置位置
        // 在完善版中我们将计算相对偏移。
        const restoredLines = [...lines];

        // 倒序插入，避免行号混乱
        // 简化版：直接按比例或者在头部恢复
        for (const comment of context.comments.reverse()) {
            // 这里偷懒塞回它原本大概的比例位置
            const ratio = context.comments.length > 0 ? (comment.originalLineIndex / (context.comments.length + lines.length)) : 0;
            const insertIdx = Math.max(0, Math.floor(lines.length * ratio));
            restoredLines.splice(insertIdx, 0, comment.text);
        }

        return restoredLines.join('\n');
    }
}
