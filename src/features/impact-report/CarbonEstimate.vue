<script setup lang="ts">
import {
  BatteryCharging,
  CircleDollarSign,
  Info,
  Leaf,
  ShowerHead,
  Utensils,
} from "lucide-vue-next";
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EstimateKind } from "../../types/estimate";
import type { ImpactReport, ReportPeriod } from "../../types/report";
import {
  carbonAssumptions,
  calculateCarbonEquivalents,
  CARBON_EQUIVALENTS,
} from "../../core/metrics/carbon";
import {
  formatCarbon,
  formatCount,
  formatEstimatedCount,
  formatEstimatedUsd,
  formatEstimatedValue,
} from "../../core/metrics/formatting";

const props = defineProps<{
  report: ImpactReport;
  period: ReportPeriod;
}>();

const selectedCarbon = computed(
  () => props.report.metrics.carbonMonthly[props.period],
);
const selectedCarbonEstimate = computed(
  () => props.report.metrics.carbonMonthly.estimates[props.period],
);
const selectedEquivalents = computed(() =>
  calculateCarbonEquivalents(selectedCarbon.value),
);
const periodSuffix = computed(() =>
  props.period === "yearly" ? "/ yr" : "/ mo",
);
const periodEquivalentLabel = computed(
  () =>
    `${props.period === "yearly" ? "Yearly" : "Monthly"} lifestyle equivalents`,
);

const equivalentTooltips = {
  meal: "1 meal uses a 600 kcal average-meal assumption of 1.5 kg CO2e. Actual emissions vary by ingredient, preparation, and region.",
  warmShower10Min:
    "1 warm shower uses a 10-minute assumption of 1.15 kg CO2e. Actual emissions vary by shower length, water temperature, heater type, and local energy mix.",
  phoneCharge:
    "1 smartphone charge uses the US EPA value of 0.0124 kg CO2. This depends on the local electricity mix.",
  socialCostOfCarbon:
    "This is not cash saved. It uses avoided future climate damage based on $190 per tCO2, or $0.19 per kgCO2.",
} as const;

function formatEquivalent(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedCount(value, estimate, {
    maximumFractionDigits: 2,
    notation: "compact",
  });
}

function formatCarbonShort(
  value: number | null,
  estimate: EstimateKind,
): string {
  return formatEstimatedValue(value, estimate, (knownValue) => {
    const abs = Math.abs(knownValue);
    const sign = knownValue < 0 ? "-" : "";

    if (abs >= 1000) {
      return `${sign}${formatCount(abs / 1000, {
        maximumFractionDigits: 2,
        notation: "compact",
      })} t CO2e`;
    }

    return formatCarbon(knownValue);
  });
}
</script>

<template>
  <section class="section-block" aria-labelledby="carbon-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Carbon</p>
        <h2 id="carbon-heading">CO2e avoided</h2>
      </div>
      <Badge variant="outline">
        <Leaf aria-hidden="true" :size="14" />
        {{ formatCarbonShort(selectedCarbon, selectedCarbonEstimate) }}
        {{ periodSuffix }}
      </Badge>
    </div>

    <dl class="assumption-list" aria-label="Carbon assumptions">
      <div title="Energy intensity">
        <dt>Energy intensity</dt>
        <dd>{{ carbonAssumptions.energyIntensityKWhPerGB }} kWh/GB</dd>
      </div>
      <div title="Grid intensity">
        <dt>Grid intensity</dt>
        <dd>{{ carbonAssumptions.gridIntensityKgCO2ePerKWh }} kg CO2e/kWh</dd>
      </div>
    </dl>

    <div class="equivalence-grid" :aria-label="periodEquivalentLabel">
      <Card :title="equivalentTooltips.meal">
        <span class="equivalence-icon" aria-hidden="true">
          <Utensils :size="18" />
        </span>
        <span>Meal equivalents</span>
        <strong>{{
          formatEquivalent(selectedEquivalents.meals, selectedCarbonEstimate)
        }}</strong>
        <small>{{ CARBON_EQUIVALENTS.meal.kgCo2e }} kg each</small>
      </Card>
      <Card :title="equivalentTooltips.warmShower10Min">
        <span class="equivalence-icon" aria-hidden="true">
          <ShowerHead :size="18" />
        </span>
        <span>Shower equivalents</span>
        <strong>{{
          formatEquivalent(
            selectedEquivalents.warmShowers10Min,
            selectedCarbonEstimate,
          )
        }}</strong>
        <small>{{ CARBON_EQUIVALENTS.warmShower10Min.kgCo2e }} kg each</small>
      </Card>
      <Card :title="equivalentTooltips.phoneCharge">
        <span class="equivalence-icon" aria-hidden="true">
          <BatteryCharging :size="18" />
        </span>
        <span>Phone charges</span>
        <strong>{{
          formatEquivalent(
            selectedEquivalents.phoneCharges,
            selectedCarbonEstimate,
          )
        }}</strong>
        <small>{{ CARBON_EQUIVALENTS.phoneCharge.kgCo2e }} kg each</small>
      </Card>
      <Card :title="equivalentTooltips.socialCostOfCarbon">
        <span class="equivalence-icon" aria-hidden="true">
          <CircleDollarSign :size="18" />
        </span>
        <span>Avoided damage</span>
        <strong>{{
          formatEstimatedUsd(
            selectedEquivalents.avoidedDamageUsd,
            selectedCarbonEstimate,
          )
        }}</strong>
        <small>$190 / tCO2</small>
      </Card>
    </div>

    <p class="report-note">
      <Info aria-hidden="true" :size="16" />
      <span>Communication aid, not formal emissions accounting.</span>
    </p>
  </section>
</template>
