import type { ReplacementRule, ReplacementRuleType } from "../../types/replacement";
import { isValidPackageName } from "../npm/resolvePackage";

type UnknownRecord = Record<string, unknown>;

export function normalizeModuleReplacements(
  payload: unknown,
  sourceType: ReplacementRuleType = "unknown",
  sourceUrl?: string
): ReplacementRule[] {
  const rules: ReplacementRule[] = [];
  const seen = new Set<string>();

  function add(rule: ReplacementRule): void {
    const normalized: ReplacementRule = {
      ...rule,
      from: rule.from.trim(),
      to: rule.to.trim(),
      type: rule.type ?? sourceType,
      sourceUrl: rule.sourceUrl ?? sourceUrl
    };

    if (!normalized.from || !normalized.to) {
      return;
    }

    const key = `${normalized.from}\u0000${normalized.to}\u0000${normalized.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      rules.push(normalized);
    }
  }

  function parseItem(item: unknown, inferredFrom?: string): void {
    if (typeof item === "string" && inferredFrom) {
      add({
        from: inferredFrom,
        to: item,
        type: sourceType,
        sourceUrl
      });
      return;
    }

    if (!isRecord(item)) {
      return;
    }

    if (Array.isArray(item.replacements)) {
      const from = readString(item, ["moduleName", "from", "name", "packageName"]) ?? inferredFrom;
      for (const nested of item.replacements) {
        parseItem(nested, from);
      }
      return;
    }

    const from = inferredFrom ?? readString(item, ["from", "moduleName", "name", "packageName"]);
    const to =
      readString(
        item,
        inferredFrom
          ? ["to", "replacement", "replaceWith", "target", "package", "packageName", "moduleName", "name"]
          : ["to", "replacement", "replaceWith", "target", "package", "packageName"]
      ) ??
      readFirstString(item.alternatives) ??
      readFirstString(item.replacement);

    if (!from || !to) {
      return;
    }

    add({
      from,
      to,
      type: normalizeRuleType(readString(item, ["type", "category"]), sourceType),
      caution: readString(item, ["caution", "note", "notes", "reason", "description"]) ?? undefined,
      sourceUrl: readString(item, ["sourceUrl", "source", "url"]) ?? sourceUrl,
      docsUrl: readString(item, ["docsUrl", "docs", "guide", "guideUrl"]) ?? undefined
    });
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      parseItem(item);
    }
    return rules;
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.replacements)) {
      for (const item of payload.replacements) {
        parseItem(item);
      }
    }

    for (const [from, value] of Object.entries(payload)) {
      if (from === "replacements" || from === "default") {
        continue;
      }

      if (!isValidPackageName(from)) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          parseItem(item, from);
        }
      } else {
        parseItem(value, from);
      }
    }
  }

  return rules;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function readFirstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim());
    return typeof first === "string" ? first : null;
  }

  return null;
}

function normalizeType(value: string | ReplacementRuleType): ReplacementRuleType {
  const normalized = value.toLowerCase().replace(/_/g, "-");

  if (normalized.includes("native")) {
    return "native";
  }

  if (normalized.includes("preferred")) {
    return "preferred";
  }

  if (normalized.includes("micro")) {
    return "micro-utility";
  }

  if (normalized.includes("ecosystem")) {
    return "ecosystem-recommendation";
  }

  return "unknown";
}

function normalizeRuleType(
  value: string | null,
  sourceType: ReplacementRuleType
): ReplacementRuleType {
  const parsed = value ? normalizeType(value) : "unknown";
  if (parsed === "unknown" && sourceType !== "unknown") {
    return sourceType;
  }

  return parsed;
}
