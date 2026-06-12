import { describe, expect, it } from "vitest";
import { resolveDependencyGraph } from "./resolveDependencyGraph";

describe("resolveDependencyGraph", () => {
  it("stops traversal and reports a warning when node limit is reached", async () => {
    const snapshot = await resolveDependencyGraph("root", "latest", {
      maxNodes: 2,
      measureTarballs: false,
      fetchImpl: async (input) => {
        const name = decodeURIComponent(String(input).split("/").pop() ?? "");
        return jsonResponse(
          registryPackage(
            name,
            name === "root" ? { child: "1.0.0" } : { leaf: "1.0.0" },
          ),
        );
      },
    });

    expect(snapshot.packageCount).toBe(2);
    expect(snapshot.estimates.packageCount).toBe("lower-bound");
    expect(snapshot.warnings).toContain(
      "Graph node limit of 2 packages was reached; this is a partial estimate.",
    );
  });

  it("preserves unknown metadata instead of fabricating zero values", async () => {
    const snapshot = await resolveDependencyGraph("root", "latest", {
      measureTarballs: false,
      fetchImpl: async () =>
        jsonResponse({
          name: "root",
          "dist-tags": { latest: "1.0.0" },
          versions: {
            "1.0.0": {
              name: "root",
              version: "1.0.0",
              dependencies: {},
              dist: {},
            },
          },
        }),
    });

    expect(snapshot.fileCount).toBeNull();
    expect(snapshot.estimates.fileCount).toBe("unknown");
    expect(snapshot.tarballBytes).toBeNull();
    expect(snapshot.estimates.tarballBytes).toBe("unknown");
    expect(snapshot.unpackedBytes).toBeNull();
    expect(snapshot.estimates.unpackedBytes).toBe("unknown");
  });

  it("keeps known lower bounds when only part of a graph omits metadata", async () => {
    const snapshot = await resolveDependencyGraph("root", "latest", {
      measureTarballs: false,
      fetchImpl: async (input) => {
        const name = decodeURIComponent(String(input).split("/").pop() ?? "");
        return jsonResponse(
          name === "root"
            ? registryPackage("root", { missing: "1.0.0" })
            : {
                name: "missing",
                "dist-tags": { latest: "1.0.0" },
                versions: {
                  "1.0.0": {
                    name: "missing",
                    version: "1.0.0",
                    dependencies: {},
                    dist: {},
                  },
                },
              },
        );
      },
    });

    expect(snapshot.fileCount).toBe(1);
    expect(snapshot.estimates.fileCount).toBe("lower-bound");
    expect(snapshot.unpackedBytes).toBe(1);
    expect(snapshot.estimates.unpackedBytes).toBe("lower-bound");
    expect(snapshot.warnings).toContain(
      "missing@1.0.0 does not publish fileCount metadata.",
    );
  });
});

function registryPackage(name: string, dependencies: Record<string, string>) {
  return {
    name,
    "dist-tags": { latest: "1.0.0" },
    versions: {
      "1.0.0": {
        name,
        version: "1.0.0",
        dependencies,
        dist: {
          fileCount: 1,
          unpackedSize: 1,
        },
      },
    },
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}
