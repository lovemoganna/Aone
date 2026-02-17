<script lang="ts">
	import "../app.css";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import ClipboardPanel from "$lib/components/ClipboardPanel.svelte";
	import { ToastContainer } from "$lib/components/toast";
	import ProgressIndicator from "$lib/components/progress/ProgressIndicator.svelte";
	import { sidebarCollapsed, theme } from "$lib/stores";
	import { onMount } from "svelte";
	import { Clipboard } from "lucide-svelte";

	let { children } = $props();
	let isClipboardOpen = $state(false);

	onMount(() => {
		theme.init();
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950">
	<CommandPalette />
	<ToastContainer />
	<ProgressIndicator />
	<Sidebar />
	<ClipboardPanel bind:isOpen={isClipboardOpen} />

	<main
		class="
      min-h-screen transition-all duration-300 ease-out
      {$sidebarCollapsed ? 'ml-16' : 'ml-60'}
    "
	>
		<div class="p-6">
			{@render children()}
		</div>
	</main>

	<!-- Fixed Global Tools -->
	<div class="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
		<button
			class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:scale-110 transition-all group"
			onclick={() => (isClipboardOpen = !isClipboardOpen)}
			title="Clipboard History"
		>
			<Clipboard size={20} />
			<span
				class="absolute right-0 top-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-slate-800 scale-0 group-hover:scale-100 transition-transform"
			></span>
		</button>
	</div>
</div>
