export type DependencyKind = "dependency" | "optional" | "peer";

export type DependencyRecord = Record<string, string>;

export type RepositoryField =
  | string
  | {
      type?: string;
      url?: string;
      directory?: string;
    };

export type PackageDist = {
  tarball?: string;
  fileCount?: number;
  unpackedSize?: number;
};

export type NpmPackageVersion = {
  name: string;
  version: string;
  description?: string;
  license?: string;
  repository?: RepositoryField;
  dependencies?: DependencyRecord;
  optionalDependencies?: DependencyRecord;
  peerDependencies?: DependencyRecord;
  dist?: PackageDist;
};

export type NpmPackageMetadata = {
  name: string;
  "dist-tags"?: {
    latest?: string;
  };
  versions: Record<string, NpmPackageVersion>;
  time?: Record<string, string>;
};

export type PackageMetadata = {
  name: string;
  latestVersion: string;
  latest: NpmPackageVersion;
  versions: Record<string, NpmPackageVersion>;
  repositoryUrl: string | null;
};

export type DependencyEntry = {
  name: string;
  range: string;
  kind: DependencyKind;
};

export type PackageSearchResult = {
  name: string;
  version: string | null;
  description: string | null;
  keywords: string[];
  score: number | null;
};
