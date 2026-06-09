<script setup lang="ts">
import { Check, Copy } from "lucide-vue-next";
import { computed, ref } from "vue";
import type { ImpactReport } from "../../types/report";
import { generatePrMarkdown } from "./generatePrMarkdown";

const props = defineProps<{
  report: ImpactReport;
}>();

const copied = ref(false);
const copyError = ref<string | null>(null);

const reportUrl = computed(() => `${window.location.pathname}${window.location.search}`);
const markdown = computed(() => generatePrMarkdown(props.report, reportUrl.value));

async function copyMarkdown(): Promise<void> {
  copyError.value = null;
  try {
    await navigator.clipboard.writeText(markdown.value);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch (error) {
    copyError.value = error instanceof Error ? error.message : "Clipboard permission was denied.";
  }
}
</script>

<template>
  <section class="section-block" aria-labelledby="markdown-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Pull request note</p>
        <h2 id="markdown-heading">PR Markdown</h2>
      </div>
      <button class="secondary-button" type="button" @click="copyMarkdown">
        <Check v-if="copied" aria-hidden="true" :size="17" />
        <Copy v-else aria-hidden="true" :size="17" />
        <span>{{ copied ? "Copied" : "Copy" }}</span>
      </button>
    </div>
    <p v-if="copyError" class="status status-warning">{{ copyError }}</p>
    <pre class="markdown-preview">{{ markdown }}</pre>
  </section>
</template>
