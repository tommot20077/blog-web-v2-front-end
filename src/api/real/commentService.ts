import apiClient from '../apiClient'
import type {
  ArticleCommentList,
  CommentItem,
  CreateCommentRequest,
  EditCommentRequest,
} from '../../types/comment'

export const commentService = {
  async list(
    articleUuid: string,
    page: number,
    size: number,
    sort: 'newest' | 'oldest',
  ): Promise<ArticleCommentList> {
    return await apiClient.get<unknown, ArticleCommentList>(
      `/api/v1/articles/${articleUuid}/comments`,
      { params: { page, size, sort } },
    )
  },

  async create(articleUuid: string, req: CreateCommentRequest): Promise<CommentItem> {
    return await apiClient.post<unknown, CommentItem>(
      `/api/v1/articles/${articleUuid}/comments`,
      req,
    )
  },

  async edit(uuid: string, req: EditCommentRequest): Promise<CommentItem> {
    return await apiClient.put<unknown, CommentItem>(`/api/v1/comments/${uuid}`, req)
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/comments/${uuid}`)
  },

  async like(uuid: string): Promise<void> {
    await apiClient.post(`/api/v1/comments/${uuid}/like`)
  },

  async unlike(uuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/comments/${uuid}/like`)
  },
}
