import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import CommentSection from './CommentSection.vue'
import { commentService } from '../../api/commentService'
import type { CommentItem } from '../../types/comment'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ fullPath: '/articles/a' }),
  RouterLink: { props: ['to'], template: '<a :href="to" @click.prevent><slot /></a>' },
}))
vi.mock('../../api/commentService')

function comment(uuid: string, parentUuid: string | null, extra: Partial<CommentItem> = {}): CommentItem {
  return {
    uuid, parentUuid, content: uuid, contentHtml: `<p>${uuid}</p>`,
    author: { uuid: 'u1', nickname: 'Alice', avatarUrl: null },
    likeCount: 0, liked: false, createdAt: '2026-05-01T10:00:00Z', editedAt: null,
    deleted: false, deletedByRole: null, ...extra,
  }
}
const replies = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => comment(`reply-${from + i}`, 'p1'))
const pageOf = (records: CommentItem[], total: number) => ({ records, total, size: 20, current: 1, pages: 1 })

function mockList(replyCount: number) {
  vi.mocked(commentService.list).mockResolvedValue({
    topLevels: {
      records: [comment('p1', null, { replyCount, replies: replies(1, Math.min(3, replyCount)) })],
      total: 1, page: 1, size: 20,
    },
    totalCommentCount: 1 + replyCount,
  })
}

describe('CommentSection 回覆分頁（D3）', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('5 則回覆：先顯示 3 則與載入更多，點擊後顯示全部 5 則、不重複，按鈕消失', async () => {
    mockList(5)
    vi.mocked(commentService.listReplies).mockResolvedValue(pageOf(replies(1, 5), 5))
    render(CommentSection, { props: { articleUuid: 'a' } })

    const btn = await screen.findByTestId('comment-replies-load-more')
    expect(btn.textContent).toContain('剩 2 則')
    expect(screen.getAllByTestId('comment-item')).toHaveLength(1 + 3)

    await fireEvent.click(btn)

    await waitFor(() => expect(screen.getAllByTestId('comment-item')).toHaveLength(1 + 5))
    const ids = screen.getAllByTestId('comment-item').map(el => el.getAttribute('data-comment-uuid'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(screen.queryByTestId('comment-replies-load-more')).toBeNull()
  })

  it('載入失敗 → 顯示錯誤並可重試，重試成功後顯示全部', async () => {
    mockList(5)
    vi.mocked(commentService.listReplies)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(pageOf(replies(1, 5), 5))
    render(CommentSection, { props: { articleUuid: 'a' } })

    await fireEvent.click(await screen.findByTestId('comment-replies-load-more'))
    expect(await screen.findByTestId('comment-replies-error')).toBeTruthy()
    expect(screen.getAllByTestId('comment-item')).toHaveLength(1 + 3)

    await fireEvent.click(screen.getByTestId('comment-replies-load-more'))
    await waitFor(() => expect(screen.getAllByTestId('comment-item')).toHaveLength(1 + 5))
    expect(screen.queryByTestId('comment-replies-error')).toBeNull()
  })
})
