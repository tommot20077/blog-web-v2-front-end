import { describe, it, expect, beforeEach } from 'vitest'
import {
  createArticleMock,
  updateArticleMock,
  getArticleForEditMock,
} from './editorMockService'
import { resetEditorArticleStore } from './data'

beforeEach(() => {
  resetEditorArticleStore()
})

describe('editorMockService', () => {
  describe('createArticleMock', () => {
    it('回傳帶有新 uuid 的草稿文章', async () => {
      const result = await createArticleMock({
        title: '新文章標題',
        summary: '文章摘要',
        content: '# Hello',
        coverImageUrl: null,
        categoryIds: ['cat-1'],
        tagNames: ['Vue'],
      })
      expect(result.uuid).toBeTruthy()
      expect(result.title).toBe('新文章標題')
      expect(result.status).toBe('DRAFT')
    })

    it('建立後可以用 uuid 取得文章', async () => {
      const created = await createArticleMock({
        title: '可被查詢的文章',
        summary: '',
        content: '',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      })
      const fetched = await getArticleForEditMock(created.uuid)
      expect(fetched).not.toBeNull()
      expect(fetched?.title).toBe('可被查詢的文章')
    })
  })

  describe('updateArticleMock', () => {
    it('更新已存在的文章', async () => {
      const result = await updateArticleMock('editor-draft-1', {
        title: '更新後的標題',
        summary: '更新摘要',
        content: '# 更新內容',
        coverImageUrl: null,
        categoryIds: ['cat-1'],
        tagNames: ['Vue'],
      })
      expect(result.title).toBe('更新後的標題')
      expect(result.uuid).toBe('editor-draft-1')
    })

    it('更新後保留原始 status', async () => {
      const result = await updateArticleMock('editor-draft-1', {
        title: '標題',
        summary: '',
        content: '',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      })
      expect(result.status).toBe('DRAFT')
    })

    it('找不到文章時拋出錯誤', async () => {
      await expect(
        updateArticleMock('non-existent-uuid', {
          title: '',
          summary: '',
          content: '',
          coverImageUrl: null,
          categoryIds: [],
          tagNames: [],
        })
      ).rejects.toThrow()
    })
  })

  describe('getArticleForEditMock', () => {
    it('回傳既有文章的完整內容', async () => {
      const result = await getArticleForEditMock('editor-draft-1')
      expect(result).not.toBeNull()
      expect(result?.uuid).toBe('editor-draft-1')
      expect(result?.content).toBeTruthy()
    })

    it('找不到時回傳 null', async () => {
      const result = await getArticleForEditMock('no-such-uuid')
      expect(result).toBeNull()
    })
  })
})
