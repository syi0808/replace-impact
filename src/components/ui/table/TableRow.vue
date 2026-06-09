<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <tr data-slot="table-row" :class="cn('ui-table-row', props.class)">
    <slot />
  </tr>
</template>
