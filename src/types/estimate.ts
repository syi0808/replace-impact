export type EstimateKind = "exact" | "lower-bound" | "upper-bound" | "unknown";

export type EstimatedValue = {
  value: number | null;
  estimate: EstimateKind;
};
