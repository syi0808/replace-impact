<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="replace-impact home">
        <span class="brand-mark">ri</span>
        <span>replace-impact</span>
      </RouterLink>
      <nav class="site-nav" aria-label="Primary navigation">
        <RouterLink to="/">Search</RouterLink>
        <RouterLink to="/methodology">Methodology</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
