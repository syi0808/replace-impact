import { describe, expect, it } from "vitest";
import { normalizeModuleReplacements } from "./normalizeModuleReplacements";

describe("normalizeModuleReplacements", () => {
  it("normalizes object manifests keyed by module name", () => {
    expect(
      normalizeModuleReplacements(
        {
          glob: {
            replacement: "tinyglobby",
            type: "preferred",
            caution: "Check glob pattern behavior."
          }
        },
        "preferred",
        "https://example.test/preferred.json"
      )
    ).toEqual([
      {
        from: "glob",
        to: "tinyglobby",
        type: "preferred",
        caution: "Check glob pattern behavior.",
        sourceUrl: "https://example.test/preferred.json"
      }
    ]);
  });

  it("normalizes array manifests and deduplicates entries", () => {
    const rules = normalizeModuleReplacements([
      { moduleName: "rimraf", replacement: "del" },
      { from: "rimraf", to: "del" }
    ]);

    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ from: "rimraf", to: "del" });
  });

  it("keeps the outer module as from for nested replacement objects", () => {
    const rules = normalizeModuleReplacements(
      [
        {
          moduleName: "glob",
          replacements: [{ moduleName: "tinyglobby" }]
        }
      ],
      "preferred"
    );

    expect(rules).toEqual([
      {
        from: "glob",
        to: "tinyglobby",
        type: "preferred",
        sourceUrl: undefined
      }
    ]);
  });

  it("does not let nested package item type erase the source manifest category", () => {
    const rules = normalizeModuleReplacements(
      [
        {
          moduleName: "glob",
          replacements: [{ type: "package", name: "tinyglobby" }]
        }
      ],
      "preferred"
    );

    expect(rules[0]).toMatchObject({
      from: "glob",
      to: "tinyglobby",
      type: "preferred"
    });
  });
});
