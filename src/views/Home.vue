<script setup lang="ts">
import HeroMarquee from '../components/home/HeroMarquee.vue';
import TrendingSection from '../components/home/TrendingSection.vue';
import LatestArticlesSection from '../components/home/LatestArticlesSection.vue';
import HotTagsSection from '../components/home/HotTagsSection.vue';
import { useHomePage } from '../composables/useHomePage';
import { useHeadSetup } from '../composables/useHeadSetup';

// SEO / AEO：注入頁面標題、meta description、OG tags 與 JSON-LD
useHeadSetup();

const {
  trendingArticles,
  latestArticles,
  hotTags,
  isLoadingTrending,
  isLoadingLatest,
  isLoadingTags,
} = useHomePage();
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- SEO 用隱藏標題：供爬蟲與螢幕閱讀器辨識本頁為部落格首頁 -->
    <h1 class="sr-only">MY BLOG WEB. — 技術部落格首頁</h1>

    <!-- Hero Section / 跑馬燈 -->
    <HeroMarquee />

    <!-- 內容區塊 -->
    <div class="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 mb-32 space-y-16">
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
    </div>
  </div>
</template>
