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

    <!-- About section -->
    <section class="about-home wrap">
      <div class="sec reveal">
        <div class="sec-head">
          <span class="tag">§ 04 — About</span>
          <h2>關於這個人。</h2>
          <span class="tag r">VIEW PROFILE →</span>
        </div>
      </div>
      <div class="about-home-grid reveal">
        <div class="about-avatar">
          <div class="av"></div>
          <div class="av-meta">
            <span>YUAN · LUCA</span>
            <span>EST 2023</span>
            <span>TAIPEI · TW</span>
          </div>
        </div>
        <div class="about-text">
          <p>台北的前端工程師，偶爾設計，長期思考怎麼把複雜的事寫得更直白。</p>
          <p class="about-p2">這個 blog 沒有追蹤你、沒有演算法、沒有訂閱牆。每一篇都是自己寫、慢慢改、慢慢發。</p>
          <div class="about-socials">
            <a href="https://twitter.com/" target="_blank" rel="noopener">X / Twitter ↗</a>
            <span class="sep">·</span>
            <a href="https://github.com/tommot20077" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
