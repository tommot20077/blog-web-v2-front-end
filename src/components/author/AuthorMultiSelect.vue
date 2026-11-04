<script setup lang="ts">
/**
 * 作者多選（ARIA combobox + listbox，multiselectable）。
 *
 * - v-model 是 authorUuid 陣列；chip 顯示 nickname，nickname 由元件自行保存 uuid→nickname 對照
 *   （搜尋結果換掉後，已選作者仍要有名字），並以 `update:labels` 回報給父層（例如工具列的作用中篩選）。
 * - 搜尋 300ms debounce；以序號守衛丟棄舊回應（輸入一次就讓在途請求過期）。
 * - 上限沿用 MAX_VALUES_PER_FILTER（後端對 authorUuids 限 20 個，超過回 400）。
 * - 鍵盤：↑↓ 移動、Enter 選取／取消、Esc 關閉（已關則清空輸入）、輸入框為空時 Backspace 刪最後一個。
 *   不使用 label click + readonly + preventDefault 的假 checkbox（FE-05 舊坑：鍵盤無法操作）。
 */
import { ref, computed, nextTick, onBeforeUnmount, useId } from 'vue'
import { authorService, type AuthorSearchItem } from '../../api/authorService'
import { MAX_VALUES_PER_FILTER } from '../../composables/useArticleFilters'

const props = withDefaults(defineProps<{
  modelValue: string[]
  max?: number
}>(), { max: MAX_VALUES_PER_FILTER })

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'update:labels': [labels: Record<string, string>]
}>()

const DEBOUNCE_MS = 300
/** 對齊後端 keyword 上限（trim 後最多 50 字） */
const MAX_KEYWORD_LENGTH = 50

const uid = useId()
const listboxId = `${uid}-listbox`
const optionId = (i: number) => `${uid}-opt-${i}`

const rootRef = ref<HTMLElement | null>(null)
const keyword = ref('')
const isOpen = ref(false)
const options = ref<AuthorSearchItem[]>([])
const activeIndex = ref(-1)
const status = ref<'idle' | 'loading' | 'error' | 'done'>('idle')
const labels = ref<Record<string, string>>({})

let seq = 0
let timer: ReturnType<typeof setTimeout> | null = null
let loadedOnce = false

const selected = computed(() => new Set(props.modelValue))
const atMax = computed(() => props.modelValue.length >= props.max)

function clearTimer() {
  if (timer !== null) { clearTimeout(timer); timer = null }
}

function rememberLabels(items: AuthorSearchItem[]) {
  let changed = false
  const next = { ...labels.value }
  for (const a of items) {
    if (selected.value.has(a.uuid) && next[a.uuid] !== a.nickname) { next[a.uuid] = a.nickname; changed = true }
  }
  if (changed) { labels.value = next; emit('update:labels', next) }
}

async function runSearch(kw: string) {
  const mySeq = ++seq
  status.value = 'loading'
  try {
    const result = await authorService.searchAuthors(kw)
    if (mySeq !== seq) return // 已有較新的輸入或請求：丟棄舊回應
    options.value = result
    activeIndex.value = -1
    status.value = 'done'
    loadedOnce = true
    rememberLabels(result)
  } catch {
    if (mySeq !== seq) return
    options.value = []
    activeIndex.value = -1
    status.value = 'error'
  }
}

function open() {
  isOpen.value = true
  if (!loadedOnce && timer === null && status.value !== 'loading') void runSearch(keyword.value.trim())
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function onInput(e: Event) {
  keyword.value = (e.target as HTMLInputElement).value
  isOpen.value = true
  clearTimer()
  seq++ // 讓在途的舊請求過期
  status.value = 'loading'
  timer = setTimeout(() => {
    timer = null
    void runSearch(keyword.value.trim())
  }, DEBOUNCE_MS)
}

function emitSelection(next: string[]) {
  emit('update:modelValue', next)
}

function toggle(item: AuthorSearchItem) {
  if (selected.value.has(item.uuid)) {
    emitSelection(props.modelValue.filter(u => u !== item.uuid))
    return
  }
  if (atMax.value) return
  labels.value = { ...labels.value, [item.uuid]: item.nickname }
  emit('update:labels', labels.value)
  emitSelection([...props.modelValue, item.uuid])
}

function remove(uuid: string) {
  emitSelection(props.modelValue.filter(u => u !== uuid))
}

function move(delta: 1 | -1) {
  const n = options.value.length
  if (n === 0) return
  activeIndex.value = delta === 1
    ? (activeIndex.value + 1) % n
    : (activeIndex.value <= 0 ? n - 1 : activeIndex.value - 1)
  void nextTick(() => {
    const el = rootRef.value?.querySelector<HTMLElement>(`[id="${optionId(activeIndex.value)}"]`)
    el?.scrollIntoView?.({ block: 'nearest' })
  })
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (!isOpen.value) open()
      else move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!isOpen.value) open()
      else move(-1)
      break
    case 'Enter':
      if (!isOpen.value) break
      e.preventDefault()
      {
        const item = options.value[activeIndex.value]
        if (item) toggle(item)
      }
      break
    case 'Escape':
      if (isOpen.value) {
        e.stopPropagation()
        close()
      } else if (keyword.value) {
        e.stopPropagation()
        keyword.value = ''
        clearTimer()
        loadedOnce = false // 下次開啟重新載入完整清單
      }
      break
    case 'Backspace':
      if (keyword.value === '') {
        const last = props.modelValue[props.modelValue.length - 1]
        if (last !== undefined) remove(last)
      }
      break
  }
}

function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (!next || !rootRef.value?.contains(next)) close()
}

onBeforeUnmount(() => {
  clearTimer()
  seq++
})
</script>

<template>
  <div ref="rootRef" class="ams" @focusout="onFocusOut">
    <div class="ams-field">
      <span v-for="uuid in modelValue" :key="uuid" class="ams-chip">
        <span class="ams-chip-name">{{ labels[uuid] ?? '未知作者' }}</span>
        <button
          type="button"
          class="ams-chip-x"
          :aria-label="`移除 ${labels[uuid] ?? '未知作者'}`"
          @click="remove(uuid)"
        >×</button>
      </span>
      <input
        class="ams-input"
        type="text"
        role="combobox"
        aria-label="搜尋作者"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="listboxId"
        :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
        :maxlength="MAX_KEYWORD_LENGTH"
        :value="keyword"
        placeholder="搜尋作者…"
        autocomplete="off"
        @input="onInput"
        @focus="open"
        @click="open"
        @keydown="onKeydown"
      />
    </div>

    <div v-show="isOpen" class="ams-panel">
      <ul :id="listboxId" class="ams-list" role="listbox" aria-multiselectable="true" aria-label="作者">
        <li
          v-for="(a, i) in options"
          :id="optionId(i)"
          :key="a.uuid"
          role="option"
          class="ams-option"
          :class="{ active: i === activeIndex, selected: selected.has(a.uuid), disabled: !selected.has(a.uuid) && atMax }"
          :aria-selected="selected.has(a.uuid) ? 'true' : 'false'"
          :aria-disabled="!selected.has(a.uuid) && atMax ? 'true' : undefined"
          @mousedown.prevent
          @click="toggle(a)"
        >
          <span class="ams-check" aria-hidden="true">{{ selected.has(a.uuid) ? '✓' : '' }}</span>
          <span class="ams-name">{{ a.nickname }}</span>
          <span class="ams-count">{{ a.publishedArticleCount }} 篇</span>
        </li>
      </ul>
      <p v-if="status === 'loading'" class="ams-msg" role="status">搜尋中…</p>
      <p v-else-if="status === 'error'" class="ams-msg ams-err" role="alert">搜尋失敗，請稍後再試</p>
      <p v-else-if="status === 'done' && options.length === 0" class="ams-msg" role="status">找不到符合的作者</p>
      <p v-if="atMax" class="ams-msg">已達上限（最多 {{ max }} 位）</p>
    </div>
  </div>
</template>

<style scoped>
.ams { position: relative; }
.ams-field {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-sub);
}
.ams-field:focus-within { border-color: var(--accent); }
.ams-chip {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 4px 2px 8px;
  border-radius: 999px; background: color-mix(in oklch, var(--accent) 14%, transparent);
  font-size: 12px; color: var(--ink);
}
.ams-chip-x { border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 4px; }
.ams-chip-x:focus-visible { outline: 2px solid var(--accent); border-radius: 4px; }
.ams-input { flex: 1; min-width: 80px; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: 13px; }
.ams-panel {
  position: absolute; z-index: 20; left: 0; right: 0; margin-top: 4px; max-height: 260px; overflow-y: auto;
  border: 1px solid var(--border); border-radius: 8px; background: var(--bg); box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}
.ams-list { list-style: none; margin: 0; padding: 4px 0; }
.ams-option { display: flex; align-items: center; gap: 8px; padding: 6px 10px; cursor: pointer; font-size: 13px; color: var(--ink); }
.ams-option.active { background: color-mix(in oklch, var(--accent) 12%, transparent); }
.ams-option.disabled { opacity: .45; cursor: not-allowed; }
.ams-check { width: 14px; color: var(--accent); }
.ams-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ams-count { font-family: var(--f-mono); font-size: 10px; color: var(--muted); }
.ams-msg { margin: 0; padding: 8px 10px; font-size: 12px; color: var(--muted); }
.ams-err { color: var(--danger, #c0392b); }
</style>
