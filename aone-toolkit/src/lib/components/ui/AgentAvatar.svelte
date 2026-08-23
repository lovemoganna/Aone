<script lang="ts">
    import { getAgentAvatar, type AvatarSpec } from "$lib/assets/agent-avatars";
    import { Bot, User as UserIcon } from "lucide-svelte";

    interface Props {
        agent?: any | string;
        size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | number;
        shape?: "circle" | "rounded" | "hexagon" | "prism" | "square";
        status?: "idle" | "thinking" | "speaking" | "online" | "offline";
        glow?: boolean;
        interactive?: boolean;
        showBadge?: boolean;
        avatarUrl?: string;
        class?: string;
    }

    let {
        agent,
        size = "md",
        shape = "rounded",
        status = "idle",
        glow = false,
        interactive = false,
        showBadge = false,
        avatarUrl,
        class: className = "",
    }: Props = $props();

    // Determine Agent ID & Meta
    const agentId = $derived.by(() => {
        if (!agent) return "decomposer";
        if (typeof agent === "string") return agent;
        return agent.id || agent.avatar || agent.role || "decomposer";
    });

    const avatarSpec = $derived.by<AvatarSpec>(() => {
        return getAgentAvatar(agentId);
    });

    // Size dimensions
    const sizeConfig = $derived.by(() => {
        if (typeof size === "number") {
            return {
                style: `width: ${size}px; height: ${size}px;`,
                px: size,
                badgeSize: Math.max(6, Math.floor(size * 0.25)),
            };
        }

        switch (size) {
            case "xs":
                return { style: "width: 20px; height: 20px;", px: 20, badgeSize: 6 };
            case "sm":
                return { style: "width: 28px; height: 28px;", px: 28, badgeSize: 8 };
            case "md":
                return { style: "width: 36px; height: 36px;", px: 36, badgeSize: 10 };
            case "lg":
                return { style: "width: 48px; height: 48px;", px: 48, badgeSize: 12 };
            case "xl":
                return { style: "width: 64px; height: 64px;", px: 64, badgeSize: 14 };
            case "2xl":
                return { style: "width: 80px; height: 80px;", px: 80, badgeSize: 18 };
            case "3xl":
                return { style: "width: 96px; height: 96px;", px: 96, badgeSize: 22 };
            default:
                return { style: "width: 36px; height: 36px;", px: 36, badgeSize: 10 };
        }
    });

    // Shape classes
    const shapeClass = $derived.by(() => {
        switch (shape) {
            case "circle":
                return "rounded-full";
            case "rounded":
                return "rounded-2xl";
            case "square":
                return "rounded-lg";
            case "hexagon":
                return "rounded-[28%]";
            case "prism":
                return "rounded-3xl";
            default:
                return "rounded-2xl";
        }
    });
</script>

<div
    class="relative inline-flex items-center justify-center shrink-0 select-none {shapeClass} {className}"
    style="{sizeConfig.style}"
    class:hover:scale-102={interactive}
    class:transition-transform={interactive}
    class:duration-150={interactive}
    class:cursor-pointer={interactive}
>
    <!-- Avatar Inner Container -->
    <div
        class="w-full h-full {shapeClass} overflow-hidden flex items-center justify-center relative border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-2xs"
    >
        {#if avatarUrl}
            <img
                src={avatarUrl}
                alt={avatarSpec.title}
                class="w-full h-full object-cover"
            />
        {:else}
            <!-- SVG Graphic -->
            {@html avatarSpec.svgContent}
        {/if}
    </div>

    <!-- Status Indicator / Dot Badge -->
    {#if showBadge || status === "online" || status === "speaking" || status === "thinking"}
        <span
            class="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-slate-950 shadow-2xs"
            style="width: {sizeConfig.badgeSize}px; height: {sizeConfig.badgeSize}px; background-color: {status === 'offline' ? '#94A3B8' : status === 'thinking' ? '#F59E0B' : '#10B981'};"
        ></span>
    {/if}
</div>
