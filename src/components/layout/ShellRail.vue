<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

/**
 * ShellRail — 「工作區」左側導覽（共用元件）
 *
 * 給所有 `layout: 'shell'` 的頁面（/bookmarks、/my-articles、/settings、/my-stats）
 * 共用同一份左側導覽，確保四頁之間互相都能導航。
 *
 * 修復重點（768px 站名擠壓，T7）：
 * views.css 的 `.shell { grid-template-columns: 64px 1fr }`（max-width:1100px）
 * 因 @import 順序（views.css 晚於 styles.css 匯入）在 768px 寬度下持續覆蓋掉
 * styles.css 原本要在 768px 隱藏整個 rail 的規則，導致 rail 卡在 64px 窄寬，
 * 而站名文字沒有對應收合，逐字換行溢出。此處以 scoped 樣式（帶
 * data-v scope attribute，天然比 `.shell-rail .brand .name` 多一層 selector，
 * 不受匯入順序影響）在同一寬度收窄站名文字，只留下 mark 圖示。
 *
 * 樹狀子項（settings tree，Yuan 定案 T1「縮排樹」+ 自動展開，2026-07-19）：
 * `/settings` 原本並排著兩條導覽（本元件 + SettingsView 自己的 .st-rail）。
 * 現在併成一棵樹：SettingsView 把它的區塊清單透過 `settingsChildren` prop
 * 傳進來，掛在「設定」項目底下。子項資料與「哪一個是 active」完全由呼叫端
 * （SettingsView）掌握 —— 本元件只負責呈現與展開/收合互動，選取子項時只
 * emit `select-child`，不自己碰路由。這樣其他三頁（/bookmarks、/my-articles、
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

const navItems = computed(() => NAV_ITEMS.filter((item) => !item.requiresAuthor || authStore.isAuthor))

const hasSettingsChildren = computed(() => (props.settingsChildren?.length ?? 0) > 0)
const isSettingsActive = computed(() => activeKey.value === 'settings')

// 自動展開：只在目前身處「設定」分頁時展開，離開後不強制收合（實務上
// SettingsView 換頁即整個卸載重掛載，下次進來會重新以 true 初始化）。
// 仍保留手動收合：expanded 是本地狀態，使用者按 chevron 可自行收合／展開。
const expanded = ref(isSettingsActive.value)
watch(isSettingsActive, (active) => {
  if (active) expanded.value = true
})

function toggleExpanded() {
  expanded.value = !expanded.value
}

function selectChild(id: string) {
  emit('select-child', id)
}
</script>

<template>
  <nav class="shell-rail" data-testid="shell-rail">
    <RouterLink to="/" class="brand" data-testid="shell-logo">
      <span class="mark" />
      <span class="name">MY BLOG WEB.</span>
    </RouterLink>

    <span class="rail-section">NAVIGATE</span>
    <template v-for="item in navItems" :key="item.key">
      <RouterLink
        v-if="!(item.key === 'settings' && hasSettingsChildren)"
        :to="item.to"
        class="rail-item"
        :class="{ active: activeKey === item.key }"
        :data-testid="`shell-rail-link-${item.key}`"
      >
        {{ item.label }}
      </RouterLink>

      <template v-else>
        <button
          type="button"
          class="rail-item rail-item-toggle"
          :class="{ active: activeKey === item.key }"
          :aria-expanded="expanded"
          aria-controls="shell-rail-settings-kids"
          data-testid="shell-rail-toggle-settings"
          @click="toggleExpanded"
        >
          {{ item.label }}
          <svg class="chev" :class="{ open: expanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <ul
          v-show="expanded"
          id="shell-rail-settings-kids"
          class="rail-kids"
          role="group"
          :aria-label="`${item.label}子選單`"
          data-testid="shell-rail-settings-kids"
        >
          <li v-for="kid in settingsChildren" :key="kid.id">
            <button
              type="button"
              class="rail-kid"
              :class="{ on: kid.id === activeChildId, danger: kid.danger }"
              :tabindex="expanded ? 0 : -1"
              :data-testid="`shell-rail-kid-${kid.id}`"
              @click="selectChild(kid.id)"
            >
              {{ kid.label }}
            </button>
          </li>
        </ul>
      </template>
    </template>

    <!-- 頁面專屬內容（例如：我的文章的狀態篩選、開始新文章按鈕） -->
    <slot />

    <div class="rail-foot">
      <RouterLink to="/">← Blog 首頁</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
@media (max-width: 1100px) {
  .shell-rail .brand .name {
    display: none;
  }
}

/*
 * 樹狀子項視覺（T1「縮排樹」，Yuan 定案）。design source（src/assets/design/*.css）
 * 不可編輯，這裡是唯一放這組樣式的地方。變數（--border-strong / --bg-sub /
 * --muted / --ink / --ease）皆為全站 :root 已定義的 design token，可直接沿用。
 */
.rail-item-toggle {
  width: 100%;
}
.chev {
  margin-left: auto;
  width: 12px;
  height: 12px;
  flex: none;
  color: var(--muted);
  transition: transform 0.3s var(--ease);
}
.chev.open {
  transform: rotate(90deg);
}
.rail-item-toggle.active .chev {
  color: var(--bg);
}

.rail-kids {
  list-style: none;
  margin: 2px 0 4px 20px;
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  animation: shell-rail-kids-in 0.22s var(--ease);
}
.rail-kids::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--border-strong);
}
.rail-kid {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px 7px 16px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--muted);
  position: relative;
  transition: color 0.18s, background 0.18s;
}
.rail-kid::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 9px;
  height: 1px;
  background: var(--border-strong);
}
.rail-kid:hover {
  color: var(--ink);
  background: var(--bg-sub);
}
.rail-kid.on {
  color: var(--ink);
  font-weight: 500;
  background: var(--bg-sub);
}
.rail-kid.danger {
  color: #c54235;
}

@keyframes shell-rail-kids-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
