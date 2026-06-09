import type { PackageSearchResult } from "../../types/package";
import { searchRegistryPackages } from "../../core/npm/registryClient";

export function searchPackages(query: string, signal?: AbortSignal): Promise<PackageSearchResult[]> {
  return searchRegistryPackages(query, { signal });
}
