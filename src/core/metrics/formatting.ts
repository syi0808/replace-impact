import type { EstimateKind } from "../../types/estimate";

export function formatCount(
  value: number | null,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  return new Intl.NumberFormat("en", options).format(value);
}

export function formatCompact(value: number | null): string {
  return formatCount(value, {
    maximumFractionDigits: 2,
  });
}

export function formatBytes(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const units = ["B", "kB", "MB", "GB", "TB", "PB"];
  let size = abs;
  let unitIndex = 0;

  while (size >= 1000 && unitIndex < units.length - 1) {
    size /= 1000;
    unitIndex += 1;
  }

  return `${sign}${formatCount(size, { maximumFractionDigits: size >= 10 ? 1 : 2 })} ${units[unitIndex]}`;
}

export function formatEstimatedCount(
  value: number | null,
  estimate: EstimateKind,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatEstimatedValue(value, estimate, (knownValue) =>
    formatCount(knownValue, options),
  );
}

export function formatEstimatedCompact(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(value, estimate, formatCompact);
}

export function formatEstimatedBytes(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(value, estimate, formatBytes);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) {
    return "unknown";
  }

  const abs = Math.abs(seconds);
  const sign = seconds < 0 ? "-" : "";

  if (abs < 60) {
    return `${sign}${formatCount(abs, { maximumFractionDigits: 1 })} sec`;
  }

  const minutes = abs / 60;
  if (minutes < 60) {
    return `${sign}${formatCount(minutes, { maximumFractionDigits: 1 })} min`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `${sign}${formatCount(hours, { maximumFractionDigits: 1 })} hr`;
  }

  const days = hours / 24;
  if (days < 365) {
    return `${sign}${formatCount(days, { maximumFractionDigits: 1 })} days`;
  }

  return `${sign}${formatCount(days / 365, { maximumFractionDigits: 2 })} years`;
}

export function formatEstimatedDuration(
  seconds: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(seconds, estimate, formatDuration);
}

export function formatHours(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) {
    return "unknown";
  }

  const hours = seconds / 3600;
  return `${formatCount(hours, { maximumFractionDigits: Math.abs(hours) >= 10 ? 1 : 2 })} hr`;
}

export function formatEstimatedHours(
  seconds: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(seconds, estimate, formatHours);
}

export function formatCarbon(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs < 1) {
    return `${sign}${formatCount(abs * 1000, { maximumFractionDigits: 2 })} g CO2e`;
  }

  return `${sign}${formatCount(abs, { maximumFractionDigits: 2 })} kg CO2e`;
}

export function formatEstimatedCarbon(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(value, estimate, formatCarbon);
}

export function formatUsd(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) >= 10 ? 0 : 2,
  }).format(value);
}

export function formatEstimatedUsd(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(value, estimate, formatUsd);
}

export function describeDelta(value: number | null, noun: string): string {
  if (value === null) {
    return `${noun} unknown`;
  }

  if (value < 0) {
    return `${noun} increase`;
  }

  if (value === 0) {
    return `${noun} neutral`;
  }

  return `${noun} avoided`;
}

export function formatEstimatedValue(
  value: number | null,
  estimate: EstimateKind,
  formatter: (value: number) => string,
): string {
  if (value === null || Number.isNaN(value) || estimate === "unknown") {
    return "unknown";
  }

  const formatted = formatter(value);

  if (estimate === "lower-bound") {
    return value >= 0 ? `${formatted}+` : `>= ${formatted}`;
  }

  if (estimate === "upper-bound") {
    return `<= ${formatted}`;
  }

  return formatted;
}
