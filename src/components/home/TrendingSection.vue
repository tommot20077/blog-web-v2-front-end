<script setup lang="ts">
import type { RecommendArticleResponse } from '../../api/recommendService';
import ArticleCardSkeleton from '../article/ArticleCardSkeleton.vue';
import { useRouter } from 'vue-router';

defineProps<{
  articles: RecommendArticleResponse[];
  isLoading: boolean;
}>();

const router = useRouter();

function goToDetail(uuid: string) {
  router.push(`/articles/${uuid}`);
}
</script>

<template>
  <section>
    <h2 class="text-2xl font-bold tracking-wider mb-6" style="color: var(--text-main);">
      熱門文章
    </h2>

    <!-- 載入中骨架 -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ArticleCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <!-- 文章卡片 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="article in articles"
        :key="article.uuid"
        class="flex flex-col rounded-[24px] border cursor-pointer group hover:scale-[1.02] transition-transform duration-300 overflow-hidden"
        style="background: var(--glass-panel); border-color: var(--glass-border); backdrop-filter: blur(12px);"
        @click="goToDetail(article.uuid)"
      >
        <div class="p-5 flex flex-col flex-grow">
          <h3 class="font-bold text-lg mb-2 group-hover:opacity-80 transition-opacity line-clamp-2">{{ article.title }}</h3>
          <div class="text-xs opacity-50 mb-2">{{ article.authorNickname }} · {{ article.publishedAt }}</div>
          <p class="text-sm opacity-70 line-clamp-2 flex-grow">{{ article.summary }}</p>
          <div class="flex items-center gap-3 text-xs opacity-40 mt-3">
            <span>{{ article.viewCount }} 次觀看</span>
            <span>❤ {{ article.likeCount }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
