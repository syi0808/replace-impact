<script setup lang="ts">
import { AlertTriangle, ArrowRight, ExternalLink } from "lucide-vue-next";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { ReplacementCandidate } from "../../types/replacement";
import { isValidPackageName } from "../../core/npm/resolvePackage";

const props = defineProps<{
  packageName: string;
  candidates: ReplacementCandidate[];
  unavailableMessage?: string | null;
}>();

const sortedCandidates = computed(() => props.candidates);

function reportUrl(candidate: ReplacementCandidate): string {
  const params = new URLSearchParams({
    pkg: props.packageName,
    from: candidate.rule.from,
    to: candidate.rule.to
  });
  return `/report?${params.toString()}`;
}

function sourceLabel(candidate: ReplacementCandidate): string {
  const source = candidate.rule.sourceUrl ?? candidate.rule.docsUrl;
  if (!source) {
    return "source unknown";
  }

  try {
    return new URL(source).hostname;
  } catch {
    return source;
  }
}
</script>

<template>
  <section class="section-block" aria-labelledby="replacement-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">e18e/module-replacements</p>
        <h2 id="replacement-heading">Replacement candidates</h2>
      </div>
      <span class="count-chip">{{ candidates.length }} matches</span>
    </div>

    <p v-if="unavailableMessage" class="status status-warning">
      {{ unavailableMessage }}
    </p>

    <div v-if="sortedCandidates.length" class="candidate-list">
      <article
        v-for="candidate in sortedCandidates"
        :key="`${candidate.dependencyKind}-${candidate.rule.from}-${candidate.rule.to}`"
        class="candidate-card"
      >
        <div>
          <div class="candidate-title">
            <code>{{ candidate.rule.from }}</code>
            <ArrowRight aria-hidden="true" :size="16" />
            <code>{{ candidate.rule.to }}</code>
          </div>
          <p class="muted">
            Current range {{ candidate.currentRange }} - {{ candidate.rule.type }}
          </p>
          <p class="muted">Source: {{ sourceLabel(candidate) }}</p>
        </div>

        <div class="candidate-badges">
          <span v-if="candidate.dependencyKind === 'optional'" class="badge">optional</span>
          <span v-if="candidate.dependencyKind === 'peer'" class="badge badge-caution">
            <AlertTriangle aria-hidden="true" :size="14" /> peer caution
          </span>
          <span v-if="candidate.rule.caution" class="badge badge-caution">
            <AlertTriangle aria-hidden="true" :size="14" /> caution
          </span>
        </div>

        <p v-if="candidate.rule.caution" class="candidate-note">{{ candidate.rule.caution }}</p>

        <div class="candidate-actions">
          <RouterLink
            v-if="isValidPackageName(candidate.rule.to)"
            class="secondary-button"
            :to="reportUrl(candidate)"
          >
            <span>View impact</span>
            <ArrowRight aria-hidden="true" :size="16" />
          </RouterLink>
          <span v-else class="status">Native or manual replacement</span>
          <a
            v-if="candidate.rule.docsUrl || candidate.rule.sourceUrl"
            class="icon-link"
            :href="candidate.rule.docsUrl || candidate.rule.sourceUrl"
            target="_blank"
            rel="noreferrer"
            :title="candidate.rule.docsUrl ? 'Open migration guide' : 'Open replacement source'"
          >
            <ExternalLink aria-hidden="true" :size="17" />
          </a>
        </div>
      </article>
    </div>

    <p v-else-if="!unavailableMessage" class="empty-state">
      No direct dependency replacement candidates were found for this package.
    </p>
  </section>
</template>
