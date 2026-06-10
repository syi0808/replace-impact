<script setup lang="ts">
import type { Component, HTMLAttributes } from "vue";
import { computed } from "vue";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

const props = withDefaults(
  defineProps<{
    as?: string | Component;
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  {
    as: "button",
    variant: "default",
    size: "default",
    type: "button",
    disabled: false,
  },
);

const isNativeButton = computed(() => props.as === "button");
const classes = computed(() =>
  cn(
    "ui-button",
    `ui-button--${props.variant}`,
    props.size === "default" ? undefined : `ui-button--${props.size}`,
    props.class,
  ),
);
</script>

<template>
  <component
    :is="as"
    data-slot="button"
    :class="classes"
    :type="isNativeButton ? type : undefined"
    :disabled="isNativeButton ? disabled : undefined"
    :aria-disabled="!isNativeButton && disabled ? 'true' : undefined"
    :tabindex="!isNativeButton && disabled ? -1 : undefined"
  >
    <slot />
  </component>
</template>
