<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { fileService } from '../../api/fileService'
import { tagSuggestService } from '../../api/tagSuggestService'
import { useToast } from '../../composables/useToast'
import type { CategoryOption } from '../../types/editor'
import type { OutlineItem } from '../../composables/useEditorOutline'

const props = defineProps<{
  summary: string
  coverImageUrl: string | null
  categoryIds: string[]
  tagNames: string[]
  categories: CategoryOption[]
  outline: OutlineItem[]
  activeHeadingLineIndex: number
}>()

const emit = defineEmits<{
  'update:summary': [value: string]
  'update:coverImageUrl': [value: string | null]
  'update:categoryIds': [value: string[]]
  'update:tagNames': [value: string[]]
  'jump-to-line': [lineIndex: number]
}>()

const metaTab = ref<'meta' | 'outline'>('meta')

// ── 標籤 ──────────────────────────────────────────────────────────────────
const tagInput = ref('')
const tagSuggestions = ref<{ name: string; articleCount: number }[]>([])
let suggestTimer: ReturnType<typeof setTimeout> | null = null

function onTagInput() {
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = setTimeout(async () => {
    if (tagInput.value.trim()) {
      tagSuggestions.value = await tagSuggestService.suggestTags(tagInput.value.trim())
    } else {
      tagSuggestions.value = []
    }
  }, 300)
}

onUnmounted(() => {
  if (suggestTimer) clearTimeout(suggestTimer)
})

function addTag(name: string) {
  const trimmed = name.trim()
  if (!trimmed || props.tagNames.includes(trimmed)) return
  emit('update:tagNames', [...props.tagNames, trimmed])
  tagInput.value = ''
  tagSuggestions.value = []
}

function removeTag(name: string) {
  emit('update:tagNames', props.tagNames.filter(t => t !== name))
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag(tagInput.value)
  }
}

// ── 分類 ──────────────────────────────────────────────────────────────────
function toggleCategory(id: string) {
  const current = [...props.categoryIds]
  const idx = current.indexOf(id)
  if (idx === -1) {
    current.push(id)
  } else {
    current.splice(idx, 1)
  }
  emit('update:categoryIds', current)
}

// ── 封面圖 ────────────────────────────────────────────────────────────────
const isUploading = ref(false)
const uploadError = ref('')
const { showToast } = useToast()

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  isUploading.value = true
  uploadError.value = ''
  try {
    const result = await fileService.uploadFile(file, 'ARTICLE_COVER')
    emit('update:coverImageUrl', result.url)
  } catch (err) {
    const message = err instanceof Error ? err.message : '請稍後再試'
    uploadError.value = '上傳失敗：' + message
    showToast('上傳失敗：' + message, 'error')
  } finally {
    isUploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <aside class="w-72 shrink-0 flex flex-col p-4 bg-white/60 backdrop-blur-md border-l border-white/80 dark:bg-white/8 dark:border-white/15 overflow-y-auto">

    <!-- Meta / Outline tabs -->
    <div class="meta-tabs">
      <button
        type="button"
        class="meta-tab-btn"
        :class="{ active: metaTab === 'meta' }"
        @click="metaTab = 'meta'"
      >Meta</button>
      <button
        type="button"
        class="meta-tab-btn"
        :class="{ active: metaTab === 'outline' }"
        @click="metaTab = 'outline'"
      >Outline</button>
    </div>

    <div v-show="metaTab === 'meta'" class="flex flex-col gap-4">

      <!-- 封面圖 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">封面圖</p>
        <div
          v-if="coverImageUrl"
          class="relative rounded-xl overflow-hidden mb-2"
        >
          <img data-testid="cover-preview" :src="coverImageUrl" alt="封面圖預覽" class="w-full h-32 object-cover" />
          <button
            type="button"
            class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            @click="emit('update:coverImageUrl', null)"
          >✕</button>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <span
            class="px-3 py-1.5 rounded-full text-sm bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            :class="{ 'opacity-60 cursor-not-allowed': isUploading }"
          >
            {{ isUploading ? '上傳中...' : '上傳封面' }}
          </span>
          <input
            data-testid="cover-upload-input"
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="isUploading"
            @change="onFileChange"
          />
        </label>
        <p v-if="uploadError" class="text-xs text-red-500 mt-1">{{ uploadError }}</p>
      </section>

      <!-- 分類 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">分類</p>
        <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
          <label
            v-for="cat in categories"
            :key="cat.id"
            class="flex items-center gap-2 cursor-pointer text-sm hover:text-[var(--accent)] transition-colors"
          >
            <input
              type="checkbox"
              :name="cat.name"
              :aria-label="cat.name"
              :checked="categoryIds.includes(cat.id)"
              class="rounded"
              @change="toggleCategory(cat.id)"
            />
            {{ cat.name }}
          </label>
        </div>
      </section>

      <!-- 標籤 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">標籤</p>
        <!-- 已加標籤 -->
        <div v-if="tagNames.length" class="flex flex-wrap gap-1 mb-2">
          <span
            v-for="tag in tagNames"
            :key="tag"
            class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 border border-white/80 text-xs"
          >
            {{ tag }}
            <button
              type="button"
              :title="`移除 ${tag}`"
              class="text-gray-400 hover:text-red-500 transition-colors"
              @click="removeTag(tag)"
            >✕</button>
          </span>
        </div>
        <!-- 輸入框 -->
        <div class="relative">
          <input
            v-model="tagInput"
            type="text"
            placeholder="輸入標籤後按 Enter"
            class="w-full px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/10 border border-white/80 dark:border-white/15 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            @input="onTagInput"
            @keydown="onTagKeydown"
          />
          <!-- 建議列表 -->
          <ul
            v-if="tagSuggestions.length"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg text-sm overflow-hidden"
          >
            <li
              v-for="sug in tagSuggestions"
              :key="sug.name"
              class="px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="addTag(sug.name)"
            >
              {{ sug.name }}
              <span class="text-xs text-gray-400 ml-1">{{ sug.articleCount }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 摘要 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">摘要</p>
        <textarea
          :value="summary"
          placeholder="文章摘要..."
          rows="4"
          class="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/10 border border-white/80 dark:border-white/15 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          @input="emit('update:summary', ($event.target as HTMLTextAreaElement).value)"
        />
      </section>

    </div>

    <!-- Outline tab -->
    <div v-show="metaTab === 'outline'" class="outline-panel">
      <p v-if="outline.length === 0" class="outline-empty">文章還沒有標題</p>
      <ul v-else class="outline-list">
        <li
          v-for="item in outline"
          :key="item.lineIndex"
          class="outline-item"
          :class="[`outline-level-${item.level}`, { active: activeHeadingLineIndex === item.lineIndex }]"
          @click="emit('jump-to-line', item.lineIndex)"
        >
          {{ item.text }}
        </li>
      </ul>
    </div>

  </aside>
</template>

<style scoped>
.meta-tabs { display: flex; gap: 4px; padding: 8px 4px 4px; border-bottom: 1px solid var(--divider); margin-bottom: 8px; }
.meta-tab-btn { flex: 1; padding: 5px 8px; border-radius: 6px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); transition: all 0.15s; }
.meta-tab-btn.active { background: var(--ink); color: var(--bg); }
.outline-panel { flex: 1; overflow-y: auto; padding: 4px 0; }
.outline-empty { font-size: 12px; color: var(--muted-2); padding: 16px 8px; text-align: center; }
.outline-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
.outline-item { font-size: 12.5px; color: var(--muted); padding: 6px 10px; border-radius: 6px; cursor: pointer; line-height: 1.4; transition: all 0.12s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.outline-item:hover { background: var(--bg-sub); color: var(--ink); }
.outline-item.active { background: var(--bg-sub); color: var(--accent); }
.outline-level-1 { padding-left: 10px; font-weight: 500; }
.outline-level-2 { padding-left: 22px; }
.outline-level-3 { padding-left: 34px; }
</style>
