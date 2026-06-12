import type { ImpactReport, SignedMetric } from "../../types/report";
import type { EstimatedValue } from "../../types/estimate";
import { calculateEstimatedCarbonKgCO2e } from "../../core/metrics/carbon";
import {
  calculateEstimatedPerInstallDelta,
  calculateEstimatedPeriodValue,
  unknownEstimate,
} from "../../core/metrics/traffic";
import { fetchDownloadsSummary } from "../../core/npm/downloadsClient";
import { fetchPackageMetadata } from "../../core/npm/registryClient";
import { resolveDependencyGraph } from "../../core/npm/resolveDependencyGraph";
import {
  cleanPackageName,
  findDirectDependency,
  isValidPackageName,
} from "../../core/npm/resolvePackage";

export type CreateImpactReportOptions = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

export async function createImpactReport(
  pkg: string,
  from: string,
  to?: string | null,
  options: CreateImpactReportOptions = {},
): Promise<ImpactReport> {
  const cleanedPkg = cleanPackageName(pkg);
  const cleanedFrom = cleanPackageName(from);
  const cleanedTo = to ? cleanPackageName(to) : null;

  for (const [label, value] of [
    ["pkg", cleanedPkg],
    ["from", cleanedFrom],
  ] as const) {
    if (!isValidPackageName(value)) {
      throw new Error(`Invalid ${label} package name: ${value || "empty"}`);
    }
  }

  if (cleanedTo !== null && !isValidPackageName(cleanedTo)) {
    throw new Error(`Invalid to package name: ${cleanedTo || "empty"}`);
  }

  const rootPackage = await fetchPackageMetadata(cleanedPkg, options);
  const directDependency = findDirectDependency(
    rootPackage.latest,
    cleanedFrom,
  );
  const downloadsPromise = fetchDownloadsSummary(cleanedPkg, options);

  const directDependencyWarning =
    directDependency === null
      ? cleanedTo
        ? `${cleanedFrom} is not a direct dependency of ${cleanedPkg}@${rootPackage.latestVersion}; this report compares the replacement subtrees only.`
        : `${cleanedFrom} is not a direct dependency of ${cleanedPkg}@${rootPackage.latestVersion}; this report estimates removing the dependency subtree only.`
      : directDependency.kind === "optional"
        ? `${cleanedFrom} is optional in ${cleanedPkg}; optional dependencies are shown but excluded from default installed dependency traffic.`
        : directDependency.kind === "peer"
          ? `${cleanedFrom} is a peer dependency in ${cleanedPkg}; peer dependencies are compatibility signals, not default installed traffic.`
          : null;

  const beforeRange =
    directDependency?.kind === "dependency" ? directDependency.range : "latest";
  const [before, after, downloads] = await Promise.all([
    resolveDependencyGraph(cleanedFrom, beforeRange, options),
    cleanedTo
      ? resolveDependencyGraph(cleanedTo, "latest", options)
      : Promise.resolve(emptyPackageSnapshot()),
    downloadsPromise,
  ]);

  const trafficPerInstall = calculateEstimatedPerInstallDelta(
    snapshotMetric(before, "tarballBytes"),
    snapshotMetric(after, "tarballBytes"),
  );
  const filesPerInstall = calculateEstimatedPerInstallDelta(
    snapshotMetric(before, "fileCount"),
    snapshotMetric(after, "fileCount"),
  );
  const unpackedPerInstall = calculateEstimatedPerInstallDelta(
    snapshotMetric(before, "unpackedBytes"),
    snapshotMetric(after, "unpackedBytes"),
  );

  const warnings = [
    directDependencyWarning,
    ...downloads.warnings,
    ...before.warnings.map((warning) => `Before graph: ${warning}`),
    ...after.warnings.map((warning) => `After graph: ${warning}`),
  ].filter((warning): warning is string => Boolean(warning));

  return {
    rootPackage,
    pkg: cleanedPkg,
    from: cleanedFrom,
    to: cleanedTo,
    directDependency,
    directDependencyWarning,
    before,
    after,
    downloads,
    metrics: {
      traffic: buildMetric(
        "Potential package traffic avoided",
        trafficPerInstall,
        downloads,
        "bytes",
      ),
      files: buildMetric(
        "Files not unpacked",
        filesPerInstall,
        downloads,
        "files",
      ),
      unpacked: buildMetric(
        "Filesystem work avoided",
        unpackedPerInstall,
        downloads,
        "bytes",
      ),
      reach: {
        label: "Potential direct npm install paths improved",
        perInstall: directDependency?.kind === "dependency" ? 1 : null,
        monthly:
          directDependency?.kind === "dependency" ? downloads.monthly : null,
        yearly:
          directDependency?.kind === "dependency" ? downloads.yearly : null,
        estimates: {
          perInstall:
            directDependency?.kind === "dependency" ? "exact" : "unknown",
          monthly:
            directDependency?.kind === "dependency" &&
            downloads.monthly !== null
              ? "exact"
              : "unknown",
          yearly:
            directDependency?.kind === "dependency" && downloads.yearly !== null
              ? "exact"
              : "unknown",
        },
        unit: "installs",
      },
      carbonMonthly: buildCarbonMetric(trafficPerInstall, downloads),
    },
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

function emptyPackageSnapshot(): ImpactReport["after"] {
  return {
    packageCount: 0,
    fileCount: 0,
    tarballBytes: 0,
    unpackedBytes: 0,
    estimates: {
      packageCount: "exact",
      fileCount: "exact",
      tarballBytes: "exact",
      unpackedBytes: "exact",
    },
    dependencyNodes: [],
    warnings: [],
  };
}

function buildMetric(
  label: string,
  perInstall: EstimatedValue,
  downloads: { monthly: number | null; yearly: number | null },
  unit: SignedMetric["unit"],
): SignedMetric {
  const monthly = calculateEstimatedPeriodValue(perInstall, downloads.monthly);
  const yearly = calculateEstimatedPeriodValue(perInstall, downloads.yearly);

  return {
    label,
    perInstall: perInstall.value,
    monthly: monthly.value,
    yearly: yearly.value,
    estimates: {
      perInstall: perInstall.estimate,
      monthly: monthly.estimate,
      yearly: yearly.estimate,
    },
    unit,
  };
}

function buildCarbonMetric(
  trafficPerInstall: EstimatedValue,
  downloads: { monthly: number | null; yearly: number | null },
): SignedMetric {
  const monthlyTraffic = calculateEstimatedPeriodValue(
    trafficPerInstall,
    downloads.monthly,
  );
  const yearlyTraffic = calculateEstimatedPeriodValue(
    trafficPerInstall,
    downloads.yearly,
  );
  const perInstall = calculateEstimatedCarbonKgCO2e(trafficPerInstall);
  const monthly = calculateEstimatedCarbonKgCO2e(monthlyTraffic);
  const yearly = calculateEstimatedCarbonKgCO2e(yearlyTraffic);

  return {
    label: "Estimated emissions avoided",
    perInstall: perInstall.value,
    monthly: monthly.value,
    yearly: yearly.value,
    estimates: {
      perInstall: perInstall.estimate,
      monthly: monthly.estimate,
      yearly: yearly.estimate,
    },
    unit: "kgCO2e",
  };
}

function snapshotMetric(
  snapshot: ImpactReport["before"],
  key: "fileCount" | "tarballBytes" | "unpackedBytes",
): EstimatedValue {
  const value = snapshot[key];

  if (value === null) {
    return unknownEstimate();
  }

  return {
    value,
    estimate: snapshot.estimates[key],
  };
}
