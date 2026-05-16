import type {
  ArticleCommentList,
  CommentItem,
  CreateCommentRequest,
  EditCommentRequest,
} from '../../types/comment'

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
    const records = sorted.slice(start, start + size).map(c => ({
      ...c,
      replies: all.filter(r => r.parentUuid === c.uuid),
    }))
    return {
      topLevels: { records, total: topLevels.length, page, size },
      // 對齊 backend CommentService.countByArticle 行為：
      // 計入所有 top-level（含 deleted tombstone）+ active reply，排除 deleted reply
      totalCommentCount: all.filter(c => !c.parentUuid || !c.deleted).length,
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

export async function seedComment(articleUuid: string, content: string): Promise<CommentItem> {
  return commentService.create(articleUuid, { content })
}
