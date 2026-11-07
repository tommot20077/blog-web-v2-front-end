import { resetAuthMockState } from './authMockData'
import { resetArticleVersionStore, resetEditorArticleStore } from './data'
import { simulateExternalArticleUpdate as simulateExternalArticleUpdateState } from './editorMockService'
import { resetBookmarkMockState, seedBookmark as seedBookmarkState } from './bookmarkService'
import { resetArticleLikeMockState, seedArticleLike } from './articleLikeService'
import { resetCommentMockState, seedComment } from './commentService'
import { resetTagMockState, seedFollowedTag } from './tagMockService'
import {
  mockApiFailure as mockApiFailureState,
  resetMockApiFailures,
  type MockApiFailureBody,
  type MockApiFailurePattern,
} from './mockApiFailureState'

export function resetAllMockState(): void {
  resetAuthMockState()
  resetEditorArticleStore()
  resetArticleVersionStore()
  resetBookmarkMockState()
  resetArticleLikeMockState()
  resetCommentMockState()
  resetTagMockState()
  resetMockApiFailures()
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

export function mockApiFailure(
  urlPattern: MockApiFailurePattern,
  body?: MockApiFailureBody,
  status?: number,
): void {
  mockApiFailureState(urlPattern, body, status)
}

/** 模擬別處已修改這篇文章（B2 樂觀鎖衝突）：version 遞增並套用新內容，之後舊 version 存檔得 409／A0208 */
export function simulateExternalArticleUpdate(
  articleUuid: string,
  patch?: { title?: string; summary?: string; content?: string },
): void {
  simulateExternalArticleUpdateState(articleUuid, patch)
}

export const mockE2E = {
  resetAllMockState,
  seedBookmark,
  seedLike,
  seedArticleComment,
  seedTagFollow,
  mockApiFailure,
  simulateExternalArticleUpdate,
}
