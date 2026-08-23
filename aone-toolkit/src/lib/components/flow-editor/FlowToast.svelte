<script lang="ts">
    import { toastStore } from "$lib/stores/toastStore";
    import { fly } from "svelte/transition";
    import { CheckCircle, AlertCircle, Info, X } from "lucide-svelte";

    // Subscribe to store
    let toasts = $derived($toastStore);
</script>

<div
    class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
>
    {#each toasts as toast (toast.id)}
        <div
            class="bg-slate-900/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px] pointer-events-auto backdrop-blur-sm"
            in:fly={{ y: 20, duration: 200 }}
            out:fly={{ opacity: 0, duration: 200 }}
        >
            {#if toast.type === "success"}
                <CheckCircle size={18} class="text-green-400" />
            {:else if toast.type === "error"}
                <AlertCircle size={18} class="text-red-400" />
            {:else if toast.type === "warning"}
                <AlertCircle size={18} class="text-yellow-400" />
            {:else}
                <Info size={18} class="text-blue-400" />
            {/if}

            <span class="text-sm font-medium">{toast.message}</span>
        </div>
    {/each}
</div>
