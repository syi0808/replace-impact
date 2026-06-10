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
import { formatDuration } from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
}>();
</script>

<template>
  <section class="section-block" aria-labelledby="network-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Network</p>
        <h2 id="network-heading">Transfer time</h2>
      </div>
    </div>

    <Table aria-label="Equivalent network transfer time avoided">
      <TableHeader>
        <TableRow>
          <TableHead>Profile</TableHead>
          <TableHead>
            <span class="table-metric table-metric--right">
              <Wifi aria-hidden="true" :size="15" />
              Mbps
            </span>
          </TableHead>
          <TableHead>Mo</TableHead>
          <TableHead>Yr</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="profile in networkProfiles" :key="profile.label">
          <TableCell>{{ profile.label }}</TableCell>
          <TableCell>{{ profile.downlinkMbps }} Mbps</TableCell>
          <TableCell>{{
            formatDuration(
              calculateTransferSeconds(
                report.metrics.traffic.monthly,
                profile.downlinkMbps,
              ),
            )
          }}</TableCell>
          <TableCell>{{
            formatDuration(
              calculateTransferSeconds(
                report.metrics.traffic.yearly,
                profile.downlinkMbps,
              ),
            )
          }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <p class="report-note">
      <Info aria-hidden="true" :size="16" />
      <span>Transfer comparison, not install duration.</span>
    </p>
  </section>
</template>
