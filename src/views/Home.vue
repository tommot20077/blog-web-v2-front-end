<script setup lang="ts">
import { ref } from 'vue';
import ArticleCard from '../components/article/ArticleCard.vue';
import HeroMarquee from '../components/home/HeroMarquee.vue';
import StickyNoteBoard from '../components/common/StickyNoteBoard.vue';

// 模擬後端回傳的假資料（對應未來 /api/v1/recommend/trending 或 /api/v1/articles）
const articles = ref([
  {
    uuid: '1',
    title: '深入淺出 Vue 3 Composables：打造高可維護模組',
    summary: '在這篇文章中，我們將探討如何使用 Vue 3 的 Composition API 提取可重用的邏輯，也就是所謂的 composables。這不僅能大幅減少重複代碼，還能讓組件關注點更加清晰。',
    viewCount: 1250,
    publishedAt: '2026-03-20',
    tags: ['Vue', 'Frontend', 'Architecture']
  },
  {
    uuid: '2',
    title: 'Elasticsearch 全文檢索與 IK Analyzer 中文分詞實戰',
    summary: '部落格系統隨著文章數量增加，傳統的 SQL 搜尋越來越吃力。本文分享如何透過 Elasticsearch 和 custom IK Analyzer 來打造流暢的全文檢索體驗與相關推薦。',
    viewCount: 890,
    publishedAt: '2026-03-18',
    tags: ['Backend', 'Elasticsearch', 'Search']
  },
  {
    uuid: '3',
    title: 'K3s 叢集建置與 GitHub Actions 自動化部署',
    summary: '從零開始在 VPS 上搭建出高可用 (HA) 的 K3s Kubernetes 叢集，並透過 GitHub Action 和設定 yaml 實現真正的 GitOps 自動化發布部落格服務。',
    viewCount: 2100,
    publishedAt: '2026-03-15',
    tags: ['DevOps', 'Kubernetes', 'K3s']
  }
]);
</script>

<template>
  <div class="flex flex-col items-center">
    
    <!-- Hero Section / 跑馬燈 -->
    <HeroMarquee />

    <!-- 內容區塊 -->
    <div class="w-full max-w-7xl px-8 mt-12 mb-32 space-y-10">
      
      <div class="flex justify-between items-end border-b pb-4" style="border-color: var(--glass-border)">
        <h2 class="text-2xl font-bold tracking-wider" style="color: var(--text-main)">近期發布</h2>
        <router-link to="/articles" class="text-sm opacity-60 hover:opacity-100 hover:text-accent font-medium transition-colors">
          查看全部文章 →
        </router-link>
      </div>

      <!-- 三張卡片排列 (對應 Figma Frame 3, 4, 5) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ArticleCard 
          v-for="item in articles" 
          :key="item.uuid" 
          :article="item" 
        />
      </div>

    </div>

    <!-- 留言板 / 便利貼互動區塊 (暫時隱藏並記錄於 pending.md)
    <div class="w-full overflow-hidden mb-24">
      <StickyNoteBoard />
    </div>
    -->

  </div>
</template>
