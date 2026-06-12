<script setup lang="ts">
import { Info, Wifi } from "lucide-vue-next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImpactReport } from "../../types/report";
import {
  calculateTransferSeconds,
  networkProfiles,
} from "../../core/metrics/networkTime";
import { formatEstimatedDuration } from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
}>();

function formatTransferTime(
  trafficBytes: number | null,
  estimate: ImpactReport["metrics"]["traffic"]["estimates"]["perInstall"],
  downlinkMbps: number,
): string {
  return formatEstimatedDuration(
    calculateTransferSeconds(trafficBytes, downlinkMbps),
    estimate,
  );
}
</script>

<template>
  <section class="section-block" aria-labelledby="network-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Transfer</p>
        <h2 id="network-heading">Transfer time avoided</h2>
      </div>
    </div>

    <Table aria-label="Equivalent network transfer time avoided">
      <TableHeader>
        <TableRow>
          <TableHead>Network profile</TableHead>
          <TableHead>
            <span class="table-metric table-metric--right">
              <Wifi aria-hidden="true" :size="15" />
              Mbps
            </span>
          </TableHead>
          <TableHead>Avoided / install</TableHead>
          <TableHead>Avoided / month</TableHead>
          <TableHead>Avoided / year</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="profile in networkProfiles" :key="profile.label">
          <TableCell>{{ profile.label }}</TableCell>
          <TableCell>{{ profile.downlinkMbps }} Mbps</TableCell>
          <TableCell>{{
            formatTransferTime(
              report.metrics.traffic.perInstall,
              report.metrics.traffic.estimates.perInstall,
              profile.downlinkMbps,
            )
          }}</TableCell>
          <TableCell>{{
            formatTransferTime(
              report.metrics.traffic.monthly,
              report.metrics.traffic.estimates.monthly,
              profile.downlinkMbps,
            )
          }}</TableCell>
          <TableCell>{{
            formatTransferTime(
              report.metrics.traffic.yearly,
              report.metrics.traffic.estimates.yearly,
              profile.downlinkMbps,
            )
          }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <p class="report-note">
      <Info aria-hidden="true" :size="16" />
      <span>Equivalent transfer time only; not install duration.</span>
    </p>
  </section>
</template>
