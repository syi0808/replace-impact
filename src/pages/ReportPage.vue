<script setup lang="ts">
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarDays,
  Download,
  Info,
  PackageCheck,
} from "lucide-vue-next";
import { computed, onUnmounted, ref, watch } from "vue";
import type { Component } from "vue";
import { useRoute } from "vue-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { ImpactReport, ReportPeriod } from "../types/report";
import { isValidPackageName } from "../core/npm/resolvePackage";
import { createImpactReport } from "../features/impact-report/createImpactReport";
import { formatCount } from "../core/metrics/formatting";
import ImpactSummary from "../features/impact-report/ImpactSummary.vue";
import BeforeAfterTable from "../features/impact-report/BeforeAfterTable.vue";
import NetworkImpact from "../features/impact-report/NetworkImpact.vue";
import CarbonEstimate from "../features/impact-report/CarbonEstimate.vue";
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
const statisticPeriod = ref<ReportPeriod>("yearly");
const periodOptions = [
  {
    value: "yearly",
    label: "Yearly",
    icon: CalendarDays,
  },
  {
    value: "monthly",
    label: "Monthly",
    icon: Calendar,
  },
] satisfies ReadonlyArray<{
  value: ReportPeriod;
  label: string;
  icon: Component;
}>;
const caveatWarnings = computed(() => {
  if (!report.value) {
    return [];
  }

  return report.value.warnings.filter(
    (warning) => warning !== report.value?.directDependencyWarning,
  );
});
const knownIssueWarnings = computed(() =>
  caveatWarnings.value.filter(isKnownMetadataIssue),
);
const otherWarnings = computed(() =>
  caveatWarnings.value.filter((warning) => !isKnownMetadataIssue(warning)),
);
const hasBoundedEstimates = computed(() => {
  if (!report.value) {
    return false;
  }

  return Object.values(report.value.metrics).some((metric) =>
    Object.values(metric.estimates).some(
      (estimate) => estimate === "lower-bound" || estimate === "upper-bound",
    ),
  );
});

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
  if (!params.pkg || !params.from) {
    return "Report URLs need pkg and from query parameters.";
  }

  for (const [label, value] of [
    ["pkg", params.pkg],
    ["from", params.from],
  ] as const) {
    if (!isValidPackageName(value)) {
      return `Invalid ${label} package name in this report URL.`;
    }
  }

  if (params.to && !isValidPackageName(params.to)) {
    return "Invalid to package name in this report URL.";
  }

  return null;
}

function formatShortCount(value: number | null): string {
  return formatCount(value, {
    maximumFractionDigits: 2,
    notation: "compact",
  });
}

function isKnownMetadataIssue(warning: string): boolean {
  return /does not publish (fileCount|unpackedSize) metadata|compressed tarball size is unknown/.test(
    warning,
  );
}

function formatKnownIssue(warning: string): string {
  return warning
    .replace(/^Before graph: /, "Before subtree: ")
    .replace(/^After graph: /, "After subtree: ");
}
</script>

<template>
  <section class="content-page report-page">
    <div v-if="loading" class="loading-panel">
      <Spinner />
      <span>Calculating savings from npm data...</span>
    </div>

    <Alert v-else-if="error" variant="warning" role="alert">
      <AlertTriangle aria-hidden="true" :size="18" />
      <span>{{ error }}</span>
    </Alert>

    <template v-else-if="report">
      <header class="page-header report-header">
        <div class="report-header-top">
          <p class="eyebrow">Replacement savings</p>
          <div
            class="period-toggle"
            role="radiogroup"
            aria-label="Statistics basis"
          >
            <label
              v-for="option in periodOptions"
              :key="option.value"
              class="period-toggle-option"
              :class="{ 'is-active': statisticPeriod === option.value }"
            >
              <input
                v-model="statisticPeriod"
                type="radio"
                name="report-statistic-period"
                :value="option.value"
              />
              <component :is="option.icon" aria-hidden="true" :size="15" />
              <span>{{ option.label }}</span>
            </label>
          </div>
        </div>
        <h1>
          <code>{{ report.from }}</code>
          <ArrowRight class="report-arrow" aria-hidden="true" :size="34" />
          <code>{{ report.to ?? "native API" }}</code>
        </h1>
        <p class="report-context">
          <strong>{{ report.pkg }}</strong> @
          {{ report.rootPackage.latestVersion }} | npm metadata + downloads
        </p>
        <div class="header-facts">
          <Badge v-if="report.directDependency" variant="outline">
            <PackageCheck aria-hidden="true" :size="14" />
            direct {{ report.directDependency.kind }}
            {{ report.directDependency.range }}
          </Badge>
          <Badge v-else variant="outline">
            <PackageCheck aria-hidden="true" :size="14" />
            indirect
          </Badge>
          <Badge variant="outline"
            ><Download aria-hidden="true" :size="14" />
            {{ formatShortCount(report.downloads.monthly) }} / mo</Badge
          >
          <Badge variant="outline"
            ><CalendarDays aria-hidden="true" :size="14" />
            {{ formatShortCount(report.downloads.yearly) }} / yr</Badge
          >
        </div>
      </header>

      <Alert v-if="report.directDependencyWarning" variant="warning">
        <AlertTriangle aria-hidden="true" :size="18" />
        <span>{{ report.directDependencyWarning }}</span>
      </Alert>

      <ImpactSummary :report="report" :period="statisticPeriod" />
      <BeforeAfterTable :report="report" />
      <NetworkImpact :report="report" :period="statisticPeriod" />
      <CarbonEstimate :report="report" :period="statisticPeriod" />

      <section class="section-block" aria-labelledby="caveats-heading">
        <div class="section-heading-row">
          <div>
            <p class="eyebrow">Savings basis</p>
            <h2 id="caveats-heading">Limits & assumptions</h2>
          </div>
        </div>
        <ul class="warning-list">
          <li>
            <Info aria-hidden="true" :size="16" />
            <span
              >Values represent potential savings, not guaranteed real-world
              reductions.</span
            >
          </li>
          <li v-if="hasBoundedEstimates">
            <Info aria-hidden="true" :size="16" />
            <span
              ><code>+</code> marks a known lower bound because some registry
              metadata is missing.</span
            >
          </li>
          <li v-for="warning in knownIssueWarnings" :key="warning">
            <Info aria-hidden="true" :size="16" />
            <span>
              {{ formatKnownIssue(warning) }}
            </span>
          </li>
          <li v-for="warning in otherWarnings" :key="warning">
            <AlertTriangle aria-hidden="true" :size="16" />
            <span>{{ warning }}</span>
          </li>
        </ul>
      </section>

      <PrMarkdownPreview :report="report" />
    </template>
  </section>
</template>
