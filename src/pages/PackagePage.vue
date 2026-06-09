<script setup lang="ts">
import { AlertTriangle, ArrowRight, ExternalLink } from "lucide-vue-next";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { DependencyEntry, PackageMetadata } from "../types/package";
import type {
  ReplacementCandidate,
  ReplacementRule,
} from "../types/replacement";
import { fetchPackageMetadata } from "../core/npm/registryClient";
import {
  isValidPackageName,
  listDirectDependencies,
  routeParamToPackageName,
} from "../core/npm/resolvePackage";
import { loadModuleReplacements } from "../core/replacements/loadModuleReplacements";
import { matchReplacementCandidates } from "../features/replacement-recommender/matchReplacementCandidates";
import ReplacementCandidateList from "../features/replacement-recommender/ReplacementCandidateList.vue";

const route = useRoute();
const router = useRouter();
const packageName = computed(() =>
  routeParamToPackageName(
    route.params.pkgMatch as string | string[] | undefined,
  ),
);

const loading = ref(false);
const replacementLoading = ref(false);
const error = ref<string | null>(null);
const replacementError = ref<string | null>(null);
const metadata = ref<PackageMetadata | null>(null);
const dependencies = ref<DependencyEntry[]>([]);
const candidates = ref<ReplacementCandidate[]>([]);
const selectedDependencyName = ref("");
const replacementPackageName = ref("");

const selectedDependency = computed(
  () =>
    dependencies.value.find(
      (dependency) => dependency.name === selectedDependencyName.value,
    ) ?? null,
);

const canCreateManualReport = computed(
  () =>
    !!metadata.value &&
    !!selectedDependency.value &&
    isValidPackageName(replacementPackageName.value) &&
    replacementPackageName.value.trim() !== selectedDependency.value.name,
);

let loadId = 0;
let controller: AbortController | null = null;

watch(
  packageName,
  async (name) => {
    const currentLoadId = ++loadId;
    controller?.abort();
    controller = null;
    metadata.value = null;
    dependencies.value = [];
    candidates.value = [];
    selectedDependencyName.value = "";
    replacementPackageName.value = "";
    error.value = null;
    replacementError.value = null;
    replacementLoading.value = false;

    if (!name || !isValidPackageName(name)) {
      error.value = "Enter a valid npm package name in the URL.";
      return;
    }

    controller = new AbortController();
    loading.value = true;
    try {
      const loadedMetadata = await fetchPackageMetadata(name, {
        signal: controller.signal,
      });
      if (currentLoadId !== loadId) {
        return;
      }

      metadata.value = loadedMetadata;
      dependencies.value = listDirectDependencies(loadedMetadata.latest);
      selectedDependencyName.value = dependencies.value[0]?.name ?? "";
      loading.value = false;

      replacementLoading.value = true;
      let rules: ReplacementRule[] = [];
      try {
        rules = await loadModuleReplacements();
      } catch (replacementLoadError) {
        if (currentLoadId === loadId) {
          replacementError.value =
            replacementLoadError instanceof Error
              ? replacementLoadError.message
              : "Replacement candidates unavailable.";
        }
      }

      if (currentLoadId === loadId) {
        candidates.value = matchReplacementCandidates(
          dependencies.value,
          rules,
        );
      }
    } catch (loadError) {
      if (
        loadError instanceof DOMException &&
        loadError.name === "AbortError"
      ) {
        return;
      }

      if (currentLoadId === loadId) {
        error.value =
          loadError instanceof Error
            ? loadError.message
            : "Package metadata could not be loaded.";
      }
    } finally {
      if (currentLoadId === loadId) {
        loading.value = false;
        replacementLoading.value = false;
      }
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  controller?.abort();
});

function createManualReport(): void {
  if (
    !metadata.value ||
    !selectedDependency.value ||
    !canCreateManualReport.value
  ) {
    return;
  }

  const params = new URLSearchParams({
    pkg: metadata.value.name,
    from: selectedDependency.value.name,
    to: replacementPackageName.value.trim(),
  });
  router.push(`/report?${params.toString()}`);
}
</script>

<template>
  <section class="content-page">
    <div v-if="loading" class="loading-panel">
      <Spinner />
      <span>Loading real npm metadata...</span>
    </div>

    <Alert v-else-if="error" variant="warning" role="alert">
      <AlertTriangle aria-hidden="true" :size="18" />
      <span>{{ error }}</span>
    </Alert>

    <template v-else-if="metadata">
      <header class="page-header">
        <p class="eyebrow">npm package</p>
        <h1>{{ metadata.name }}</h1>
        <p>
          {{
            metadata.latest.description || "No package description published."
          }}
        </p>
        <div class="header-facts">
          <Badge variant="outline">latest {{ metadata.latestVersion }}</Badge>
          <Badge variant="outline">{{
            metadata.latest.license || "unknown license"
          }}</Badge>
          <Button
            v-if="metadata.repositoryUrl"
            as="a"
            variant="outline"
            size="sm"
            :href="metadata.repositoryUrl"
            target="_blank"
            rel="noreferrer"
          >
            repository <ExternalLink aria-hidden="true" :size="14" />
          </Button>
        </div>
      </header>

      <section class="section-block" aria-labelledby="dependencies-heading">
        <div class="section-heading-row">
          <div>
            <p class="eyebrow">Direct manifest entries</p>
            <h2 id="dependencies-heading">Dependencies</h2>
          </div>
          <Badge variant="outline">{{ dependencies.length }} entries</Badge>
        </div>

        <div v-if="dependencies.length" class="dependency-list">
          <Card
            v-for="dependency in dependencies"
            :key="`${dependency.kind}-${dependency.name}`"
            class="dependency-row"
          >
            <code>{{ dependency.name }}</code>
            <span>{{ dependency.range }}</span>
            <Badge v-if="dependency.kind === 'optional'">optional</Badge>
            <Badge v-else-if="dependency.kind === 'peer'" variant="caution"
              >peer caution</Badge
            >
            <Badge v-else variant="muted">dependency</Badge>
          </Card>
        </div>

        <p v-else class="empty-state">
          No direct dependencies are published for this latest version.
        </p>
      </section>

      <section class="section-block" aria-labelledby="manual-report-heading">
        <div class="section-heading-row">
          <div>
            <p class="eyebrow">Manual replacement</p>
            <h2 id="manual-report-heading">Create report</h2>
          </div>
        </div>

        <form class="manual-report-form" @submit.prevent="createManualReport">
          <Label>
            <span>Dependency</span>
            <Select
              v-model="selectedDependencyName"
              :disabled="!dependencies.length"
            >
              <option
                v-for="dependency in dependencies"
                :key="`${dependency.kind}-${dependency.name}`"
                :value="dependency.name"
              >
                {{ dependency.name }} ({{ dependency.kind }})
              </option>
            </Select>
          </Label>

          <Label>
            <span>Replacement package</span>
            <Input
              v-model="replacementPackageName"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="tinyglobby"
              aria-label="Replacement package"
            />
          </Label>

          <Button type="submit" :disabled="!canCreateManualReport">
            <span>Create report</span>
            <ArrowRight aria-hidden="true" :size="17" />
          </Button>
        </form>

        <Alert v-if="selectedDependency?.kind === 'optional'">
          Optional dependencies are shown separately from default installed
          dependency traffic.
        </Alert>
        <Alert
          v-else-if="selectedDependency?.kind === 'peer'"
          variant="warning"
        >
          Peer dependencies are compatibility signals; the report will show a
          caution.
        </Alert>
        <Alert
          v-else-if="
            replacementPackageName &&
            !isValidPackageName(replacementPackageName)
          "
          variant="warning"
        >
          Enter a valid npm package name for the replacement.
        </Alert>
      </section>

      <ReplacementCandidateList
        :package-name="metadata.name"
        :candidates="candidates"
        :unavailable-message="
          replacementLoading
            ? 'Loading replacement candidates...'
            : replacementError
              ? 'Replacement candidates unavailable. Explicit report URLs still work.'
              : null
        "
      />
    </template>
  </section>
</template>
