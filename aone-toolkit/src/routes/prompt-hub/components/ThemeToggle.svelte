<script lang="ts">
    import { Sun, Moon } from "lucide-svelte";
    import { onMount } from "svelte";

    let isDark = $state(false);

    onMount(() => {
        // Check localStorage first, then system preference
        const stored = localStorage.getItem("theme");
        if (stored) {
            isDark = stored === "dark";
        } else {
            isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        applyTheme();
    });

    function toggleTheme() {
        isDark = !isDark;
        localStorage.setItem("theme", isDark ? "dark" : "light");
        applyTheme();
    }

    function applyTheme() {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }
</script>

<button
    onclick={toggleTheme}
    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
>
    {#if isDark}
        <Sun size={18} class="text-yellow-500" />
    {:else}
        <Moon size={18} class="text-gray-600" />
    {/if}
</button>
