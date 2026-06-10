import type { DependencyKind } from "./package";

export type ReplacementRuleType =
  | "native"
  | "preferred"
  | "micro-utility"
  | "ecosystem-recommendation"
  | "unknown";

export type ReplacementRule = {
  from: string;
  to: string | null;
  type: ReplacementRuleType;
  caution?: string;
  sourceUrl?: string;
  docsUrl?: string;
};

export type ReplacementCandidate = {
  rule: ReplacementRule;
  dependencyKind: DependencyKind;
  currentRange: string;
};
