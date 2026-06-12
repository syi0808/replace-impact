<script setup lang="ts">
import {
  AlertTriangle,
  Archive,
  FileStack,
  Info,
  PackageOpen,
  Play,
} from "lucide-vue-next";
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
        <h2 id="experimental-heading">Browser check</h2>
      </div>
      <Button
        type="button"
        :disabled="running"
        :aria-label="
          running
            ? 'Browser install measurement running'
            : 'Run browser install measurement'
        "
        @click="runMeasurement"
      >
        <Play aria-hidden="true" :size="17" />
        <span>{{ running ? "Running" : "Run check" }}</span>
      </Button>
    </div>

    <p class="report-note">
      <Info aria-hidden="true" :size="16" />
      <span>Browser result, excluded from the savings summary.</span>
    </p>

    <div v-if="result?.ok" class="measurement-grid">
      <Card>
        <span class="measurement-label">
          <PackageOpen aria-hidden="true" :size="16" />
          Pkg before
        </span>
        <strong>{{ formatCompact(result.before.packageCount) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <PackageOpen aria-hidden="true" :size="16" />
          Pkg after
        </span>
        <strong>{{ formatCompact(result.after.packageCount) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <PackageOpen aria-hidden="true" :size="16" />
          Pkg delta
        </span>
        <strong>{{ formatCompact(result.delta.packageCount) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <FileStack aria-hidden="true" :size="16" />
          Files before
        </span>
        <strong>{{ formatCompact(result.before.fileCount) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <FileStack aria-hidden="true" :size="16" />
          Files after
        </span>
        <strong>{{ formatCompact(result.after.fileCount) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <FileStack aria-hidden="true" :size="16" />
          Files delta
        </span>
        <strong>{{ formatCompact(result.delta.fileCount) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <Archive aria-hidden="true" :size="16" />
          Size before
        </span>
        <strong>{{ formatBytes(result.before.nodeModulesBytes) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <Archive aria-hidden="true" :size="16" />
          Size after
        </span>
        <strong>{{ formatBytes(result.after.nodeModulesBytes) }}</strong>
      </Card>
      <Card>
        <span class="measurement-label">
          <Archive aria-hidden="true" :size="16" />
          Size delta
        </span>
        <strong>{{ formatBytes(result.delta.nodeModulesBytes) }}</strong>
      </Card>
    </div>

    <Alert v-else-if="result && !result.ok" variant="warning">
      <AlertTriangle aria-hidden="true" :size="16" />
      <span>{{ result.reason }}</span>
    </Alert>
  </section>
</template>
