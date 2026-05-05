<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

interface Tag { name: string; slug: string; count: number }
interface Series { id: string; badge: string; title: string; desc: string; done: number; total: number }

const TAGS: Tag[] = [
  { name: 'Vue 3',         slug: 'vue-3',         count: 18 },
  { name: 'TypeScript',    slug: 'typescript',    count: 14 },
  { name: 'Java',          slug: 'java',          count: 12 },
  { name: 'PostgreSQL',    slug: 'postgresql',    count: 10 },
  { name: 'Spring',        slug: 'spring',        count: 9  },
  { name: 'Testing',       slug: 'testing',       count: 8  },
  { name: 'Design System', slug: 'design-system', count: 7  },
  { name: 'CI/CD',         slug: 'ci-cd',         count: 6  },
  { name: 'CSS',           slug: 'css',           count: 6  },
  { name: 'TDD',           slug: 'tdd',           count: 5  },
  { name: 'Animation',     slug: 'animation',     count: 5  },
  { name: 'Redis',         slug: 'redis',         count: 4  },
  { name: 'Docker',        slug: 'docker',        count: 4  },
  { name: 'Pinia',         slug: 'pinia',         count: 3  },
  { name: 'Vite',          slug: 'vite',          count: 3  },
  { name: 'Shiki',         slug: 'shiki',         count: 2  },
  { name: 'Vitest',        slug: 'vitest',        count: 2  },
  { name: 'Playwright',    slug: 'playwright',    count: 2  },
  { name: 'Tailwind',      slug: 'tailwind',      count: 2  },
  { name: 'A11y',          slug: 'a11y',          count: 2  },
  { name: 'ESLint',        slug: 'eslint',        count: 1  },
  { name: 'Prettier',      slug: 'prettier',      count: 1  },
  { name: 'Husky',         slug: 'husky',         count: 1  },
]

const SERIES: Series[] = [
  {
    id: 'vue-reactivity',
    badge: 'Series · 5 / 8',
    title: 'Vue 3 響應式系統內部',
    desc: '從 reactive、ref、effect 到 computed 的完整解剖，以及如何自己寫一個迷你版本。',
    done: 5, total: 8,
  },
  {
    id: 'markdown-editor',
    badge: 'Series · 3 / 6',
    title: '從零打造 Markdown Editor',
    desc: 'CodeMirror 6 + Shiki + 自製 markdown extension，全 series 結束時你會有一個能用的 editor。',
    done: 3, total: 6,
  },
  {
    id: 'spring-webflux',
    badge: 'Series · 2 / 5',
    title: 'Spring WebFlux 實戰',
    desc: '非同步、backpressure、R2DBC 與整合測試的踩雷紀錄。',
    done: 2, total: 5,
  },
  {
    id: 'pg-index',
    badge: 'Series · 4 / 4 · 完結',
    title: 'PostgreSQL Index 全攻略',
    desc: 'B-tree、GIN、BRIN、Hash、partial index — 何時用、怎麼測。',
    done: 4, total: 4,
  },
]

const activeTag = ref<string | null>(null)

function chipSize(count: number) {
  if (count >= 14) return 's5'
  if (count >= 8)  return 's4'
  if (count >= 5)  return 's3'
  if (count >= 3)  return 's2'
  return 's1'
}

function toggleTag(slug: string) {
  activeTag.value = activeTag.value === slug ? null : slug
}

const totalTags = computed(() => TAGS.length)
const totalSeries = computed(() => SERIES.length)
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
      <div class="tg-cloud" data-testid="tags-cloud">
        <RouterLink
          v-for="tag in TAGS"
          :key="tag.slug"
          :to="'/tags/' + tag.slug"
          class="tg-chip"
          :class="[chipSize(tag.count), { active: activeTag === tag.slug }]"
          @click.prevent="toggleTag(tag.slug)"
        >
          #{{ tag.name }}
          <span class="tg-chip-count">{{ tag.count }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- Series -->
    <section class="tg-section wrap">
      <div class="tg-sec-h">
        <span class="mono tg-sec-label" style="color:var(--muted-2)">Series · 連載</span>
        <div class="tg-sec-line" />
        <span class="mono tg-sec-meta" style="color:var(--muted)">{{ totalSeries }} ongoing</span>
      </div>
      <div class="tg-series-grid" data-testid="tags-series">
        <div v-for="s in SERIES" :key="s.id" class="tg-series-card">
          <span class="tg-series-badge">{{ s.badge }}</span>
          <h3 class="tg-series-title">{{ s.title }}</h3>
          <p class="tg-series-desc">{{ s.desc }}</p>
          <div class="tg-series-prog">
            <div class="tg-prog-bar">
              <div class="tg-prog-fill" :style="{ width: `${(s.done / s.total) * 100}%` }" />
            </div>
            <span class="mono tg-prog-pct">{{ Math.round((s.done / s.total) * 100) }}%</span>
          </div>
        </div>

        <!-- Coming soon placeholder -->
        <div class="tg-series-card tg-series-card--coming">
          <div class="tg-coming-title">下一個系列規劃中</div>
          <div class="tg-coming-sub">關於 Vue 3 + Tailwind 的 12 篇連載</div>
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
.tg-series-desc { font-size: 13.5px; color: var(--muted); line-height: 1.65; margin: 0 0 16px; }

.tg-series-prog { display: flex; align-items: center; gap: 12px; }
.tg-prog-bar { flex: 1; height: 4px; background: var(--bg-sub); border-radius: 2px; overflow: hidden; }
.tg-prog-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.6s var(--ease); }
.tg-prog-pct { font-size: 10.5px; color: var(--muted); letter-spacing: 0.1em; }

.tg-series-card--coming {
  border-style: dashed;
  background: transparent;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  gap: 6px;
}
.tg-coming-title { font-family: var(--f-display); font-size: 17px; color: var(--ink-2); }
.tg-coming-sub { font-size: 13px; }

@media (max-width: 640px) {
  .tg-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .tg-header-stats { flex-direction: row; }
  .tg-series-grid { grid-template-columns: 1fr; }
}
</style>
