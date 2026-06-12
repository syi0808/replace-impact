import type { DependencyEntry, PackageMetadata } from "./package";
import type { EstimateKind } from "./estimate";

export type PackageSnapshot = {
  packageCount: number;
  fileCount: number | null;
  tarballBytes: number | null;
  unpackedBytes: number | null;
  estimates: {
    packageCount: EstimateKind;
    fileCount: EstimateKind;
    tarballBytes: EstimateKind;
    unpackedBytes: EstimateKind;
  };
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
  estimates: {
    perInstall: EstimateKind;
    monthly: EstimateKind;
    yearly: EstimateKind;
  };
  unit: "bytes" | "files" | "packages" | "seconds" | "kgCO2e" | "installs";
};

export type ImpactReport = {
  rootPackage: PackageMetadata;
  pkg: string;
  from: string;
  to: string | null;
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
