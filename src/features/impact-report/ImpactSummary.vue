<script setup lang="ts">
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ImpactReport, SignedMetric } from "../../types/report";
import {
  formatBytes,
  formatCarbon,
  formatCompact,
  formatHours,
} from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
}>();

function formatMetric(metric: SignedMetric, value: number | null): string {
  switch (metric.unit) {
    case "bytes":
      return formatBytes(value);
    case "files":
    case "installs":
    case "packages":
      return formatCompact(value);
    case "kgCO2e":
      return formatCarbon(value);
    case "seconds":
      return formatHours(value);
  }
}

function polarityClass(value: number | null): string {
  if (value === null) {
    return "unknown";
  }

  if (value < 0) {
    return "negative";
  }

  if (value === 0) {
    return "neutral";
  }

  return "positive";
}
</script>

<template>
  <section class="section-block" aria-labelledby="impact-summary-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Registry estimate</p>
        <h2 id="impact-summary-heading">Impact summary</h2>
      </div>
      <Badge variant="outline">live npm metadata</Badge>
    </div>

    <Alert
      v-if="
        report.metrics.traffic.perInstall !== null &&
        report.metrics.traffic.perInstall < 0
      "
      variant="warning"
    >
      This replacement may increase package traffic.
    </Alert>

    <div class="metric-grid">
      <Card
        v-for="metric in [
          report.metrics.traffic,
          report.metrics.files,
          report.metrics.unpacked,
          report.metrics.reach,
          report.metrics.carbonMonthly,
        ]"
        :key="metric.label"
        class="metric-card"
        :class="polarityClass(metric.perInstall)"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ formatMetric(metric, metric.perInstall) }}</strong>
        <dl>
          <div>
            <dt>Monthly estimate</dt>
            <dd>{{ formatMetric(metric, metric.monthly) }}</dd>
          </div>
          <div>
            <dt>Yearly estimate</dt>
            <dd>{{ formatMetric(metric, metric.yearly) }}</dd>
          </div>
        </dl>
      </Card>
    </div>

    <p class="caveat">
      These are estimated, potential impacts based on npm metadata and downloads
      as a proxy for reach.
    </p>
  </section>
</template>
