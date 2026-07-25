<script setup lang="ts">
import AdminRail from '../components/layout/AdminRail.vue'

/**
 * AdminDashboardView — admin 後台總覽儀表板（`/admin`）
 *
 * Task A4 範圍：只建立殼層與內容區骨架。四格真實資料指標卡
 * （待審文章數 / 分類數 / 標籤數 / 搜尋索引狀態）留給 Task A6 實作，
 * 這裡不呼叫任何 API，避免佔位頁顯示假資料。
 */
</script>

<template>
  <div class="shell" data-testid="admin-dashboard-root">
    <AdminRail active="admin-dashboard" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">總覽</h1>
        <p class="admin-empty" data-testid="admin-dashboard-placeholder">
          儀表板內容開發中（Task A6）
        </p>
      </div>
    </main>
  </div>
</template>
