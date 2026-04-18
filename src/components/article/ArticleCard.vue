<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { ArticleItem } from '../../api/articleService';

const props = defineProps<{
  article: ArticleItem;
}>();

const router = useRouter();
const goToDetail = () => {
  router.push(`/articles/${props.article.uuid}`);
};
</script>

<template>
  <article
    @click="goToDetail"
    class="flex flex-col rounded-[24px] border cursor-pointer group hover:scale-[1.02] transition-transform duration-300 w-full overflow-hidden"
    style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(12px);"
  >
    <!-- 封面圖 -->
    <img
      v-if="article.coverImageUrl"
      :src="article.coverImageUrl"
      :alt="article.title"
      loading="lazy"
      class="w-full aspect-video object-cover"
    />

    <div class="flex flex-col p-6 flex-grow">
      <!-- 標題 -->
      <h3 class="text-xl font-bold mb-2 group-hover:opacity-80 transition-opacity" style="color: var(--ink)">
        {{ article.title }}
      </h3>

      <!-- 作者 · 日期 -->
      <div class="flex items-center gap-3 text-xs opacity-50 font-medium mb-4">
        <span>{{ article.authorNickname }}</span>
        <span>·</span>
        <span>{{ article.publishedAt }}</span>
        <span>·</span>
        <span>{{ article.viewCount }} 次觀看</span>
      </div>

      <!-- 摘要 -->
      <p class="text-sm opacity-70 mb-6 line-clamp-3 leading-loose flex-grow">
        {{ article.summary }}
      </p>

      <!-- 底部：標籤 + 互動數據 -->
      <div class="flex items-center justify-between mt-auto">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="text-xs px-3 py-1 rounded-full border opacity-60 border-current hover:opacity-100 transition-opacity"
          >
            # {{ tag }}
          </span>
        </div>

        <div class="flex items-center gap-3 text-xs opacity-50 shrink-0 ml-4">
          <span class="flex items-center gap-1" data-testid="like-count">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {{ article.likeCount }}
          </span>
          <span class="flex items-center gap-1" data-testid="comment-count">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
            </svg>
            {{ article.commentCount }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
