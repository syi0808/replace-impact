import type { ReplacementRule } from "../../types/replacement";

export function matchModuleReplacement(
  packageName: string,
  rules: ReplacementRule[]
): ReplacementRule[] {
  return rules.filter((rule) => rule.from === packageName);
}
