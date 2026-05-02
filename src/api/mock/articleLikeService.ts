const likedArticles = new Set<string>()

export const articleLikeService = {
  async like(uuid: string): Promise<void> {
    likedArticles.add(uuid)
  },
  async unlike(uuid: string): Promise<void> {
    likedArticles.delete(uuid)
  },
}
