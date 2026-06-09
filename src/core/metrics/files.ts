import { calculatePerInstallDelta, calculatePeriodValue } from "./traffic";

export function calculateFilesNotUnpacked(
  beforeFileCount: number | null,
  afterFileCount: number | null,
  downloads: number | null
): number | null {
  return calculatePeriodValue(calculatePerInstallDelta(beforeFileCount, afterFileCount), downloads);
}
