const likedArticleIds = new Set<string>()
const bookmarkedArticleIds = new Set<string>()

export function resetArticleLikeState(): void {
  likedArticleIds.clear()
}

export function seedArticleLike(uuid: string): void {
  likedArticleIds.add(uuid)
}

export function removeArticleLike(uuid: string): void {
  likedArticleIds.delete(uuid)
}

export function isArticleLiked(uuid: string): boolean {
  return likedArticleIds.has(uuid)
}

export function resetBookmarkState(): void {
  bookmarkedArticleIds.clear()
}

export function seedArticleBookmark(uuid: string): void {
  bookmarkedArticleIds.add(uuid)
}

export function removeArticleBookmark(uuid: string): void {
  bookmarkedArticleIds.delete(uuid)
}

export function isArticleBookmarked(uuid: string): boolean {
  return bookmarkedArticleIds.has(uuid)
}
