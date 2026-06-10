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
import { formatBytes, formatCompact } from "../../core/metrics/formatting";

const props = defineProps<{
  report: ImpactReport;
}>();

const afterLabel = computed(() => props.report.to ?? "native API / removed");
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
          <TableCell>{{ formatCompact(report.before.packageCount) }}</TableCell>
          <TableCell>{{ formatCompact(report.after.packageCount) }}</TableCell>
          <TableCell>{{
            formatCompact(
              report.before.packageCount - report.after.packageCount,
            )
          }}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <CloudDownload aria-hidden="true" :size="16" />
              Traffic
            </span>
          </TableCell>
          <TableCell>{{ formatBytes(report.before.tarballBytes) }}</TableCell>
          <TableCell>{{ formatBytes(report.after.tarballBytes) }}</TableCell>
          <TableCell>{{
            formatBytes(report.metrics.traffic.perInstall)
          }}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <FileStack aria-hidden="true" :size="16" />
              Files
            </span>
          </TableCell>
          <TableCell>{{ formatCompact(report.before.fileCount) }}</TableCell>
          <TableCell>{{ formatCompact(report.after.fileCount) }}</TableCell>
          <TableCell>{{
            formatCompact(report.metrics.files.perInstall)
          }}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <span class="table-metric">
              <Archive aria-hidden="true" :size="16" />
              Size
            </span>
          </TableCell>
          <TableCell>{{ formatBytes(report.before.unpackedBytes) }}</TableCell>
          <TableCell>{{ formatBytes(report.after.unpackedBytes) }}</TableCell>
          <TableCell>{{
            formatBytes(report.metrics.unpacked.perInstall)
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
