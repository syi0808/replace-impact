<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const model = defineModel<string | number>();
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <select
    v-bind="$attrs"
    v-model="model"
    data-slot="select"
    :class="cn('ui-select', props.class)"
  >
    <slot />
  </select>
</template>
