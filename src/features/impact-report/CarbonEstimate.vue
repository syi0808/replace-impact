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
import type { ImpactReport } from "../../types/report";
import {
  carbonAssumptions,
  calculateCarbonEquivalents,
  CARBON_EQUIVALENTS,
} from "../../core/metrics/carbon";
import {
  formatCarbon,
  formatCount,
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

function formatEquivalent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  return formatCount(value, {
    maximumFractionDigits: 2,
    notation: "compact",
  });
}

function formatCarbonShort(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1000) {
    return `${sign}${formatCount(abs / 1000, {
      maximumFractionDigits: 2,
      notation: "compact",
    })} t CO2e`;
  }

  return formatCarbon(value);
}
</script>

<template>
  <section class="section-block" aria-labelledby="carbon-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Carbon</p>
        <h2 id="carbon-heading">CO2e estimate</h2>
      </div>
      <Badge variant="outline">
        <Leaf aria-hidden="true" :size="14" />
        {{ formatCarbonShort(report.metrics.carbonMonthly.monthly) }} / mo
      </Badge>
    </div>

    <dl class="assumption-list" aria-label="Carbon assumptions">
      <div title="Energy intensity">
        <dt>Energy</dt>
        <dd>{{ carbonAssumptions.energyIntensityKWhPerGB }} kWh/GB</dd>
      </div>
      <div title="Grid intensity">
        <dt>Grid</dt>
        <dd>{{ carbonAssumptions.gridIntensityKgCO2ePerKWh }} kg CO2e/kWh</dd>
      </div>
    </dl>

    <div class="equivalence-grid" aria-label="Monthly lifestyle equivalents">
      <Card :title="equivalentTooltips.meal">
        <span class="equivalence-icon" aria-hidden="true">
          <Utensils :size="18" />
        </span>
        <span>Meals</span>
        <strong>{{ formatEquivalent(monthlyEquivalents.meals) }}</strong>
        <small>{{ CARBON_EQUIVALENTS.meal.kgCo2e }} kg each</small>
      </Card>
      <Card :title="equivalentTooltips.warmShower10Min">
        <span class="equivalence-icon" aria-hidden="true">
          <ShowerHead :size="18" />
        </span>
        <span>Showers</span>
        <strong>{{
          formatEquivalent(monthlyEquivalents.warmShowers10Min)
        }}</strong>
        <small>{{ CARBON_EQUIVALENTS.warmShower10Min.kgCo2e }} kg each</small>
      </Card>
      <Card :title="equivalentTooltips.phoneCharge">
        <span class="equivalence-icon" aria-hidden="true">
          <BatteryCharging :size="18" />
        </span>
        <span>Charges</span>
        <strong>{{ formatEquivalent(monthlyEquivalents.phoneCharges) }}</strong>
        <small>{{ CARBON_EQUIVALENTS.phoneCharge.kgCo2e }} kg each</small>
      </Card>
      <Card :title="equivalentTooltips.socialCostOfCarbon">
        <span class="equivalence-icon" aria-hidden="true">
          <CircleDollarSign :size="18" />
        </span>
        <span>Damage</span>
        <strong>{{ formatUsd(monthlyEquivalents.avoidedDamageUsd) }}</strong>
        <small>$190 / tCO2</small>
      </Card>
    </div>

    <p class="report-note">
      <Info aria-hidden="true" :size="16" />
      <span>Communication estimate only.</span>
    </p>
  </section>
</template>
