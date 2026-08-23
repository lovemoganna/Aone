<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    onMount(() => {
        goto("/developer-utilities#charts", { replaceState: true });
    });
</script>

<div class="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
    正在跳转至开发者工具箱 (Data Charts)...
</div>
