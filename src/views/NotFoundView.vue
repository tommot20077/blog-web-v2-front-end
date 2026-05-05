<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { allMockArticles } from '../api/mock/data'

const suggestions = allMockArticles.slice(0, 4)

function fmtDate(d: string) {
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[1]}.${p[2]}` : d.slice(5)
}
</script>

<template>
  <div class="err-page" data-testid="notfound-root">
    <div class="nf-wrap">

      <!-- Glitch 404 art -->
      <div class="nf-num err-bg-num" aria-hidden="true">
        404
        <span class="nf-glitch">404</span>
      </div>

      <p class="err-tag">§ ERROR · NOT FOUND</p>
      <h1 class="err-title">找不到這一頁。</h1>
      <p class="err-sub">這個 URL 可能已移除、改名，或從來就不存在。</p>

      <!-- CTAs -->
      <div class="nf-actions" data-testid="notfound-actions">
        <RouterLink to="/" class="nf-btn-pri err-cta">回首頁 →</RouterLink>
        <RouterLink to="/search" class="nf-btn-sec">搜尋</RouterLink>
        <RouterLink to="/archive" class="nf-btn-sec">Archive</RouterLink>
      </div>

      <!-- Suggested articles -->
      <div class="nf-suggest" data-testid="notfound-suggestions">
        <div class="nf-suggest-h">
          <span class="mono nf-suggest-label">最近寫的 · 也許你會想看</span>
          <span class="nf-suggest-rule" />
        </div>
        <div class="nf-suggest-list">
          <RouterLink
            v-for="a in suggestions"
            :key="a.uuid"
            :to="'/articles/' + a.uuid"
            class="nf-suggest-row"
          >
            <span class="nf-d">{{ fmtDate(a.publishedAt) }}</span>
            <span class="nf-t">{{ a.title }}</span>
            <span class="nf-tag-label">{{ a.tags[0] }}</span>
          </RouterLink>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.nf-wrap {
  text-align: center;
  max-width: 560px;
  width: 100%;
  padding: 48px 24px 64px;
}

/* Big glitch number */
.nf-num {
  font-family: var(--f-display);
  font-size: clamp(120px, 24vw, 240px);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.88;
  color: var(--ink);
  opacity: 0.05;
  position: relative;
  user-select: none;
  margin-bottom: -12px;
}

.nf-glitch {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  opacity: 0;
  animation: nf-glitch 6s steps(1) infinite;
}

@keyframes nf-glitch {
  0%,  100% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate(0); }
  4%         { opacity: 0.9; clip-path: inset(0 0 80% 0);  transform: translate(-4px); }
  6%         { clip-path: inset(60% 0 20% 0); transform: translate(4px); }
  8%         { clip-path: inset(30% 0 55% 0); transform: translate(-2px); }
  10%        { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate(0); }
  48%        { opacity: 0; clip-path: inset(100% 0 0 0); }
  50%        { opacity: 0.7; clip-path: inset(15% 0 70% 0); transform: translate(3px); }
  52%        { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate(0); }
}

/* CTAs */
.nf-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 28px;
}

.nf-btn-pri,
.nf-btn-sec {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: opacity 0.15s, border-color 0.15s, color 0.15s;
}

.nf-btn-pri {
  padding: 10px 22px;
  background: var(--ink);
  color: var(--bg);
}
.nf-btn-pri:hover { opacity: 0.82; }

.nf-btn-sec {
  padding: 9px 20px;
  border: 1px solid var(--border-strong);
  color: var(--muted);
}
.nf-btn-sec:hover { color: var(--ink); border-color: var(--ink); }

/* Suggestions section */
.nf-suggest {
  margin-top: 52px;
  text-align: left;
}

.nf-suggest-h {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.nf-suggest-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--muted-2);
  white-space: nowrap;
}

.nf-suggest-rule {
  flex: 1;
  height: 1px;
  background: var(--divider);
}

.nf-suggest-list { display: flex; flex-direction: column; }

.nf-suggest-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider);
  transition: opacity 0.15s;
}
.nf-suggest-row:last-child { border-bottom: 0; }
.nf-suggest-row:hover { opacity: 0.65; }

.nf-d {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--muted-2);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.nf-t {
  font-family: var(--f-display);
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nf-tag-label {
  font-family: var(--f-mono);
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted-2);
  white-space: nowrap;
}
</style>
