<script setup lang="ts">
import HeroMarquee from '../components/home/HeroMarquee.vue';
import TrendingSection from '../components/home/TrendingSection.vue';
import LatestArticlesSection from '../components/home/LatestArticlesSection.vue';
import ZoneEntrySection from '../components/home/ZoneEntrySection.vue';
import HotTagsSection from '../components/home/HotTagsSection.vue';
import { useHomePage } from '../composables/useHomePage';

const {
  trendingArticles,
  latestArticles,
  hotTags,
  zoneEntries,
  isLoadingTrending,
  isLoadingLatest,
  isLoadingTags,
} = useHomePage();
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- Hero Section / 跑馬燈 -->
    <HeroMarquee />

    <!-- 內容區塊 -->
    <div class="w-full max-w-7xl px-4 md:px-8 mt-12 mb-32 space-y-16">
      <TrendingSection
        :articles="trendingArticles"
        :is-loading="isLoadingTrending"
      />

      <LatestArticlesSection
        :articles="latestArticles"
        :is-loading="isLoadingLatest"
      />

      <ZoneEntrySection :zones="zoneEntries" />

      <HotTagsSection
        :tags="hotTags"
        :is-loading="isLoadingTags"
      />
    </div>
  </div>
</template>
