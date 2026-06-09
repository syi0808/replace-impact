<script setup lang="ts">
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
import { formatHours } from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
}>();
</script>

<template>
  <section class="section-block" aria-labelledby="network-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Network profiles</p>
        <h2 id="network-heading">Equivalent network transfer time avoided</h2>
      </div>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Profile</TableHead>
          <TableHead>Downlink</TableHead>
          <TableHead>Monthly equivalent</TableHead>
          <TableHead>Yearly equivalent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="profile in networkProfiles" :key="profile.label">
          <TableCell>{{ profile.label }}</TableCell>
          <TableCell>{{ profile.downlinkMbps }} Mbps</TableCell>
          <TableCell>{{
            formatHours(
              calculateTransferSeconds(
                report.metrics.traffic.monthly,
                profile.downlinkMbps,
              ),
            )
          }}</TableCell>
          <TableCell>{{
            formatHours(
              calculateTransferSeconds(
                report.metrics.traffic.yearly,
                profile.downlinkMbps,
              ),
            )
          }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <p class="caveat">
      Equivalent network transfer time avoided is a transfer-time comparison,
      not an install-duration claim.
    </p>
  </section>
</template>
