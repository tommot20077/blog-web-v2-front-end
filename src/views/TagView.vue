<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'
import { tagService, type TagDetailResponse } from '../api/tagService'

const route  = useRoute()
const router = useRouter()
const slug   = computed(() => route.params.slug as string)

const articles    = ref<ArticleItem[]>([])
const relatedTags = ref<TagDetailResponse[]>([])
const isLoading   = ref(false)

// Tag descriptions (matches designer's DESC map)
const DESCRIPTIONS: Record<string, string> = {
  'vue-3':          'Composition API、Pinia、VueRouter 4 到 SSR，記錄從 Options API 移過來的每一個轉折點。',
  'tailwind':       'v3 到 v4 的遷移筆記，plugin 撰寫，以及我為什麼在 prose 之外幾乎不用 @apply。',
  'css':            'cascade layers、container queries、oklch 色彩空間，以及一些只有自己懂的 specificity 焦慮。',
  'design-systems': '800 行 tokens.css 的誕生過程，以及如何在 side project 裡讓設計不再拖垮自己。',
  'tdd':            'Vitest + happy-dom 的組合筆記，測試先行的心理學，以及怎麼讓 CI 跑得比你的直覺還快。',
  'essay':          '不是教學，也不是筆記。只是想把一件事說清楚。',
}

const tagName    = computed(() => slug.value.replace(/-/g, ' '))
const tagDesc    = computed(() => DESCRIPTIONS[slug.value] ?? `關於 #${tagName.value} 的所有文章與紀錄。`)

function formatDate(d: string) {
  if (!d) return ''
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[0]} · ${p[1]} · ${p[2]}` : d.slice(0, 10)
}

onMounted(async () => {
  isLoading.value = true
  try {
    const [articlesRes, tagsRes] = await Promise.allSettled([
      articleService.getArticles(1, 100, '全部', tagName.value),
      tagService.getHotTags(20),
    ])
    if (articlesRes.status === 'fulfilled') articles.value = articlesRes.value.records
    if (tagsRes.status === 'fulfilled')
      relatedTags.value = tagsRes.value.filter(t => t.slug !== slug.value).slice(0, 8)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="td-page">
    <!-- Back -->
    <div class="td-back wrap">
      <RouterLink to="/articles" class="td-back-link">← 所有文章</RouterLink>
    </div>

    <!-- Header -->
    <header class="td-header wrap">
      <div class="td-header-inner">
        <div class="td-eyebrow">
          <span class="td-mono">§ TAG</span>
          <span class="td-mono">{{ articles.length }} articles</span>
        </div>
        <h1 class="td-title" data-testid="tag-title">#{{ tagName }}</h1>
        <p class="td-desc">{{ tagDesc }}</p>

        <!-- Related tags -->
        <div v-if="relatedTags.length" class="td-related" data-testid="tag-related">
          <span class="td-mono td-related-label">Related →</span>
          <RouterLink
            v-for="t in relatedTags"
            :key="t.uuid"
            :to="`/tags/${t.slug}`"
            class="td-rel-pill"
          >
            #{{ t.name }}<span class="td-rel-n">{{ t.articleCount }}</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <div class="td-divider wrap" />

    <!-- Loading -->
    <div v-if="isLoading" class="td-list wrap">
      <div v-for="i in 4" :key="i" class="sk-pulse" style="height:100px;margin-bottom:1px" />
    </div>

    <!-- Article list -->
    <main class="td-list wrap" data-testid="tag-articles">
      <article
        v-for="(article, i) in articles"
        :key="article.uuid"
        class="td-row reveal"
        @click="router.push('/articles/' + article.uuid)"
      >
        <div class="td-row-left">
          <div class="td-thumb" :data-cat="article.tags?.[0]?.toUpperCase() ?? 'ESSAY'">
            <span class="td-thumb-n">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
        </div>
        <div class="td-row-body">
          <div class="td-row-meta">
            <span class="td-mono">{{ article.tags?.[0] ?? 'Essay' }}</span>
            <span class="td-dot" />
            <span class="td-mono">{{ formatDate(article.publishedAt) }}</span>
          </div>
          <h3 class="td-row-title">{{ article.title }}</h3>
          <p>{{ article.summary }}</p>
        </div>
        <span class="td-row-arr">→</span>
      </article>

      <!-- Empty -->
      <div v-if="!isLoading && articles.length === 0" class="es-wrap">
        <div class="es-icon">∅</div>
        <h3 class="es-title">沒有找到 #{{ tagName }} 的文章</h3>
      </div>
    </main>
  </div>
</template>

<style scoped>
.td-page { min-height: 100vh; padding-top: 96px; }
.td-back { padding: 24px 0 0; }
.td-back-link { font-family: var(--f-mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); text-decoration: none; }
.td-back-link:hover { color: var(--ink); }
.td-header { padding: 40px 0 48px; }
.td-header-inner { max-width: 760px; }
.td-eyebrow { display: flex; gap: 20px; font-family: var(--f-mono); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--muted-2); margin-bottom: 14px; }
.td-mono { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted-2); }
.td-title { font-family: var(--f-display); font-size: clamp(40px, 7vw, 88px); font-weight: 500; letter-spacing: -0.04em; line-height: 0.95; margin: 0 0 20px; }
.td-desc { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 50ch; margin: 0 0 28px; }
.td-related { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.td-related-label { margin-right: 4px; }
.td-rel-pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 12px; color: var(--muted); text-decoration: none; transition: all .15s; }
.td-rel-pill:hover { color: var(--ink); border-color: var(--border-strong); }
.td-rel-n { font-family: var(--f-mono); font-size: 10px; color: var(--muted-2); }
.td-divider { height: 1px; background: var(--border); margin-bottom: 40px; }
.td-list { display: flex; flex-direction: column; padding-bottom: 120px; }
.td-row { display: grid; grid-template-columns: 120px 1fr auto; gap: 24px; padding: 24px 0; border-bottom: 1px solid var(--divider); align-items: start; cursor: pointer; }
.td-row:hover .td-row-title { color: var(--accent); }
.td-thumb { aspect-ratio: 4/3; background: var(--bg-sub); border-radius: 4px; position: relative; display: flex; align-items: flex-end; padding: 8px; }
.td-thumb-n { font-family: var(--f-mono); font-size: 10px; color: var(--muted); }
.td-row-body { min-width: 0; }
.td-row-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.td-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--muted-2); }
.td-row-title { font-family: var(--f-display); font-size: 20px; font-weight: 500; letter-spacing: -0.01em; line-height: 1.3; margin: 0 0 8px; transition: color .2s; }
.td-row p { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin: 0; }
.td-row-arr { font-size: 14px; color: var(--muted); padding-top: 4px; transition: transform .2s; }
.td-row:hover .td-row-arr { transform: translateX(4px); color: var(--accent); }
</style>
