<script setup lang="ts">
import { AlertTriangle } from "lucide-vue-next";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
  to: stringQuery(route.query.to),
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
      const loadedReport = await createImpactReport(
        params.pkg,
        params.from,
        params.to,
        {
          signal: controller.signal,
        },
      );
      if (currentLoadId === loadId) {
        report.value = loadedReport;
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
            : "Report could not be generated.";
      }
    } finally {
      if (currentLoadId === loadId) {
        loading.value = false;
      }
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  controller?.abort();
});

function stringQuery(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function validateParams(params: {
  pkg: string;
  from: string;
  to: string;
}): string | null {
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
      <Spinner />
      <span>Resolving live npm metadata and download reach...</span>
    </div>

    <Alert v-else-if="error" variant="warning" role="alert">
      <AlertTriangle aria-hidden="true" :size="18" />
      <span>{{ error }}</span>
    </Alert>

    <template v-else-if="report">
      <header class="page-header report-header">
        <p class="eyebrow">Shareable impact report</p>
        <h1>
          <code>{{ report.from }}</code>
          <span>-></span>
          <code>{{ report.to }}</code>
        </h1>
        <p>
          In <strong>{{ report.pkg }}</strong
          >, based on {{ report.rootPackage.name }}@{{
            report.rootPackage.latestVersion
          }}
          and live npm registry data.
        </p>
        <div class="header-facts">
          <Badge v-if="report.directDependency" variant="outline">
            direct {{ report.directDependency.kind }} -
            {{ report.directDependency.range }}
          </Badge>
          <Badge v-else variant="outline">not a direct dependency</Badge>
          <Badge variant="outline"
            >monthly downloads
            {{ formatCount(report.downloads.monthly) }}</Badge
          >
          <Badge variant="outline"
            >yearly downloads {{ formatCount(report.downloads.yearly) }}</Badge
          >
        </div>
      </header>

      <Alert v-if="report.directDependencyWarning" variant="warning">
        <AlertTriangle aria-hidden="true" :size="18" />
        <span>{{ report.directDependencyWarning }}</span>
      </Alert>

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
          <li>
            Missing registry fields render as unknown rather than fabricated
            values.
          </li>
          <li v-for="warning in report.warnings" :key="warning">
            {{ warning }}
          </li>
        </ul>
      </section>

      <PrMarkdownPreview :report="report" />
      <ExperimentalMeasurement :report="report" />
    </template>
  </section>
</template>
