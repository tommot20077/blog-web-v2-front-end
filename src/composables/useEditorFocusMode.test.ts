import { describe, it, expect } from 'vitest'
import { useEditorFocusMode } from './useEditorFocusMode'

describe('useEditorFocusMode', () => {
  it('starts with focus mode off', () => {
    const { isFocusMode } = useEditorFocusMode()
    expect(isFocusMode.value).toBe(false)
  })

  it('toggleFocusMode turns it on', () => {
    const { isFocusMode, toggleFocusMode } = useEditorFocusMode()
    toggleFocusMode()
    expect(isFocusMode.value).toBe(true)
  })

  it('toggleFocusMode turns it off when on', () => {
    const { isFocusMode, toggleFocusMode } = useEditorFocusMode()
    toggleFocusMode()
    toggleFocusMode()
    expect(isFocusMode.value).toBe(false)
  })

  it('exitFocusMode turns it off', () => {
    const { isFocusMode, enterFocusMode, exitFocusMode } = useEditorFocusMode()
    enterFocusMode()
    exitFocusMode()
    expect(isFocusMode.value).toBe(false)
  })
})
