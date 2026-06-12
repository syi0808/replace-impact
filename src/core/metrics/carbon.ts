import type { EstimatedValue } from "../../types/estimate";
import { calculateEstimatedPeriodValue } from "./traffic";

export const carbonAssumptions = {
  energyIntensityKWhPerGB: 0.194,
  gridIntensityKgCO2ePerKWh: 0.494,
} as const;

export const CARBON_EQUIVALENTS = {
  meal: {
    label: "average 600 kcal meal",
    kgCo2e: 1.5,
    source:
      "Clever Carbon; food footprints vary by ingredient, region, and preparation",
  },
  warmShower10Min: {
    label: "10-minute warm shower",
    kgCo2e: 1.15,
    source: "co2data.org shower estimate based on water-heating assumptions",
  },
  phoneCharge: {
    label: "smartphone charge",
    kgCo2e: 0.0124,
    source: "US EPA Greenhouse Gas Equivalencies Calculator",
  },
  socialCostOfCarbon: {
    label: "avoided climate damage",
    usdPerKgCo2e: 0.19,
    source: "US EPA 2023 SC-GHG report, 2.0% near-term discount rate",
  },
} as const;

export type CarbonEquivalentSummary = {
  meals: number | null;
  warmShowers10Min: number | null;
  phoneCharges: number | null;
  avoidedDamageUsd: number | null;
};

export function calculateCarbonKgCO2e(
  trafficBytes: number | null,
): number | null {
  if (trafficBytes === null) {
    return null;
  }

  const trafficAvoidedGB = trafficBytes / 1_000_000_000;
  const energyKWh =
    trafficAvoidedGB * carbonAssumptions.energyIntensityKWhPerGB;
  return energyKWh * carbonAssumptions.gridIntensityKgCO2ePerKWh;
}

export function calculateEstimatedCarbonKgCO2e(
  trafficBytes: EstimatedValue,
): EstimatedValue {
  const kgCo2ePerByte =
    (carbonAssumptions.energyIntensityKWhPerGB *
      carbonAssumptions.gridIntensityKgCO2ePerKWh) /
    1_000_000_000;

  return calculateEstimatedPeriodValue(trafficBytes, kgCo2ePerByte);
}

export function calculateCarbonEquivalents(
  savedKgCo2e: number | null,
): CarbonEquivalentSummary {
  if (savedKgCo2e === null) {
    return {
      meals: null,
      warmShowers10Min: null,
      phoneCharges: null,
      avoidedDamageUsd: null,
    };
  }

  return {
    meals: savedKgCo2e / CARBON_EQUIVALENTS.meal.kgCo2e,
    warmShowers10Min: savedKgCo2e / CARBON_EQUIVALENTS.warmShower10Min.kgCo2e,
    phoneCharges: savedKgCo2e / CARBON_EQUIVALENTS.phoneCharge.kgCo2e,
    avoidedDamageUsd:
      savedKgCo2e * CARBON_EQUIVALENTS.socialCostOfCarbon.usdPerKgCo2e,
  };
}
