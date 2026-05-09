import apiClient from '../apiClient'

export const articleLikeService = {
  async like(uuid: string): Promise<void> {
    await apiClient.post(`/api/v1/articles/${uuid}/like`)
  },
  async unlike(uuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/articles/${uuid}/like`)
  },
}
