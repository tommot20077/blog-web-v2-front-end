<script setup lang="ts">
import { computed } from 'vue'
import HeroSection from '../components/home/HeroSection.vue'
import TrendingSection from '../components/home/TrendingSection.vue'
import LatestArticlesSection from '../components/home/LatestArticlesSection.vue'
import HotTagsSection from '../components/home/HotTagsSection.vue'
import { useHomePage } from '../composables/useHomePage'
import { useHeadSetup } from '../composables/useHeadSetup'

useHeadSetup()

const {
  trendingArticles,
  latestArticles,
  hotTags,
  isLoadingTrending,
  isLoadingLatest,
  isLoadingTags,
} = useHomePage()

const latestUuid = computed(() => latestArticles.value?.[0]?.uuid)
</script>

<template>
  <main class="home">
    <h1 class="sr-only">MY BLOG WEB. — 技術部落格首頁</h1>

    <HeroSection :latest-article-uuid="latestUuid" />

    <TrendingSection
      :articles="trendingArticles"
      :is-loading="isLoadingTrending"
    />

    <LatestArticlesSection
      :articles="latestArticles"
      :is-loading="isLoadingLatest"
    />

    <HotTagsSection
      :tags="hotTags"
      :is-loading="isLoadingTags"
    />
  </main>
</template>
