<script setup lang="ts">
import { Search, ArrowRight } from "lucide-vue-next";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { PackageSearchResult } from "../../types/package";
import { encodePackagePath, isValidPackageName } from "../../core/npm/resolvePackage";
import { searchPackages } from "./searchPackages";

const props = defineProps<{
  initialQuery?: string;
  autofocus?: boolean;
}>();

const router = useRouter();
const query = ref(props.initialQuery ?? "");
const suggestions = ref<PackageSearchResult[]>([]);
const loading = ref(false);
const searchError = ref<string | null>(null);

const canSubmit = computed(() => isValidPackageName(query.value));

let debounce: number | undefined;
let controller: AbortController | null = null;

watch(
  query,
  (value) => {
    window.clearTimeout(debounce);
    controller?.abort();
    searchError.value = null;

    if (value.trim().length < 2) {
      suggestions.value = [];
      loading.value = false;
      return;
    }

    debounce = window.setTimeout(async () => {
      controller = new AbortController();
      loading.value = true;
      try {
        suggestions.value = await searchPackages(value, controller.signal);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          searchError.value = error instanceof Error ? error.message : "Search failed";
        }
      } finally {
        loading.value = false;
      }
    }, 240);
  },
  { immediate: true }
);

onUnmounted(() => {
  window.clearTimeout(debounce);
  controller?.abort();
});

function submit(packageName = query.value): void {
  const cleaned = packageName.trim();
  if (!isValidPackageName(cleaned)) {
    searchError.value = "Enter a valid npm package name.";
    return;
  }

  router.push(`/package/${encodePackagePath(cleaned)}`);
}
</script>

<template>
  <form class="search-box" role="search" @submit.prevent="submit()">
    <div class="search-control">
      <Search aria-hidden="true" :size="20" />
      <input
        v-model="query"
        :autofocus="autofocus"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="Search npm package, e.g. vite"
        aria-label="npm package name"
      />
      <button class="primary-button" type="submit" :disabled="!canSubmit">
        <span>Analyze</span>
        <ArrowRight aria-hidden="true" :size="18" />
      </button>
    </div>

    <div v-if="loading || suggestions.length || searchError" class="suggestion-panel" aria-live="polite">
      <p v-if="loading" class="muted">Searching npm registry...</p>
      <p v-else-if="searchError" class="status status-warning">{{ searchError }}</p>
      <template v-else>
        <button
          v-for="result in suggestions"
          :key="result.name"
          type="button"
          class="suggestion-row"
          @click="submit(result.name)"
        >
          <span>
            <strong>{{ result.name }}</strong>
            <small v-if="result.description">{{ result.description }}</small>
          </span>
          <span v-if="result.version" class="version-pill">{{ result.version }}</span>
        </button>
      </template>
    </div>
  </form>
</template>
