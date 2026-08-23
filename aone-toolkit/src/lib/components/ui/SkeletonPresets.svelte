<script lang="ts" module>
  import Skeleton from './Skeleton.svelte';

  export { Skeleton };

  // Card skeleton
  export function createCardSkeleton() {
    return {
      title: Skeleton,
      description: Skeleton,
      image: Skeleton,
    };
  }
</script>
