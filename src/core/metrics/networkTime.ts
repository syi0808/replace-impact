export const networkProfiles = {
  "lighthouse-mobile": { label: "Lighthouse mobile", downlinkMbps: 1.6 },
  "regular-3g": { label: "Regular 3G", downlinkMbps: 0.75 },
  "slow-3g": { label: "Slow 3G", downlinkMbps: 0.4 },
  "2g": { label: "2G", downlinkMbps: 0.05 }
} as const;

export type NetworkProfileKey = keyof typeof networkProfiles;

export function calculateTransferSeconds(
  trafficBytes: number | null,
  downlinkMbps: number
): number | null {
  if (trafficBytes === null) {
    return null;
  }

  const downlinkBps = downlinkMbps * 1_000_000;
  return (trafficBytes * 8) / downlinkBps;
}
