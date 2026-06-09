<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { Button } from "@/components/ui/button";
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="replace-impact home">
        <span class="brand-mark">ri</span>
        <span>replace-impact</span>
      </RouterLink>
      <nav class="site-nav" aria-label="Primary navigation">
        <Button :as="RouterLink" variant="ghost" size="sm" to="/"
          >Search</Button
        >
        <Button :as="RouterLink" variant="ghost" size="sm" to="/methodology"
          >Methodology</Button
        >
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
