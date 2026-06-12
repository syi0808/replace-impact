import { describe, expect, it } from "vitest";
import { calculateCarbonKgCO2e } from "./carbon";
import {
  formatBytes,
  formatCarbon,
  formatCompact,
  formatDuration,
  formatEstimatedBytes,
  formatEstimatedCompact,
  formatHours,
} from "./formatting";
import { calculateTransferSeconds } from "./networkTime";
import {
  calculateEstimatedPerInstallDelta,
  calculateEstimatedPeriodValue,
  calculatePerInstallDelta,
  calculatePeriodValue,
} from "./traffic";

describe("metric formulas", () => {
  it("preserves negative savings as increases", () => {
    expect(calculatePerInstallDelta(100, 140)).toBe(-40);
    expect(calculatePeriodValue(-40, 10)).toBe(-400);
  });

  it("returns unknown when either side is missing", () => {
    expect(calculatePerInstallDelta(null, 140)).toBeNull();
    expect(calculatePeriodValue(null, 10)).toBeNull();
  });

  it("propagates lower-bound deltas when the missing side is safe", () => {
    const delta = calculateEstimatedPerInstallDelta(
      { value: 122, estimate: "lower-bound" },
      { value: 5, estimate: "exact" },
    );

    expect(delta).toEqual({ value: 117, estimate: "lower-bound" });
    expect(calculateEstimatedPeriodValue(delta, 10)).toEqual({
      value: 1170,
      estimate: "lower-bound",
    });
  });

  it("keeps ambiguous bounded deltas unknown", () => {
    expect(
      calculateEstimatedPerInstallDelta(
        { value: 122, estimate: "lower-bound" },
        { value: 5, estimate: "lower-bound" },
      ),
    ).toEqual({ value: null, estimate: "unknown" });
  });

  it("uses bytes and downlink Mbps for equivalent transfer time", () => {
    expect(calculateTransferSeconds(1_000_000, 0.4)).toBe(20);
  });

  it("uses the MVP carbon assumptions", () => {
    expect(calculateCarbonKgCO2e(1_000_000_000)).toBeCloseTo(0.095836);
  });
});

describe("formatting", () => {
  it("formats signed bytes and durations without hiding the sign", () => {
    expect(formatBytes(-1_500)).toBe("-1.5 kB");
    expect(formatDuration(-3_600)).toBe("-1 hr");
  });

  it("formats small carbon values in grams", () => {
    expect(formatCarbon(0.5)).toBe("500 g CO2e");
  });

  it("formats transfer comparisons in hours instead of years", () => {
    expect(formatHours(60 * 60 * 24 * 400)).toBe("9,600 hr");
  });

  it("formats large counts with full digits instead of compact suffixes", () => {
    expect(formatCompact(1_234_567)).toBe("1,234,567");
  });

  it("formats lower bounds with a plus suffix", () => {
    expect(formatEstimatedCompact(51, "lower-bound")).toBe("51+");
    expect(formatEstimatedBytes(1_500, "lower-bound")).toBe("1.5 kB+");
  });
});
