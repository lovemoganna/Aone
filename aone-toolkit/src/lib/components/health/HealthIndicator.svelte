<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Wifi, WifiOff, AlertTriangle, Clock, Activity } from 'lucide-svelte';
  import { healthStore, quotaPercentage, latencyStatus } from '$lib/stores/healthStore.svelte';

  let health = $state<any>(null);
  let quota = $state(0);
  let latency = $state('good');

  // Subscribe to stores
  const unsubHealth = healthStore.subscribe(v => health = v);
  const unsubQuota = quotaPercentage.subscribe(v => quota = v);
  const unsubLatency = latencyStatus.subscribe(v => latency = v);

  onMount(() => {
    healthStore.startMonitoring({ heartbeatInterval: 30000 });
  });

  onDestroy(() => {
    unsubHealth();
    unsubQuota();
    unsubLatency();
    healthStore.stopMonitoring();
  });

  const statusConfig = {
    connected: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: '已连接', icon: Wifi },
    connecting: { color: 'text-amber-500', bg: 'bg-amber-500', label: '连接中', icon: Activity },
    disconnected: { color: 'text-slate-400', bg: 'bg-slate-400', label: '已断开', icon: WifiOff },
    error: { color: 'text-red-500', bg: 'bg-red-500', label: '错误', icon: AlertTriangle },
  };

  const latencyConfig = {
    good: { color: 'text-emerald-500', label: '< 100ms' },
    warning: { color: 'text-amber-500', label: '< 300ms' },
    critical: { color: 'text-red-500', label: '> 300ms' },
  };
</script>

{#if health}
  <div class="flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
    <!-- Connection Status -->
    <div class="flex items-center gap-1.5">
      <div class="w-2 h-2 rounded-full {statusConfig[health.status].bg} animate-pulse"></div>
      <svelte:component this={statusConfig[health.status].icon} class="w-3.5 h-3.5 {statusConfig[health.status].color}" />
      <span class="text-slate-600 dark:text-slate-400">{statusConfig[health.status].label}</span>
    </div>

    <!-- Divider -->
    <div class="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>

    <!-- Latency -->
    <div class="flex items-center gap-1.5">
      <Clock class="w-3.5 h-3.5 {latencyConfig[latency].color}" />
      <span class="{latencyConfig[latency].color}">{health.metrics.apiLatency}ms</span>
    </div>

    <!-- Divider -->
    <div class="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>

    <!-- Quota -->
    <div class="flex items-center gap-1.5">
      <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          class="h-full rounded-full transition-all {quota > 80 ? 'bg-red-500' : quota > 50 ? 'bg-amber-500' : 'bg-blue-500'}"
          style="width: {quota}%"
        ></div>
      </div>
      <span class="text-slate-500 dark:text-slate-400">{quota}%</span>
    </div>
  </div>
{/if}
