import type { DependencyEntry, NpmPackageVersion, PackageMetadata } from "../../types/package";

const packageNamePattern =
  /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/i;

export function cleanPackageName(input: string): string {
  return input.trim().replace(/^npm:/, "");
}

export function isValidPackageName(input: string): boolean {
  const packageName = cleanPackageName(input);
  return packageName.length <= 214 && packageNamePattern.test(packageName);
}

export function encodePackageForRegistry(packageName: string): string {
  return encodeURIComponent(cleanPackageName(packageName));
}

export function encodePackagePath(packageName: string): string {
  return cleanPackageName(packageName)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function routeParamToPackageName(param: string | string[] | undefined): string {
  if (!param) {
    return "";
  }

  return Array.isArray(param) ? param.join("/") : param;
}

export function listDirectDependencies(packageVersion: NpmPackageVersion): DependencyEntry[] {
  const entries: DependencyEntry[] = [];

  for (const [name, range] of Object.entries(packageVersion.dependencies ?? {})) {
    entries.push({ name, range, kind: "dependency" });
  }

  for (const [name, range] of Object.entries(packageVersion.optionalDependencies ?? {})) {
    entries.push({ name, range, kind: "optional" });
  }

  for (const [name, range] of Object.entries(packageVersion.peerDependencies ?? {})) {
    entries.push({ name, range, kind: "peer" });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function findDirectDependency(
  packageVersion: NpmPackageVersion,
  dependencyName: string
): DependencyEntry | null {
  const name = cleanPackageName(dependencyName);

  if (packageVersion.dependencies?.[name]) {
    return { name, range: packageVersion.dependencies[name], kind: "dependency" };
  }

  if (packageVersion.optionalDependencies?.[name]) {
    return { name, range: packageVersion.optionalDependencies[name], kind: "optional" };
  }

  if (packageVersion.peerDependencies?.[name]) {
    return { name, range: packageVersion.peerDependencies[name], kind: "peer" };
  }

  return null;
}

export function selectVersion(
  packageMetadata: Pick<PackageMetadata, "versions" | "latestVersion">,
  requestedRange: string | null | undefined
): NpmPackageVersion | null {
  const versions = Object.keys(packageMetadata.versions);
  if (versions.length === 0) {
    return null;
  }

  const requested = normalizeRequestedRange(requestedRange);
  if (!requested || requested === "latest" || requested === "*") {
    return packageMetadata.versions[packageMetadata.latestVersion] ?? null;
  }

  if (packageMetadata.versions[requested]) {
    return packageMetadata.versions[requested];
  }

  const sorted = versions.sort(compareVersions).reverse();
  const match = sorted.find((version) => satisfies(version, requested));
  return match ? packageMetadata.versions[match] : packageMetadata.versions[packageMetadata.latestVersion] ?? null;
}

function normalizeRequestedRange(range: string | null | undefined): string {
  if (!range) {
    return "latest";
  }

  const trimmed = range.trim();
  if (trimmed.startsWith("npm:")) {
    const atIndex = trimmed.lastIndexOf("@");
    return atIndex > 4 ? trimmed.slice(atIndex + 1) : "latest";
  }

  return trimmed
    .replace(/\s+\|\|\s+.*/, "")
    .replace(/^workspace:/, "")
    .replace(/^catalog:/, "")
    .trim();
}

type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
};

function parseVersion(version: string): ParsedVersion | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null
  };
}

function compareVersions(a: string, b: string): number {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);

  if (!parsedA || !parsedB) {
    return a.localeCompare(b);
  }

  for (const key of ["major", "minor", "patch"] as const) {
    if (parsedA[key] !== parsedB[key]) {
      return parsedA[key] - parsedB[key];
    }
  }

  if (parsedA.prerelease && !parsedB.prerelease) {
    return -1;
  }

  if (!parsedA.prerelease && parsedB.prerelease) {
    return 1;
  }

  return (parsedA.prerelease ?? "").localeCompare(parsedB.prerelease ?? "");
}

function satisfies(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  if (!parsed) {
    return false;
  }

  const trimmed = range.trim();

  if (/^\d+$/.test(trimmed)) {
    return parsed.major === Number(trimmed);
  }

  const wildcard = trimmed.match(/^(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/i);
  if (wildcard) {
    const [, major, minor, patch] = wildcard;
    if (parsed.major !== Number(major)) {
      return false;
    }
    if (minor && !/[x*]/i.test(minor) && parsed.minor !== Number(minor)) {
      return false;
    }
    if (patch && !/[x*]/i.test(patch) && parsed.patch !== Number(patch)) {
      return false;
    }
    return true;
  }

  if (trimmed.startsWith("^")) {
    const base = parseVersion(trimmed.slice(1));
    if (!base || compareVersions(version, versionFromParsed(base)) < 0) {
      return false;
    }
    if (base.major > 0) {
      return parsed.major === base.major;
    }
    if (base.minor > 0) {
      return parsed.major === 0 && parsed.minor === base.minor;
    }
    return parsed.major === 0 && parsed.minor === 0 && parsed.patch === base.patch;
  }

  if (trimmed.startsWith("~")) {
    const base = parseVersion(trimmed.slice(1));
    return (
      !!base &&
      parsed.major === base.major &&
      parsed.minor === base.minor &&
      compareVersions(version, versionFromParsed(base)) >= 0
    );
  }

  if (/^[><=]/.test(trimmed)) {
    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .every((comparator) => compareComparator(version, comparator));
  }

  return version === trimmed;
}

function compareComparator(version: string, comparator: string): boolean {
  const match = comparator.match(/^(>=|>|<=|<|=)?\s*(.+)$/);
  if (!match) {
    return false;
  }

  const [, rawOperator, target] = match;
  const operator = rawOperator ?? "=";
  const comparison = compareVersions(version, target);

  switch (operator) {
    case ">=":
      return comparison >= 0;
    case ">":
      return comparison > 0;
    case "<=":
      return comparison <= 0;
    case "<":
      return comparison < 0;
    default:
      return comparison === 0;
  }
}

function versionFromParsed(version: ParsedVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}
