<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { TocEntry } from '../../types/article'

// 文章章節導覽（TOC）側欄。
// 純展示元件：不自行捲動、不碰路由，點擊時只 emit 錨點 id，交由呼叫端（ArticleDetail）處理。
const props = defineProps<{
  toc: TocEntry[]
  activeId?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

// 超過此則數才啟動自動收合分組；<= 則維持平鋪呈現（與改版前行為一致）。
const COLLAPSE_THRESHOLD = 8

interface TocGroup {
  entry: TocEntry
  children: TocEntry[]
}

// 把每個 h3 歸到「前一個 h2」底下成組。防禦性處理：若清單最前面就出現 h3
// （理論上不該發生的異常 markdown 標題順序），該 h3 自成一組，不拋錯、不遺漏。
const groups = computed<TocGroup[]>(() => {
  const result: TocGroup[] = []
  for (const entry of props.toc) {
    const last = result[result.length - 1]
    if (entry.level === 3 && last) {
      last.children.push(entry)
    } else {
      result.push({ entry, children: [] })
    }
  }
  return result
})

const isCollapsible = computed(() => props.toc.length > COLLAPSE_THRESHOLD)

function groupHasActive(group: TocGroup): boolean {
  if (group.entry.id === props.activeId) return true
  return group.children.some((child) => child.id === props.activeId)
}

// 使用者手動點 caret 展開/收合的覆寫狀態，key 為該組代表項（h2）的 id。
// 只要沒被手動覆寫過，展開與否就跟著「目前 active 是否落在這一組」走。
const manualOverrides = reactive<Record<string, boolean>>({})

function isGroupOpen(group: TocGroup): boolean {
  const override = manualOverrides[group.entry.id]
  if (override !== undefined) return override
  return groupHasActive(group)
}

function toggleGroup(group: TocGroup) {
  manualOverrides[group.entry.id] = !isGroupOpen(group)
}
</script>

<template>
  <nav
    v-if="toc.length > 0"
    class="article-toc"
    aria-label="文章章節導覽"
    data-testid="article-toc"
  >
    <div class="toc-label">On this page</div>

    <!-- <= 8 項：平鋪呈現，行為與改版前一致 -->
    <ul v-if="!isCollapsible" class="toc-list">
      <li
        v-for="entry in toc"
        :key="entry.id"
        class="toc-item"
        :class="{ 'toc-item--h3': entry.level === 3 }"
        :data-testid="`toc-entry-${entry.id}`"
      >
        <button
          type="button"
          class="toc-link"
          :class="{ active: entry.id === activeId }"
          :aria-current="entry.id === activeId ? 'true' : undefined"
          :data-testid="`toc-link-${entry.id}`"
          @click="emit('select', entry.id)"
        >
          {{ entry.text }}
        </button>
      </li>
    </ul>

    <!-- > 8 項：依 h2 分組，只展開 activeId 所在的組，其餘收合 -->
    <ul v-else class="toc-list">
      <li
        v-for="group in groups"
        :key="group.entry.id"
        class="toc-group"
        :data-testid="`toc-entry-${group.entry.id}`"
      >
        <button
          type="button"
          class="toc-link toc-link--group"
          :class="{ active: group.entry.id === activeId }"
          :aria-current="group.entry.id === activeId ? 'true' : undefined"
          :data-testid="`toc-link-${group.entry.id}`"
          @click="emit('select', group.entry.id)"
        >
          <span class="toc-link-text">{{ group.entry.text }}</span>
          <span
            v-if="group.children.length > 0"
            class="toc-caret"
            :class="{ 'toc-caret--open': isGroupOpen(group) }"
            :data-testid="`toc-caret-${group.entry.id}`"
            @click.stop="toggleGroup(group)"
          />
          <span
            v-if="group.children.length > 0 && !isGroupOpen(group)"
            class="toc-count"
            :data-testid="`toc-count-${group.entry.id}`"
          >{{ group.children.length }}</span>
        </button>

        <ul v-if="group.children.length > 0 && isGroupOpen(group)" class="toc-kids">
          <li
            v-for="child in group.children"
            :key="child.id"
            class="toc-item toc-item--h3"
            :data-testid="`toc-entry-${child.id}`"
          >
            <button
              type="button"
              class="toc-link"
              :class="{ active: child.id === activeId }"
              :aria-current="child.id === activeId ? 'true' : undefined"
              :data-testid="`toc-link-${child.id}`"
              @click="emit('select', child.id)"
            >
              {{ child.text }}
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* 導軌骨架 + 無標記（N1）+ 自動收合（G）。刻意不加容器外框（不要 border/background），
   視覺重量全部交給導軌線本身，層級只靠縮排與字級，不加編號/圓點/破折號。 */
.toc-label {
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted-2);
  margin-bottom: 14px;
}
.toc-list,
.toc-kids {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc-list {
  border-left: 1px solid var(--border);
}
.toc-kids {
  border-left: 1px solid var(--border);
  margin-left: 16px;
}
.toc-item,
.toc-group {
  margin: 0;
}
.toc-link {
  display: block;
  width: 100%;
  margin-left: -1px;
  padding: 8px 12px 8px 16px;
  border: none;
  border-left: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s var(--ease), border-color 0.2s var(--ease);
}
.toc-item--h3 > .toc-link,
.toc-kids .toc-link {
  padding-left: 30px;
  font-size: 12.5px;
  color: var(--muted-2);
}
.toc-link:hover {
  color: var(--ink-2);
}
.toc-link.active {
  color: var(--ink);
  font-weight: 600;
  border-left-color: var(--ink);
}
.toc-link--group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toc-link-text {
  flex: 1;
  min-width: 0;
}
.toc-caret {
  position: relative;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  opacity: 0.5;
  transition: transform 0.2s var(--ease), opacity 0.2s var(--ease);
}
.toc-caret::before {
  content: '';
  position: absolute;
  inset: 0;
  border-right: 1.4px solid currentColor;
  border-bottom: 1.4px solid currentColor;
  transform: rotate(-45deg) scale(0.7);
}
.toc-caret--open {
  transform: rotate(90deg);
}
.toc-link.active .toc-caret {
  opacity: 0.8;
}
.toc-count {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--muted-2);
  flex-shrink: 0;
}
</style>
