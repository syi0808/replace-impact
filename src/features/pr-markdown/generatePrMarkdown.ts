import type { ImpactReport, SignedMetric } from "../../types/report";
import {
  networkProfiles,
  calculateTransferSeconds,
} from "../../core/metrics/networkTime";
import {
  formatBytes,
  formatCarbon,
  formatCompact,
  formatHours,
} from "../../core/metrics/formatting";

export function generatePrMarkdown(
  report: ImpactReport,
  reportUrl: string,
): string {
  const slowMobileMonthly = calculateTransferSeconds(
    report.metrics.traffic.monthly,
    networkProfiles["slow-3g"].downlinkMbps,
  );
  const slowMobileYearly = calculateTransferSeconds(
    report.metrics.traffic.yearly,
    networkProfiles["slow-3g"].downlinkMbps,
  );

  return [
    "### Dependency replacement impact estimate",
    "",
    `This PR replaces \`${report.from}\` with \`${report.to}\` in \`${report.pkg}\`.`,
    "",
    "Small per-install savings can compound across the ecosystem.",
    "",
    "| Metric | Monthly estimate | Yearly estimate |",
    "|---|---:|---:|",
    metricRow(report.metrics.traffic),
    metricRow(report.metrics.files),
    metricRow(report.metrics.reach),
    `| Equivalent slow-mobile transfer time avoided | ${formatHours(slowMobileMonthly)} | ${formatHours(
      slowMobileYearly,
    )} |`,
    `| Estimated emissions avoided | ${formatCarbon(report.metrics.carbonMonthly.monthly)} | ${formatCarbon(
      report.metrics.carbonMonthly.yearly,
    )} |`,
    "",
    `Report: ${reportUrl}`,
    "",
    "These figures are estimates. npm downloads are used as a proxy for install frequency. Real-world impact depends on package manager cache behavior, registry mirrors, lockfile deduplication, CI caching, and downstream dependency graphs.",
    "",
    "Carbon estimates are communication aids, not formal emissions accounting.",
  ].join("\n");
}

function metricRow(metric: SignedMetric): string {
  return `| ${metric.label} | ${formatMetricValue(metric, metric.monthly)} | ${formatMetricValue(
    metric,
    metric.yearly,
  )} |`;
}

function formatMetricValue(metric: SignedMetric, value: number | null): string {
  switch (metric.unit) {
    case "bytes":
      return formatBytes(value);
    case "files":
    case "installs":
    case "packages":
      return formatCompact(value);
    case "seconds":
      return formatHours(value);
    case "kgCO2e":
      return formatCarbon(value);
  }
}
