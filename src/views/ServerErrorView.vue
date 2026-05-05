<script setup lang="ts">
function reload() {
  window.location.reload()
}
</script>

<template>
  <div class="err-page" data-testid="server-error-root">
    <div class="se-wrap">

      <!-- Glitch 500 art -->
      <div class="se-num" aria-hidden="true">
        500
        <span class="se-glitch">500</span>
      </div>

      <p class="err-tag">§ SERVER ERROR</p>
      <h1 class="err-title">伺服器壞了，抱歉。</h1>
      <p class="err-sub">這不是你的錯。我已經收到通知，正在查 log。<br />等三十秒再試，或先去別的頁面晃晃。</p>

      <!-- CTAs -->
      <div class="se-actions">
        <button class="se-btn-pri" @click="reload">↻ 重新整理</button>
        <RouterLink to="/" class="se-btn-sec">回首頁</RouterLink>
      </div>

      <!-- Error trace -->
      <div class="se-trace">
        <div class="se-trace-head mono" style="color:var(--muted-2)">Error Trace · 給工程師看</div>
        <pre class="se-trace-body"><span class="se-key">request_id:</span> <span class="se-val">req_8f3a2b1c9d</span>
<span class="se-key">timestamp: </span> 2026-05-04T08:32:11Z
<span class="se-key">node:      </span> blog-edge-tpe-02
<span class="se-key">trace:     </span> TimeoutError → upstream → article_service</pre>
      </div>

    </div>
  </div>
</template>

<style scoped>
.se-wrap {
  text-align: center;
  max-width: 520px;
  width: 100%;
  padding: 48px 24px 64px;
}

/* Glitch 500 number */
.se-num {
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

.se-glitch {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  opacity: 0;
  animation: se-glitch 5s steps(1) infinite;
}

@keyframes se-glitch {
  0%,  100% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate(0); }
  3%         { opacity: 0.85; clip-path: inset(0 0 75% 0);  transform: translate(-4px); }
  5%         { clip-path: inset(55% 0 25% 0); transform: translate(4px); }
  7%         { clip-path: inset(25% 0 60% 0); transform: translate(-2px); }
  9%         { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate(0); }
  45%        { opacity: 0; }
  47%        { opacity: 0.7; clip-path: inset(10% 0 75% 0); transform: translate(3px); }
  49%        { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate(0); }
}

/* CTAs */
.se-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 28px;
}

.se-btn-pri,
.se-btn-sec {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: opacity 0.15s, border-color 0.15s, color 0.15s;
}

.se-btn-pri { padding: 10px 22px; background: var(--ink); color: var(--bg); }
.se-btn-pri:hover { opacity: 0.82; }

.se-btn-sec { padding: 9px 20px; border: 1px solid var(--border-strong); color: var(--muted); }
.se-btn-sec:hover { color: var(--ink); border-color: var(--ink); }

/* Error trace */
.se-trace { margin-top: 48px; text-align: left; }

.se-trace-head {
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.se-trace-body {
  font-family: var(--f-mono);
  font-size: 11.5px;
  line-height: 1.8;
  background: var(--bg-sub);
  border: 1px solid var(--divider);
  border-radius: 10px;
  padding: 16px 20px;
  margin: 0;
  color: var(--muted);
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
}

.se-key { color: var(--muted-2); }
.se-val { color: var(--accent); }
</style>
