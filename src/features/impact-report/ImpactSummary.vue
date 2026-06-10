<script setup lang="ts">
import type { Component } from "vue";
import {
  AlertTriangle,
  CloudDownload,
  FileStack,
  HardDriveDownload,
  Leaf,
  Route,
  Info,
} from "lucide-vue-next";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ImpactReport, SignedMetric } from "../../types/report";
import {
  formatBytes,
  formatCarbon,
  formatCount,
  formatCompact,
  formatHours,
} from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
}>();

type MetricKey = keyof ImpactReport["metrics"];

const summaryMetrics = [
  {
    key: "traffic",
    label: "Traffic",
    title: "Potential package traffic avoided",
    icon: CloudDownload,
  },
  {
    key: "files",
    label: "Files",
    title: "Files not unpacked",
    icon: FileStack,
  },
  {
    key: "unpacked",
    label: "Size",
    title: "Filesystem work avoided",
    icon: HardDriveDownload,
  },
  {
    key: "reach",
    label: "Reach",
    title: "Potential direct npm install paths improved",
    icon: Route,
  },
  {
    key: "carbonMonthly",
    label: "CO2e",
    title: "Estimated emissions avoided",
    icon: Leaf,
  },
] satisfies ReadonlyArray<{
  key: MetricKey;
  label: string;
  title: string;
  icon: Component;
}>;

function formatMetric(
  metric: SignedMetric,
  value: number | null,
  options: { compact?: boolean } = {},
): string {
  switch (metric.unit) {
    case "bytes":
      return formatBytes(value);
    case "files":
    case "installs":
    case "packages":
      return options.compact ? formatShortCount(value) : formatCompact(value);
    case "kgCO2e":
      return options.compact ? formatCarbonShort(value) : formatCarbon(value);
    case "seconds":
      return formatHours(value);
  }
}

function formatShortCount(value: number | null): string {
  return formatCount(value, {
    maximumFractionDigits: 2,
    notation: "compact",
  });
}

function formatCarbonShort(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1000) {
    return `${sign}${formatCount(abs / 1000, {
      maximumFractionDigits: 2,
      notation: "compact",
    })} t CO2e`;
  }

  return formatCarbon(value);
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
        <p class="eyebrow">Estimate</p>
        <h2 id="impact-summary-heading">Summary</h2>
      </div>
      <Badge variant="outline">
        <Info aria-hidden="true" :size="14" />
        npm + downloads
      </Badge>
    </div>

    <Alert
      v-if="
        report.metrics.traffic.perInstall !== null &&
        report.metrics.traffic.perInstall < 0
      "
      variant="warning"
    >
      <AlertTriangle aria-hidden="true" :size="16" />
      <span>May increase traffic.</span>
    </Alert>

    <div class="metric-grid">
      <Card
        v-for="item in summaryMetrics"
        :key="item.key"
        class="metric-card"
        :class="polarityClass(report.metrics[item.key].perInstall)"
        :aria-label="item.title"
        :title="item.title"
      >
        <div class="metric-card-top">
          <span class="metric-icon" aria-hidden="true">
            <component :is="item.icon" :size="17" />
          </span>
          <span>{{ item.label }}</span>
        </div>
        <strong>{{
          formatMetric(
            report.metrics[item.key],
            report.metrics[item.key].perInstall,
          )
        }}</strong>
        <span class="metric-scope">per install</span>
        <dl class="metric-periods">
          <div>
            <dt>mo</dt>
            <dd>
              {{
                formatMetric(
                  report.metrics[item.key],
                  report.metrics[item.key].monthly,
                  { compact: true },
                )
              }}
            </dd>
          </div>
          <div>
            <dt>yr</dt>
            <dd>
              {{
                formatMetric(
                  report.metrics[item.key],
                  report.metrics[item.key].yearly,
                  { compact: true },
                )
              }}
            </dd>
          </div>
        </dl>
      </Card>
    </div>

    <p class="report-note">
      <Info aria-hidden="true" :size="16" />
      <span>Estimated from npm metadata and downloads.</span>
    </p>
  </section>
</template>
