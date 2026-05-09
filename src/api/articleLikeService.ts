export interface ArticleLikeService {
  like(uuid: string): Promise<void>
  unlike(uuid: string): Promise<void>
}

export const articleLikeService: ArticleLikeService = {
  async like(uuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleLikeService: svc } = await import('./mock/articleLikeService')
      return svc.like(uuid)
    }
    const { articleLikeService: svc } = await import('./real/articleLikeService')
    return svc.like(uuid)
  },
  async unlike(uuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleLikeService: svc } = await import('./mock/articleLikeService')
      return svc.unlike(uuid)
    }
    const { articleLikeService: svc } = await import('./real/articleLikeService')
    return svc.unlike(uuid)
  },
}
