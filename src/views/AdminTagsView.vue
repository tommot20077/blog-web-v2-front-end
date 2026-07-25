<script setup lang="ts">
import AdminRail from '../components/layout/AdminRail.vue'

/**
 * AdminTagsView — 標籤管理（`/admin/tags`）
 *
 * Task A4 範圍：只建立殼層與內容區骨架。表格、color/icon/description
 * 編輯、刪除防護留給 Task A8 實作，這裡不呼叫任何 API。
 */
</script>

<template>
  <div class="shell" data-testid="admin-tags-root">
    <AdminRail active="admin-tags" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">標籤管理</h1>
        <p class="admin-empty" data-testid="admin-tags-placeholder">
          標籤管理內容開發中（Task A8）
        </p>
      </div>
    </main>
  </div>
</template>
