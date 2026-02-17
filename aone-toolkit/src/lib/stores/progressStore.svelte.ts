import { writable, derived } from 'svelte/store';

export type ProgressStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';

export interface ProgressStep {
  id: string;
  label: string;
  status: ProgressStatus;
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface ProgressState {
  id: string;
  title: string;
  steps: ProgressStep[];
  currentStepIndex: number;
  totalProgress: number;
  status: ProgressStatus;
  startTime: number;
  endTime?: number;
  canCancel: boolean;
}

function createProgressStore() {
  const { subscribe, update, set } = writable<ProgressState | null>(null);

  function start(id: string, title: string, stepLabels: string[], canCancel = true) {
    const steps: ProgressStep[] = stepLabels.map((label, index) => ({
      id: `${id}-step-${index}`,
      label,
      status: index === 0 ? 'running' : 'idle',
      progress: 0,
      startTime: index === 0 ? Date.now() : undefined,
    }));

    set({
      id,
      title,
      steps,
      currentStepIndex: 0,
      totalProgress: 0,
      status: 'running',
      startTime: Date.now(),
      canCancel,
    });
  }

  function updateStep(stepIndex: number, progress: number, status?: ProgressStatus) {
    update((state) => {
      if (!state) return null;

      const newSteps = [...state.steps];
      const step = { ...newSteps[stepIndex] };
      
      if (progress !== undefined) {
        step.progress = Math.min(100, Math.max(0, progress));
      }
      
      if (status) {
        step.status = status;
        if (status === 'running' && !step.startTime) {
          step.startTime = Date.now();
        }
        if ((status === 'completed' || status === 'error' || status === 'cancelled') && !step.endTime) {
          step.endTime = Date.now();
        }
      }

      newSteps[stepIndex] = step;

      // Calculate total progress
      const totalProgress = newSteps.reduce((acc, s, i) => {
        if (i < stepIndex) return acc + 100;
        if (i === stepIndex) return acc + step.progress;
        return acc;
      }, 0) / newSteps.length;

      // Update current step index
      let currentStepIndex = stepIndex;
      if (status === 'completed' && stepIndex < newSteps.length - 1) {
        currentStepIndex = stepIndex + 1;
        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'running', startTime: Date.now() };
      }

      return {
        ...state,
        steps: newSteps,
        currentStepIndex,
        totalProgress,
        status: status || state.status,
      };
    });
  }

  function complete() {
    update((state) => {
      if (!state) return null;
      return {
        ...state,
        status: 'completed',
        endTime: Date.now(),
        totalProgress: 100,
        steps: state.steps.map(s => ({ ...s, status: 'completed' as ProgressStatus, progress: 100 })),
      };
    });
  }

  function error(message: string) {
    update((state) => {
      if (!state) return null;
      return {
        ...state,
        status: 'error',
        endTime: Date.now(),
        steps: state.steps.map((s, i) => 
          i <= state.currentStepIndex 
            ? { ...s, status: 'error' as ProgressStatus, error: i === state.currentStepIndex ? message : undefined }
            : s
        ),
      };
    });
  }

  function cancel() {
    update((state) => {
      if (!state || !state.canCancel) return null;
      return {
        ...state,
        status: 'cancelled',
        endTime: Date.now(),
      };
    });
  }

  function reset() {
    set(null);
  }

  return {
    subscribe,
    start,
    updateStep,
    complete,
    error,
    cancel,
    reset,
  };
}

export const progressStore = createProgressStore();
