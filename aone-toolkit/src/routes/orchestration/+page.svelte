<script lang="ts">
    import { legacyAgentStudioRoutes } from "$lib/legacyRoutes";

    const route = legacyAgentStudioRoutes.orchestration;
</script>

<svelte:head>
    <title>Redirecting to Agent Studio Orchestration - Aone Toolkit</title>
</svelte:head>

<div class="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
    <p class="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
        Legacy route
    </p>
    <h1 class="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
        Orchestration now lives in Agent Studio
    </h1>
    <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {route.reason}
    </p>
    <a
        class="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        href={route.to}
    >
        Open Agent Studio Orchestration
    </a>
</div>
