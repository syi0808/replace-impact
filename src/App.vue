<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import SiteFooter from "@/components/SiteFooter.vue";

const logoUrl = `${import.meta.env.BASE_URL}favicon.svg`;
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="Replace Impact home">
        <img class="brand-logo" :src="logoUrl" alt="" width="32" height="32" />
        <span>Replace Impact</span>
      </RouterLink>
    </header>

    <main>
      <RouterView />
    </main>

    <SiteFooter />
  </div>
</template>
