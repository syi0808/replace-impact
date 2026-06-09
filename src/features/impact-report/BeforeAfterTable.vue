<script setup lang="ts">
import type { ImpactReport } from "../../types/report";
import { formatBytes, formatCompact } from "../../core/metrics/formatting";

defineProps<{
  report: ImpactReport;
}>();
</script>

<template>
  <section class="section-block" aria-labelledby="before-after-heading">
    <div class="section-heading-row">
      <div>
        <p class="eyebrow">Subtree comparison</p>
        <h2 id="before-after-heading">Before / after</h2>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Before: {{ report.from }}</th>
            <th>After: {{ report.to }}</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Packages</td>
            <td>{{ formatCompact(report.before.packageCount) }}</td>
            <td>{{ formatCompact(report.after.packageCount) }}</td>
            <td>{{ formatCompact(report.before.packageCount - report.after.packageCount) }}</td>
          </tr>
          <tr>
            <td>Compressed tarball traffic</td>
            <td>{{ formatBytes(report.before.tarballBytes) }}</td>
            <td>{{ formatBytes(report.after.tarballBytes) }}</td>
            <td>{{ formatBytes(report.metrics.traffic.perInstall) }}</td>
          </tr>
          <tr>
            <td>Files</td>
            <td>{{ formatCompact(report.before.fileCount) }}</td>
            <td>{{ formatCompact(report.after.fileCount) }}</td>
            <td>{{ formatCompact(report.metrics.files.perInstall) }}</td>
          </tr>
          <tr>
            <td>Unpacked size</td>
            <td>{{ formatBytes(report.before.unpackedBytes) }}</td>
            <td>{{ formatBytes(report.after.unpackedBytes) }}</td>
            <td>{{ formatBytes(report.metrics.unpacked.perInstall) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <details class="node-details">
      <summary>Dependency nodes included</summary>
      <div class="node-columns">
        <div>
          <strong>Before</strong>
          <code v-for="node in report.before.dependencyNodes" :key="node">{{ node }}</code>
        </div>
        <div>
          <strong>After</strong>
          <code v-for="node in report.after.dependencyNodes" :key="node">{{ node }}</code>
        </div>
      </div>
    </details>
  </section>
</template>
