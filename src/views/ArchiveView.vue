<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { allMockArticles } from '../api/mock/data'

const router = useRouter()

interface YearGroup {
  year: string
  articles: typeof allMockArticles
}

const byYear = computed<YearGroup[]>(() => {
  const map = new Map<string, typeof allMockArticles>()
  allMockArticles.forEach(a => {
    const y = a.publishedAt.slice(0, 4)
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(a)
  })
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, articles]) => ({ year, articles }))
})

const stats = computed(() => {
  const total = allMockArticles.length
  const years = byYear.value.length
  const tags = new Set(allMockArticles.flatMap(a => a.tags)).size
  return { total, years, tags }
})

function fmtDate(d: string) {
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[1]}.${p[2]}` : d.slice(5)
}
</script>

<template>
  <div class="ar-page" data-testid="archive-root">

    <!-- Header -->
    <header class="ar-header wrap">
      <div class="ar-header-text">
        <div class="ar-eyebrow mono" style="color:var(--muted-2)">§ ARCHIVE · 全部文章</div>
        <h1 class="ar-title">每一篇<em>都還記得。</em></h1>
        <p class="ar-sub">從第一篇到現在，全部 {{ stats.total }} 篇按時間排好。</p>
      </div>
      <div class="ar-header-stats">
        <div class="ar-stat"><b>{{ stats.total }}</b><span>Total</span></div>
        <div class="ar-stat"><b>{{ stats.years }}</b><span>Years</span></div>
        <div class="ar-stat"><b>{{ stats.tags }}</b><span>Tags</span></div>
      </div>
    </header>

    <div class="ar-divider wrap" />

    <!-- Year groups -->
    <main class="ar-main wrap">
      <section
        v-for="group in byYear"
        :key="group.year"
        class="ar-year-group"
        data-testid="archive-year"
      >
        <header class="ar-year-head">
          <span class="ar-year-num">{{ group.year }}</span>
          <span class="mono ar-year-count" style="color:var(--muted)">
            {{ group.articles.length }} {{ group.articles.length === 1 ? 'post' : 'posts' }}
          </span>
          <div class="ar-year-line" />
        </header>

        <div class="ar-year-list">
          <article
            v-for="a in group.articles"
            :key="a.uuid"
            class="ar-row"
            @click="router.push('/articles/' + a.uuid)"
          >
            <span class="ar-date">{{ fmtDate(a.publishedAt) }}</span>
            <h3 class="ar-row-title"><a>{{ a.title }}</a></h3>
            <div class="ar-row-tags">
              <span v-for="tag in a.tags.slice(0, 2)" :key="tag" class="ar-tag">{{ tag }}</span>
            </div>
          </article>
        </div>
      </section>
    </main>

  </div>
</template>

<style scoped>
.ar-page { min-height: 100vh; padding-top: 88px; padding-bottom: 120px; }

/* Header */
.ar-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 48px 0 40px; gap: 32px; }
.ar-eyebrow { font-size: 10px; letter-spacing: 0.2em; margin-bottom: 10px; }
.ar-title {
  font-family: var(--f-display); font-weight: 500;
  font-size: clamp(36px, 5vw, 64px); letter-spacing: -0.035em; line-height: 1;
  margin: 0 0 12px;
}
.ar-title em { font-style: italic; font-weight: 300; color: var(--muted); }
.ar-sub { font-size: 14.5px; color: var(--muted); margin: 0; }
.ar-header-stats { display: flex; gap: 24px; flex-shrink: 0; }
.ar-stat { display: flex; flex-direction: column; align-items: flex-end; }
.ar-stat b { font-family: var(--f-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }
.ar-stat span { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }

.ar-divider { height: 1px; background: var(--divider); margin-bottom: 48px; }

/* Year groups */
.ar-year-group { margin-bottom: 52px; }

.ar-year-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 18px; }
.ar-year-num { font-family: var(--f-display); font-size: 28px; font-weight: 500; letter-spacing: -0.02em; }
.ar-year-count { font-size: 10.5px; }
.ar-year-line { flex: 1; height: 1px; background: var(--divider); }

.ar-year-list { display: flex; flex-direction: column; }

.ar-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 16px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--divider);
  cursor: pointer;
  transition: opacity 0.15s;
}
.ar-row:hover { opacity: 0.7; }

.ar-date { font-family: var(--f-mono); font-size: 10px; color: var(--muted-2); letter-spacing: 0.06em; white-space: nowrap; }

.ar-row-title { margin: 0; }
.ar-row-title a { font-family: var(--f-display); font-size: 14.5px; font-weight: 500; color: var(--ink); }
.ar-row:hover .ar-row-title a { color: var(--accent); }

.ar-row-tags { display: flex; gap: 6px; }
.ar-tag { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-2); white-space: nowrap; }

@media (max-width: 640px) {
  .ar-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .ar-header-stats { flex-direction: row; }
  .ar-row { grid-template-columns: 36px 1fr; }
  .ar-row-tags { display: none; }
}
</style>
