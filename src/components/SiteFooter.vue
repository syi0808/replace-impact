<script setup lang="ts">
import { Github } from "lucide-vue-next";
</script>

<template>
  <footer class="site-footer" aria-label="Site credits">
    <span>
      Built for
      <a href="https://github.com/e18e" target="_blank" rel="noreferrer">e18e</a
      >.
    </span>
    <span>
      Uses
      <a
        href="https://github.com/e18e/module-replacements"
        target="_blank"
        rel="noreferrer"
        >e18e/module-replacements</a
      >.
    </span>
    <span>
      References
      <a
        href="https://github.com/Fuzzyma/e18e-tools"
        target="_blank"
        rel="noreferrer"
        >Fuzzyma/e18e-tools</a
      >.
    </span>
    <a
      class="site-footer-repo"
      href="https://github.com/syi0808/replace-impact"
      target="_blank"
      rel="noreferrer"
    >
      <Github aria-hidden="true" :size="16" />
      <span>syi0808/replace-impact</span>
    </a>
  </footer>
</template>
