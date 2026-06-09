<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "warning";

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant;
    role?: "status" | "alert" | "note";
    class?: HTMLAttributes["class"];
  }>(),
  {
    variant: "default",
    role: "status",
  },
);
</script>

<template>
  <div
    data-slot="alert"
    :role="role"
    :class="cn('ui-alert', `ui-alert--${variant}`, props.class)"
  >
    <slot />
  </div>
</template>
