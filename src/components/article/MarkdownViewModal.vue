<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { copyToClipboard } from './clipboard'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { showToast } = useToast()

// 記住開啟前的捲動位置，卸載時恢復，避免彈窗打斷閱讀進度。
let savedScrollY = 0

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

function handleOverlayClick() {
  emit('close')
}

async function copyAll() {
  const copied = await copyToClipboard(props.content)
  if (copied) {
    showToast('已複製全文', 'success')
  } else {
    showToast('複製失敗，請稍後再試', 'error')
  }
}

onMounted(() => {
  savedScrollY = window.scrollY
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
  window.scrollTo({ top: savedScrollY, left: 0, behavior: 'auto' })
})
</script>

<template>
  <div
    class="mvm-overlay"
    data-testid="markdown-view-modal-overlay"
    @click.self="handleOverlayClick"
  >
    <div class="mvm-panel" data-testid="markdown-view-modal">
      <header class="mvm-header">
        <span class="mvm-title mono">Markdown 原始檔</span>
        <div class="mvm-actions">
          <button
            class="mvm-copy-btn"
            data-testid="markdown-view-modal-copy"
            @click="copyAll"
          >
            複製全文
          </button>
          <button
            class="mvm-close-btn"
            aria-label="關閉"
            title="關閉"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </header>
      <pre class="mvm-content" data-testid="markdown-view-modal-content">{{ content }}</pre>
    </div>
  </div>
</template>

<style scoped>
.mvm-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}
.mvm-panel {
  width: min(760px, 100%);
  max-height: min(80vh, 720px);
  display: flex;
  flex-direction: column;
  background: var(--surface, #fff);
  border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.mvm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.1));
}
.mvm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mvm-copy-btn {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  background: var(--bg-sub, #ededed);
  cursor: pointer;
}
.mvm-copy-btn:hover {
  background: var(--surface, #fbfbfb);
}
.mvm-close-btn {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
}
.mvm-close-btn:hover {
  opacity: 1;
}
.mvm-content {
  margin: 0;
  padding: 20px;
  overflow: auto;
  font-family: var(--f-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
