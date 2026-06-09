<script setup lang="ts">
import { computed } from "vue";
import type { ImpactReport } from "../../types/report";
import {
  carbonAssumptions,
  calculateCarbonEquivalents,
  CARBON_EQUIVALENTS,
} from "../../core/metrics/carbon";
import {
  formatCarbon,
  formatCompact,
  formatUsd,
} from "../../core/metrics/formatting";

const props = defineProps<{
  report: ImpactReport;
}>();

const monthlyEquivalents = computed(() =>
  calculateCarbonEquivalents(props.report.metrics.carbonMonthly.monthly),
);

const equivalentTooltips = {
  meal: "1 meal uses a 600 kcal average-meal estimate of 1.5 kg CO2e. Actual emissions vary by ingredient, preparation, and region.",
  warmShower10Min:
    "1 warm shower uses a 10-minute estimate of 1.15 kg CO2e. Actual emissions vary by shower length, water temperature, heater type, and local energy mix.",
  phoneCharge:
    "1 smartphone charge uses the US EPA estimate of 0.0124 kg CO2. This depends on the local electricity mix.",
  socialCostOfCarbon:
    "This is not cash saved. It estimates avoided future climate damage using $190 per tCO2, or $0.19 per kgCO2.",
} as const;
</script>

<template>
  <section class="section-block" aria-labelledby="carbon-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Communication aid</p>
        <h2 id="carbon-heading">Estimated emissions avoided</h2>
      </div>
      <strong
        >{{ formatCarbon(report.metrics.carbonMonthly.monthly) }} /
        month</strong
      >
    </div>

    <dl class="assumption-list">
      <div>
        <dt>Energy intensity</dt>
        <dd>{{ carbonAssumptions.energyIntensityKWhPerGB }} kWh/GB</dd>
      </div>
      <div>
        <dt>Grid intensity</dt>
        <dd>{{ carbonAssumptions.gridIntensityKgCO2ePerKWh }} kg CO2e/kWh</dd>
      </div>
    </dl>

    <div class="equivalence-grid" aria-label="Monthly lifestyle equivalents">
      <div :title="equivalentTooltips.meal">
        <span>Average meals</span>
        <strong>{{ formatCompact(monthlyEquivalents.meals) }}</strong>
        <small>1 meal = {{ CARBON_EQUIVALENTS.meal.kgCo2e }} kg CO2e</small>
      </div>
      <div :title="equivalentTooltips.warmShower10Min">
        <span>Warm showers</span>
        <strong>{{
          formatCompact(monthlyEquivalents.warmShowers10Min)
        }}</strong>
        <small
          >10 min = {{ CARBON_EQUIVALENTS.warmShower10Min.kgCo2e }} kg
          CO2e</small
        >
      </div>
      <div :title="equivalentTooltips.phoneCharge">
        <span>Phone charges</span>
        <strong>{{ formatCompact(monthlyEquivalents.phoneCharges) }}</strong>
        <small
          >1 charge = {{ CARBON_EQUIVALENTS.phoneCharge.kgCo2e }} kg CO2</small
        >
      </div>
      <div :title="equivalentTooltips.socialCostOfCarbon">
        <span>Avoided climate damage</span>
        <strong>{{ formatUsd(monthlyEquivalents.avoidedDamageUsd) }}</strong>
        <small>$190 / tCO2</small>
      </div>
    </div>

    <p class="caveat">
      Estimates are approximate and intended for communication, not formal
      carbon accounting.
    </p>
  </section>
</template>
