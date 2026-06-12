<script setup lang="ts">
import type { Component } from "vue";
import {
  AlertTriangle,
  CloudDownload,
  FileStack,
  HardDriveDownload,
  Leaf,
  Info,
} from "lucide-vue-next";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EstimateKind } from "../../types/estimate";
import type {
  ImpactReport,
  ReportPeriod,
  SignedMetric,
} from "../../types/report";
import {
  formatCarbon,
  formatCount,
  formatEstimatedBytes,
  formatEstimatedCompact,
  formatEstimatedCount,
  formatEstimatedValue,
  formatHours,
} from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
  period: ReportPeriod;
}>();

type MetricKey = keyof ImpactReport["metrics"];

const summaryMetrics = [
  {
    key: "traffic",
    label: "Package traffic avoided",
    title: "Package traffic avoided",
    icon: CloudDownload,
  },
  {
    key: "files",
    label: "Files not unpacked",
    title: "Files not unpacked",
    icon: FileStack,
  },
  {
    key: "unpacked",
    label: "Unpacked size avoided",
    title: "Unpacked size avoided",
    icon: HardDriveDownload,
  },
  {
    key: "carbonMonthly",
    label: "Emissions avoided",
    title: "Emissions avoided",
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
  estimate: EstimateKind,
  options: { compact?: boolean } = {},
): string {
  switch (metric.unit) {
    case "bytes":
      return formatEstimatedBytes(value, estimate);
    case "files":
    case "installs":
    case "packages":
      return options.compact
        ? formatShortCount(value, estimate)
        : formatEstimatedCompact(value, estimate);
    case "kgCO2e":
      return options.compact
        ? formatCarbonShort(value, estimate)
        : formatEstimatedValue(value, estimate, formatCarbon);
    case "seconds":
      return formatEstimatedValue(value, estimate, formatHours);
  }
}

function formatShortCount(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedCount(value, estimate, {
    maximumFractionDigits: 2,
    notation: "compact",
  });
}

function formatCarbonShort(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(value, estimate, (knownValue) => {
    const abs = Math.abs(knownValue);
    const sign = knownValue < 0 ? "-" : "";

    if (abs >= 1000) {
      return `${sign}${formatCount(abs / 1000, {
        maximumFractionDigits: 2,
        notation: "compact",
      })} t CO2e`;
    }

    return formatCarbon(knownValue);
  });
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

function alternatePeriod(period: ReportPeriod): ReportPeriod {
  return period === "yearly" ? "monthly" : "yearly";
}

function periodLabel(period: ReportPeriod): string {
  return period === "yearly" ? "Yearly" : "Monthly";
}

function periodScope(period: ReportPeriod): string {
  return period === "yearly" ? "per year" : "per month";
}
</script>

<template>
  <section class="section-block" aria-labelledby="impact-summary-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Summary</p>
        <h2 id="impact-summary-heading">Savings</h2>
      </div>
    </div>

    <Alert
      v-if="
        report.metrics.traffic.perInstall !== null &&
        report.metrics.traffic.perInstall < 0
      "
      variant="warning"
    >
      <AlertTriangle aria-hidden="true" :size="16" />
      <span>Package traffic may increase.</span>
    </Alert>

    <div class="metric-grid">
      <Card
        v-for="item in summaryMetrics"
        :key="item.key"
        class="metric-card"
        :class="polarityClass(report.metrics[item.key][period])"
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
            report.metrics[item.key][period],
            report.metrics[item.key].estimates[period],
            { compact: true },
          )
        }}</strong>
        <span class="metric-scope">{{ periodScope(period) }}</span>
        <dl class="metric-periods">
          <div>
            <dt>Per install</dt>
            <dd>
              {{
                formatMetric(
                  report.metrics[item.key],
                  report.metrics[item.key].perInstall,
                  report.metrics[item.key].estimates.perInstall,
                )
              }}
            </dd>
          </div>
          <div>
            <dt>{{ periodLabel(alternatePeriod(period)) }}</dt>
            <dd>
              {{
                formatMetric(
                  report.metrics[item.key],
                  report.metrics[item.key][alternatePeriod(period)],
                  report.metrics[item.key].estimates[alternatePeriod(period)],
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
      <span>Based on npm package metadata and download volume.</span>
    </p>
  </section>
</template>
