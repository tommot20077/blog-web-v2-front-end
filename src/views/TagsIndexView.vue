<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { tagService } from '../api/tagService'
import { seriesService, type SeriesSummary } from '../api/seriesService'

interface Tag { name: string; slug: string; count: number }

const tags = ref<Tag[]>([])
const series = ref<SeriesSummary[]>([])
const isLoading = ref(true)
const hasError = ref(false)

async function load() {
  isLoading.value = true
  hasError.value = false

  // tags 與 series 各自獨立抓取：series 失敗（或無 mock 層）不可阻擋標籤雲渲染。
  const [tagsResult, seriesResult] = await Promise.allSettled([
    tagService.getAllTags(),
    seriesService.list({ size: 100 }),
  ])

  if (tagsResult.status === 'fulfilled') {
    tags.value = tagsResult.value.map(t => ({ name: t.name, slug: t.slug, count: t.articleCount }))
  } else {
    console.error('Load tags failed:', tagsResult.reason)
    hasError.value = true
    tags.value = []
  }

  if (seriesResult.status === 'fulfilled') {
    series.value = seriesResult.value.records
  } else {
    // series 失敗時靜默降級為空清單（區塊會自動隱藏），不影響標籤雲
    console.error('Load series failed:', seriesResult.reason)
    series.value = []
  }

  isLoading.value = false
}

onMounted(load)

function chipSize(count: number) {
  if (count >= 14) return 's5'
  if (count >= 8)  return 's4'
  if (count >= 5)  return 's3'
  if (count >= 3)  return 's2'
  return 's1'
}

const totalTags = computed(() => tags.value.length)
const totalSeries = computed(() => series.value.length)
const hasSeries = computed(() => series.value.length > 0)
</script>

<template>
  <div class="tg-page" data-testid="tags-index-root">

    <!-- Page header -->
    <header class="tg-header wrap">
      <div class="tg-header-text">
        <div class="tg-eyebrow mono" style="color:var(--muted-2)">
          § tags &amp; series · {{ totalTags }} topics
        </div>
        <h1 class="tg-title">用主題<em>串起來看。</em></h1>
        <p class="tg-sub">
          不是每篇都獨立。同一個 tag 是觀點的延伸，同一個 series 是一段完整的論證。挑一個進去。
        </p>
      </div>
      <div class="tg-header-stats">
        <div class="tg-stat"><b>{{ totalTags }}</b><span>tags</span></div>
        <div class="tg-stat"><b>{{ totalSeries }}</b><span>series</span></div>
      </div>
    </header>

    <div class="tg-divider wrap" />

    <!-- Tag cloud -->
    <section class="tg-section wrap">
      <div class="tg-sec-h">
        <span class="mono tg-sec-label" style="color:var(--muted-2)">Tag Cloud</span>
        <div class="tg-sec-line" />
      </div>
      <div v-if="isLoading" class="tg-state" data-testid="tags-loading">載入中…</div>
      <div v-else-if="hasError" class="tg-state" data-testid="tags-error">標籤載入失敗，請稍後再試。</div>
      <div v-else class="tg-cloud" data-testid="tags-cloud">
        <RouterLink
          v-for="tag in tags"
          :key="tag.slug"
          :to="'/tags/' + tag.slug"
          class="tg-chip"
          :class="chipSize(tag.count)"
        >
          #{{ tag.name }}
          <span class="tg-chip-count">{{ tag.count }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- Series（無資料時整段隱藏；與 tag cloud 獨立，tag 失敗仍可顯示） -->
    <section v-if="!isLoading && hasSeries" class="tg-section wrap">
      <div class="tg-sec-h" data-testid="tags-series-header">
        <span class="mono tg-sec-label" style="color:var(--muted-2)">Series · 連載</span>
        <div class="tg-sec-line" />
        <span class="mono tg-sec-meta" style="color:var(--muted)">{{ totalSeries }} series</span>
      </div>
      <div class="tg-series-grid" data-testid="tags-series">
        <div v-for="s in series" :key="s.uuid" class="tg-series-card">
          <span class="tg-series-badge">Series · {{ s.articleCount }} 篇</span>
          <h3 class="tg-series-title">{{ s.title }}</h3>
          <p v-if="s.description" class="tg-series-desc">{{ s.description }}</p>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.tg-page { min-height: 100vh; padding-top: 88px; padding-bottom: 120px; }

/* Header */
.tg-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 48px 0 40px; gap: 32px; }
.tg-eyebrow { font-size: 10px; letter-spacing: 0.2em; margin-bottom: 10px; }
.tg-title {
  font-family: var(--f-display); font-weight: 500;
  font-size: clamp(36px, 5vw, 60px); letter-spacing: -0.03em; line-height: 1;
  margin: 0 0 12px;
}
.tg-title em { font-style: italic; font-weight: 300; color: var(--muted); }
.tg-sub { font-size: 14.5px; color: var(--muted); line-height: 1.7; max-width: 48ch; margin: 0; }
.tg-header-stats { display: flex; gap: 24px; flex-shrink: 0; }
.tg-stat { display: flex; flex-direction: column; align-items: flex-end; }
.tg-stat b { font-family: var(--f-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }
.tg-stat span { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }

.tg-divider { height: 1px; background: var(--divider); margin-bottom: 40px; }

/* Section */
.tg-section { margin-bottom: 56px; }
.tg-sec-h { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.tg-sec-label { font-size: 10.5px; letter-spacing: 0.2em; white-space: nowrap; }
.tg-sec-line { flex: 1; height: 1px; background: var(--divider); }
.tg-sec-meta { font-size: 10.5px; letter-spacing: 0.14em; white-space: nowrap; }

/* Loading / error state */
.tg-state { font-size: 14px; color: var(--muted); padding: 8px 0; }

/* Tag cloud */
.tg-cloud { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: baseline; }

.tg-chip {
  padding: 5px 13px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-family: var(--f-display);
  font-weight: 500;
  color: var(--ink-2);
  transition: all 0.18s;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.2;
  text-decoration: none;
}
.tg-chip:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.tg-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.tg-chip-count {
  font-family: var(--f-mono);
  font-size: 0.65em;
  opacity: 0.55;
  letter-spacing: 0.06em;
}

.tg-chip.s5 { font-size: 26px; padding: 6px 16px; }
.tg-chip.s4 { font-size: 20px; padding: 6px 14px; }
.tg-chip.s3 { font-size: 16px; }
.tg-chip.s2 { font-size: 14px; }
.tg-chip.s1 { font-size: 12px; color: var(--muted); }

/* Series grid */
.tg-series-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

.tg-series-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  transition: border-color 0.18s;
}
.tg-series-card:hover { border-color: var(--border-strong); }

.tg-series-badge {
  font-family: var(--f-mono);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 3px 8px;
  display: inline-block;
  margin-bottom: 14px;
}

.tg-series-title {
  font-family: var(--f-display);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.015em;
  margin: 0 0 10px;
  line-height: 1.3;
}
.tg-series-desc { font-size: 13.5px; color: var(--muted); line-height: 1.65; margin: 0; }

@media (max-width: 640px) {
  .tg-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .tg-header-stats { flex-direction: row; }
  .tg-series-grid { grid-template-columns: 1fr; }
}
</style>
