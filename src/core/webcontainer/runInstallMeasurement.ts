import type { ImpactReport } from "../../types/report";
import { createWebContainer } from "./createWebContainer";
import { patchPackageManifest } from "./patchPackageManifest";

export type InstallMeasurementResult =
  | {
      ok: true;
      before: InstallMeasurementStats;
      after: InstallMeasurementStats;
      delta: InstallMeasurementStats;
      label: "experimental-webcontainer";
      warnings: string[];
    }
  | {
      ok: false;
      reason: string;
    };

export type InstallMeasurementStats = {
  packageCount: number;
  fileCount: number;
  nodeModulesBytes: number;
};

export async function runInstallMeasurement(report: ImpactReport): Promise<InstallMeasurementResult> {
  const container = await createWebContainer();
  if (!container.ok) {
    return container;
  }

  try {
    const beforeManifest = {
      name: report.rootPackage.latest.name,
      version: report.rootPackage.latest.version,
      dependencies: report.rootPackage.latest.dependencies ?? {}
    };
    const manifest = patchPackageManifest(report.rootPackage.latest, report.from, report.to);

    const before = await installAndMeasure(container.instance, beforeManifest);
    await resetWorkspace(container.instance.fs);
    const after = await installAndMeasure(container.instance, manifest);

    return {
      ok: true,
      before,
      after,
      delta: {
        packageCount: before.packageCount - after.packageCount,
        fileCount: before.fileCount - after.fileCount,
        nodeModulesBytes: before.nodeModulesBytes - after.nodeModulesBytes
      },
      label: "experimental-webcontainer",
      warnings: [
        "Experimental browser install measurement; package manager cache behavior and local lockfiles are not modeled."
      ]
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "WebContainer measurement failed."
    };
  }
}

type FileSystemApi = import("@webcontainer/api").WebContainer["fs"];
type WebContainerInstance = import("@webcontainer/api").WebContainer;

async function installAndMeasure(
  instance: WebContainerInstance,
  manifest: { name: string; version: string; dependencies: Record<string, string> }
): Promise<InstallMeasurementStats> {
  await instance.mount({
    "package.json": {
      file: {
        contents: JSON.stringify(manifest, null, 2)
      }
    }
  });

  const install = await instance.spawn("npm", ["install", "--ignore-scripts"]);
  const exitCode = await install.exit;
  if (exitCode !== 0) {
    throw new Error(`npm install exited with code ${exitCode}.`);
  }

  const measured = await measureDirectory(instance.fs, "node_modules");
  return {
    packageCount: measured.packageCount,
    fileCount: measured.fileCount,
    nodeModulesBytes: measured.bytes
  };
}

async function resetWorkspace(fs: FileSystemApi): Promise<void> {
  await removePath(fs, "node_modules");
  await removePath(fs, "package-lock.json");
}

async function removePath(fs: FileSystemApi, path: string): Promise<void> {
  const fsWithRm = fs as FileSystemApi & {
    rm?: (target: string, options: { recursive?: boolean; force?: boolean }) => Promise<void>;
  };

  if (!fsWithRm.rm) {
    return;
  }

  try {
    await fsWithRm.rm(path, { recursive: true, force: true });
  } catch {
    // A missing generated path should not make the second measurement unavailable.
  }
}

async function measureDirectory(
  fs: FileSystemApi,
  path: string
): Promise<{ packageCount: number; fileCount: number; bytes: number }> {
  let packageCount = 0;
  let fileCount = 0;
  let bytes = 0;

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = `${currentPath}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== ".bin" && !entry.name.startsWith(".")) {
          if (entry.name.startsWith("@")) {
            await walk(entryPath);
          } else if (currentPath === "node_modules" || currentPath.includes("node_modules/@")) {
            packageCount += 1;
            await walk(entryPath);
          } else {
            await walk(entryPath);
          }
        }
      } else {
        fileCount += 1;
        try {
          const content = await fs.readFile(entryPath);
          bytes += content.byteLength;
        } catch {
          // Keep the measurement usable even if a generated file disappears during traversal.
        }
      }
    }
  }

  await walk(path);
  return { packageCount, fileCount, bytes };
}
