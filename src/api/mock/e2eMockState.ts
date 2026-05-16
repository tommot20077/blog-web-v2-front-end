import { resetAuthMockState } from './authMockData'
import { resetEditorArticleStore } from './data'
import { resetBookmarkMockState, seedBookmark as seedBookmarkState } from './bookmarkService'
import { resetArticleLikeMockState, seedArticleLike } from './articleLikeService'
import { resetCommentMockState, seedComment } from './commentService'
import { resetTagMockState, seedFollowedTag } from './tagMockService'

export function resetAllMockState(): void {
  resetAuthMockState()
  resetEditorArticleStore()
  resetBookmarkMockState()
  resetArticleLikeMockState()
  resetCommentMockState()
  resetTagMockState()
}

export function seedBookmark(articleUuid: string): void {
  seedBookmarkState(articleUuid)
}

export function seedLike(articleUuid: string): void {
  seedArticleLike(articleUuid)
}

export async function seedArticleComment(articleUuid: string, content: string): Promise<void> {
  await seedComment(articleUuid, content)
}

export function seedTagFollow(tagUuid: string): void {
  seedFollowedTag(tagUuid)
}

export const mockE2E = {
  resetAllMockState,
  seedBookmark,
  seedLike,
  seedArticleComment,
  seedTagFollow,
}
