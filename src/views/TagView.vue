<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'

const route = useRoute()
const tag = computed(() => route.params.slug as string)
const allArticles = ref<ArticleItem[]>([])
const isLoading = ref(false)

const filtered = computed(() =>
  allArticles.value.filter(a => a.tags.includes(tag.value))
)

onMounted(async () => {
  isLoading.value = true
  try {
    const result = await articleService.getArticles(1, 1000, '全部', '')
    allArticles.value = result.records
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="tag-page">
    <div class="wrap">
      <h1 class="tag-page-title" data-testid="tag-title"># {{ tag }}</h1>
      <div data-testid="tag-articles">
        <div v-if="isLoading" class="sk-pulse" style="height:4px;width:120px" />
        <div v-else-if="filtered.length === 0" class="tag-empty">
          <p>目前沒有標籤為 {{ tag }} 的文章。</p>
        </div>
        <div v-else class="tag-list">
          <RouterLink
            v-for="article in filtered"
            :key="article.uuid"
            :to="`/articles/${article.uuid}`"
            class="tag-row"
          >
            <article>
              <h3>{{ article.title }}</h3>
              <p>{{ article.summary }}</p>
            </article>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tag-page { padding: 80px 0; min-height: 60vh; }
.tag-page-title {
  font-family: var(--f-display); font-size: clamp(32px, 5vw, 64px);
  font-weight: 500; letter-spacing: -.03em; margin-bottom: 48px; color: var(--ink);
}
.tag-list { display: flex; flex-direction: column; gap: 24px; }
.tag-row { text-decoration: none; color: inherit; }
.tag-row article { padding: 24px; border: 1px solid var(--border); border-radius: 12px; }
.tag-row article h3 { font-size: 18px; color: var(--ink); margin-bottom: 8px; }
.tag-row article p { color: var(--muted); font-size: 14px; }
.tag-empty { color: var(--muted); padding: 48px 0; }
</style>
