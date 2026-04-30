import { ref } from 'vue'

export function useEditorFocusMode() {
  const isFocusMode = ref(false)

  function toggleFocusMode() { isFocusMode.value = !isFocusMode.value }
  function exitFocusMode() { isFocusMode.value = false }
  function enterFocusMode() { isFocusMode.value = true }

  return { isFocusMode, toggleFocusMode, exitFocusMode, enterFocusMode }
}
