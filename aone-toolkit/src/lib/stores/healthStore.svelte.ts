import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface HealthMetrics {
  apiLatency: number;
  apiQuotaUsed: number;
  apiQuotaTotal: number;
  lastHeartbeat: number;
  errorCount: number;
}

export interface HealthState {
  status: ConnectionStatus;
  metrics: HealthMetrics;
  errors: string[];
}

const DEFAULT_HEALTH: HealthState = {
  status: 'connected',
  metrics: {
    apiLatency: 0,
    apiQuotaUsed: 0,
    apiQuotaTotal: 1000,
    lastHeartbeat: Date.now(),
    errorCount: 0,
  },
  errors: [],
};

function createHealthStore() {
  const { subscribe, update, set } = writable<HealthState>(DEFAULT_HEALTH);
  
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  function startMonitoring(config?: {
    heartbeatInterval?: number;
    onStatusChange?: (status: ConnectionStatus) => void;
  }) {
    const interval = config?.heartbeatInterval || 30000; // 30s default
    
    // Clear existing intervals
    stopMonitoring();
    
    // Start heartbeat
    heartbeatInterval = setInterval(() => {
      heartbeat();
    }, interval);
    
    // Initial heartbeat
    heartbeat();
  }

  function stopMonitoring() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  }

  async function heartbeat() {
    update((state) => ({
      ...state,
      status: 'connecting',
    }));

    try {
      // Simulate API check - in real app, this would be an actual health endpoint
      const start = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      const latency = Date.now() - start;

      update((state) => ({
        ...state,
        status: 'connected',
        metrics: {
          ...state.metrics,
          apiLatency: latency,
          lastHeartbeat: Date.now(),
        },
        errors: [],
      }));
    } catch (error) {
      update((state) => ({
        ...state,
        status: 'error',
        metrics: {
          ...state.metrics,
          errorCount: state.metrics.errorCount + 1,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }));

      // Auto reconnect after error
      reconnectTimeout = setTimeout(() => {
        heartbeat();
      }, 5000);
    }
  }

  function setStatus(status: ConnectionStatus) {
    update((state) => ({
      ...state,
      status,
    }));
  }

  function updateMetrics(partial: Partial<HealthMetrics>) {
    update((state) => ({
      ...state,
      metrics: {
        ...state.metrics,
        ...partial,
      },
    }));
  }

  function setQuota(used: number, total: number) {
    update((state) => ({
      ...state,
      metrics: {
        ...state.metrics,
        apiQuotaUsed: used,
        apiQuotaTotal: total,
      },
    }));
  }

  function addError(error: string) {
    update((state) => ({
      ...state,
      status: 'error',
      errors: [...state.errors, error].slice(-5), // Keep last 5 errors
      metrics: {
        ...state.metrics,
        errorCount: state.metrics.errorCount + 1,
      },
    }));
  }

  function clearErrors() {
    update((state) => ({
      ...state,
      errors: [],
    }));
  }

  function reset() {
    stopMonitoring();
    set(DEFAULT_HEALTH);
  }

  return {
    subscribe,
    startMonitoring,
    stopMonitoring,
    heartbeat,
    setStatus,
    updateMetrics,
    setQuota,
    addError,
    clearErrors,
    reset,
  };
}

export const healthStore = createHealthStore();

// Derived store for quota percentage
export const quotaPercentage = derived(healthStore, ($health) => {
  if ($health.metrics.apiQuotaTotal === 0) return 0;
  return Math.round(($health.metrics.apiQuotaUsed / $health.metrics.apiQuotaTotal) * 100);
});

// Derived store for latency status
export const latencyStatus = derived(healthStore, ($health) => {
  const latency = $health.metrics.apiLatency;
  if (latency < 100) return 'good';
  if (latency < 300) return 'warning';
  return 'critical';
});
