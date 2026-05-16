<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Highlight, UpdateHighlightRequest } from '../../api/highlightService'

const props = defineProps<{
  highlights: Highlight[]
  locatedByHighlightUuid: Map<string, boolean>
  isLoading: boolean
  isMutating: boolean
  loadError?: boolean
}>()

const emit = defineEmits<{
  update: [uuid: string, request: UpdateHighlightRequest]
  delete: [uuid: string]
  retry: []
}>()

const colors = ['#FFEB3B', '#C8E6C9', '#BBDEFB']
const noteDrafts = ref<Record<string, string>>({})
const dirtyNoteUuids = ref<Set<string>>(new Set())

watch(
  () => props.highlights,
  (highlights) => {
    const next: Record<string, string> = {}
    const nextDirtyUuids = new Set<string>()

    for (const highlight of highlights) {
      const incomingNote = highlight.note ?? ''
      if (dirtyNoteUuids.value.has(highlight.uuid)) {
        const draftNote = noteDrafts.value[highlight.uuid] ?? incomingNote
        next[highlight.uuid] = draftNote
        if (draftNote !== incomingNote) nextDirtyUuids.add(highlight.uuid)
      } else {
        next[highlight.uuid] = incomingNote
      }
    }

    noteDrafts.value = next
    dirtyNoteUuids.value = nextDirtyUuids
  },
  { immediate: true },
)

function isLocated(uuid: string) {
  return props.locatedByHighlightUuid.get(uuid) !== false
}

function markNoteDirty(uuid: string) {
  dirtyNoteUuids.value = new Set(dirtyNoteUuids.value).add(uuid)
}

function saveNote(uuid: string) {
  emit('update', uuid, { note: noteDrafts.value[uuid] ?? '' })
}
</script>

<template>
  <section class="article-highlight-panel" data-testid="article-highlight-panel">
    <div class="highlight-panel-head">
      <h2>我的劃線</h2>
      <span>{{ highlights.length }}</span>
    </div>

    <p v-if="isLoading" class="highlight-empty">載入劃線中...</p>
    <div v-else-if="loadError" class="highlight-error-state" role="alert">
      <p>劃線載入失敗</p>
      <button type="button" @click="emit('retry')">重新載入劃線</button>
    </div>
    <p v-else-if="highlights.length === 0" class="highlight-empty">尚未建立劃線</p>

    <article
      v-for="highlight in highlights"
      :key="highlight.uuid"
      class="highlight-card"
      :style="{ borderColor: highlight.color }"
    >
      <p class="highlight-snippet">{{ highlight.snippet }}</p>
      <p v-if="!isLocated(highlight.uuid)" class="highlight-warning">正文位置已變更</p>

      <div class="highlight-colors">
        <button
          v-for="(color, index) in colors"
          :key="color"
          type="button"
          class="highlight-color"
          :class="{ active: highlight.color === color }"
          :style="{ backgroundColor: color }"
          :aria-label="`選擇劃線顏色 ${color}`"
          :aria-pressed="highlight.color === color"
          :data-testid="`highlight-panel-color-${highlight.uuid}-${index}`"
          :disabled="isMutating"
          @click="emit('update', highlight.uuid, { color })"
        />
      </div>

      <textarea
        v-model="noteDrafts[highlight.uuid]"
        class="highlight-note"
        maxlength="2000"
        aria-label="劃線筆記"
        :disabled="isMutating"
        @input="markNoteDirty(highlight.uuid)"
      />

      <div class="highlight-actions">
        <button
          type="button"
          :data-testid="`highlight-note-save-${highlight.uuid}`"
          :disabled="isMutating"
          @click="saveNote(highlight.uuid)"
        >
          儲存 note
        </button>
        <button
          type="button"
          :data-testid="`highlight-delete-${highlight.uuid}`"
          :disabled="isMutating"
          @click="emit('delete', highlight.uuid)"
        >
          刪除
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.article-highlight-panel {
  max-width: 68ch;
  margin: 40px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--divider);
}
.highlight-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.highlight-panel-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.highlight-empty {
  color: var(--muted);
  font-size: 14px;
}
.highlight-error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #c54235;
  border-radius: 8px;
  color: #c54235;
  font-size: 14px;
}
.highlight-error-state p {
  margin: 0;
}
.highlight-error-state button {
  border: 1px solid currentColor;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 6px 10px;
  cursor: pointer;
}
.highlight-card {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: 8px;
  background: var(--bg-sub);
}
.highlight-snippet {
  margin: 0 0 8px;
  color: var(--ink);
}
.highlight-warning {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
}
.highlight-colors {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.highlight-color {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}
.highlight-color.active {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
.highlight-note {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--ink);
  padding: 8px;
  resize: vertical;
}
.highlight-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
