import { describe, it, expect, beforeEach } from 'vitest'
import { listArticleVersionsMock, restoreArticleVersionMock } from './articleVersionMockService'
import { getArticleForEditMock } from './editorMockService'
import { resetArticleVersionStore, resetEditorArticleStore } from './data'

beforeEach(() => {
  resetEditorArticleStore()
  resetArticleVersionStore()
})

describe('articleVersionMockService', () => {
  describe('listArticleVersionsMock', () => {
    it('只回傳該文章的版本，且由新到舊排序', async () => {
      const result = await listArticleVersionsMock('editor-draft-1')

      expect(result.records.map(v => v.uuid)).toEqual([
        'version-draft-1-auto',
        'version-draft-1-outline',
      ])
      expect(result.total).toBe(2)
    })

    it('回傳的 summary 帶 contentLength，不帶 content（對齊 VersionSummaryResponse）', async () => {
      const result = await listArticleVersionsMock('editor-draft-1')

      const first = result.records[0]!
      expect(first.contentLength).toBeGreaterThan(0)
      expect(first).not.toHaveProperty('content')
    })

    it('type 篩選只回傳該類型的版本', async () => {
      const result = await listArticleVersionsMock('editor-draft-1', { type: 'MANUAL' })

      expect(result.records).toHaveLength(1)
      expect(result.records[0]!.type).toBe('MANUAL')
    })

    it('沒有版本的文章回傳空清單而不是錯誤（新建文章的 History tab）', async () => {
      const result = await listArticleVersionsMock('editor-published-1')

      expect(result.records).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('restoreArticleVersionMock', () => {
    it('把快照內容寫回文章本體，之後重抓文章看得到還原後的資料', async () => {
      await restoreArticleVersionMock('editor-draft-1', 'version-draft-1-outline')

      const article = await getArticleForEditMock('editor-draft-1')
      expect(article?.title).toBe('Vue 3 Composition API 草稿（大綱版）')
      expect(article?.content).toContain('## 大綱')
      expect(article?.tags).toEqual(['Vue'])
    })

    it('還原前先留一筆還原前內容的 AUTO stash 快照（對齊後端行為）', async () => {
      const before = await getArticleForEditMock('editor-draft-1')

      await restoreArticleVersionMock('editor-draft-1', 'version-draft-1-outline')

      const versions = await listArticleVersionsMock('editor-draft-1')
      expect(versions.total).toBe(3)
      const stash = versions.records[0]!
      expect(stash.type).toBe('AUTO')
      expect(stash.contentLength).toBe(before!.content.length)
    })

    it('版本不存在時 reject，讓畫面顯示還原失敗', async () => {
      await expect(
        restoreArticleVersionMock('editor-draft-1', 'no-such-version'),
      ).rejects.toThrow(/不存在/)
    })

    it('版本不屬於該文章時 reject（不可跨文章還原）', async () => {
      await expect(
        restoreArticleVersionMock('editor-published-1', 'version-draft-1-outline'),
      ).rejects.toThrow(/不存在/)
    })
  })
})
