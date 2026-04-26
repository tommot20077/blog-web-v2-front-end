<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleDetail } from '../composables/useArticleDetail'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useWordCount } from '../composables/useWordCount'
import { useReadingProgress } from '../composables/useReadingProgress'

const route = useRoute()
const router = useRouter()
const uuid = route.params.uuid as string

const { article, isLoading } = useArticleDetail(uuid)
const markdownSource = computed(() => article.value?.content ?? '')
const { renderedHtml } = useMarkdownRenderer(markdownSource)
const { readingTimeMinutes } = useWordCount(markdownSource)

const articleEl = ref<HTMLElement | null>(null)
const { progress } = useReadingProgress(articleEl)

watchEffect(() => {
  if (!isLoading.value && !article.value) router.replace({ name: 'not-found', params: { pathMatch: ['not-found'] } })
})

onMounted(() => window.scrollTo({ top: 0, behavior: 'auto' }))

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const goBack = () => window.history.length > 1 ? router.back() : router.push('/articles')
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading" class="art-loading">
    <div class="sk-pulse" style="height:4px;width:120px;border-radius:2px;" />
    <p class="mono">萃取文章細節中...</p>
  </div>

  <!-- Article -->
  <article v-if="article" ref="articleEl" class="art-detail" data-testid="article-root">

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
              :key="cat"
              class="mono"
              style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)"
            >{{ cat }}</span>
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
            <span data-testid="like-count">{{ article.likeCount }} ♡</span>
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

    <!-- Article body -->
    <div class="wrap">
      <div
        class="art-body prose"
        data-testid="article-body"
        v-html="renderedHtml"
      />

      <!-- Article end -->
      <footer class="art-end">
        <p class="mono" style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted-2)">END OF ARTICLE.</p>
        <button @click="scrollToTop" class="back-top-btn">↑</button>
      </footer>
    </div>

    <!-- Side navigation dots -->
    <div class="art-nav">
      <div class="art-nav-dot active" />
      <div class="art-nav-dot" />
      <div class="art-nav-dot" />
    </div>
  </article>
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
.art-hero-stats { display: flex; gap: 20px; font-family: var(--f-mono); font-size: 11px; letter-spacing: .12em; color: var(--muted-2); text-transform: uppercase; }
.art-cover { padding: 48px 0 0; }
.art-cover img { width: 100%; border-radius: 8px; display: block; }
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
</style>
