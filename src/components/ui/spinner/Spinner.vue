<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <span
    data-slot="spinner"
    aria-hidden="true"
    :class="cn('ui-spinner', props.class)"
  />
</template>
