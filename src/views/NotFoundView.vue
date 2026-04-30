<script setup lang="ts">
</script>

<template>
  <div class="err-page">
    <div class="err-inner">
      <div class="err-bg-num">404</div>
      <p class="err-tag">§ ERROR · NOT FOUND</p>
      <h1 class="err-title">找不到這一頁。</h1>
      <p class="err-sub">這個 URL 可能已移除、改名，或從來就不存在。</p>
      <div class="err-rule"></div>
      <RouterLink to="/" class="err-cta">回首頁 →</RouterLink>
    </div>
  </div>
</template>
