<script setup lang="ts">
import { computed } from "vue";
import {
  Archive,
  CloudDownload,
  FileStack,
  PackageOpen,
} from "lucide-vue-next";
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
  formatEstimatedBytes,
  formatEstimatedCompact,
} from "../../core/metrics/formatting";
import { calculateEstimatedPerInstallDelta } from "../../core/metrics/traffic";

const props = defineProps<{
  report: ImpactReport;
}>();

const afterLabel = computed(() => props.report.to ?? "native API / removed");
const packageDelta = computed(() =>
  calculateEstimatedPerInstallDelta(
    {
      value: props.report.before.packageCount,
      estimate: props.report.before.estimates.packageCount,
    },
    {
      value: props.report.after.packageCount,
      estimate: props.report.after.estimates.packageCount,
    },
  ),
);
</script>

<template>
  <section class="section-block" aria-labelledby="before-after-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Subtree</p>
        <h2 id="before-after-heading">Before / After</h2>
      </div>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          <TableHead :title="report.from">Before</TableHead>
          <TableHead :title="afterLabel">After</TableHead>
          <TableHead>Delta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <PackageOpen aria-hidden="true" :size="16" />
              Packages
            </span>
          </TableCell>
          <TableCell>{{
            formatEstimatedCompact(
              report.before.packageCount,
              report.before.estimates.packageCount,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedCompact(
              report.after.packageCount,
              report.after.estimates.packageCount,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedCompact(packageDelta.value, packageDelta.estimate)
          }}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <CloudDownload aria-hidden="true" :size="16" />
              Traffic
            </span>
          </TableCell>
          <TableCell>{{
            formatEstimatedBytes(
              report.before.tarballBytes,
              report.before.estimates.tarballBytes,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedBytes(
              report.after.tarballBytes,
              report.after.estimates.tarballBytes,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedBytes(
              report.metrics.traffic.perInstall,
              report.metrics.traffic.estimates.perInstall,
            )
          }}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <FileStack aria-hidden="true" :size="16" />
              Files
            </span>
          </TableCell>
          <TableCell>{{
            formatEstimatedCompact(
              report.before.fileCount,
              report.before.estimates.fileCount,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedCompact(
              report.after.fileCount,
              report.after.estimates.fileCount,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedCompact(
              report.metrics.files.perInstall,
              report.metrics.files.estimates.perInstall,
            )
          }}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <Archive aria-hidden="true" :size="16" />
              Size
            </span>
          </TableCell>
          <TableCell>{{
            formatEstimatedBytes(
              report.before.unpackedBytes,
              report.before.estimates.unpackedBytes,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedBytes(
              report.after.unpackedBytes,
              report.after.estimates.unpackedBytes,
            )
          }}</TableCell>
          <TableCell>{{
            formatEstimatedBytes(
              report.metrics.unpacked.perInstall,
              report.metrics.unpacked.estimates.perInstall,
            )
          }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <details class="node-details">
      <summary>Nodes</summary>
      <div class="node-columns">
        <div>
          <strong>Before</strong>
          <code v-for="node in report.before.dependencyNodes" :key="node">{{
            node
          }}</code>
        </div>
        <div>
          <strong>After</strong>
          <code v-for="node in report.after.dependencyNodes" :key="node">{{
            node
          }}</code>
        </div>
      </div>
    </details>
  </section>
</template>
