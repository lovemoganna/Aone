<script lang="ts">
	import "../app.css";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import StorageManagerModal from "$lib/components/StorageManagerModal.svelte";
	import ToastContainer from "$lib/components/toast/ToastContainer.svelte";
	import ProgressIndicator from "$lib/components/progress/ProgressIndicator.svelte";
	import { sidebarCollapsed, theme } from "$lib/stores";
	import { onMount } from "svelte";

	let { children } = $props();
	let isStorageManagerOpen = $state(false);

	onMount(() => {
		theme.init();

		const handleStorageOpenEvent = () => {
			isStorageManagerOpen = true;
		};
		window.addEventListener("open-storage-manager", handleStorageOpenEvent);
		return () => {
			window.removeEventListener("open-storage-manager", handleStorageOpenEvent);
		};
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
	<StorageManagerModal bind:isOpen={isStorageManagerOpen} />

	<main
		class="
      h-screen overflow-hidden flex flex-col transition-[margin-left] duration-300 ease-out
      ml-16 {$sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
    "
	>
		<div class="h-full flex-1 flex flex-col overflow-hidden">
			{@render children()}
		</div>
	</main>
</div>

