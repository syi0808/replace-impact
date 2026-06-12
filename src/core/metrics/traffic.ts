import type { EstimatedValue, EstimateKind } from "../../types/estimate";

export function calculatePerInstallDelta(
  before: number | null,
  after: number | null,
): number | null {
  if (before === null || after === null) {
    return null;
  }

  return before - after;
}

export function calculatePeriodValue(
  perInstallDelta: number | null,
  downloads: number | null,
): number | null {
  if (perInstallDelta === null || downloads === null) {
    return null;
  }

  return perInstallDelta * downloads;
}

export function unknownEstimate(): EstimatedValue {
  return {
    value: null,
    estimate: "unknown",
  };
}

export function calculateEstimatedPerInstallDelta(
  before: EstimatedValue,
  after: EstimatedValue,
): EstimatedValue {
  if (
    before.value === null ||
    after.value === null ||
    before.estimate === "unknown" ||
    after.estimate === "unknown"
  ) {
    return unknownEstimate();
  }

  const estimate = combineDeltaEstimate(before.estimate, after.estimate);
  if (estimate === "unknown") {
    return unknownEstimate();
  }

  return {
    value: before.value - after.value,
    estimate,
  };
}

export function calculateEstimatedPeriodValue(
  value: EstimatedValue,
  multiplier: number | null,
): EstimatedValue {
  if (
    value.value === null ||
    multiplier === null ||
    value.estimate === "unknown"
  ) {
    return unknownEstimate();
  }

  return {
    value: value.value * multiplier,
    estimate: multiplier < 0 ? flipBound(value.estimate) : value.estimate,
  };
}

function combineDeltaEstimate(
  before: EstimateKind,
  after: EstimateKind,
): EstimateKind {
  if (before === "exact" && after === "exact") {
    return "exact";
  }

  if (before === "lower-bound" && after === "exact") {
    return "lower-bound";
  }

  if (before === "exact" && after === "lower-bound") {
    return "upper-bound";
  }

  if (before === "upper-bound" && after === "exact") {
    return "upper-bound";
  }

  if (before === "exact" && after === "upper-bound") {
    return "lower-bound";
  }

  if (before === "lower-bound" && after === "upper-bound") {
    return "lower-bound";
  }

  if (before === "upper-bound" && after === "lower-bound") {
    return "upper-bound";
  }

  return "unknown";
}

function flipBound(estimate: EstimateKind): EstimateKind {
  if (estimate === "lower-bound") {
    return "upper-bound";
  }

  if (estimate === "upper-bound") {
    return "lower-bound";
  }

  return estimate;
}
