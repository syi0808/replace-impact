<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "caution" | "muted";

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
    class?: HTMLAttributes["class"];
  }>(),
  {
    variant: "default",
  },
);
</script>

<template>
  <span
    data-slot="badge"
    :class="cn('ui-badge', `ui-badge--${variant}`, props.class)"
  >
    <slot />
  </span>
</template>
