import type {
  NpmPackageMetadata,
  NpmPackageVersion,
  PackageMetadata,
  PackageSearchResult,
  RepositoryField
} from "../../types/package";
import { encodePackageForRegistry, selectVersion } from "./resolvePackage";

const registryBaseUrl = "https://registry.npmjs.org";

type ClientOptions = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

export class RegistryError extends Error {
  constructor(
    message: string,
    public readonly packageName: string
  ) {
    super(message);
    this.name = "RegistryError";
  }
}

export async function fetchPackageMetadata(
  packageName: string,
  options: ClientOptions = {}
): Promise<PackageMetadata> {
  const fetcher = options.fetchImpl ?? fetch;
  const response = await fetcher(`${registryBaseUrl}/${encodePackageForRegistry(packageName)}`, {
    signal: options.signal
  });

  if (!response.ok) {
    throw new RegistryError(`npm registry returned ${response.status}`, packageName);
  }

  const data = (await response.json()) as NpmPackageMetadata;
  const versions = data.versions ?? {};
  const latestVersion = data["dist-tags"]?.latest ?? sortVersions(Object.keys(versions)).at(-1);

  if (!latestVersion || !versions[latestVersion]) {
    throw new RegistryError("npm registry metadata did not include a latest version", packageName);
  }

  const latest = versions[latestVersion];

  return {
    name: data.name,
    latestVersion,
    latest,
    versions,
    repositoryUrl: normalizeRepositoryUrl(latest.repository)
  };
}

export async function fetchPackageVersion(
  packageName: string,
  requestedRange: string | null | undefined,
  options: ClientOptions = {}
): Promise<NpmPackageVersion | null> {
  const metadata = await fetchPackageMetadata(packageName, options);
  return selectVersion(metadata, requestedRange);
}

export async function searchRegistryPackages(
  query: string,
  options: ClientOptions = {}
): Promise<PackageSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const fetcher = options.fetchImpl ?? fetch;
  const response = await fetcher(
    `${registryBaseUrl}/-/v1/search?text=${encodeURIComponent(normalizedQuery)}&size=8`,
    { signal: options.signal }
  );

  if (!response.ok) {
    throw new Error(`npm search returned ${response.status}`);
  }

  const data = (await response.json()) as {
    objects?: Array<{
      package?: {
        name?: string;
        version?: string;
        description?: string;
        keywords?: string[];
      };
      score?: {
        final?: number;
      };
    }>;
  };

  return (data.objects ?? []).flatMap((item) => {
    if (!item.package?.name) {
      return [];
    }

    return [
      {
        name: item.package.name,
        version: item.package.version ?? null,
        description: item.package.description ?? null,
        keywords: item.package.keywords ?? [],
        score: item.score?.final ?? null
      }
    ];
  });
}

function normalizeRepositoryUrl(repository: RepositoryField | undefined): string | null {
  const raw = typeof repository === "string" ? repository : repository?.url;
  if (!raw) {
    return null;
  }

  return raw
    .replace(/^git\+/, "")
    .replace(/^git:/, "https:")
    .replace(/\.git$/, "")
    .replace("ssh://git@github.com/", "https://github.com/")
    .replace("git@github.com:", "https://github.com/");
}

function sortVersions(versions: string[]): string[] {
  return versions.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}
