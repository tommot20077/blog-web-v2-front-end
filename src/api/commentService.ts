import type { PageResult } from '../types/editor'
import type {
  ArticleCommentList,
  CommentItem,
  CreateCommentRequest,
  EditCommentRequest,
} from '../types/comment'

export interface CommentService {
  list(
    articleUuid: string,
    page: number,
    size: number,
    sort: 'newest' | 'oldest',
  ): Promise<ArticleCommentList>
  /** 頂層留言的回覆分頁（載入更多，D3）；page 從 1 起，依建立時間升冪 */
  listReplies(parentUuid: string, page: number, size: number): Promise<PageResult<CommentItem>>
  create(articleUuid: string, req: CreateCommentRequest): Promise<CommentItem>
  edit(uuid: string, req: EditCommentRequest): Promise<CommentItem>
  delete(uuid: string): Promise<void>
  like(uuid: string): Promise<void>
  unlike(uuid: string): Promise<void>
}

export const commentService: CommentService = {
  async list(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.list(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.list(...args)
  },
  async listReplies(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.listReplies(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.listReplies(...args)
  },
  async create(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.create(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.create(...args)
  },
  async edit(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.edit(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.edit(...args)
  },
  async delete(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.delete(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.delete(...args)
  },
  async like(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.like(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.like(...args)
  },
  async unlike(...args) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { commentService: svc } = await import('./mock/commentService')
      return svc.unlike(...args)
    }
    const { commentService: svc } = await import('./real/commentService')
    return svc.unlike(...args)
  },
}
