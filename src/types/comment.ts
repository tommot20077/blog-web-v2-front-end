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
  topLevels: { records: CommentItem[]; total: number; page: number; size: number }
  totalCommentCount: number
}
