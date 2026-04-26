<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'

const route  = useRoute()
const router = useRouter()
const handle = computed(() => route.params.handle as string)

const articles  = ref<ArticleItem[]>([])
const isLoading = ref(false)

// Mock author profiles (matches designer's PROFILES map)
interface AuthorProfile {
  name: string; role: string; bio: string
  joined: string; github?: string; twitter?: string
}
const PROFILES: Record<string, AuthorProfile> = {
  yuanluca: {
    name:    'Yuan Luca',
    role:    'Frontend · Taipei',
    bio:     '寫 Vue 3、設計系統、以及那些花很長時間才想清楚的事。Frontend @ Taipei。',
    joined:  '2023 · Q3',
    github:  'tommot20077',
    twitter: 'yuanluca_dev',
  },
}

const profile = computed<AuthorProfile>(() =>
  PROFILES[handle.value] ?? { name: handle.value, role: '', bio: '', joined: '' }
)

const filteredArticles = computed(() =>
  articles.value.filter(a => a.authorNickname === profile.value.name)
)

function formatDate(d: string) {
  if (!d) return ''
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[0]} · ${p[1]} · ${p[2]}` : d.slice(0, 10)
}

onMounted(async () => {
  isLoading.value = true
  try {
    const result = await articleService.getArticles(1, 200, '全部', '')
    articles.value = result.records
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="ap-page">
    <!-- Hero -->
    <div class="ap-hero wrap">
      <div class="ap-avatar">
        <div class="ap-av">{{ profile.name.slice(0, 2).toUpperCase() }}</div>
      </div>
      <div class="ap-info">
        <div class="ap-eyebrow mono">§ AUTHOR · {{ profile.joined }}</div>
        <h1 class="ap-name" data-testid="author-name">{{ profile.name }}</h1>
        <p class="ap-role mono">{{ profile.role }}</p>
        <p class="ap-bio">{{ profile.bio }}</p>
        <div v-if="profile.github || profile.twitter" class="ap-socials">
          <a v-if="profile.github" :href="`https://github.com/${profile.github}`" target="_blank" rel="noopener" class="ap-social-link">
            GitHub ↗
          </a>
          <span v-if="profile.github && profile.twitter" class="ap-sep">·</span>
          <a v-if="profile.twitter" :href="`https://twitter.com/${profile.twitter}`" target="_blank" rel="noopener" class="ap-social-link">
            Twitter ↗
          </a>
        </div>
      </div>
      <div class="ap-stats">
        <div class="ap-stat"><b>{{ filteredArticles.length }}</b><span>articles</span></div>
        <div class="ap-stat"><b>{{ filteredArticles.reduce((s, a) => s + a.viewCount, 0) }}</b><span>views</span></div>
        <div class="ap-stat"><b>{{ filteredArticles.reduce((s, a) => s + a.likeCount, 0) }}</b><span>likes</span></div>
      </div>
    </div>

    <div class="ap-divider wrap" />

    <!-- Articles -->
    <main class="ap-articles wrap" data-testid="author-articles">
      <div class="sec-head">
        <span class="tag">ARTICLES</span>
        <h2>{{ profile.name }} 的文章</h2>
        <span class="tag r">{{ filteredArticles.length }} posts</span>
      </div>

      <div v-if="isLoading" class="art-grid">
        <div v-for="i in 4" :key="i" class="sk-pulse" style="height:200px" />
      </div>

      <div v-else-if="filteredArticles.length" class="art-grid">
        <div
          v-for="article in filteredArticles"
          :key="article.uuid"
          class="art-card-g ap-card reveal"
          @click="router.push('/articles/' + article.uuid)"
        >
          <span class="art-card-thumb" :data-tag="article.tags?.[0] ?? ''" />
          <div class="art-card-body">
            <div class="art-card-meta">
              <span>{{ article.tags?.[0] ?? 'Article' }}</span>
              <span>·</span>
              <span>{{ formatDate(article.publishedAt) }}</span>
            </div>
            <h4><a>{{ article.title }}</a></h4>
            <p>{{ article.summary }}</p>
            <div class="art-card-foot">
              <div class="art-card-stats">
                <span>{{ article.viewCount }} views</span>
                <span>{{ article.likeCount }} ♡</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoading" class="es-wrap">
        <div class="es-icon">∅</div>
        <h3 class="es-title">沒有找到 {{ profile.name }} 的文章</h3>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ap-page { min-height: 100vh; padding-top: 96px; }
.ap-hero { display: grid; grid-template-columns: 160px 1fr auto; gap: 48px; padding: 48px 0 56px; align-items: start; }
.ap-av { width: 160px; height: 160px; border-radius: 50%; background: linear-gradient(135deg, color-mix(in oklch, var(--accent) 30%, var(--bg-sub)), var(--bg-sub)); display: grid; place-items: center; font-family: var(--f-display); font-style: italic; font-weight: 500; font-size: 48px; color: var(--ink-2); letter-spacing: -0.04em; border: 1px solid var(--border); }
.ap-eyebrow { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--muted-2); margin-bottom: 10px; }
.ap-name { font-family: var(--f-display); font-size: clamp(28px, 4vw, 52px); font-weight: 500; letter-spacing: -0.03em; margin: 0 0 6px; }
.ap-role { font-size: 11px; letter-spacing: .16em; color: var(--muted-2); margin: 0 0 14px; }
.ap-bio { font-size: 14.5px; color: var(--muted); line-height: 1.7; margin: 0 0 16px; max-width: 50ch; }
.ap-socials { display: flex; gap: 12px; align-items: center; }
.ap-sep { color: var(--muted-2); }
.ap-social-link { font-family: var(--f-mono); font-size: 11px; letter-spacing: .12em; color: var(--muted); text-decoration: none; text-transform: uppercase; }
.ap-social-link:hover { color: var(--accent); }
.ap-stats { display: flex; flex-direction: column; gap: 14px; padding-top: 4px; }
.ap-stat { display: flex; flex-direction: column; align-items: flex-end; }
.ap-stat b { font-family: var(--f-display); font-size: 28px; font-weight: 500; letter-spacing: -0.02em; }
.ap-stat span { font-family: var(--f-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.ap-divider { height: 1px; background: var(--border); margin-bottom: 48px; }
.ap-articles { padding-bottom: 120px; }
.ap-card { cursor: pointer; }
.ap-card h4 a { color: var(--ink); }
.ap-card:hover h4 a { color: var(--accent); }
@media (max-width: 768px) {
  .ap-hero { grid-template-columns: 1fr; gap: 24px; }
  .ap-stats { flex-direction: row; }
}
</style>
