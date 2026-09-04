import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import type { Page } from '@playwright/test'
import { EditorPage } from './editor.page'

// EditorPage 的選擇器若指向 EditorView 已不存在的 class，e2e job 要跑滿 actionTimeout
// 才會紅（且要等 20 分鐘的 e2e job）。這裡用假的 Page 記錄 page object 實際建立的
// 選擇器，再與 EditorView.vue 的實際渲染對照，讓這種漂移在 unit 階段就被攔下。
interface SelectorCall {
  by: string
  value: string
}

function createFakePage(): Page {
  const make = (by: string) => (value: string | RegExp): SelectorCall => ({ by, value: String(value) })
  return {
    getByTestId: make('testid'),
    getByTitle: make('title'),
    getByPlaceholder: make('placeholder'),
    locator: make('css'),
  } as unknown as Page
}

describe('EditorPage（e2e page object）與 EditorView 的選擇器契約', () => {
  const editorViewSource = readFileSync('src/views/EditorView.vue', 'utf8')

  it('字數顯示以 data-testid="editor-word-count" 定位，且該 testid 真的被 EditorView 渲染', () => {
    const editorPage = new EditorPage(createFakePage())

    expect(editorPage.wordCount).toEqual({ by: 'testid', value: 'editor-word-count' })
    expect(editorViewSource).toContain('data-testid="editor-word-count"')
  })

  it('不再以已被移除的 .editor-word-count class 定位字數', () => {
    const pageObjectSource = readFileSync('e2e/pages/editor.page.ts', 'utf8')

    expect(pageObjectSource).not.toContain('.editor-word-count')
    expect(editorViewSource).not.toContain('class="editor-word-count"')
  })
})
