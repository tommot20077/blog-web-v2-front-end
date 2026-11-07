import type { PageResult } from './editor'

export interface AuthorSummary {
  uuid: string
  nickname: string
  avatarUrl: string | null
}

export interface CommentItem {
  uuid: string
  parentUuid: string | null
  content: string
  contentHtml: string
  author: AuthorSummary | null
  likeCount: number
  liked: boolean
  createdAt: string
  editedAt: string | null
  deleted: boolean
  deletedByRole: 'AUTHOR' | 'ADMIN' | null
  /**
   * 未刪除回覆的總數（僅頂層留言有意義；回覆為 0）。
   * 列表 API 的 `replies` 最多只帶前 3 則，`replyCount > replies.length` 代表還有更多（D3）。
   */
  replyCount?: number
  replies?: CommentItem[]
}

export interface CreateCommentRequest {
  content: string
  parentUuid?: string
}

export interface EditCommentRequest {
  content: string
}

export interface ArticleCommentList {
  topLevels: PageResult<CommentItem>
  totalCommentCount: number
}
