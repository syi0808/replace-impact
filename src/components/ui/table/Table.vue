<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  class?: HTMLAttributes["class"];
  wrapperClass?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    data-slot="table-container"
    :class="cn('ui-table-container', props.wrapperClass)"
  >
    <table
      v-bind="$attrs"
      data-slot="table"
      :class="cn('ui-table', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
