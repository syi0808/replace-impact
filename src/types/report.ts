import type { DependencyEntry, PackageMetadata } from "./package";

export type PackageSnapshot = {
  packageCount: number;
  fileCount: number | null;
  tarballBytes: number | null;
  unpackedBytes: number | null;
  dependencyNodes: string[];
  warnings: string[];
};

export type DownloadsSummary = {
  monthly: number | null;
  yearly: number | null;
  warnings: string[];
};

export type SignedMetric = {
  label: string;
  perInstall: number | null;
  monthly: number | null;
  yearly: number | null;
  unit: "bytes" | "files" | "packages" | "seconds" | "kgCO2e" | "installs";
};

export type ImpactReport = {
  rootPackage: PackageMetadata;
  pkg: string;
  from: string;
  to: string;
  directDependency: DependencyEntry | null;
  directDependencyWarning: string | null;
  before: PackageSnapshot;
  after: PackageSnapshot;
  downloads: DownloadsSummary;
  metrics: {
    traffic: SignedMetric;
    files: SignedMetric;
    unpacked: SignedMetric;
    reach: SignedMetric;
    carbonMonthly: SignedMetric;
  };
  warnings: string[];
  generatedAt: string;
};
