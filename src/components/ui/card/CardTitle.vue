<script setup lang="ts">
import type { Component, HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    as?: string | Component;
    class?: HTMLAttributes["class"];
  }>(),
  {
    as: "h3",
  },
);
</script>

<template>
  <component
    :is="as"
    data-slot="card-title"
    :class="cn('ui-card-title', props.class)"
  >
    <slot />
  </component>
</template>
