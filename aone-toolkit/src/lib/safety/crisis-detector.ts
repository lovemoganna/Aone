/**
 * 安全层模块 - 危机检测与能力边界
 * 
 * 提供：
 * - 危机关键词检测（一级、二级）
 * - 能力边界检查
 * - 响应生成
 */

import { SURVIVAL_PROMPTS } from '../constants/survivalPrompts';

// ============== 危机级别 ==============

export type CrisisLevel = 0 | 1 | 2;

export interface CrisisResult {
    level: CrisisLevel;
    detected: boolean;
    response: string | null;
    shouldInterrupt: boolean;
}

// ============== 能力边界 ==============

export type BoundaryType = 'legal' | 'medical' | 'investment' | 'illegal';

export interface BoundaryResult {
    isBoundary: boolean;
    boundaryType?: BoundaryType;
    response: string;
}

// ============== 危机检测 ==============

/**
 * 检测文本中的危机关键词
 * @param text 要检测的文本
 * @returns 危机检测结果
 */
export function detectCrisis(text: string): CrisisResult {
    const lowerText = text.toLowerCase();
    
    // 一级危机：立即中断
    const level1Keywords = SURVIVAL_PROMPTS.crisis.keywords.level1;
    const hasLevel1 = level1Keywords.some(keyword => 
        lowerText.includes(keyword.toLowerCase())
    );
    
    if (hasLevel1) {
        return {
            level: 1,
            detected: true,
            response: SURVIVAL_PROMPTS.crisis.responses.level1,
            shouldInterrupt: true
        };
    }
    
    // 二级危机：嵌入提醒
    const level2Keywords = SURVIVAL_PROMPTS.crisis.keywords.level2;
    const hasLevel2 = level2Keywords.some(keyword => 
        lowerText.includes(keyword.toLowerCase())
    );
    
    if (hasLevel2) {
        return {
            level: 2,
            detected: true,
            response: SURVIVAL_PROMPTS.crisis.responses.level2,
            shouldInterrupt: false
        };
    }
    
    // 无危机
    return {
        level: 0,
        detected: false,
        response: null,
        shouldInterrupt: false
    };
}

/**
 * 获取危机响应文本
 * @param level 危机级别
 * @returns 响应文本
 */
export function getCrisisResponse(level: CrisisLevel): string {
    if (level === 1) {
        return SURVIVAL_PROMPTS.crisis.responses.level1;
    } else if (level === 2) {
        return SURVIVAL_PROMPTS.crisis.responses.level2;
    }
    return '';
}

/**
 * 获取免责声明
 */
export function getDisclaimer(): string {
    return SURVIVAL_PROMPTS.crisis.disclaimer;
}

// ============== 能力边界检查 ==============

// 边界关键词
const boundaryKeywords: Record<BoundaryType, string[]> = {
    legal: ['法律', '律师', '打官司', '法院', '判刑', '犯罪'],
    medical: ['医生', '医院', '看病', '诊断', '治疗', '开药', '手术'],
    investment: ['投资', '理财', '买股票', '买基金', '炒币', '赚钱'],
    illegal: ['违法', '犯罪', '黑客', '病毒', '赌博', '色情']
};

/**
 * 检测文本是否涉及能力边界
 * @param text 要检测的文本
 * @returns 边界检测结果
 */
export function checkBoundary(text: string): BoundaryResult {
    const lowerText = text.toLowerCase();
    
    // 法律边界
    if (boundaryKeywords.legal.some(keyword => lowerText.includes(keyword))) {
        return {
            isBoundary: true,
            boundaryType: 'legal',
            response: '这个问题涉及法律咨询。建议你拨打12348法律援助热线，有专业律师可以免费为你提供帮助。'
        };
    }
    
    // 医疗边界
    if (boundaryKeywords.medical.some(keyword => lowerText.includes(keyword))) {
        return {
            isBoundary: true,
            boundaryType: 'medical',
            response: '这个问题涉及医疗专业。建议你尽快就近就医，或拨打120急救电话。'
        };
    }
    
    // 投资边界
    if (boundaryKeywords.investment.some(keyword => lowerText.includes(keyword))) {
        return {
            isBoundary: true,
            boundaryType: 'investment',
            response: '我不做投资建议。但我可以帮你理清现有的资源状况，具体买什么投资产品需要你自己判断。'
        };
    }
    
    // 违法边界
    if (boundaryKeywords.illegal.some(keyword => lowerText.includes(keyword))) {
        return {
            isBoundary: true,
            boundaryType: 'illegal',
            response: '抱歉，这个问题我无法帮助。'
        };
    }
    
    return {
        isBoundary: false,
        response: ''
    };
}

// ============== 完整安全检查 ==============

export interface SafetyResult {
    shouldBlock: boolean;
    crisisLevel: CrisisLevel;
    crisisResponse: string | null;
    boundaryResponse: string | null;
    shouldShowDisclaimer: boolean;
}

/**
 * 完整的安全检查
 * @param text 用户输入的文本
 * @returns 综合安全检查结果
 */
export function performSafetyCheck(text: string): SafetyResult {
    // 危机检测
    const crisisResult = detectCrisis(text);
    
    // 边界检查
    const boundaryResult = checkBoundary(text);
    
    return {
        shouldBlock: crisisResult.shouldInterrupt,
        crisisLevel: crisisResult.level,
        crisisResponse: crisisResult.response,
        boundaryResponse: boundaryResult.isBoundary ? boundaryResult.response : null,
        shouldShowDisclaimer: !crisisResult.detected && !boundaryResult.isBoundary
    };
}

// ============== 底部常驻声明 ==============

export const FOOTER_DISCLAIMER = '我是认知决策工具，不是心理医生，不做诊断，不开处方。';

export default {
    detectCrisis,
    checkBoundary,
    performSafetyCheck,
    getCrisisResponse,
    getDisclaimer,
    FOOTER_DISCLAIMER
};
