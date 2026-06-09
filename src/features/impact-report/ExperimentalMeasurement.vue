<script setup lang="ts">
import { Play, AlertTriangle } from "lucide-vue-next";
import { ref } from "vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <Button type="button" :disabled="running" @click="runMeasurement">
        <Play aria-hidden="true" :size="17" />
        <span>{{
          running ? "Running" : "Run browser install measurement"
        }}</span>
      </Button>
    </div>

    <p class="caveat">
      Experimental results are browser-side install measurements and are not
      mixed into the primary registry estimate.
    </p>

    <div v-if="result?.ok" class="measurement-grid">
      <Card>
        <span>Before packages</span>
        <strong>{{ formatCompact(result.before.packageCount) }}</strong>
      </Card>
      <Card>
        <span>After packages</span>
        <strong>{{ formatCompact(result.after.packageCount) }}</strong>
      </Card>
      <Card>
        <span>Package delta</span>
        <strong>{{ formatCompact(result.delta.packageCount) }}</strong>
      </Card>
      <Card>
        <span>Before files</span>
        <strong>{{ formatCompact(result.before.fileCount) }}</strong>
      </Card>
      <Card>
        <span>After files</span>
        <strong>{{ formatCompact(result.after.fileCount) }}</strong>
      </Card>
      <Card>
        <span>File delta</span>
        <strong>{{ formatCompact(result.delta.fileCount) }}</strong>
      </Card>
      <Card>
        <span>Before node_modules</span>
        <strong>{{ formatBytes(result.before.nodeModulesBytes) }}</strong>
      </Card>
      <Card>
        <span>After node_modules</span>
        <strong>{{ formatBytes(result.after.nodeModulesBytes) }}</strong>
      </Card>
      <Card>
        <span>Size delta</span>
        <strong>{{ formatBytes(result.delta.nodeModulesBytes) }}</strong>
      </Card>
    </div>

    <Alert v-else-if="result && !result.ok" variant="warning">
      <AlertTriangle aria-hidden="true" :size="16" />
      <span>{{ result.reason }}</span>
    </Alert>
  </section>
</template>
