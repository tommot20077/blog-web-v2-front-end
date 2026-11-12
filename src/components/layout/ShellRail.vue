<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import RailBase from './RailBase.vue'

/**
 * ShellRail — 「工作區」左側導覽（共用元件）
 *
 * 給所有 `layout: 'shell'` 的頁面（/bookmarks、/my-articles、/settings、/my-stats）
 * 共用同一份左側導覽，確保四頁之間互相都能導航。
 *
 * 重構記錄（Task A3，抽出 presentational base）：
 * rail 的版面呈現、樹狀子項展開/收合、768px 站名收窄行為已全數搬進
 * `RailBase.vue`（無狀態基座）。本元件現在只負責「本元件專屬的導覽資料」：
 * NAV_ITEMS 四項常數、`requiresAuthor` 過濾、以及把 `settingsChildren` 併入
 * 「設定」項目的樹狀子項——呈現交給 RailBase 組合，對外 props/emits 逐字
 * 不變，四個既有頁面與 `ui-layout-regression` 回歸 spec 不受影響。
 *
 * 樹狀子項（settings tree，Yuan 定案 T1「縮排樹」+ 自動展開，2026-07-19）：
 * `/settings` 原本並排著兩條導覽（本元件 + SettingsView 自己的 .st-rail）。
 * 現在併成一棵樹：SettingsView 把它的區塊清單透過 `settingsChildren` prop
 * 傳進來，掛在「設定」項目底下。子項資料與「哪一個是 active」完全由呼叫端
 * （SettingsView）掌握 —— 呈現與展開/收合互動、選取子項 emit `select-child`
 * 由 RailBase 負責，本元件不碰路由。這樣其他三頁（/bookmarks、/my-articles、
 * /my-stats）完全不受影響：它們不會傳 settingsChildren，「設定」項目維持
 * 原本單純的 RouterLink。
 */

type ShellPage = 'bookmarks' | 'my-articles' | 'my-stats' | 'settings'

interface ShellRailChild {
  id: string
  label: string
  /** 危險操作子項（例如刪除帳號）套用強調色 */
  danger?: boolean
}

const props = defineProps<{
  /** 目前作用中的分頁；未提供時會嘗試以目前路由名稱推斷 */
  active?: ShellPage
  /** 「設定」項目底下的樹狀子項；未提供或空陣列時「設定」維持一般連結 */
  settingsChildren?: ShellRailChild[]
  /** 目前作用中的子項 id（由呼叫端掌握，對應高亮顯示） */
  activeChildId?: string
}>()

const emit = defineEmits<{
  (e: 'select-child', id: string): void
}>()

const route = useRoute()
const authStore = useAuthStore()

const activeKey = computed<ShellPage | ''>(() => {
  if (props.active) return props.active
  const name = route.name?.toString() ?? ''
  if (name === 'bookmarks' || name === 'my-articles' || name === 'my-stats' || name === 'settings') {
    return name
  }
  return ''
})

const NAV_ITEMS: ReadonlyArray<{ key: ShellPage; label: string; to: string; requiresAuthor?: boolean }> = [
  { key: 'bookmarks', label: '我的收藏', to: '/bookmarks' },
  { key: 'my-articles', label: '我的文章', to: '/my-articles' },
  { key: 'my-stats', label: '站台數據', to: '/my-stats', requiresAuthor: true },
  { key: 'settings', label: '設定', to: '/settings' },
]

// 交給 RailBase 呈現：把「設定」項目在有子項時掛上 children，其餘欄位照舊。
const railItems = computed(() =>
  NAV_ITEMS.filter((item) => !item.requiresAuthor || authStore.isAuthor).map((item) => {
    if (item.key === 'settings' && (props.settingsChildren?.length ?? 0) > 0) {
      return { key: item.key, label: item.label, to: item.to, children: props.settingsChildren }
    }
    return { key: item.key, label: item.label, to: item.to }
  }),
)

function selectChild(id: string) {
  emit('select-child', id)
}
</script>

<template>
  <RailBase
    test-id-prefix="shell-rail"
    brand-test-id="shell-logo"
    brand-label="MY BLOG WEB."
    foot-label="← Blog 首頁"
    :items="railItems"
    :active="activeKey"
    :active-child-id="activeChildId"
    @select-child="selectChild"
  >
    <slot />
  </RailBase>
</template>
