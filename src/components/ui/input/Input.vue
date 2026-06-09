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
  <input
    v-bind="$attrs"
    v-model="model"
    data-slot="input"
    :class="cn('ui-input', props.class)"
  />
</template>
