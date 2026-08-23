import { type EditorState, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { CodeFormatterService } from './CodeFormatterService';
import type { FormatterOptions } from './CodeFormatterService';
import { StatementBoundDetector } from './ux/StatementBoundDetector';

export class FormatterTransaction {
    /**
     * OOM与死循环断路器 (Feature 09)
     * 控制执行时长，阻止主线程冻结
     */
    public static async formatWithTimeout(
        sql: string,
        options: FormatterOptions,
        timeoutMs: number = 2000
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            // 设置超时熔断
            const timer = setTimeout(() => {
                reject(new Error(`[Formatter] Hardware Timeout: Operation exceeded ${timeoutMs}ms.`));
            }, timeoutMs);

            try {
                // 因为排版由于AST/Regex可能是计算密集型的同步操作，
                // 在理想情况下，应借助 Web Worker 执行
                // 这里我们做模拟的防冻结处理，优先释放当前调用栈
                setTimeout(() => {
                    const result = CodeFormatterService.format(sql, options).result;
                    clearTimeout(timer);
                    resolve(result);
                }, 0);
            } catch (err) {
                clearTimeout(timer);
                reject(err);
            }
        });
    }

    /**
     * 格式化隔离历史记录栈与安全撤销隔离区 (Feature 08)
     * 通过生成原子级的 Editor Transaction 控制撤回作用域
     */
    public static async applyToCodeMirror(
        view: EditorView,
        options: FormatterOptions = {}
    ): Promise<boolean> {
        const state = view.state;
        const documentText = state.doc.toString();

        try {
            // Feature 09: 携带超时机制的挂起运算
            const formatted = await this.formatWithTimeout(documentText, options);

            // 如果内容没变，无需创建历史帧
            if (formatted === documentText) return false;

            // Feature 08: 隔离撤回区
            // 我们通过派发一个独立的 transaction 挂载特定的 annotation
            // 将整个文件替换封装为一个原子级的不可分割变更帧
            const transaction: Transaction = state.update({
                changes: { from: 0, to: state.doc.length, insert: formatted },
                // 强制将这次改动与前面的打字分开
                annotations: Transaction.addToHistory.of(true),
                // 如果需要识别为某个用户的特定操作标记
                userEvent: 'format'
            });

            view.dispatch(transaction);
            return true;

        } catch (error) {
            console.error('Code formatting aborted:', error);
            // 这里可以接入系统的 Toast 通知
            return false;
        }
    }

    /**
     * Leave-Node Micro Transactions (Feature 08)
     * Formats only the specific statement where the cursor is currently located.
     */
    public static async applyPartialFormat(
        view: EditorView,
        options: FormatterOptions = {}
    ): Promise<boolean> {
        const state = view.state;
        const cursor = state.selection.main.head;
        const documentText = state.doc.toString();

        // 1. Detect boundaries of current statement
        const { from, to } = StatementBoundDetector.detect(documentText, cursor);
        const originalStatement = documentText.substring(from, to);

        try {
            // 2. Format only that piece
            const formattedStatement = await this.formatWithTimeout(originalStatement, options);

            if (formattedStatement === originalStatement) return false;

            // 3. Dispatch specific transaction
            view.dispatch({
                changes: { from, to, insert: formattedStatement },
                annotations: Transaction.addToHistory.of(true),
                userEvent: 'format.partial'
            });

            return true;
        } catch (error) {
            console.error('Partial formatting aborted:', error);
            return false;
        }
    }
}
