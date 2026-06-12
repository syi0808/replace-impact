import type { ImpactReport, SignedMetric } from "../../types/report";
import type { EstimateKind } from "../../types/estimate";
import {
  networkProfiles,
  calculateTransferSeconds,
} from "../../core/metrics/networkTime";
import {
  formatEstimatedBytes,
  formatEstimatedCarbon,
  formatEstimatedCompact,
  formatEstimatedHours,
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
  const boundNote = lowerBoundNote(report);

  return [
    report.to
      ? "### Dependency replacement impact estimate"
      : "### Dependency removal impact estimate",
    "",
    report.to
      ? `This PR replaces \`${report.from}\` with \`${report.to}\` in \`${report.pkg}\`.`
      : `This PR replaces \`${report.from}\` with native APIs and removes the dependency from \`${report.pkg}\`.`,
    "",
    "Small per-install savings can compound across the ecosystem.",
    "",
    "| Metric | Monthly estimate | Yearly estimate |",
    "|---|---:|---:|",
    metricRow(report.metrics.traffic),
    metricRow(report.metrics.files),
    metricRow(report.metrics.reach),
    `| Equivalent slow-mobile transfer time avoided | ${formatEstimatedHours(
      slowMobileMonthly,
      report.metrics.traffic.estimates.monthly,
    )} | ${formatEstimatedHours(
      slowMobileYearly,
      report.metrics.traffic.estimates.yearly,
    )} |`,
    `| Estimated emissions avoided | ${formatEstimatedCarbon(
      report.metrics.carbonMonthly.monthly,
      report.metrics.carbonMonthly.estimates.monthly,
    )} | ${formatEstimatedCarbon(
      report.metrics.carbonMonthly.yearly,
      report.metrics.carbonMonthly.estimates.yearly,
    )} |`,
    "",
    `Report: ${reportUrl}`,
    ...(boundNote ? ["", boundNote] : []),
    "",
    "These figures are estimates. npm downloads are used as a proxy for install frequency. Real-world impact depends on package manager cache behavior, registry mirrors, lockfile deduplication, CI caching, and downstream dependency graphs.",
    "",
    "Carbon estimates are communication aids, not formal emissions accounting.",
  ].join("\n");
}

function metricRow(metric: SignedMetric): string {
  return `| ${metric.label} | ${formatMetricValue(
    metric,
    metric.monthly,
    metric.estimates.monthly,
  )} | ${formatMetricValue(metric, metric.yearly, metric.estimates.yearly)} |`;
}

function formatMetricValue(
  metric: SignedMetric,
  value: number | null,
  estimate: EstimateKind,
): string {
  switch (metric.unit) {
    case "bytes":
      return formatEstimatedBytes(value, estimate);
    case "files":
    case "installs":
    case "packages":
      return formatEstimatedCompact(value, estimate);
    case "seconds":
      return formatEstimatedHours(value, estimate);
    case "kgCO2e":
      return formatEstimatedCarbon(value, estimate);
  }
}

function lowerBoundNote(report: ImpactReport): string {
  const hasBounds = Object.values(report.metrics).some((metric) =>
    Object.values(metric.estimates).some(
      (estimate) => estimate === "lower-bound" || estimate === "upper-bound",
    ),
  );

  return hasBounds
    ? "Values with + are known lower bounds from partial registry metadata."
    : "";
}
