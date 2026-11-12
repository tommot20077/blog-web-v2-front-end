<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { RouterLink } from 'vue-router'

/**
 * RailBase — 左側導覽 rail 的無狀態呈現基座（presentational base）
 *
 * 從 `ShellRail.vue` 抽出（Task A3）：版面呈現、樹狀子項展開/收合、
 * 768px 站名收窄行為統一收斂在這裡；不碰路由，選取子項只 emit
 * `select-child`。導覽資料（哪些項目、目前 active、樹狀子項內容）
 * 一律由呼叫端（`ShellRail`、未來的 `AdminRail`）提供並組合。
 */

interface RailBaseItemChild {
  id: string
  label: string
  /** 危險操作子項（例如刪除帳號）套用強調色 */
  danger?: boolean
}

interface RailBaseItem {
  key: string
  label: string
  to: string
  /** 樹狀子項；未提供或空陣列時該項目維持一般連結 */
  children?: RailBaseItemChild[]
}

const props = withDefaults(
  defineProps<{
    /** 導覽項目清單 */
    items: RailBaseItem[]
    /** 目前作用中的項目 key */
    active?: string
    /** 目前作用中的子項 id（由呼叫端掌握，對應高亮顯示） */
    activeChildId?: string
    /** data-testid 前綴，衍生出各項目/子項的 testid */
    testIdPrefix?: string
    brandTo?: string
    brandLabel?: string
    /** 品牌連結 data-testid；未提供時預設 `${testIdPrefix}-logo` */
    brandTestId?: string
    sectionLabel?: string
    footTo?: string
    footLabel?: string
  }>(),
  {
    active: '',
    testIdPrefix: 'rail',
    brandTo: '/',
    brandLabel: '',
    brandTestId: undefined,
    sectionLabel: 'NAVIGATE',
    footTo: '/',
    footLabel: '',
  },
)

const emit = defineEmits<{
  (e: 'select-child', id: string): void
}>()

const resolvedBrandTestId = computed(() => props.brandTestId ?? `${props.testIdPrefix}-logo`)

function hasChildren(item: RailBaseItem): boolean {
  return (item.children?.length ?? 0) > 0
}

function kidsId(key: string): string {
  return `${props.testIdPrefix}-${key}-kids`
}

// 展開狀態：每個項目各自一把，初始值＝掛載當下是否為 active（沿用 ShellRail
// 舊行為：只在「目前就在該分頁」時預設展開，離開後不強制收合；使用者仍可
// 手動收合/展開）。項目清單本身在單一 rail 實例存續期間視為固定。
const expandedMap = reactive<Record<string, boolean>>({})
for (const item of props.items) {
  expandedMap[item.key] = item.key === props.active
}

watch(
  () => props.active,
  (key) => {
    if (key && key in expandedMap) {
      expandedMap[key] = true
    }
  },
)

function toggleExpanded(key: string) {
  expandedMap[key] = !expandedMap[key]
}

function selectChild(id: string) {
  emit('select-child', id)
}
</script>

<template>
  <nav class="shell-rail" :data-testid="testIdPrefix">
    <RouterLink :to="brandTo" class="brand" :data-testid="resolvedBrandTestId">
      <span class="mark" />
      <span class="name">{{ brandLabel }}</span>
    </RouterLink>

    <span class="rail-section">{{ sectionLabel }}</span>
    <template v-for="item in items" :key="item.key">
      <RouterLink
        v-if="!hasChildren(item)"
        :to="item.to"
        class="rail-item"
        :class="{ active: active === item.key }"
        :data-testid="`${testIdPrefix}-link-${item.key}`"
      >
        {{ item.label }}
      </RouterLink>

      <template v-else>
        <button
          type="button"
          class="rail-item rail-item-toggle"
          :class="{ active: active === item.key }"
          :aria-expanded="expandedMap[item.key]"
          :aria-controls="kidsId(item.key)"
          :data-testid="`${testIdPrefix}-toggle-${item.key}`"
          @click="toggleExpanded(item.key)"
        >
          {{ item.label }}
          <svg class="chev" :class="{ open: expandedMap[item.key] }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <ul
          v-show="expandedMap[item.key]"
          :id="kidsId(item.key)"
          class="rail-kids"
          role="group"
          :aria-label="`${item.label}子選單`"
          :data-testid="kidsId(item.key)"
        >
          <li v-for="kid in item.children" :key="kid.id">
            <button
              type="button"
              class="rail-kid"
              :class="{ on: kid.id === activeChildId, danger: kid.danger }"
              :tabindex="expandedMap[item.key] ? 0 : -1"
              :data-testid="`${testIdPrefix}-kid-${kid.id}`"
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
      <RouterLink :to="footTo">{{ footLabel }}</RouterLink>
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
