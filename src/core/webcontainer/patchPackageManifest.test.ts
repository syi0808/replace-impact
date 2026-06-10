import { describe, expect, it } from "vitest";
import { patchPackageManifest } from "./patchPackageManifest";
import type { NpmPackageVersion } from "../../types/package";

describe("patchPackageManifest", () => {
  it("removes the source dependency without adding a target package", () => {
    expect(patchPackageManifest(manifest(), "glob", null).dependencies).toEqual(
      {
        vue: "^3.5.0",
      },
    );
  });

  it("replaces the source dependency when a target package is provided", () => {
    expect(
      patchPackageManifest(manifest(), "glob", "tinyglobby").dependencies,
    ).toEqual({
      vue: "^3.5.0",
      tinyglobby: "latest",
    });
  });
});

function manifest(): NpmPackageVersion {
  return {
    name: "fixture",
    version: "1.0.0",
    dependencies: {
      glob: "^10.0.0",
      vue: "^3.5.0",
    },
  };
}
