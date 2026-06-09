<script setup lang="ts">
import { AlertTriangle } from "lucide-vue-next";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { ImpactReport } from "../types/report";
import { isValidPackageName } from "../core/npm/resolvePackage";
import { createImpactReport } from "../features/impact-report/createImpactReport";
import { formatCount } from "../core/metrics/formatting";
import ImpactSummary from "../features/impact-report/ImpactSummary.vue";
import BeforeAfterTable from "../features/impact-report/BeforeAfterTable.vue";
import NetworkImpact from "../features/impact-report/NetworkImpact.vue";
import CarbonEstimate from "../features/impact-report/CarbonEstimate.vue";
import ExperimentalMeasurement from "../features/impact-report/ExperimentalMeasurement.vue";
import PrMarkdownPreview from "../features/pr-markdown/PrMarkdownPreview.vue";

const route = useRoute();

const query = computed(() => ({
  pkg: stringQuery(route.query.pkg),
  from: stringQuery(route.query.from),
  to: stringQuery(route.query.to)
}));

const loading = ref(false);
const error = ref<string | null>(null);
const report = ref<ImpactReport | null>(null);

let loadId = 0;
let controller: AbortController | null = null;

watch(
  query,
  async (params) => {
    const currentLoadId = ++loadId;
    controller?.abort();
    controller = null;
    report.value = null;
    error.value = null;

    const validationError = validateParams(params);
    if (validationError) {
      error.value = validationError;
      return;
    }

    controller = new AbortController();
    loading.value = true;

    try {
      const loadedReport = await createImpactReport(params.pkg, params.from, params.to, {
        signal: controller.signal
      });
      if (currentLoadId === loadId) {
        report.value = loadedReport;
      }
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") {
        return;
      }

      if (currentLoadId === loadId) {
        error.value = loadError instanceof Error ? loadError.message : "Report could not be generated.";
      }
    } finally {
      if (currentLoadId === loadId) {
        loading.value = false;
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  controller?.abort();
});

function stringQuery(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function validateParams(params: { pkg: string; from: string; to: string }): string | null {
  if (!params.pkg || !params.from || !params.to) {
    return "Report URLs need pkg, from, and to query parameters.";
  }

  for (const [label, value] of Object.entries(params)) {
    if (!isValidPackageName(value)) {
      return `Invalid ${label} package name in this report URL.`;
    }
  }

  return null;
}
</script>

<template>
  <section class="content-page report-page">
    <div v-if="loading" class="loading-panel">
      <span class="spinner" aria-hidden="true"></span>
      <span>Resolving live npm metadata and download reach...</span>
    </div>

    <div v-else-if="error" class="status status-warning">
      <AlertTriangle aria-hidden="true" :size="18" />
      <span>{{ error }}</span>
    </div>

    <template v-else-if="report">
      <header class="page-header report-header">
        <p class="eyebrow">Shareable impact report</p>
        <h1>
          <code>{{ report.from }}</code>
          <span>-></span>
          <code>{{ report.to }}</code>
        </h1>
        <p>
          In <strong>{{ report.pkg }}</strong>, based on {{ report.rootPackage.name }}@{{ report.rootPackage.latestVersion }}
          and live npm registry data.
        </p>
        <div class="header-facts">
          <span v-if="report.directDependency">
            direct {{ report.directDependency.kind }} - {{ report.directDependency.range }}
          </span>
          <span v-else>not a direct dependency</span>
          <span>monthly downloads {{ formatCount(report.downloads.monthly) }}</span>
          <span>yearly downloads {{ formatCount(report.downloads.yearly) }}</span>
        </div>
      </header>

      <div v-if="report.directDependencyWarning" class="status status-warning">
        <AlertTriangle aria-hidden="true" :size="18" />
        <span>{{ report.directDependencyWarning }}</span>
      </div>

      <ImpactSummary :report="report" />
      <BeforeAfterTable :report="report" />
      <NetworkImpact :report="report" />
      <CarbonEstimate :report="report" />

      <section class="section-block" aria-labelledby="caveats-heading">
        <div class="section-heading-row">
          <div>
            <p class="eyebrow">Partial data and caveats</p>
            <h2 id="caveats-heading">Methodology notes</h2>
          </div>
        </div>
        <ul class="warning-list">
          <li>Potential reach, not additive total.</li>
          <li>Missing registry fields render as unknown rather than fabricated values.</li>
          <li v-for="warning in report.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </section>

      <PrMarkdownPreview :report="report" />
      <ExperimentalMeasurement :report="report" />
    </template>
  </section>
</template>
