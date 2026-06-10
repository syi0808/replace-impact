<script setup lang="ts">
import { Search, ArrowRight } from "lucide-vue-next";
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PackageSearchResult } from "../../types/package";
import {
  encodePackagePath,
  isValidPackageName,
} from "../../core/npm/resolvePackage";
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
const activeSuggestionIndex = ref(-1);

const canSubmit = computed(() => isValidPackageName(query.value));
const showSuggestions = computed(
  () => loading.value || suggestions.value.length > 0 || !!searchError.value,
);
const activeSuggestionId = computed(() =>
  activeSuggestionIndex.value >= 0
    ? suggestionId(activeSuggestionIndex.value)
    : undefined,
);

const suggestionsListId = "package-search-suggestions";

let debounce: number | undefined;
let controller: AbortController | null = null;

watch(
  query,
  (value) => {
    window.clearTimeout(debounce);
    controller?.abort();
    searchError.value = null;
    activeSuggestionIndex.value = -1;

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
        activeSuggestionIndex.value = -1;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          searchError.value =
            error instanceof Error ? error.message : "Search failed";
        }
      } finally {
        loading.value = false;
      }
    }, 240);
  },
  { immediate: true },
);

watch(suggestions, (nextSuggestions) => {
  if (activeSuggestionIndex.value >= nextSuggestions.length) {
    activeSuggestionIndex.value = -1;
  }
});

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

function suggestionId(index: number): string {
  return `${suggestionsListId}-${index}`;
}

function moveActiveSuggestion(delta: 1 | -1): void {
  if (!suggestions.value.length) {
    return;
  }

  const lastIndex = suggestions.value.length - 1;
  if (activeSuggestionIndex.value === -1) {
    activeSuggestionIndex.value = delta === 1 ? 0 : lastIndex;
  } else {
    activeSuggestionIndex.value =
      (activeSuggestionIndex.value + delta + suggestions.value.length) %
      suggestions.value.length;
  }

  void nextTick(() => {
    document
      .getElementById(suggestionId(activeSuggestionIndex.value))
      ?.scrollIntoView({ block: "nearest" });
  });
}

function closeSuggestions(): void {
  controller?.abort();
  suggestions.value = [];
  loading.value = false;
  searchError.value = null;
  activeSuggestionIndex.value = -1;
}

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActiveSuggestion(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveActiveSuggestion(-1);
    return;
  }

  if (event.key === "Enter" && activeSuggestionIndex.value >= 0) {
    event.preventDefault();
    submit(suggestions.value[activeSuggestionIndex.value]?.name);
    return;
  }

  if (event.key === "Escape" && showSuggestions.value) {
    event.preventDefault();
    closeSuggestions();
  }
}
</script>

<template>
  <form class="search-box" role="search" @submit.prevent="submit()">
    <div class="search-control">
      <Search aria-hidden="true" :size="20" />
      <Input
        v-model="query"
        :autofocus="autofocus"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="Search npm package, e.g. vite"
        aria-label="npm package name"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="showSuggestions ? 'true' : 'false'"
        :aria-controls="showSuggestions ? suggestionsListId : undefined"
        :aria-activedescendant="activeSuggestionId"
        @keydown="onSearchKeydown"
      />
      <Button type="submit" :disabled="!canSubmit">
        <span>Analyze</span>
        <ArrowRight aria-hidden="true" :size="18" />
      </Button>
    </div>

    <Card
      v-if="showSuggestions"
      :id="suggestionsListId"
      class="suggestion-panel"
      aria-live="polite"
      :role="
        suggestions.length && !loading && !searchError ? 'listbox' : undefined
      "
      aria-label="Package suggestions"
    >
      <p v-if="loading" class="muted">Searching npm registry...</p>
      <Alert v-else-if="searchError" variant="warning" role="alert">{{
        searchError
      }}</Alert>
      <template v-else>
        <Button
          v-for="(result, index) in suggestions"
          :key="result.name"
          :id="suggestionId(index)"
          type="button"
          variant="ghost"
          role="option"
          :aria-selected="activeSuggestionIndex === index"
          tabindex="-1"
          :class="[
            'suggestion-row',
            { 'is-active': activeSuggestionIndex === index },
          ]"
          @mouseenter="activeSuggestionIndex = index"
          @click="submit(result.name)"
        >
          <span>
            <strong>{{ result.name }}</strong>
            <small v-if="result.description">{{ result.description }}</small>
          </span>
          <Badge v-if="result.version" variant="outline">{{
            result.version
          }}</Badge>
        </Button>
      </template>
    </Card>
  </form>
</template>
