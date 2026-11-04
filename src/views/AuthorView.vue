<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'
import { authorService, type PublicProfile } from '../api/authorService'
import { buildSocialUrl, isHttpUrl, SOCIAL_PLATFORMS } from '../utils/socialLinks'

const PER_PAGE = 12

const route = useRoute()
const uuid = computed(() => String(route.params.uuid ?? ''))

type ProfileState = 'loading' | 'ok' | 'notfound' | 'error'
const profileState = ref<ProfileState>('loading')
const profile = ref<PublicProfile | null>(null)

const articles = ref<ArticleItem[]>([])
const page = ref(1)
const totalPages = ref(0)
const articlesLoading = ref(false)
const articlesFailed = ref(false)

// 序號守衛：切換作者／翻頁時只採用最新一次回應
let profileSeq = 0
let articleSeq = 0

async function loadArticles(n: number) {
  const seq = ++articleSeq
  articlesLoading.value = true
  articlesFailed.value = false
  try {
    const result = await articleService.getArticles(n, PER_PAGE, '全部', '', { authorUuids: [uuid.value] })
    if (seq !== articleSeq) return
    articles.value = result.records
    totalPages.value = result.pages
    page.value = n
  } catch {
    if (seq !== articleSeq) return
    articles.value = []
    articlesFailed.value = true
  } finally {
    if (seq === articleSeq) articlesLoading.value = false
  }
}

async function loadProfile() {
  const seq = ++profileSeq
  ++articleSeq // 作者換了，進行中的文章請求一併過期
  profileState.value = 'loading'
  profile.value = null
  articles.value = []
  page.value = 1
  totalPages.value = 0
  articlesFailed.value = false
  try {
    const result = await authorService.getProfile(uuid.value)
    if (seq !== profileSeq) return
    if (!result) {
      profileState.value = 'notfound'
      return
    }
    profile.value = result
    profileState.value = 'ok'
    await loadArticles(1)
  } catch {
    if (seq !== profileSeq) return
    profileState.value = 'error'
  }
}

watch(uuid, () => { void loadProfile() }, { immediate: true })
onBeforeUnmount(() => { profileSeq++; articleSeq++ })

function goToPage(n: number) {
  if (n < 1 || n > totalPages.value || articlesLoading.value) return
  void loadArticles(n)
}

/** joinedAt → `YYYY · Qn`；用字串切片避免 new Date() 跨時區位移 */
const joinedLabel = computed(() => {
  const iso = profile.value?.joinedAt ?? ''
  const year = iso.slice(0, 4)
  const month = parseInt(iso.slice(5, 7), 10)
  if (!/^\d{4}$/.test(year) || !(month >= 1 && month <= 12)) return ''
  return `${year} · Q${Math.ceil(month / 3)}`
})

/** website 再以 isHttpUrl 過濾，才可能渲染成連結 */
const safeWebsite = computed(() => {
  const w = profile.value?.website
  return w && isHttpUrl(w) ? w : null
})
const websiteLabel = computed(() => {
  if (!safeWebsite.value) return ''
  return new URL(safeWebsite.value).host
})

const PLATFORM_LABELS: Record<keyof typeof SOCIAL_PLATFORMS, string> = {
  github: 'GitHub',
  twitter: 'X',
  linkedin: 'LinkedIn',
}

/** 只處理三個已知平台；未知 key 不產生連結；不合格 handle 不信任（buildSocialUrl 回 null） */
const socialLinks = computed(() =>
  (Object.keys(SOCIAL_PLATFORMS) as Array<keyof typeof SOCIAL_PLATFORMS>)
    .map(key => ({ key, label: PLATFORM_LABELS[key], url: buildSocialUrl(key, profile.value?.socialLinks?.[key]) }))
    .filter((l): l is { key: keyof typeof SOCIAL_PLATFORMS; label: string; url: string } => l.url !== null),
)

function formatDate(d: string) {
  if (!d) return ''
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[0]} · ${p[1]} · ${p[2]}` : d.slice(0, 10)
}
</script>

<template>
  <div class="ap-page">
    <!-- 載入中 -->
    <div v-if="profileState === 'loading'" class="ap-hero wrap" aria-busy="true">
      <div class="sk-pulse" style="width:160px;height:160px;border-radius:50%" />
      <div class="sk-pulse" style="height:120px" />
    </div>

    <!-- 404：不存在、已刪除、未驗證、停權 — 後端不可區分 -->
    <div v-else-if="profileState === 'notfound'" class="es-wrap" data-testid="author-not-found">
      <div class="es-icon">∅</div>
      <h3 class="es-title">找不到這位作者</h3>
      <RouterLink to="/articles" class="ap-social-link">瀏覽所有文章</RouterLink>
    </div>

    <!-- 其他失敗：不能說成「找不到」 -->
    <div v-else-if="profileState === 'error'" class="es-wrap" role="alert">
      <div class="es-icon">!</div>
      <h3 class="es-title">載入失敗，請稍後再試</h3>
      <button type="button" class="ap-retry" @click="loadProfile">重試</button>
    </div>

    <template v-else-if="profile">
      <!-- Hero -->
      <div class="ap-hero wrap">
        <div class="ap-avatar">
          <img v-if="profile.avatarUrl" class="ap-av ap-av-img" :src="profile.avatarUrl" :alt="profile.nickname" />
          <div v-else class="ap-av">{{ profile.nickname.slice(0, 2).toUpperCase() }}</div>
        </div>
        <div class="ap-info">
          <div class="ap-eyebrow mono">§ AUTHOR<template v-if="joinedLabel"> · {{ joinedLabel }}</template></div>
          <h1 class="ap-name" data-testid="author-name">{{ profile.nickname }}</h1>
          <p v-if="profile.location" class="ap-role mono">{{ profile.location }}</p>
          <p v-if="profile.bio" class="ap-bio">{{ profile.bio }}</p>
          <div v-if="safeWebsite || socialLinks.length" class="ap-socials">
            <a
              v-if="safeWebsite"
              :href="safeWebsite"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="ap-website-link"
              data-testid="author-website"
            >{{ websiteLabel }} ↗</a>
            <template v-for="(l, i) in socialLinks" :key="l.key">
              <span v-if="safeWebsite || i > 0" class="ap-sep">·</span>
              <a :href="l.url" target="_blank" rel="noopener noreferrer" class="ap-social-link">{{ l.label }} ↗</a>
            </template>
          </div>
        </div>
        <div class="ap-stats">
          <div class="ap-stat"><b>{{ profile.stats.publishedArticleCount }}</b><span>articles</span></div>
          <div class="ap-stat"><b>{{ profile.stats.totalViewCount }}</b><span>views</span></div>
          <div class="ap-stat"><b>{{ profile.stats.totalLikeCount }}</b><span>likes</span></div>
        </div>
      </div>

      <div class="ap-divider wrap" />

      <!-- Articles -->
      <main class="ap-articles wrap" data-testid="author-articles">
        <div class="sec-head">
          <span class="tag">ARTICLES</span>
          <h2>{{ profile.nickname }} 的文章</h2>
          <span class="tag r">{{ profile.stats.publishedArticleCount }} posts</span>
        </div>

        <div v-if="articlesLoading" class="art-grid">
          <div v-for="i in 4" :key="i" class="sk-pulse" style="height:200px" />
        </div>

        <div v-else-if="articlesFailed" class="es-wrap" role="alert">
          <h3 class="es-title">文章載入失敗</h3>
          <button type="button" class="ap-retry" @click="loadArticles(page)">重試</button>
        </div>

        <div v-else-if="articles.length" class="art-grid">
          <div
            v-for="article in articles"
            :key="article.uuid"
            class="art-card-g ap-card reveal"
          >
            <span
              class="art-card-thumb"
              :data-tag="article.coverImageUrl ? '' : (article.tags?.[0] ?? '')"
              :style="article.coverImageUrl ? {
                backgroundImage: `url(${article.coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {}"
            />
            <div class="art-card-body">
              <div class="art-card-meta">
                <span>{{ article.tags?.[0] ?? 'Article' }}</span>
                <span>·</span>
                <span>{{ formatDate(article.publishedAt) }}</span>
              </div>
              <h4><RouterLink class="ap-card-link" :to="`/articles/${article.uuid}`">{{ article.title }}</RouterLink></h4>
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

        <div v-else class="es-wrap">
          <div class="es-icon">∅</div>
          <h3 class="es-title">尚未發表文章</h3>
        </div>

        <nav v-if="totalPages > 1" class="ap-pagination" aria-label="文章分頁">
          <button type="button" class="ap-page-btn" :disabled="page <= 1 || articlesLoading" @click="goToPage(page - 1)">上一頁</button>
          <span class="mono">第 {{ page }} / {{ totalPages }} 頁</span>
          <button type="button" class="ap-page-btn" :disabled="page >= totalPages || articlesLoading" @click="goToPage(page + 1)">下一頁</button>
        </nav>
      </main>
    </template>
  </div>
</template>

<style scoped>
.ap-page { min-height: 100vh; padding-top: 96px; }
.ap-hero { display: grid; grid-template-columns: 160px 1fr auto; gap: 48px; padding: 48px 0 56px; align-items: start; }
.ap-av { width: 160px; height: 160px; border-radius: 50%; background: linear-gradient(135deg, color-mix(in oklch, var(--accent) 30%, var(--bg-sub)), var(--bg-sub)); display: grid; place-items: center; font-family: var(--f-display); font-style: italic; font-weight: 500; font-size: 48px; color: var(--ink-2); letter-spacing: -0.04em; border: 1px solid var(--border); }
.ap-eyebrow { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 10px; }
.ap-name { font-family: var(--f-display); font-size: clamp(28px, 4vw, 52px); font-weight: 500; letter-spacing: -0.03em; margin: 0 0 6px; }
.ap-role { font-size: 11px; letter-spacing: .16em; color: var(--ink-2); margin: 0 0 14px; }
.ap-bio { font-size: 14.5px; color: var(--muted); line-height: 1.7; margin: 0 0 16px; max-width: 50ch; }
.ap-socials { display: flex; gap: 12px; align-items: center; }
.ap-sep { color: var(--muted-2); }
.ap-website-link, .ap-social-link { font-family: var(--f-mono); font-size: 11px; letter-spacing: .12em; color: var(--muted); text-decoration: none; text-transform: uppercase; }
.ap-website-link:hover, .ap-social-link:hover { color: var(--accent); }
.ap-stats { display: flex; flex-direction: column; gap: 14px; padding-top: 4px; }
.ap-stat { display: flex; flex-direction: column; align-items: flex-end; }
.ap-stat b { font-family: var(--f-display); font-size: 28px; font-weight: 500; letter-spacing: -0.02em; }
.ap-stat span { font-family: var(--f-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.ap-divider { height: 1px; background: var(--border); margin-bottom: 48px; }
.ap-articles { padding-bottom: 120px; }
.ap-card { position: relative; cursor: pointer; }
.ap-card-link { color: inherit; text-decoration: none; }
.ap-card-link::after { content: ''; position: absolute; inset: 0; }
.ap-av-img { object-fit: cover; }
.ap-retry, .ap-page-btn { padding: 6px 14px; border: 1px solid var(--border); border-radius: 999px; background: transparent; color: var(--ink); cursor: pointer; font-family: var(--f-mono); font-size: 11px; }
.ap-page-btn:disabled { opacity: .4; cursor: not-allowed; }
.ap-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 32px; }
.ap-card h4 a { color: var(--ink); }
.ap-card:hover h4 a { color: var(--accent); }
@media (max-width: 768px) {
  .ap-hero { grid-template-columns: 1fr; gap: 24px; }
  .ap-stats { flex-direction: row; }
}
</style>
