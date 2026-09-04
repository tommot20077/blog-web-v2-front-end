import type {
  ListArticleVersionsParams,
  VersionPageResponse,
  VersionSummaryResponse,
} from '../real/articleVersionService'
import { articleVersionStore, editorArticleStore, type MockArticleVersion } from './data'

const MOCK_DELAY = 300

function toSummary(version: MockArticleVersion): VersionSummaryResponse {
  return {
    uuid: version.uuid,
    type: version.type,
    createdAt: version.createdAt,
    contentLength: version.content.length,
    note: version.note,
  }
}

/**
 * 取得文章的版本清單（不含 content，對齊後端 VersionSummaryResponse）。
 * 依 createdAt 由新到舊排序，與後端一致。
 *
 * @param articleUuid 文章 UUID
 * @param params      類型篩選與分頁參數
 * @returns 版本分頁結果
 */
export function listArticleVersionsMock(
  articleUuid: string,
  params: ListArticleVersionsParams = {},
): Promise<VersionPageResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const matched = articleVersionStore
        .filter(v => v.articleUuid === articleUuid)
        .filter(v => !params.type || v.type === params.type)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      const size = params.size ?? 20
      const current = params.page ?? 1
      const start = (current - 1) * size

      resolve({
        records: matched.slice(start, start + size).map(toSummary),
        total: matched.length,
        current,
        size,
        pages: Math.ceil(matched.length / size),
      })
    }, MOCK_DELAY)
  })
}

/**
 * 還原文章至指定版本快照。
 *
 * 對齊後端 VersioningService.restore()：還原前先把當前內容存成一筆 AUTO 快照（stash），
 * 再把快照內容寫回文章本體；分類不在還原範圍內（ArticleVersion 沒有多對多分類）。
 * 端點本身回 Void，畫面要拿還原後的資料得重抓文章。
 *
 * @param articleUuid 文章 UUID
 * @param versionUuid 版本 UUID
 */
export function restoreArticleVersionMock(articleUuid: string, versionUuid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const version = articleVersionStore.find(
        v => v.uuid === versionUuid && v.articleUuid === articleUuid,
      )
      if (!version) {
        reject(new Error(`版本 ${versionUuid} 不存在`))
        return
      }
      const index = editorArticleStore.findIndex(a => a.uuid === articleUuid)
      if (index === -1) {
        reject(new Error(`文章 ${articleUuid} 不存在`))
        return
      }

      const current = editorArticleStore[index]!
      const now = new Date().toISOString()

      articleVersionStore.push({
        uuid: `version-auto-${Date.now()}`,
        articleUuid,
        type: 'AUTO',
        createdAt: now,
        note: null,
        title: current.title,
        content: current.content,
        summary: current.summary,
        coverImageUrl: current.coverImageUrl,
        status: current.status,
        tagNames: [...current.tags],
      })

      editorArticleStore[index] = {
        ...current,
        title: version.title,
        content: version.content,
        summary: version.summary,
        coverImageUrl: version.coverImageUrl,
        status: version.status,
        tags: [...version.tagNames],
        updatedAt: now,
      }
      resolve()
    }, MOCK_DELAY)
  })
}
