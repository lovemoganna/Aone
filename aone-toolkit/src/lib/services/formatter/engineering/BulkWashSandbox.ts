import { CodeFormatterService, type FormatterOptions } from '../CodeFormatterService';
import { SafetyAssertion } from '../SafetyAssertion';

export interface WashResult {
    filePath: string;
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
    originalSize: number;
    newSize: number;
    error?: string;
}

export class BulkWashSandbox {
    /**
     * 批量洗稿沙箱 (Feature 18)
     * 在内存中完成排版转换，严格校验 SafetyAssertion 后再决定是否落盘
     */
    public static async washFiles(
        files: { path: string; content: string }[],
        options: FormatterOptions = {}
    ): Promise<WashResult[]> {
        const results: WashResult[] = [];

        for (const file of files) {
            try {
                // Feature 15 嗅探与 Feature 10,16 等等所有的保护都在 format 内部集成了
                const formattingResult = CodeFormatterService.format(file.content, options);
                const formattedContent = formattingResult.result;

                if (formattedContent === file.content) {
                    results.push({
                        filePath: file.path,
                        status: 'SKIPPED',
                        originalSize: file.content.length,
                        newSize: formattedContent.length,
                        error: 'Content unchanged or safety assertion rejected formatting'
                    });
                    continue;
                }

                // 进行一次绝对的安全冗余检验
                if (SafetyAssertion.assertSafe(file.content, formattedContent)) {
                    // TODO: 这里实际应用中应调用 FileSystem API 落盘 (如 fs.writeFileSync)
                    // 本次实现只做内存模拟记录

                    results.push({
                        filePath: file.path,
                        status: 'SUCCESS',
                        originalSize: file.content.length,
                        newSize: formattedContent.length
                    });
                } else {
                    results.push({
                        filePath: file.path,
                        status: 'FAILED',
                        originalSize: file.content.length,
                        newSize: file.content.length,
                        error: 'Safety Assertion Failed in sandbox verify'
                    });
                }
            } catch (err: any) {
                results.push({
                    filePath: file.path,
                    status: 'FAILED',
                    originalSize: file.content.length,
                    newSize: file.content.length,
                    error: err.message
                });
            }
        }

        return results;
    }
}
