import type { PackageMetadata } from "../../types/package";
import type { PackageSnapshot } from "../../types/report";
import type { EstimateKind } from "../../types/estimate";
import { fetchPackageMetadata } from "./registryClient";
import { selectVersion } from "./resolvePackage";
import { fetchTarballBytes } from "./tarballSizeClient";

export const graphLimits = {
  maxDepth: 8,
  maxNodes: 250,
} as const;

type GraphOptions = {
  maxDepth?: number;
  maxNodes?: number;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  measureTarballs?: boolean;
};

export async function resolveDependencyGraph(
  packageName: string,
  requestedRange: string | null | undefined,
  options: GraphOptions = {},
): Promise<PackageSnapshot> {
  const maxDepth = options.maxDepth ?? graphLimits.maxDepth;
  const maxNodes = options.maxNodes ?? graphLimits.maxNodes;
  const metadataCache = new Map<string, PackageMetadata>();
  const visited = new Set<string>();
  const dependencyNodes: string[] = [];
  const warnings = new Set<string>();

  let packageCount = 0;
  let fileCount = 0;
  let tarballBytes = 0;
  let unpackedBytes = 0;
  let knownFileCountNodes = 0;
  let knownTarballNodes = 0;
  let knownUnpackedNodes = 0;
  let unknownFileCount = false;
  let unknownTarballBytes = false;
  let unknownUnpackedBytes = false;
  let incompletePackageCount = false;
  let nodeLimitHit = false;

  async function loadMetadata(name: string): Promise<PackageMetadata> {
    const cached = metadataCache.get(name);
    if (cached) {
      return cached;
    }

    const metadata = await fetchPackageMetadata(name, {
      fetchImpl: options.fetchImpl,
      signal: options.signal,
    });
    metadataCache.set(name, metadata);
    return metadata;
  }

  async function visit(
    name: string,
    range: string | null | undefined,
    depth: number,
  ): Promise<void> {
    if (nodeLimitHit) {
      return;
    }

    if (dependencyNodes.length >= maxNodes) {
      nodeLimitHit = true;
      incompletePackageCount = true;
      warnings.add(
        `Graph node limit of ${maxNodes} packages was reached; this is a partial estimate.`,
      );
      return;
    }

    if (depth > maxDepth) {
      incompletePackageCount = true;
      warnings.add(
        `Graph depth limit of ${maxDepth} was reached; this is a partial estimate.`,
      );
      return;
    }

    let metadata: PackageMetadata;
    try {
      metadata = await loadMetadata(name);
    } catch (error) {
      warnings.add(
        `${name} metadata unavailable: ${error instanceof Error ? error.message : "request failed"}`,
      );
      incompletePackageCount = true;
      unknownFileCount = true;
      unknownTarballBytes = true;
      unknownUnpackedBytes = true;
      return;
    }

    const version = selectVersion(metadata, range);
    if (!version) {
      warnings.add(
        `${name} could not be resolved for range ${range ?? "latest"}.`,
      );
      incompletePackageCount = true;
      unknownFileCount = true;
      unknownTarballBytes = true;
      unknownUnpackedBytes = true;
      return;
    }

    const key = `${name}@${version.version}`;
    if (visited.has(key)) {
      return;
    }
    visited.add(key);
    dependencyNodes.push(key);
    packageCount += 1;

    if (typeof version.dist?.fileCount === "number") {
      fileCount += version.dist.fileCount;
      knownFileCountNodes += 1;
    } else {
      unknownFileCount = true;
      warnings.add(`${key} does not publish fileCount metadata.`);
    }

    if (typeof version.dist?.unpackedSize === "number") {
      unpackedBytes += version.dist.unpackedSize;
      knownUnpackedNodes += 1;
    } else {
      unknownUnpackedBytes = true;
      warnings.add(`${key} does not publish unpackedSize metadata.`);
    }

    if (options.measureTarballs !== false) {
      const bytes = await fetchTarballBytes(version.dist?.tarball, {
        fetchImpl: options.fetchImpl,
        signal: options.signal,
      });

      if (typeof bytes === "number") {
        tarballBytes += bytes;
        knownTarballNodes += 1;
      } else {
        unknownTarballBytes = true;
        warnings.add(`${key} compressed tarball size is unknown.`);
      }
    } else {
      unknownTarballBytes = true;
    }

    const dependencies = Object.entries(version.dependencies ?? {}).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    for (const [dependencyName, dependencyRange] of dependencies) {
      await visit(dependencyName, dependencyRange, depth + 1);
    }
  }

  await visit(packageName, requestedRange, 0);

  return {
    packageCount,
    fileCount: metricValue(fileCount, knownFileCountNodes, unknownFileCount),
    tarballBytes: metricValue(
      tarballBytes,
      knownTarballNodes,
      unknownTarballBytes,
    ),
    unpackedBytes: metricValue(
      unpackedBytes,
      knownUnpackedNodes,
      unknownUnpackedBytes,
    ),
    estimates: {
      packageCount: packageCountEstimate(packageCount, incompletePackageCount),
      fileCount: metricEstimate(knownFileCountNodes, unknownFileCount),
      tarballBytes: metricEstimate(knownTarballNodes, unknownTarballBytes),
      unpackedBytes: metricEstimate(knownUnpackedNodes, unknownUnpackedBytes),
    },
    dependencyNodes,
    warnings: [...warnings],
  };
}

function metricValue(
  value: number,
  knownNodes: number,
  hasUnknown: boolean,
): number | null {
  if (!hasUnknown) {
    return value;
  }

  return knownNodes > 0 ? value : null;
}

function metricEstimate(knownNodes: number, hasUnknown: boolean): EstimateKind {
  if (!hasUnknown) {
    return "exact";
  }

  return knownNodes > 0 ? "lower-bound" : "unknown";
}

function packageCountEstimate(
  packageCount: number,
  incompletePackageCount: boolean,
): EstimateKind {
  if (!incompletePackageCount) {
    return "exact";
  }

  return packageCount > 0 ? "lower-bound" : "unknown";
}
