import { createMockApiFailureError, getMockApiFailure } from './mockApiFailureState'
import type { PageResult } from '../../types/editor'
import type {
  ArticleCommentList,
  CommentItem,
  CreateCommentRequest,
  EditCommentRequest,
} from '../../types/comment'

/** 與後端一致：列表每則頂層只內嵌前 3 則回覆，其餘用 listReplies 載入 */
const EMBEDDED_REPLY_LIMIT = 3

const store = new Map<string, CommentItem[]>()
let nextId = 1

function genUuid(): string {
  return `mock-comment-${nextId++}`
}

function getList(articleUuid: string): CommentItem[] {
  if (!store.has(articleUuid)) store.set(articleUuid, [])
  return store.get(articleUuid)!
}

export function resetCommentMockState(): void {
  store.clear()
  nextId = 1
}

// mock 模擬後端 markdown→HTML pipeline 的最簡版：escape + 包 <p>
// 防 mock/dev 模式下用戶輸入直接被 v-html 渲染造成 XSS
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const commentService = {
  async list(
    articleUuid: string,
    page: number,
    size: number,
    sort: 'newest' | 'oldest',
  ): Promise<ArticleCommentList> {
    const all = getList(articleUuid)
    const topLevels = all.filter(c => !c.parentUuid)
    const sorted = [...topLevels].sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    )
    const start = (page - 1) * size
    const records = sorted.slice(start, start + size).map(c => {
      // 後端不回已刪除的回覆（replyCount 與分頁都只算未刪除）
      const activeReplies = all.filter(r => r.parentUuid === c.uuid && !r.deleted)
      return {
        ...c,
        replyCount: activeReplies.length,
        replies: activeReplies.slice(0, EMBEDDED_REPLY_LIMIT),
      }
    })
    return {
      topLevels: { records, total: topLevels.length, page, size },
      // 對齊 backend（B5）：未刪除的留言數（頂層加回覆），不含任何已刪除留言，包括頂層墓碑佔位。
      // 因此可能小於列表實際顯示的列數（墓碑仍會出現在列表中）
      totalCommentCount: all.filter(c => !c.deleted).length,
    }
  },

  async listReplies(parentUuid: string, page: number, size: number): Promise<PageResult<CommentItem>> {
    // mockApiFailure 在呼叫當下判定（E2E 用來模擬回覆載入失敗）
    const failure = getMockApiFailure(`/api/v1/comments/${parentUuid}/replies?page=${page}&size=${size}`)
    if (failure) throw createMockApiFailureError(failure)
    // 父留言不存在或傳入的是回覆 uuid → 200 + 空頁（對齊後端，不洩漏存在性）
    const siblings = [...store.values()].find(list => list.some(c => c.uuid === parentUuid && !c.parentUuid))
    const active = siblings ? siblings.filter(r => r.parentUuid === parentUuid && !r.deleted) : []
    const start = (page - 1) * size
    return {
      records: active.slice(start, start + size),
      total: active.length,
      size,
      current: page,
      pages: size > 0 ? Math.ceil(active.length / size) : 0,
    }
  },

  async create(articleUuid: string, req: CreateCommentRequest): Promise<CommentItem> {
    const list = getList(articleUuid)
    const item: CommentItem = {
      uuid: genUuid(),
      parentUuid: req.parentUuid ?? null,
      content: req.content,
      contentHtml: `<p>${escapeHtml(req.content)}</p>`,
      author: {
        uuid: 'mock-user',
        nickname: 'Mock User',
        avatarUrl: null,
      },
      likeCount: 0,
      liked: false,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deleted: false,
      deletedByRole: null,
    }
    list.push(item)
    return item
  },

  async edit(uuid: string, req: EditCommentRequest): Promise<CommentItem> {
    for (const list of store.values()) {
      const item = list.find(c => c.uuid === uuid)
      if (item) {
        item.content = req.content
        item.contentHtml = `<p>${req.content}</p>`
        item.editedAt = new Date().toISOString()
        return item
      }
    }
    throw new Error('comment not found')
  },

  async delete(uuid: string): Promise<void> {
    for (const list of store.values()) {
      const item = list.find(c => c.uuid === uuid)
      if (item) {
        item.deleted = true
        item.deletedByRole = 'AUTHOR'
        item.author = null
        return
      }
    }
  },

  async like(uuid: string): Promise<void> {
    for (const list of store.values()) {
      const item = list.find(c => c.uuid === uuid)
      if (item && !item.liked) {
        item.liked = true
        item.likeCount += 1
      }
      if (item) return
    }
  },

  async unlike(uuid: string): Promise<void> {
    for (const list of store.values()) {
      const item = list.find(c => c.uuid === uuid)
      if (item && item.liked) {
        item.liked = false
        item.likeCount = Math.max(0, item.likeCount - 1)
      }
      if (item) return
    }
  },
}

export async function seedComment(
  articleUuid: string,
  content: string,
  parentUuid?: string,
): Promise<CommentItem> {
  return commentService.create(articleUuid, { content, parentUuid })
}
