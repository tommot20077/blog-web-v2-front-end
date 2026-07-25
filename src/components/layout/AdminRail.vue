<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import RailBase from './RailBase.vue'

/**
 * AdminRail — admin 後台左側導覽（共用元件）
 *
 * 給所有 admin 後台頁面（/admin、/admin/review、/admin/categories、
 * /admin/tags、/admin/search）共用同一份左側導覽（Task A4）。
 *
 * 結構比照 `ShellRail.vue`：呈現、展開/收合、768px 收窄行為一律交給
 * Task A3 抽出的 `RailBase.vue` 基座；本元件只負責 admin 專屬的導覽資料
 * （5 個固定項目、依路由名稱推斷 active）。admin 目前沒有樹狀子項需求，
 * 故不使用 RailBase 的 children 能力。
 */

type AdminPage = 'admin-dashboard' | 'admin-review' | 'admin-categories' | 'admin-tags' | 'admin-search'

const props = defineProps<{
  /** 目前作用中的分頁；未提供時會嘗試以目前路由名稱推斷 */
  active?: AdminPage
}>()

const route = useRoute()

const activeKey = computed<AdminPage | ''>(() => {
  if (props.active) return props.active
  const name = route.name?.toString() ?? ''
  if (
    name === 'admin-dashboard' ||
    name === 'admin-review' ||
    name === 'admin-categories' ||
    name === 'admin-tags' ||
    name === 'admin-search'
  ) {
    return name
  }
  return ''
})

const NAV_ITEMS: { key: AdminPage; label: string; to: string }[] = [
  { key: 'admin-dashboard', label: '總覽', to: '/admin' },
  { key: 'admin-review', label: '待審', to: '/admin/review' },
  { key: 'admin-categories', label: '分類管理', to: '/admin/categories' },
  { key: 'admin-tags', label: '標籤管理', to: '/admin/tags' },
  { key: 'admin-search', label: '搜尋索引', to: '/admin/search' },
]
</script>

<template>
  <RailBase
    test-id-prefix="admin-rail"
    brand-test-id="admin-logo"
    brand-label="ADMIN CONSOLE."
    section-label="ADMIN"
    foot-label="← Blog 首頁"
    :items="NAV_ITEMS"
    :active="activeKey"
  />
</template>
