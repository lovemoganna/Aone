import yaml from 'js-yaml';

export interface SafeParseResult<T = any> {
    ok: boolean;
    data?: T;
    error?: string;
    errorLine?: number;
    errorColumn?: number;
    depth: number;
    sizeBytes: number;
    warnings: string[];
}

export interface ParseOptions {
    maxDepth?: number;
    maxBytes?: number;
    allowComments?: boolean;
}

const DEFAULT_MAX_DEPTH = 64;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Recursively calculates object depth and guards against stack overflow.
 */
export function calculateObjectDepth(obj: any, currentDepth = 1, seen = new WeakSet()): number {
    if (obj === null || typeof obj !== 'object') {
        return currentDepth;
    }
    if (seen.has(obj)) {
        return currentDepth;
    }
    seen.add(obj);

    let maxChildDepth = currentDepth;
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const d = calculateObjectDepth(item, currentDepth + 1, seen);
            if (d > maxChildDepth) maxChildDepth = d;
        }
    } else {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const d = calculateObjectDepth(obj[key], currentDepth + 1, seen);
                if (d > maxChildDepth) maxChildDepth = d;
            }
        }
    }
    return maxChildDepth;
}

/**
 * Safely parses JSON with size limits, depth guards, and exact line/column error extraction.
 */
export function safeJsonParse<T = any>(
    input: string,
    options: ParseOptions = {}
): SafeParseResult<T> {
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const warnings: string[] = [];

    if (!input || input.trim() === '') {
        return {
            ok: false,
            error: '输入内容为空',
            depth: 0,
            sizeBytes: 0,
            warnings: []
        };
    }

    const sizeBytes = new Blob([input]).size;
    if (sizeBytes > maxBytes) {
        return {
            ok: false,
            error: `文件体积超限 (${(sizeBytes / 1024 / 1024).toFixed(2)}MB)，最大允许 ${(maxBytes / 1024 / 1024).toFixed(0)}MB`,
            depth: 0,
            sizeBytes,
            warnings: []
        };
    }

    try {
        const parsed = JSON.parse(input);
        const depth = calculateObjectDepth(parsed);

        if (depth > maxDepth) {
            return {
                ok: false,
                error: `JSON 嵌套层级深达 ${depth} 层，超出安全限制 (${maxDepth} 层)`,
                depth,
                sizeBytes,
                warnings: []
            };
        }

        if (depth > 20) {
            warnings.push(`嵌套层级较高 (${depth} 层)，在某些渲染视图下可能出现递归深度过大。`);
        }

        return {
            ok: true,
            data: parsed,
            depth,
            sizeBytes,
            warnings
        };
    } catch (e: any) {
        let errorMsg = e.message || 'JSON 语法解析失败';
        let errorLine: number | undefined = undefined;
        let errorColumn: number | undefined = undefined;

        // Extract line and column from standard error if available
        const posMatch = errorMsg.match(/position (\d+)/i);
        if (posMatch && posMatch[1]) {
            const pos = parseInt(posMatch[1], 10);
            const prefix = input.substring(0, pos);
            const lines = prefix.split('\n');
            errorLine = lines.length;
            errorColumn = (lines[lines.length - 1]?.length || 0) + 1;
            errorMsg = `${errorMsg} (第 ${errorLine} 行，第 ${errorColumn} 列)`;
        }

        return {
            ok: false,
            error: errorMsg,
            errorLine,
            errorColumn,
            depth: 0,
            sizeBytes,
            warnings: []
        };
    }
}

/**
 * Safely parses YAML with size and depth limits.
 */
export function safeYamlParse<T = any>(
    input: string,
    options: ParseOptions = {}
): SafeParseResult<T> {
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const warnings: string[] = [];

    if (!input || input.trim() === '') {
        return {
            ok: false,
            error: 'YAML 输入内容为空',
            depth: 0,
            sizeBytes: 0,
            warnings: []
        };
    }

    const sizeBytes = new Blob([input]).size;
    if (sizeBytes > maxBytes) {
        return {
            ok: false,
            error: `YAML 文件体积超限 (${(sizeBytes / 1024 / 1024).toFixed(2)}MB)`,
            depth: 0,
            sizeBytes,
            warnings: []
        };
    }

    try {
        const parsed = yaml.load(input) as T;
        const depth = calculateObjectDepth(parsed);

        if (depth > maxDepth) {
            return {
                ok: false,
                error: `YAML 嵌套层级深达 ${depth} 层，超出安全限制 (${maxDepth} 层)`,
                depth,
                sizeBytes,
                warnings: []
            };
        }

        return {
            ok: true,
            data: parsed,
            depth,
            sizeBytes,
            warnings
        };
    } catch (e: any) {
        return {
            ok: false,
            error: e.message || 'YAML 语法解析错误',
            errorLine: e.mark?.line ? e.mark.line + 1 : undefined,
            errorColumn: e.mark?.column ? e.mark.column + 1 : undefined,
            depth: 0,
            sizeBytes,
            warnings: []
        };
    }
}
