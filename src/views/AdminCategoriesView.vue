<script setup lang="ts">
import AdminRail from '../components/layout/AdminRail.vue'

/**
 * AdminCategoriesView — 分類管理（`/admin/categories`）
 *
 * Task A4 範圍：只建立殼層與內容區骨架。表格、新增/編輯表單、刪除
 * 確認流程留給 Task A7 實作，這裡不呼叫任何 API。
 */
</script>

<template>
  <div class="shell" data-testid="admin-categories-root">
    <AdminRail active="admin-categories" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">分類管理</h1>
        <p class="admin-empty" data-testid="admin-categories-placeholder">
          分類管理內容開發中（Task A7）
        </p>
      </div>
    </main>
  </div>
</template>
