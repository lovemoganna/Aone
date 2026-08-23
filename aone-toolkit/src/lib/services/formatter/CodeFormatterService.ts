import { format } from 'sql-formatter';
import { AlignmentEngine } from './AlignmentEngine';
import { TemplateMixer } from './TemplateMixer';
import { CommentMagnet } from './CommentMagnet';
import { AliasInferencer } from './AliasInferencer';
import { SafetyAssertion } from './SafetyAssertion';
import { ErrorRecovery } from './ErrorRecovery';
import { BypassProtector } from './BypassProtector';
import { ZeroConfigSniffer } from './engineering/ZeroConfigSniffer';
import { ProjectStyleMiner } from './engineering/ProjectStyleMiner';
import { FormatStash } from './engineering/FormatStash';
import { DialectProtector } from './engineering/DialectProtector';
import { FuzzyParser } from './engineering/FuzzyParser';
import { BlockStreamer } from './engineering/BlockStreamer';
import { Watchdog } from './engineering/Watchdog';
import { MockEnvironment } from './engineering/MockEnvironment';
import { Minifier } from './engineering/Minifier';
import { PartialPatcher } from './engineering/PartialPatcher';
import { SemanticGrouper } from './ux/SemanticGrouper';

export interface FormattingResult {
    result: string;
    wasSalvaged?: boolean;
    patchCount?: number;
}

export interface FormatterOptions {
    dialect?: 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'tsql';
    useAliasInference?: boolean;
    tabWidth?: number;
    keywordCase?: 'upper' | 'lower' | 'preserve';
    commaPosition?: 'leading' | 'trailing';
    linesBetweenQueries?: number;
    stashedRanges?: { from: number; to: number }[];
    isInternalStreaming?: boolean;
}

/**
 * 核心格式化编排服务
 * 实现了 3-Pass 架构方案
 */
export class CodeFormatterService {
    /**
     * 格式化 SQL 代码
     * @param sql 原始 SQL 字符串
     * @param options 格式化选项
     * @returns 格式化结果对象
     */
    public static format(sql: string, options: FormatterOptions = {}): FormattingResult {
        // 1. 初始化哈希链用于死锁检测 (P0 Enhancement)
        const stateHashes = new Set<string>();
        const getHash = (s: string) => s.replace(/\s+/g, ''); // 简单内容的哈希

        // Feature 15 & 02: 零配置自动环境嗅探与隐式风格推断
        const sniffedOptions = ProjectStyleMiner.mineStyles([sql]);
        const legacyOptions = ZeroConfigSniffer.sniff(sql);
        const finalOptions = { ...legacyOptions, ...sniffedOptions, ...options };

        const dialect = finalOptions.dialect || 'sql';

        // 1.5: Large File Handling (Feature 13 - BlockStreamer)
        if (sql.length > 200000 && !finalOptions.isInternalStreaming) {
            console.log('Massive file detected. Activating BlockStreamer...');
            const result = BlockStreamer.formatStream(
                sql,
                (s, o) => this.format(s, { ...o, isInternalStreaming: true }).result,
                finalOptions
            );
            return { result };
        }

        // Pass-through processing with cycle detection helper
        const trace = (current: string, passName: string): string => {
            const h = getHash(current);
            if (stateHashes.has(h)) {
                console.warn(`Format cycle detected at ${passName}. Aborting further passes.`);
                throw new Error('FORMAT_CYCLE');
            }
            stateHashes.add(h);
            return current;
        };

        try {
            // Pass 0.0: 处理隐形代码冻结区 (Feature 7)
            let processedSql = sql;
            if (finalOptions.stashedRanges && finalOptions.stashedRanges.length > 0) {
                processedSql = FormatStash.stashRanges(processedSql, finalOptions.stashedRanges);
            }

            // Pass 0.1: 隔离不需要格式化的白名单区域 (Feature 10)
            processedSql = trace(BypassProtector.isolateProtectedBlocks(processedSql), 'BypassProtector');

            // Pass 0.2: 方言特有操作符隔离保护 (Feature 16)
            processedSql = DialectProtector.maskDialectOperators(processedSql, finalOptions);

            // Pass 1: 模板标签混排预处理 (Feature 03)
            processedSql = TemplateMixer.extractTemplates(processedSql);

            // Pass 1.2: 残片句法错误恢复 (Feature 07)
            processedSql = ErrorRecovery.salvage(processedSql);

            // Pass 1.5: 冗长实体别名推断降噪 (Feature 05)
            if (finalOptions.useAliasInference !== false) {
                processedSql = AliasInferencer.applyAliases(processedSql);
            }

            // Pass 1.8: 尾随注释与悬浮注释提取 (Feature 04)
            const commentContext = CommentMagnet.extractComments(processedSql);
            processedSql = commentContext.sqlWithoutComments;

            // Pass 2: 基础格式化 (借助 sql-formatter)
            try {
                processedSql = format(processedSql, {
                    language: dialect,
                    tabWidth: finalOptions.tabWidth || 4,
                    keywordCase: finalOptions.keywordCase === 'preserve' ? undefined : (finalOptions.keywordCase || 'upper'),
                    linesBetweenQueries: finalOptions.linesBetweenQueries || 2,
                });
            } catch (e) {
                console.warn('Fallback formatting using FuzzyParser due to parsing error', e);
                const fuzzy = FuzzyParser.salvageAndFormat(sql, (s, o) => CodeFormatterService.format(s, o).result, finalOptions);
                return {
                    result: fuzzy.result,
                    wasSalvaged: true
                };
            }

            // Pass 3: 深度嵌套与多维列对齐 (Feature 01, 02, Phase 2, Phase 4)
            processedSql = AlignmentEngine.alignGrid(processedSql);
            processedSql = AlignmentEngine.alignCTEs(processedSql); // Phase 2
            processedSql = AlignmentEngine.alignCase(processedSql); // Phase 4
            processedSql = AlignmentEngine.breakDeepNesting(processedSql);

            // Pass 3.3: 语义化换行组合保护 (Feature 4)
            processedSql = SemanticGrouper.groupSemanticLines(processedSql);

            // Pass 3.2: 注释恢复重排列 (Feature 04)
            processedSql = CommentMagnet.restoreComments(processedSql, commentContext);

            // Pass 3.4: 错误恢复副作用还原 (Feature 07)
            processedSql = ErrorRecovery.rollbackSalvage(processedSql);

            // Pass 4: 模板标签恢复 (Feature 03)
            processedSql = TemplateMixer.restoreTemplates(processedSql);

            // Pass 4.2: 方言特有操作符恢复 (Feature 16)
            processedSql = DialectProtector.restoreDialectOperators(processedSql);

            // Pass 5: 特权被保护区还原 (Feature 10)
            processedSql = BypassProtector.restoreProtectedBlocks(processedSql);

            // Pass 5.5: 还原隐形代码冻结区 (Feature 7)
            processedSql = FormatStash.restoreStashes(processedSql);

            // 终极防卫卡口 1: 结构化破损校验锁 (Feature 06)
            if (!SafetyAssertion.assertSafe(sql, processedSql)) {
                console.warn('Safety assertion rejected formatting. Returning original text.');
                return { result: sql };
            }

            // 终极防卫卡口 2: 环境仿真校验 (Feature 15 - MockEnvironment)
            const validation = MockEnvironment.validate(sql, processedSql, dialect);
            if (!validation.isValid) {
                console.error('MockEnvironment validation failed:', validation.errors.join(', '));
                return { result: sql };
            }

            // 计算变更点 (Feature 14)
            const patches = PartialPatcher.calculatePatches(sql, processedSql);

            return {
                result: processedSql,
                patchCount: patches.length
            };
        } catch (e) {
            if (e instanceof Error && e.message === 'FORMAT_CYCLE') {
                return { result: sql }; // 返回原稿
            }
            throw e;
        }
    }

    /**
     * SQL 压缩 (Feature P2 - Token Safe Minifier)
     */
    public static minify(sql: string): string {
        try {
            return Minifier.minify(sql);
        } catch (e) {
            console.warn('Minifier failed, falling back to regex minify:', e);
            return sql.replace(/\s+/g, ' ').trim();
        }
    }
}
