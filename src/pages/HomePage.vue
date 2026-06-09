<script setup lang="ts">
import { RouterLink } from "vue-router";
import PackageSearchBox from "../features/package-search/PackageSearchBox.vue";

const examples = [
  { pkg: "vite", from: "glob", to: "tinyglobby" },
  { pkg: "webpack", from: "rimraf", to: "del" },
  { pkg: "eslint", from: "glob", to: "tinyglobby" }
];

function exampleReportUrl(example: { pkg: string; from: string; to: string }): string {
  const params = new URLSearchParams(example);
  return `/report?${params.toString()}`;
}
</script>

<template>
  <section class="hero-workspace">
    <div class="hero-copy">
      <p class="eyebrow">npm replacement impact reports</p>
      <h1>A few files less.<br />Millions of times less work.</h1>
      <p>
        Generate a shareable report from live npm metadata, downloads reach, and e18e replacement data.
      </p>
    </div>

    <PackageSearchBox autofocus />

    <div class="example-strip" aria-label="Example reports">
      <RouterLink
        v-for="example in examples"
        :key="`${example.pkg}-${example.from}`"
        :to="exampleReportUrl(example)"
      >
        <span>{{ example.pkg }}</span>
        <code>{{ example.from }} -> {{ example.to }}</code>
      </RouterLink>
    </div>
  </section>
</template>
