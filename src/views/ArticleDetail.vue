<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleDetail } from '../composables/useArticleDetail'
import { useArticleLike } from '../composables/useArticleLike'
import { useArticleBookmark } from '../composables/useArticleBookmark'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useWordCount } from '../composables/useWordCount'
import { useReadingProgress } from '../composables/useReadingProgress'
import { usePersistedReadingProgress } from '../composables/usePersistedReadingProgress'
import { useArticleHighlights } from '../composables/useArticleHighlights'
import { useInlineArticleHighlights } from '../composables/useInlineArticleHighlights'
import { useArticleTextSelection } from '../composables/useArticleTextSelection'
import { useScrollSpy } from '../composables/useScrollSpy'
import ActionBar from '../components/article/ActionBar.vue'
import ReactionFooter from '../components/article/ReactionFooter.vue'
import CommentSection from '../components/article/CommentSection.vue'
import RelatedArticlesSection from '../components/article/RelatedArticlesSection.vue'
import ArticleTextSelectionToolbar from '../components/article/ArticleTextSelectionToolbar.vue'
import ArticleHighlightPanel from '../components/article/ArticleHighlightPanel.vue'
import ArticleToc from '../components/article/ArticleToc.vue'
import NotFoundView from './NotFoundView.vue'

const route = useRoute()
const router = useRouter()
const uuid = route.params.uuid as string

const { article, isLoading } = useArticleDetail(uuid)
const markdownSource = computed(() => article.value?.content ?? '')
const { renderedHtml } = useMarkdownRenderer(markdownSource)
const { readingTimeMinutes } = useWordCount(markdownSource)

const articleEl = ref<HTMLElement | null>(null)
const { progress } = useReadingProgress(articleEl)

// Like state — called synchronously in setup (safe for useRouter/useRoute inside useAuthWall)
const articleUuidRef = computed(() => article.value?.uuid ?? '')
const articleBodyEl = ref<HTMLElement | null>(null)
const highlightState = useArticleHighlights(articleUuidRef)
const selectionState = useArticleTextSelection(articleBodyEl)
const inlineHighlightState = useInlineArticleHighlights(articleBodyEl, highlightState.highlights)
usePersistedReadingProgress(articleUuidRef, progress)
const likeState = useArticleLike(articleUuidRef, { liked: false, likeCount: 0 })
const bookmarkState = useArticleBookmark(articleUuidRef, { bookmarked: false })

// 文章章節導覽（TOC）：防禦後端未上線前欄位缺失，一律視為空陣列。
// 提前在這裡宣告（而不是放到檔案後段）：下面 assignHeadingIds() 的 watch 需要
// 呼叫 resubscribeScrollSpy() 修復 BUG-001（scroll-spy 抓不到晚出現的 heading）。
const toc = computed(() => article.value?.toc ?? [])
const tocIds = computed(() => toc.value.map((entry) => entry.id))
const { activeId, resubscribe: resubscribeScrollSpy } = useScrollSpy(tocIds)

async function createHighlightFromSelection(request: Parameters<typeof highlightState.createHighlight>[0]) {
  const created = await highlightState.createHighlight(request)
  if (created) selectionState.clearSelection()
}

watch(() => renderedHtml.value, async () => {
  await nextTick()
  await inlineHighlightState.applyHighlights()
}, { flush: 'post' })

// TOC 點擊不跳轉的根因：後端 content_html 的 h2/h3 確實有 id，但本頁改用
// markdownSource 走 useMarkdownRenderer 客端重渲染（見上方註解），markdown-it
// 產出的標題不含任何 id。這裡不重新算一份 slug 演算法，而是直接依「文件順序」
// 把後端算好的 toc[i].id 指派給內文第 i 個 h2/h3，保持「TOC 第 i 項 ↔ 內文
// 第 i 個標題」的一致性，深連結與 scroll-spy 都仰賴這些 id 存在於 DOM。
function assignHeadingIds() {
  const container = articleBodyEl.value
  if (!container) return
  const headings = container.querySelectorAll('h2, h3')
  const count = Math.min(headings.length, toc.value.length)
  for (let i = 0; i < count; i += 1) {
    const entry = toc.value[i]
    if (entry) (headings[i] as HTMLElement).id = entry.id
  }
}

// renderedHtml 會因 Shiki 高亮就緒而二次渲染（見 useMarkdownRenderer 註解）；
// 每次都整份 v-html 換新 DOM 節點，所以每次都要重新指派，天然是 idempotent
// （同一份 toc + 同樣的標題順序，重複執行結果不變）。
//
// BUG-001 根因：tocIds 在文章 API 回應時就 settle，早於這裡指派 id 進 DOM 的
// 時間點，useScrollSpy 內部 watch(ids, setup) 因此不會再次觸發，observer 訂閱
// 不到任何 heading；加上這裡整份換新 DOM 節點，就算第一輪訂到了也會抓著
// detached 的舊節點。指派完 id 之後呼叫 resubscribeScrollSpy()，讓 observer
// 用目前「真正在 DOM 上」的節點重新訂閱。
watch(() => renderedHtml.value, async () => {
  await nextTick()
  assignHeadingIds()
  resubscribeScrollSpy()
}, { flush: 'post' })

// Once article loads, sync its initial interaction state.
watchEffect(() => {
  if (article.value) {
    likeState.liked.value = article.value.liked
    likeState.likeCount.value = article.value.likeCount
    bookmarkState.bookmarked.value = article.value.bookmarked
  }
})

function scrollToHeading(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 深連結（例：/articles/xxx#heading-yyy）：文章內容非同步載入，路由層級的
// scrollBehavior 執行當下標題元素通常還不存在，故於內容渲染完成後於此補捲一次。
// 只補捲一次，避免 renderedHtml 之後再變動（如 highlight 套用觸發的重繪）時重複跳動。
let hashScrolled = false
watch(() => renderedHtml.value, async () => {
  if (hashScrolled || !route.hash) return
  await nextTick()
  // 防禦性地再指派一次：不依賴另一個 watch(renderedHtml) 的註冊順序保證
  // （雖然目前確實排在它前面），確保深連結查找 id 之前，id 一定已經指派好。
  // 同理也防禦性地重新訂閱一次 scroll-spy（見上方 BUG-001 註解），不依賴
  // 另一個 watch 的執行順序保證。
  assignHeadingIds()
  resubscribeScrollSpy()
  const target = document.getElementById(route.hash.slice(1))
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    hashScrolled = true
  }
}, { flush: 'post' })

onMounted(() => window.scrollTo({ top: 0, behavior: 'auto' }))

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const goBack = () => window.history.length > 1 ? router.back() : router.push('/articles')
</script>

<template>
  <div class="article-detail-page">
    <!-- Loading -->
    <div v-if="isLoading" class="art-loading">
      <div class="sk-pulse" style="height:4px;width:120px;border-radius:2px;" />
      <p class="mono">萃取文章細節中...</p>
    </div>

    <!-- 404 -->
    <NotFoundView v-else-if="!article" />

    <!-- Article -->
    <article v-else ref="articleEl" class="art-detail" data-testid="article-root">

      <!-- Reading progress bar -->
      <div class="art-progress">
        <div class="bar" :style="{ width: `${progress}%` }" data-testid="article-progress-bar" />
      </div>

      <!-- Hero -->
      <div class="art-hero">
        <div class="wrap">
          <!-- Breadcrumb -->
          <div class="art-hero-back">
            <button class="back-btn" @click="goBack">回列表</button>
          </div>

          <!-- Meta -->
          <div class="art-hero-meta">
            <div data-testid="article-categories">
              <span
                v-for="cat in article.categories ?? []"
                :key="cat.uuid"
                class="mono"
                style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)"
              >{{ cat.name }}</span>
            </div>
            <span class="mono" style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)">
              {{ readingTimeMinutes }} MIN READ
            </span>
            <span class="mono" style="font-size:11px;color:var(--muted)">約 {{ readingTimeMinutes }} 分鐘閱讀時間</span>
          </div>

          <!-- Title -->
          <h1 class="art-hero-title" data-testid="article-title">{{ article.title }}</h1>

          <!-- Tags -->
          <div class="art-hero-tags" data-testid="article-tags">
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="art-tag"
            ># {{ tag }}</span>
          </div>

          <!-- Author / stats row -->
          <div class="art-hero-foot">
            <div class="meta-line">
              <div class="avatar" />
              <div class="who">
                <b data-testid="article-author">{{ article.authorNickname }}</b>
                <div class="mono" style="font-size:11px;color:var(--muted)">
                  <time data-testid="article-date">{{ article.publishedAt }}</time>
                </div>
              </div>
            </div>
            <div class="art-hero-stats">
              <span>{{ article.viewCount }} 觀看次數</span>
              <span data-testid="comment-count">{{ article.commentCount }} 留言</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cover image -->
      <div v-if="article.coverImageUrl" class="art-cover wrap">
        <img
          :src="article.coverImageUrl"
          :alt="article.title"
          data-testid="article-cover-image"
        />
      </div>

      <!-- Article body + side ActionBar -->
      <div class="art-content-layout wrap">
        <div class="art-body-col">
          <div
            ref="articleBodyEl"
            class="art-body prose"
            data-testid="article-body"
            v-html="renderedHtml"
          />

          <ArticleTextSelectionToolbar
            :selection-payload="selectionState.selectionPayload.value"
            :selection-error="selectionState.selectionError.value"
            :selection-anchor="selectionState.selectionAnchor.value"
            :is-pending="highlightState.isMutating.value"
            @create="createHighlightFromSelection"
          />

          <!-- Reaction footer (below article body) -->
          <ReactionFooter
            :liked="likeState.liked.value"
            :like-count="likeState.likeCount.value"
            :is-pending="likeState.isPending.value"
            @toggle="likeState.toggle"
          />

          <ArticleHighlightPanel
            :highlights="highlightState.highlights.value"
            :located-by-highlight-uuid="inlineHighlightState.locatedByHighlightUuid.value"
            :is-loading="highlightState.isLoading.value"
            :is-mutating="highlightState.isMutating.value"
            :load-error="highlightState.loadError.value"
            @update="highlightState.updateHighlight"
            @delete="highlightState.deleteHighlight"
            @retry="highlightState.loadHighlights"
          />

          <!-- Article end -->
          <footer class="art-end">
            <p class="mono" style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-2)">END OF ARTICLE.</p>
            <button @click="scrollToTop" class="back-top-btn">↑</button>
          </footer>
        </div>

        <!-- Sticky action bar (right rail) -->
        <div class="art-action-rail">
          <ActionBar
            :liked="likeState.liked.value"
            :like-count="likeState.likeCount.value"
            :is-pending="likeState.isPending.value"
            :bookmarked="bookmarkState.bookmarked.value"
            :bookmark-pending="bookmarkState.isPending.value"
            @toggle="likeState.toggle"
            @toggle-bookmark="bookmarkState.toggle"
          />
        </div>
      </div>

      <!-- Related articles -->
      <RelatedArticlesSection :article-uuid="article.uuid" />

      <!-- Comment section -->
      <!-- 包 .wrap：CommentSection 自身無寬度限制，未包住會撐滿整個視窗寬度，
           與上方 .art-cover / .art-content-layout 的欄寬不齊（max-width:1360px）。 -->
      <div class="wrap">
        <CommentSection :article-uuid="article.uuid" />
      </div>

      <!-- 文章章節導覽（TOC） -->
      <div class="art-toc-rail">
        <ArticleToc :toc="toc" :active-id="activeId" @select="scrollToHeading" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.art-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; gap: 24px; color: var(--muted);
}
.art-detail { position: relative; }
.art-hero { padding: 96px 0 64px; border-bottom: 1px solid var(--divider); }
.art-hero-back { margin-bottom: 32px; }
.back-btn {
  font-family: var(--f-mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--muted); background: none; border: none; cursor: pointer;
  transition: color .2s; padding: 0;
}
.back-btn:hover { color: var(--ink); }
.art-hero-meta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
.art-hero-title {
  font-family: var(--f-display); font-size: clamp(36px, 5vw, 80px);
  font-weight: 500; line-height: 1.05; letter-spacing: -.04em;
  color: var(--ink); margin: 0 0 28px; max-width: 22ch;
}
.art-hero-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 36px; }
.art-tag {
  padding: 5px 12px; border-radius: 6px; font-family: var(--f-mono); font-size: 11px;
  letter-spacing: .1em; text-transform: uppercase; color: var(--muted);
  border: 1px solid var(--border); background: transparent;
}
.art-hero-foot { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.meta-line { display: flex; align-items: center; gap: 14px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-sub); }
.who b { font-family: var(--f-body); font-size: 14px; color: var(--ink); }
.art-hero-stats { display: flex; gap: 20px; font-family: var(--f-mono); font-size: 11px; letter-spacing: .12em; color: var(--ink-2); text-transform: uppercase; }
.art-cover { padding: 48px 0 0; }
.art-cover img { width: 100%; border-radius: 8px; display: block; }
.art-content-layout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
}
.art-body-col { min-width: 0; }
.art-action-rail { position: sticky; top: 80px; }
.art-body {
  max-width: 68ch; margin: 48px auto 0; font-family: var(--f-body);
  color: var(--ink-2); overflow-x: hidden;
}
.art-body :deep(code) { font-family: var(--f-mono); background: var(--bg-sub); }
.art-body :deep(blockquote) {
  border-left: 3px solid var(--accent); background: var(--glass);
  padding: .75em 1.5em; border-radius: 0 .75rem .75rem 0; opacity: .85;
}
.art-body :deep(pre) { background: transparent !important; padding: 0 !important; margin: 1.5em 0 !important; max-width: 100%; overflow-x: auto; }
.art-body :deep(pre code) { display: block; padding: 1.25em 1.5em; border-radius: 1rem; font-size: .875em; line-height: 1.7; overflow-x: auto; border: 1px solid var(--glass-border); }
.art-body :deep(.shiki) { background-color: var(--shiki-light-bg, #f6f8fa) !important; }
.art-body :deep(.shiki span) { color: var(--shiki-light, inherit); }
html.dark .art-body :deep(.shiki) { background-color: var(--shiki-dark-bg, #24292e) !important; }
html.dark .art-body :deep(.shiki span) { color: var(--shiki-dark, inherit); }
.art-body :deep(a) { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.art-body :deep(img) { border-radius: 1.5rem; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
.art-body :deep(:not(pre) > code) { background-color: var(--glass); border: 1px solid var(--glass-border); padding: .15em .4em; border-radius: .375rem; font-size: .85em; color: var(--code-ink, #d23669); }
html.dark .art-body :deep(:not(pre) > code) { color: var(--code-ink-dark, #ff7b72); }
.art-body :deep(table) { display: block; overflow-x: auto; width: 100%; border-collapse: collapse; margin: 2em 0; font-size: .9em; }
.art-body :deep(th), .art-body :deep(td) { border: 1px solid var(--glass-border); padding: .75em 1em; }
.art-body :deep(th) { background-color: var(--glass); font-weight: 700; text-align: left; }
.art-body :deep(.task-list-item) { list-style-type: none; position: relative; margin-left: -1.5rem; }
.art-body :deep(.task-list-item input[type="checkbox"]) { position: absolute; left: -1.5rem; top: .35rem; width: 1.1rem; height: 1.1rem; accent-color: var(--ink); cursor: pointer; }
.art-end {
  max-width: 68ch; margin: 96px auto 120px; padding-top: 40px;
  border-top: 1px solid var(--divider); display: flex; align-items: center; justify-content: space-between;
}
.back-top-btn {
  width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border);
  background: var(--glass); backdrop-filter: blur(12px); color: var(--ink);
  font-size: 16px; cursor: pointer; display: grid; place-items: center; transition: transform .2s;
}
.back-top-btn:hover { transform: translateY(-3px); }

/* 文章章節導覽（TOC）側欄：取代原本 .art-nav 圓點的固定側邊定位。
   內容為變長文字（非等距圓點），故加高度上限 + 捲動，避免長 TOC 溢出畫面。 */
.art-toc-rail {
  position: fixed;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 80;
  width: 220px;
  max-height: 60vh;
  overflow-y: auto;
}
@media (max-width: 1100px) {
  .art-toc-rail { display: none; }
}

/* BUG-002 修復：.art-toc-rail 是 fixed 定位（right:28px + width:220px），
   佔用視窗最右側 248px（=220+28），與置中的 .wrap（max-width:1360px，
   全站 * { box-sizing: border-box } 下 max-width 含 padding）互相獨立、
   不受下方 grid 版面影響。在 TOC 出現的斷點（>1100px）之後、直到 .wrap
   因 max-width 而把內容往中間推得夠遠之前，這段區間（實測常見桌面寬度
   1280/1366/1440/1536 都落在內）.art-action-rail 的 x 座標會落入 TOC
   佔用的最右側 248px 範圍，兩者實體重疊；TOC 的 z-index:80 高於
   ActionBar，滑鼠點擊 ♡/☆/↗/{} 會被 TOC 攔截、誤觸章節跳轉。
   解法：與 TOC 顯示同一斷點下，直接讓 .art-content-layout 的右側保留
   與 TOC 等寬（含緩衝）的留白，把 grid 內容整體往左推，讓 ActionBar
   的可視範圍永遠落在 TOC 左側之外（viewport 越寬，.wrap 置中效果越
   明顯，兩者間距只會更大，故此規則不設上限斷點）。 */
@media (min-width: 1101px) {
  .art-content-layout {
    padding-right: 280px; /* 220(TOC寬) + 28(TOC右邊距) + 32(安全緩衝) */
  }
}
</style>
