<script setup lang="ts">
import type { ImpactReport } from "../../types/report";
import { calculateTransferSeconds, networkProfiles } from "../../core/metrics/networkTime";
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

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Profile</th>
            <th>Downlink</th>
            <th>Monthly equivalent</th>
            <th>Yearly equivalent</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="profile in networkProfiles" :key="profile.label">
            <td>{{ profile.label }}</td>
            <td>{{ profile.downlinkMbps }} Mbps</td>
            <td>{{ formatHours(calculateTransferSeconds(report.metrics.traffic.monthly, profile.downlinkMbps)) }}</td>
            <td>{{ formatHours(calculateTransferSeconds(report.metrics.traffic.yearly, profile.downlinkMbps)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="caveat">Equivalent network transfer time avoided is a transfer-time comparison, not an install-duration claim.</p>
  </section>
</template>
