<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { diagramStore } from "../lib/store.svelte";
    import { Maximize, Minimize, X } from "lucide-svelte";

    let { onClose } = $props<{ onClose: () => void }>();

    let container: HTMLElement;
    let cursorX = $state(0);
    let cursorY = $state(0);
    let isMoving = $state(false);
    let moveTimeout: any;

    function handleMouseMove(e: MouseEvent) {
        cursorX = e.clientX;
        cursorY = e.clientY;
        isMoving = true;

        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            isMoving = false;
        }, 2000);
    }

    onMount(() => {
        document.body.style.overflow = "hidden";
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("mousemove", handleMouseMove);
        };
    });
</script>

<div
    class="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-8 overflow-hidden"
    role="presentation"
>
    <!-- Controls (Hidden if inactive) -->
    <div
        class="absolute top-4 right-4 flex items-center gap-2 transition-opacity duration-300 {isMoving
            ? 'opacity-100'
            : 'opacity-0'}"
    >
        <button
            class="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-white/70 hover:text-white backdrop-blur-sm"
            onclick={onClose}
        >
            <X size={24} />
        </button>
    </div>

    <!-- Diagram -->
    <div
        class="w-full h-full flex items-center justify-center"
        bind:this={container}
    >
        <div
            class="max-w-full max-h-full p-8 bg-white rounded-xl shadow-2xl overflow-hidden presentation-svg"
        >
            {@html diagramStore.svg}
        </div>
    </div>

    <!-- Laser Pointer -->
    <div
        class="fixed w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] pointer-events-none mix-blend-screen transition-transform duration-75 z-[101]"
        style="left: {cursorX}px; top: {cursorY}px; transform: translate(-50%, -50%); display: {isMoving
            ? 'block'
            : 'none'};"
    ></div>
</div>

<style>
    :global(.presentation-svg svg) {
        width: 100% !important;
        height: 100% !important;
        max-height: 90vh;
    }
</style>
