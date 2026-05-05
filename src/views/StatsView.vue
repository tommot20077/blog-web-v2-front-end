<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

type Period = '7d' | '30d' | '90d'
const selectedPeriod = ref<Period>('30d')

const STAT_CARDS = [
  { lbl: 'PAGE VIEWS',  n: '12.4k', delta: '+18%', dir: 'up',   sub: '近 30 天' },
  { lbl: 'VISITORS',    n: '4,082', delta: '+12%', dir: 'up',   sub: 'estimated' },
  { lbl: 'AVG READ',    n: '4:32',  delta: '+0:38', dir: 'up',   sub: 'min:sec' },
  { lbl: 'SUBSCRIBERS', n: '1,247', delta: '+34',  dir: 'up',   sub: 'this month' },
  { lbl: 'COMMENTS',    n: '89',    delta: '-12',  dir: 'down', sub: '較上月' },
  { lbl: 'BOUNCE RATE', n: '38%',   delta: '-4%',  dir: 'up',   sub: '越低越好' },
] as const

const TOP_ARTICLES = [
  { title: '把整個 Blog 收斂成 800 行 tokens。', views: 3421, delta: '+22%', neg: false },
  { title: 'useTheme() 的第三次重構。',          views: 2108, delta: '+8%',  neg: false },
  { title: '灰階不是偷懶的藉口。',               views: 1894, delta: '+15%', neg: false },
  { title: '我為什麼離開 Pinia。',               views: 1672, delta: '+4%',  neg: false },
  { title: 'Vue 3 + Vitest 的 TDD 流程。',       views: 1233, delta: '-2%',  neg: true  },
]

const REFERRERS = [
  { src: 'Direct',               pct: 42 },
  { src: 'twitter.com',          pct: 18 },
  { src: 'news.ycombinator.com', pct: 14 },
  { src: 'google.com',           pct: 12 },
  { src: 'github.com',           pct:  8 },
  { src: 'Other',                pct:  6 },
]

// 30-day sparkline mock
const DAILY_VIEWS = Array.from({ length: 30 }, (_, i) =>
  Math.round(300 + Math.sin(i / 3) * 140 + (i % 7) * 20)
)
const PEAK = Math.max(...DAILY_VIEWS)
</script>

<template>
  <div class="shell" data-testid="stats-root">

    <!-- Left rail -->
    <nav class="shell-rail">
      <div class="brand">
        <span class="mark" />
        <span class="name">MY BLOG WEB.</span>
      </div>

      <span class="rail-section">WORKSPACE</span>

      <button class="rail-item active">站台數據</button>
      <RouterLink to="/my-articles" class="rail-item">我的文章</RouterLink>
      <RouterLink to="/editor" class="rail-item">開始新文章</RouterLink>

      <div class="rail-foot">
        <RouterLink to="/">← Blog 首頁</RouterLink>
      </div>
    </nav>

    <!-- Main content -->
    <div class="shell-main">

      <!-- Sticky breadcrumb -->
      <div class="shell-back">
        <span class="mono" style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted-2)">
          作者後台 · ANALYTICS
        </span>
      </div>

      <!-- Page header -->
      <div class="st-pg-head">
        <div class="st-pg-title-row">
          <h1 class="ma-title">站台數據<span class="em">。</span></h1>
          <div class="st-period-seg">
            <button
              v-for="p in (['7d', '30d', '90d'] as Period[])"
              :key="p"
              class="st-period-btn"
              :class="{ active: selectedPeriod === p }"
              @click="selectedPeriod = p"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stat cards grid -->
      <div class="st-cards">
        <div v-for="c in STAT_CARDS" :key="c.lbl" class="st-card">
          <div class="st-card-top">
            <span class="mono st-card-lbl">{{ c.lbl }}</span>
            <span class="st-delta" :class="{ down: c.dir === 'down' }">{{ c.delta }}</span>
          </div>
          <div class="st-card-n">{{ c.n }}</div>
          <div class="mono st-card-sub">{{ c.sub }}</div>
        </div>
      </div>

      <!-- Daily chart -->
      <div class="st-panel">
        <div class="st-panel-head">
          <h3 class="st-panel-title">每日瀏覽量</h3>
          <span class="mono st-panel-meta">DAILY · {{ selectedPeriod }}</span>
        </div>
        <div class="st-chart" role="img" aria-label="每日瀏覽量圖表">
          <div
            v-for="(v, i) in DAILY_VIEWS"
            :key="i"
            class="st-bar"
            :style="{ height: `${Math.max(4, (v / PEAK) * 100)}%` }"
            :title="`Day ${i + 1}: ${v} views`"
          />
        </div>
      </div>

      <!-- Bottom 2-col grid -->
      <div class="st-grid-2">

        <!-- Top articles -->
        <div class="st-panel">
          <div class="st-panel-head">
            <h3 class="st-panel-title">熱門文章</h3>
            <span class="mono st-panel-meta">TOP 5 · THIS PERIOD</span>
          </div>
          <table class="st-top-table">
            <tbody>
              <tr v-for="(a, i) in TOP_ARTICLES" :key="i" class="st-top-row">
                <td class="st-top-idx">{{ String(i + 1).padStart(2, '0') }}</td>
                <td class="st-top-title">{{ a.title }}</td>
                <td class="st-top-views">{{ a.views.toLocaleString() }}</td>
                <td class="st-top-delta" :class="{ neg: a.neg }">{{ a.delta }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Traffic sources -->
        <div class="st-panel">
          <div class="st-panel-head">
            <h3 class="st-panel-title">流量來源</h3>
            <span class="mono st-panel-meta">TRAFFIC · SOURCES</span>
          </div>
          <div class="st-refs">
            <div v-for="r in REFERRERS" :key="r.src" class="st-ref-row">
              <span class="st-ref-src">{{ r.src }}</span>
              <div class="st-ref-bar-wrap">
                <div class="st-ref-bar" :style="{ width: `${r.pct}%` }" />
              </div>
              <span class="mono st-ref-pct">{{ r.pct }}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page header */
.st-pg-head { padding: 24px 0 20px; }
.st-pg-title-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

.st-period-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: var(--bg-sub);
  border: 1px solid var(--divider);
  flex-shrink: 0;
}
.st-period-btn {
  padding: 6px 12px;
  border-radius: 7px;
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  transition: all 0.18s;
}
.st-period-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}

/* Stat cards */
.st-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }

.st-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px;
}

.st-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.st-card-lbl { font-size: 9.5px; letter-spacing: 0.18em; color: var(--muted-2); }

.st-delta { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.1em; color: #16a34a; }
.st-delta.down { color: #dc2626; }

.st-card-n { font-family: var(--f-display); font-size: 28px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
.st-card-sub { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted-2); }

/* Panel */
.st-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px 22px;
  margin-bottom: 16px;
}

.st-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.st-panel-title { font-family: var(--f-display); font-size: 16px; font-weight: 500; letter-spacing: -0.01em; margin: 0; }
.st-panel-meta { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted-2); }

/* Sparkline chart */
.st-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 80px;
  padding: 4px 0;
}

.st-bar {
  flex: 1;
  background: color-mix(in oklch, var(--accent) 38%, var(--bg-sub));
  border-radius: 2px 2px 0 0;
  transition: background 0.15s;
  min-height: 4px;
}
.st-bar:hover { background: var(--accent); }

/* 2-col grid */
.st-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* Top articles */
.st-top-table { width: 100%; border-collapse: collapse; }
.st-top-row { border-bottom: 1px solid var(--divider); }
.st-top-row:last-child { border-bottom: 0; }
.st-top-row td { padding: 10px 6px; font-size: 13px; }
.st-top-idx {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 500;
  color: var(--muted-2);
  letter-spacing: -0.02em;
  width: 32px;
  vertical-align: top;
  padding-top: 9px;
}
.st-top-title { color: var(--ink); line-height: 1.4; }
.st-top-views { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--muted); white-space: nowrap; text-align: right; }
.st-top-delta { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.1em; color: #16a34a; white-space: nowrap; text-align: right; }
.st-top-delta.neg { color: #dc2626; }

/* Referrers */
.st-refs { display: flex; flex-direction: column; gap: 10px; }
.st-ref-row { display: grid; grid-template-columns: 130px 1fr 38px; gap: 12px; align-items: center; }
.st-ref-src { font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-ref-bar-wrap { background: var(--bg-sub); border-radius: 2px; height: 6px; overflow: hidden; }
.st-ref-bar { height: 100%; background: var(--accent); border-radius: 2px; opacity: 0.55; }
.st-ref-pct { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-align: right; }

@media (max-width: 900px) {
  .st-cards { grid-template-columns: repeat(2, 1fr); }
  .st-grid-2 { grid-template-columns: 1fr; }
}
</style>
