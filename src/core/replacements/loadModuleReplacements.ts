import type { ReplacementRule, ReplacementRuleType } from "../../types/replacement";
import { normalizeModuleReplacements } from "./normalizeModuleReplacements";

const manifestSources: Array<{
  url: string;
  type: ReplacementRuleType;
}> = [
  {
    url: "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/all.json",
    type: "unknown"
  },
  {
    url: "https://unpkg.com/module-replacements@latest/manifests/all.json",
    type: "unknown"
  }
];

const typedFallbackSources: Array<{
  url: string;
  type: ReplacementRuleType;
}> = [
  {
    url: "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/native.json",
    type: "native"
  },
  {
    url: "https://unpkg.com/module-replacements@latest/manifests/native.json",
    type: "native"
  },
  {
    url: "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/preferred.json",
    type: "preferred"
  },
  {
    url: "https://unpkg.com/module-replacements@latest/manifests/preferred.json",
    type: "preferred"
  },
  {
    url: "https://cdn.jsdelivr.net/npm/module-replacements@latest/manifests/micro-utilities.json",
    type: "micro-utility"
  },
  {
    url: "https://unpkg.com/module-replacements@latest/manifests/micro-utilities.json",
    type: "micro-utility"
  }
];

type LoaderOptions = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

let cachedPromise: Promise<ReplacementRule[]> | null = null;

export function loadModuleReplacements(options: LoaderOptions = {}): Promise<ReplacementRule[]> {
  if (!options.fetchImpl && !options.signal) {
    cachedPromise ??= load(options).catch((error) => {
      cachedPromise = null;
      throw error;
    });
    return cachedPromise;
  }

  return load(options);
}

async function load(options: LoaderOptions): Promise<ReplacementRule[]> {
  const fetcher = options.fetchImpl ?? fetch;
  const failures: string[] = [];

  for (const source of manifestSources) {
    try {
      const payload = await fetchJson(fetcher, source.url, options.signal);
      const normalized = normalizeModuleReplacements(payload, source.type, source.url);
      if (normalized.length > 0) {
        return normalized;
      }
      failures.push(`${source.url} returned no replacement rules`);
    } catch (error) {
      failures.push(`${source.url}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  const fallbackResults = await Promise.allSettled(
    typedFallbackSources.map(async (source) => {
      const payload = await fetchJson(fetcher, source.url, options.signal);
      return normalizeModuleReplacements(payload, source.type, source.url);
    })
  );

  const rules = fallbackResults.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    failures.push(
      `${typedFallbackSources[index].url}: ${
        result.reason instanceof Error ? result.reason.message : "request failed"
      }`
    );
    return [];
  });

  if (rules.length === 0) {
    throw new Error(`Replacement data unavailable. ${failures.join(" ")}`);
  }

  return rules;
}

async function fetchJson(fetcher: typeof fetch, url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetcher(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
