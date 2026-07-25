<script setup lang="ts">
import AdminRail from '../components/layout/AdminRail.vue'

/**
 * AdminSearchView — 搜尋索引（`/admin/search`）
 *
 * Task A4 範圍：只建立殼層與內容區骨架。索引狀態顯示與「重建索引」
 * 操作流程留給 Task A9 實作，這裡不呼叫任何 API。
 */
</script>

<template>
  <div class="shell" data-testid="admin-search-root">
    <AdminRail active="admin-search" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">搜尋索引</h1>
        <p class="admin-empty" data-testid="admin-search-placeholder">
          搜尋索引內容開發中（Task A9）
        </p>
      </div>
    </main>
  </div>
</template>
