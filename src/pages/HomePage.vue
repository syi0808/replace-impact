<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Button } from "@/components/ui/button";
import PackageSearchBox from "../features/package-search/PackageSearchBox.vue";

const examples = [
  { pkg: "vite", from: "glob", to: "tinyglobby" },
  { pkg: "webpack", from: "rimraf", to: "del" },
  { pkg: "eslint", from: "glob", to: "tinyglobby" },
];

function exampleReportUrl(example: {
  pkg: string;
  from: string;
  to: string;
}): string {
  const params = new URLSearchParams(example);
  return `/report?${params.toString()}`;
}
</script>

<template>
  <section class="hero-workspace">
    <div class="hero-copy">
      <p class="eyebrow">Dependency replacement reports</p>
      <h1>Measure dependency replacement impact.</h1>
      <p>
        Estimate files, package traffic, and carbon-equivalent impact from live
        npm metadata and e18e replacement data.
      </p>
    </div>

    <PackageSearchBox autofocus />

    <div class="example-strip" aria-label="Example reports">
      <Button
        v-for="example in examples"
        :key="`${example.pkg}-${example.from}`"
        :as="RouterLink"
        variant="outline"
        class="example-link"
        :to="exampleReportUrl(example)"
      >
        <span>{{ example.pkg }}</span>
        <code>{{ example.from }} -> {{ example.to }}</code>
      </Button>
    </div>
  </section>
</template>
