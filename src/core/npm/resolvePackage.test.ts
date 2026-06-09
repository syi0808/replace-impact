import { describe, expect, it } from "vitest";
import type { NpmPackageVersion } from "../../types/package";
import { selectVersion } from "./resolvePackage";

const versions = {
  "1.0.0": version("1.0.0"),
  "1.2.0": version("1.2.0"),
  "1.9.9": version("1.9.9"),
  "2.0.0": version("2.0.0")
};

describe("selectVersion", () => {
  it("selects the highest compatible caret version", () => {
    expect(selectVersion({ latestVersion: "2.0.0", versions }, "^1.1.0")?.version).toBe("1.9.9");
  });

  it("supports comparator ranges with spaces", () => {
    expect(selectVersion({ latestVersion: "2.0.0", versions }, ">=1.0.0 <2.0.0")?.version).toBe("1.9.9");
  });

  it("falls back to latest when no conservative match is found", () => {
    expect(selectVersion({ latestVersion: "2.0.0", versions }, "file:../local")?.version).toBe("2.0.0");
  });
});

function version(value: string): NpmPackageVersion {
  return {
    name: "fixture",
    version: value,
    dependencies: {},
    dist: {}
  };
}
