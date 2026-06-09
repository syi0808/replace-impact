import type { DependencyEntry } from "../../types/package";
import type { ReplacementCandidate, ReplacementRule } from "../../types/replacement";

export function matchReplacementCandidates(
  dependencies: DependencyEntry[],
  rules: ReplacementRule[]
): ReplacementCandidate[] {
  const candidates: ReplacementCandidate[] = [];
  const seen = new Set<string>();

  for (const dependency of dependencies) {
    for (const rule of rules) {
      if (rule.from !== dependency.name) {
        continue;
      }

      const key = `${dependency.name}\u0000${rule.to}\u0000${dependency.kind}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      candidates.push({
        rule,
        dependencyKind: dependency.kind,
        currentRange: dependency.range
      });
    }
  }

  return candidates.sort((a, b) => {
    const kindOrder = { dependency: 0, optional: 1, peer: 2 };
    return kindOrder[a.dependencyKind] - kindOrder[b.dependencyKind] || a.rule.from.localeCompare(b.rule.from);
  });
}
