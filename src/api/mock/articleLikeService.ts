import {
  isArticleLiked,
  removeArticleLike,
  resetArticleLikeState,
  seedArticleLike,
} from './articleInteractionMockState'

export function resetArticleLikeMockState(): void {
  resetArticleLikeState()
}

export const articleLikeService = {
  async like(uuid: string): Promise<void> {
    seedArticleLike(uuid)
  },
  async unlike(uuid: string): Promise<void> {
    removeArticleLike(uuid)
  },
  isLiked: isArticleLiked,
}

export { seedArticleLike, isArticleLiked }
