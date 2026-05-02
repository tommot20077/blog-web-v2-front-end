<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    submitLabel?: string
    initialContent?: string
    showCancel?: boolean
  }>(),
  {
    placeholder: '寫下你的想法⋯（Markdown 支援）',
    submitLabel: 'Post',
    initialContent: '',
    showCancel: false
  }
)

const emit = defineEmits<{
  submit: [content: string]
  cancel: []
}>()

const text = ref(props.initialContent)

watch(() => props.initialContent, (v) => {
  text.value = v
})

function submit() {
  if (text.value.trim().length < 3) return
  emit('submit', text.value)
  text.value = ''
}
</script>

<template>
  <form
    class="cm-write"
    data-testid="comment-form"
    @submit.prevent="submit"
  >
    <div class="av" aria-hidden="true" />
    <div class="cm-write-body">
      <textarea
        v-model="text"
        data-testid="comment-textarea"
        :placeholder="placeholder"
        rows="3"
        @keydown.meta.enter.prevent="submit"
        @keydown.ctrl.enter.prevent="submit"
      />
      <div class="row">
        <span class="hint">⌘ + Enter 送出 · 友善至上</span>
        <div class="actions">
          <button
            v-if="showCancel"
            type="button"
            data-testid="comment-cancel"
            class="cancel"
            @click="$emit('cancel')"
          >Cancel</button>
          <button
            type="submit"
            class="submit"
            data-testid="comment-submit"
            :disabled="text.trim().length < 3"
          >{{ submitLabel }}</button>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.cm-write {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}
.av {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-sub, #ededed);
  flex-shrink: 0;
}
.cm-write-body {
  flex: 1;
}
textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  border-radius: 8px;
  resize: vertical;
  font: inherit;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.hint {
  font-size: 12px;
  color: var(--muted, #6b6b70);
}
.actions {
  display: flex;
  gap: 8px;
}
.submit, .cancel {
  padding: 6px 14px;
  border: 1px solid var(--border, rgba(0,0,0,0.15));
  border-radius: 6px;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
