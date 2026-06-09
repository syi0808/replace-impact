import type { NpmPackageVersion } from "../../types/package";

export type PatchedManifest = {
  name: string;
  version: string;
  dependencies: Record<string, string>;
};

export function patchPackageManifest(
  manifest: NpmPackageVersion,
  from: string,
  to: string
): PatchedManifest {
  const dependencies = { ...(manifest.dependencies ?? {}) };
  delete dependencies[from];
  dependencies[to] ??= "latest";

  return {
    name: manifest.name,
    version: `${manifest.version.replace(/-.*/, "")}-replace-impact.0`,
    dependencies
  };
}
