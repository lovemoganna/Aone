import { CodeFormatterService } from '../CodeFormatterService';
import type { FormatterOptions } from '../CodeFormatterService';

// 这是一段运行在 Worker 线程的代码 (Feature 13)
// 在真实 Vite 环境中通常以 ?worker 后缀引入，
// 下方提供对 `self.onmessage` 的模拟绑定和实现。

self.onmessage = (e: MessageEvent) => {
    const { id, sql, options, type } = e.data as {
        id: string;
        sql: string;
        options: FormatterOptions;
        type: 'FORMAT' | 'FORMAT_SELECTION' | 'SANITIZE';
        selection?: { start: number; end: number };
    };

    try {
        let result = '';

        if (type === 'FORMAT') {
            const formattingResult = CodeFormatterService.format(sql, options);
            result = formattingResult.result;
        } else if (type === 'SANITIZE') {
            // 如果是在 Worker 中也应引入 SanitizeExporter，但为避免循环依赖可在统一入口调用
            // 我们在此模拟标准调用路径
            // result = SanitizeExporter.exportSanitized(...)
        }

        self.postMessage({ id, status: 'SUCCESS', result });
    } catch (error: any) {
        self.postMessage({ id, status: 'ERROR', error: error.message });
    }
};

// P2 Enhancement: Heartbeat Mechanism
// Allows main thread to detect if the worker is still alive during long operations
setInterval(() => {
    self.postMessage({ type: 'HEARTBEAT', timestamp: Date.now() });
}, 1000);

export { };
