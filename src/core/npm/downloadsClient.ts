import type { DownloadsSummary } from "../../types/report";
import { encodePackageForRegistry } from "./resolvePackage";

const downloadsBaseUrl = "https://api.npmjs.org/downloads/point";

type DownloadsPoint = {
  downloads?: number;
};

type ClientOptions = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

export async function fetchDownloadsSummary(
  packageName: string,
  options: ClientOptions = {}
): Promise<DownloadsSummary> {
  const [monthly, yearly] = await Promise.allSettled([
    fetchDownloadsPoint("last-month", packageName, options),
    fetchDownloadsPoint("last-year", packageName, options)
  ]);

  const warnings: string[] = [];

  if (monthly.status === "rejected") {
    warnings.push(`Monthly downloads unavailable: ${monthly.reason.message ?? "request failed"}`);
  }

  if (yearly.status === "rejected") {
    warnings.push(`Yearly downloads unavailable: ${yearly.reason.message ?? "request failed"}`);
  }

  return {
    monthly: monthly.status === "fulfilled" ? monthly.value : null,
    yearly: yearly.status === "fulfilled" ? yearly.value : null,
    warnings
  };
}

async function fetchDownloadsPoint(
  period: "last-month" | "last-year",
  packageName: string,
  options: ClientOptions
): Promise<number> {
  const fetcher = options.fetchImpl ?? fetch;
  const response = await fetcher(
    `${downloadsBaseUrl}/${period}/${encodePackageForRegistry(packageName)}`,
    { signal: options.signal }
  );

  if (!response.ok) {
    throw new Error(`npm downloads API returned ${response.status}`);
  }

  const data = (await response.json()) as DownloadsPoint;
  if (typeof data.downloads !== "number") {
    throw new Error("npm downloads API did not include downloads");
  }

  return data.downloads;
}
