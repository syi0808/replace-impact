<script setup lang="ts">
import { Check, Copy, FileText } from "lucide-vue-next";
import { computed, ref } from "vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ImpactReport } from "../../types/report";
import { generatePrMarkdown } from "./generatePrMarkdown";

const props = defineProps<{
  report: ImpactReport;
}>();

const copied = ref(false);
const copyError = ref<string | null>(null);

const reportUrl = computed(
  () => `${window.location.pathname}${window.location.search}`,
);
const markdown = computed(() =>
  generatePrMarkdown(props.report, reportUrl.value),
);

async function copyMarkdown(): Promise<void> {
  copyError.value = null;
  try {
    await navigator.clipboard.writeText(markdown.value);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch (error) {
    copyError.value =
      error instanceof Error
        ? error.message
        : "Clipboard permission was denied.";
  }
}
</script>

<template>
  <section class="section-block" aria-labelledby="markdown-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Pull request note</p>
        <h2 id="markdown-heading">PR note</h2>
      </div>
      <Button variant="outline" type="button" @click="copyMarkdown">
        <Check v-if="copied" aria-hidden="true" :size="17" />
        <Copy v-else aria-hidden="true" :size="17" />
        <span>{{ copied ? "Copied" : "Copy" }}</span>
      </Button>
    </div>
    <Alert v-if="copyError" variant="warning" role="alert">{{
      copyError
    }}</Alert>
    <details class="preview-details">
      <summary>
        <FileText aria-hidden="true" :size="16" />
        Preview
      </summary>
      <pre class="markdown-preview">{{ markdown }}</pre>
    </details>
  </section>
</template>
