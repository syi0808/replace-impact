export function calculatePerInstallDelta(
  before: number | null,
  after: number | null
): number | null {
  if (before === null || after === null) {
    return null;
  }

  return before - after;
}

export function calculatePeriodValue(
  perInstallDelta: number | null,
  downloads: number | null
): number | null {
  if (perInstallDelta === null || downloads === null) {
    return null;
  }

  return perInstallDelta * downloads;
}
