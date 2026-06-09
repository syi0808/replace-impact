<script setup lang="ts">
import { Play, AlertTriangle } from "lucide-vue-next";
import { ref } from "vue";
import type { ImpactReport } from "../../types/report";
import type { InstallMeasurementResult } from "../../core/webcontainer/runInstallMeasurement";
import { runInstallMeasurement } from "../../core/webcontainer/runInstallMeasurement";
import { formatBytes, formatCompact } from "../../core/metrics/formatting";

const props = defineProps<{
  report: ImpactReport;
}>();

const running = ref(false);
const result = ref<InstallMeasurementResult | null>(null);

async function runMeasurement(): Promise<void> {
  running.value = true;
  result.value = null;
  try {
    result.value = await runInstallMeasurement(props.report);
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <section class="section-block" aria-labelledby="experimental-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Experimental</p>
        <h2 id="experimental-heading">WebContainer install measurement</h2>
      </div>
      <button class="primary-button" type="button" :disabled="running" @click="runMeasurement">
        <Play aria-hidden="true" :size="17" />
        <span>{{ running ? "Running" : "Run browser install measurement" }}</span>
      </button>
    </div>

    <p class="caveat">
      Experimental results are browser-side install measurements and are not mixed into the primary registry estimate.
    </p>

    <div v-if="result?.ok" class="measurement-grid">
      <div>
        <span>Before packages</span>
        <strong>{{ formatCompact(result.before.packageCount) }}</strong>
      </div>
      <div>
        <span>After packages</span>
        <strong>{{ formatCompact(result.after.packageCount) }}</strong>
      </div>
      <div>
        <span>Package delta</span>
        <strong>{{ formatCompact(result.delta.packageCount) }}</strong>
      </div>
      <div>
        <span>Before files</span>
        <strong>{{ formatCompact(result.before.fileCount) }}</strong>
      </div>
      <div>
        <span>After files</span>
        <strong>{{ formatCompact(result.after.fileCount) }}</strong>
      </div>
      <div>
        <span>File delta</span>
        <strong>{{ formatCompact(result.delta.fileCount) }}</strong>
      </div>
      <div>
        <span>Before node_modules</span>
        <strong>{{ formatBytes(result.before.nodeModulesBytes) }}</strong>
      </div>
      <div>
        <span>After node_modules</span>
        <strong>{{ formatBytes(result.after.nodeModulesBytes) }}</strong>
      </div>
      <div>
        <span>Size delta</span>
        <strong>{{ formatBytes(result.delta.nodeModulesBytes) }}</strong>
      </div>
    </div>

    <div v-else-if="result && !result.ok" class="status status-warning">
      <AlertTriangle aria-hidden="true" :size="16" />
      <span>{{ result.reason }}</span>
    </div>
  </section>
</template>
