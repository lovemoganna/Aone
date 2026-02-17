import { writable } from 'svelte/store';

export interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

export interface OnboardingState {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  steps: OnboardingStep[];
}

function createOnboardingStore() {
  const { subscribe, update, set } = writable<OnboardingState>({
    isActive: false,
    currentStepIndex: 0,
    totalSteps: 0,
    steps: [],
  });

  function start(steps: OnboardingStep[]) {
    set({
      isActive: true,
      currentStepIndex: 0,
      totalSteps: steps.length,
      steps,
    });

    // Highlight first step
    highlightStep(0, steps);
  }

  function next() {
    update((state) => {
      if (!state.isActive) return state;

      const nextIndex = state.currentStepIndex + 1;
      
      // Clear previous highlight
      clearHighlight(state.steps[state.currentStepIndex]);

      if (nextIndex >= state.totalSteps) {
        // Complete onboarding
        return {
          ...state,
          isActive: false,
          currentStepIndex: 0,
        };
      }

      // Highlight next step
      highlightStep(nextIndex, state.steps);

      return {
        ...state,
        currentStepIndex: nextIndex,
      };
    });
  }

  function previous() {
    update((state) => {
      if (!state.isActive || state.currentStepIndex === 0) return state;

      const prevIndex = state.currentStepIndex - 1;

      // Clear current highlight
      clearHighlight(state.steps[state.currentStepIndex]);

      // Highlight previous step
      highlightStep(prevIndex, state.steps);

      return {
        ...state,
        currentStepIndex: prevIndex,
      };
    });
  }

  function goToStep(index: number) {
    update((state) => {
      if (!state.isActive || index < 0 || index >= state.totalSteps) return state;

      // Clear current highlight
      clearHighlight(state.steps[state.currentStepIndex]);

      // Highlight target step
      highlightStep(index, state.steps);

      return {
        ...state,
        currentStepIndex: index,
      };
    });
  }

  function skip() {
    update((state) => {
      // Clear current highlight
      if (state.steps[state.currentStepIndex]) {
        clearHighlight(state.steps[state.currentStepIndex]);
      }
      
      return {
        ...state,
        isActive: false,
        currentStepIndex: 0,
      };
    });
  }

  function complete() {
    update((state) => {
      // Clear current highlight
      if (state.steps[state.currentStepIndex]) {
        clearHighlight(state.steps[state.currentStepIndex]);
      }

      // Execute final action if exists
      const currentStep = state.steps[state.currentStepIndex];
      if (currentStep?.action) {
        currentStep.action();
      }

      return {
        ...state,
        isActive: false,
        currentStepIndex: 0,
      };
    });
  }

  // Helper functions
  function highlightStep(index: number, steps: OnboardingStep[]) {
    const step = steps[index];
    if (step?.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        element.classList.add('onboarding-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function clearHighlight(step: OnboardingStep) {
    if (step?.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        element.classList.remove('onboarding-highlight');
      }
    }
  }

  return {
    subscribe,
    start,
    next,
    previous,
    goToStep,
    skip,
    complete,
  };
}

export const onboardingStore = createOnboardingStore();

// Default onboarding steps for Agent Studio
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 Agent Studio',
    content: '这是您的一站式 AI Agent 开发平台。让我带您快速了解核心功能。',
    position: 'center',
  },
  {
    id: 'personas',
    title: '人格管理',
    content: '创建和管理 AI 人格，为您的 Agent 定义独特的角色和性格。',
    targetSelector: '[data-nav="personas"]',
    position: 'right',
  },
  {
    id: 'skills',
    title: '技能系统',
    content: '为 Agent 装备各种技能，扩展其能力范围。',
    targetSelector: '[data-nav="skills"]',
    position: 'right',
  },
  {
    id: 'orchestration',
    title: '编排工作流',
    content: '通过可视化流程编辑器编排复杂的工作流程。',
    targetSelector: '[data-nav="orchestration"]',
    position: 'right',
  },
  {
    id: 'multi-agent',
    title: '多 Agent 协作',
    content: '创建多个 Agent 协同工作，解决复杂任务。',
    targetSelector: '[data-nav="multi-agent"]',
    position: 'right',
  },
  {
    id: 'command-palette',
    title: '快捷命令',
    content: '按 Ctrl+K 快速搜索命令和跳转页面。',
    targetSelector: 'body',
    position: 'bottom',
  },
];
