const likedArticles = new Set<string>()

export function resetArticleLikeMockState(): void {
  likedArticles.clear()
}

export function seedArticleLike(uuid: string): void {
  likedArticles.add(uuid)
}

export function isArticleLiked(uuid: string): boolean {
  return likedArticles.has(uuid)
}

export const articleLikeService = {
  async like(uuid: string): Promise<void> {
    likedArticles.add(uuid)
  },
  async unlike(uuid: string): Promise<void> {
    likedArticles.delete(uuid)
  },
  isLiked: isArticleLiked,
}
