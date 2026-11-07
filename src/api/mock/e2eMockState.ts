import { resetAuthMockState } from './authMockData'
import { resetArticleVersionStore, resetEditorArticleStore } from './data'
import { simulateExternalArticleUpdate as simulateExternalArticleUpdateState } from './editorMockService'
import { resetBookmarkMockState, seedBookmark as seedBookmarkState } from './bookmarkService'
import { resetArticleLikeMockState, seedArticleLike } from './articleLikeService'
import { resetCommentMockState, seedComment } from './commentService'
import { resetAdminSearchMockState, setMockReindexOutcome as setMockReindexOutcomeState } from './adminMockService'
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
  resetAdminSearchMockState()
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

/** 建立一則頂層留言與其回覆（D3 回覆分頁的 E2E 用）；回覆依序建立，created_at 升冪 */
export async function seedArticleCommentThread(
  articleUuid: string,
  content: string,
  replyContents: string[],
): Promise<void> {
  const parent = await seedComment(articleUuid, content)
  for (const replyContent of replyContents) {
    await seedComment(articleUuid, replyContent, parent.uuid)
  }
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

/** 清除先前註冊的 mockApiFailure（讓「失敗後重試成功」的情境可測） */
export function clearMockApiFailures(): void {
  resetMockApiFailures()
}

/** 模擬別處已修改這篇文章（B2 樂觀鎖衝突）：version 遞增並套用新內容，之後舊 version 存檔得 409／A0208 */
export function simulateExternalArticleUpdate(
  articleUuid: string,
  patch?: { title?: string; summary?: string; content?: string },
): void {
  simulateExternalArticleUpdateState(articleUuid, patch)
}

/** 讓下一次重建搜尋索引的 mock 作業以 FAILED（或預設的 COMPLETED）收場 */
export function setMockReindexOutcome(outcome: 'COMPLETED' | 'FAILED'): void {
  setMockReindexOutcomeState(outcome)
}

export const mockE2E = {
  resetAllMockState,
  seedBookmark,
  seedLike,
  seedArticleComment,
  seedArticleCommentThread,
  seedTagFollow,
  mockApiFailure,
  clearMockApiFailures,
  simulateExternalArticleUpdate,
  setMockReindexOutcome,
}
