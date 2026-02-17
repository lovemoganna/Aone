<script lang="ts">
  import { cn } from '$lib/utils/cn';

  type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
  type Animation = 'pulse' | 'wave' | 'none';

  interface Props {
    variant?: SkeletonVariant;
    width?: string;
    height?: string;
    class?: string;
    animation?: Animation;
  }

  let {
    variant = 'text',
    width,
    height,
    class: className = '',
    animation = 'pulse',
  }: Props = $props();

  const variantClasses: Record<SkeletonVariant, string> = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses: Record<Animation, string> = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };
</script>

<div
  class={cn(
    'bg-slate-200 dark:bg-slate-700',
    variantClasses[variant],
    animationClasses[animation],
    className
  )}
  style:width={width}
  style:height={height}
></div>
