import { describe, it, expect, beforeEach } from 'vitest'
import {
  createArticleMock,
  updateArticleMock,
  getArticleForEditMock,
  simulateExternalArticleUpdate,
} from './editorMockService'
import { resetEditorArticleStore } from './data'
import { mockApiFailure, resetMockApiFailures } from './mockApiFailureState'

beforeEach(() => {
  resetEditorArticleStore()
  resetMockApiFailures()
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

    it('請求已經在飛行中才註冊失敗時，該次請求仍然成功', async () => {
      const inFlight = createArticleMock({
        title: '飛行中的文章',
        summary: '',
        content: '',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      })
      mockApiFailure('/api/v1/articles', { message: '建立失敗' }, 500)

      await expect(inFlight).resolves.toMatchObject({ title: '飛行中的文章' })
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

    it('請求已經在飛行中才註冊失敗時，該次請求仍然成功', async () => {
      const inFlight = updateArticleMock('editor-draft-1', {
        title: '飛行中更新的標題',
        summary: '',
        content: '',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      })
      mockApiFailure('/api/v1/articles/editor-draft-1', { message: '更新失敗' }, 500)

      await expect(inFlight).resolves.toMatchObject({ title: '飛行中更新的標題' })
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

  describe('B2：樂觀鎖 version', () => {
    const payload = {
      title: '存檔標題', summary: '', content: '', coverImageUrl: null, categoryIds: [], tagNames: [],
    }

    it('既有文章帶 version，建立的新文章也帶 version', async () => {
      expect((await getArticleForEditMock('editor-draft-1'))?.version).toEqual(expect.any(Number))
      const created = await createArticleMock(payload)
      expect(created.version).toEqual(expect.any(Number))
    })

    it('version 相符的存檔成功，回應帶遞增後的新 version', async () => {
      const before = (await getArticleForEditMock('editor-draft-1'))!.version
      const saved = await updateArticleMock('editor-draft-1', { ...payload, version: before })
      expect(saved.version).toBe(before + 1)
      expect((await getArticleForEditMock('editor-draft-1'))!.version).toBe(before + 1)
    })

    it('沒帶 version 時不比對（相容舊前端），仍遞增', async () => {
      const before = (await getArticleForEditMock('editor-draft-1'))!.version
      const saved = await updateArticleMock('editor-draft-1', payload)
      expect(saved.version).toBe(before + 1)
    })

    it('version 與目前不一致時拒絕：HTTP 409、錯誤碼 A0208，且不改動文章', async () => {
      const before = (await getArticleForEditMock('editor-draft-1'))!
      const err = await updateArticleMock('editor-draft-1', { ...payload, version: before.version + 5 })
        .catch((e: unknown) => e) as Error & { status?: number; code?: string }
      expect(err).toBeInstanceOf(Error)
      expect(err.status).toBe(409)
      expect(err.code).toBe('A0208')
      const after = (await getArticleForEditMock('editor-draft-1'))!
      expect(after.title).toBe(before.title)
      expect(after.version).toBe(before.version)
    })

    it('simulateExternalArticleUpdate 模擬別處改動：version 遞增並套用內容，之後舊 version 存檔得到 409', async () => {
      const before = (await getArticleForEditMock('editor-draft-1'))!.version
      simulateExternalArticleUpdate('editor-draft-1', { title: '別處改的標題' })
      const after = (await getArticleForEditMock('editor-draft-1'))!
      expect(after.version).toBe(before + 1)
      expect(after.title).toBe('別處改的標題')
      await expect(updateArticleMock('editor-draft-1', { ...payload, version: before })).rejects.toMatchObject({
        code: 'A0208',
      })
    })
  })
})
