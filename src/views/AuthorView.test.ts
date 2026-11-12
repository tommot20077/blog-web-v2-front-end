import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithRouterAsync, createMockArticle, createMockPageResult } from '../test-utils'
import AuthorView from './AuthorView.vue'
import { articleService } from '../api/articleService'
import { authorService } from '../api/authorService'
import type { PublicProfile } from '../api/authorService'

vi.mock('../api/articleService', () => ({
  articleService: { getArticles: vi.fn() },
}))
vi.mock('../api/authorService', () => ({
  authorService: { getProfile: vi.fn(), searchAuthors: vi.fn() },
}))

const getArticles = vi.mocked(articleService.getArticles)
const getProfile = vi.mocked(authorService.getProfile)

const UUID = '6000a366-357c-44a3-950c-c3131c420919'

function profile(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    uuid: UUID,
    nickname: 'Yuan Luca',
    avatarUrl: null,
    bio: '我的簡介',
    location: 'Frontend · Taipei',
    website: 'https://profile.example.com',
    socialLinks: { github: 'octocat', twitter: null, linkedin: null },
    joinedAt: '2023-08-15T10:00:00',
    stats: { publishedArticleCount: 2, totalViewCount: 20, totalLikeCount: 6 },
    ...overrides,
  }
}

async function renderAuthor(path = `/author/${UUID}`) {
  const r = await renderWithRouterAsync(AuthorView, {}, path)
  await flushPromises()
  return r
}

describe('AuthorView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProfile.mockResolvedValue(profile())
    getArticles.mockResolvedValue(createMockPageResult([
      createMockArticle({ uuid: 'a1', title: '第一篇' }),
      createMockArticle({ uuid: 'a2', title: '第二篇' }),
    ], { size: 12, total: 2, pages: 1 }))
  })

  describe('資料來源', () => {
    it('以路由的 uuid 取 profile；文章用 authorUuids 篩選、每頁 12 筆，不再以 size=200 拉全量', async () => {
      await renderAuthor()
      expect(getProfile).toHaveBeenCalledWith(UUID)
      expect(getArticles).toHaveBeenCalledWith(1, 12, '全部', '', { authorUuids: [UUID] })
      expect(getArticles.mock.calls.every(c => c[1] !== 200)).toBe(true)
    })

    it('顯示 nickname、location（職稱行）、bio', async () => {
      const { container } = await renderAuthor()
      expect(container.querySelector('[data-testid="author-name"]')?.textContent).toBe('Yuan Luca')
      expect(container.querySelector('.ap-role')?.textContent).toContain('Frontend · Taipei')
      expect(container.querySelector('.ap-bio')?.textContent).toBe('我的簡介')
    })

    it('沒有 location 時不渲染職稱行', async () => {
      getProfile.mockResolvedValue(profile({ location: null }))
      const { container } = await renderAuthor()
      expect(container.querySelector('.ap-role')).toBeNull()
    })

    it.each([
      ['2023-08-15T10:00:00', '2023 · Q3'],
      ['2026-11-04T02:51:18.014632', '2026 · Q4'],
      ['2024-01-01T00:00:00', '2024 · Q1'],
      ['2024-06-30T23:59:59', '2024 · Q2'],
    ])('joinedAt %s → %s', async (joinedAt, expected) => {
      getProfile.mockResolvedValue(profile({ joinedAt }))
      const { container } = await renderAuthor()
      expect(container.querySelector('.ap-eyebrow')?.textContent).toContain(expected)
    })

    it('統計數字取自 profile.stats，不是已載入的文章', async () => {
      getProfile.mockResolvedValue(profile({ stats: { publishedArticleCount: 37, totalViewCount: 4200, totalLikeCount: 99 } }))
      const { container } = await renderAuthor()
      const stats = Array.from(container.querySelectorAll('.ap-stat b')).map(e => e.textContent)
      expect(stats).toEqual(['37', '4200', '99'])
    })
  })

  describe('404／錯誤', () => {
    it('profile 不存在（getProfile 回 null）→ 顯示「找不到這位作者」，且不去取文章', async () => {
      getProfile.mockResolvedValue(null)
      await renderAuthor()
      expect(screen.getByText('找不到這位作者')).toBeInTheDocument()
      expect(getArticles).not.toHaveBeenCalled()
    })

    it('其他失敗（5xx、網路）→ 顯示載入失敗與重試，不可說成「找不到這位作者」', async () => {
      getProfile.mockRejectedValueOnce(new Error('boom'))
      await renderAuthor()
      expect(screen.queryByText('找不到這位作者')).toBeNull()
      expect(screen.getByRole('alert').textContent).toContain('載入失敗')

      await fireEvent.click(screen.getByRole('button', { name: '重試' }))
      await flushPromises()
      expect(screen.getByTestId('author-name')).toHaveTextContent('Yuan Luca')
    })
  })

  describe('文章區', () => {
    it('有文章：顯示卡片，標題連到文章頁', async () => {
      await renderAuthor()
      expect(screen.getByRole('link', { name: '第一篇' }).getAttribute('href')).toBe('/articles/a1')
      expect(screen.getAllByTestId('author-articles').length).toBe(1)
    })

    it('沒有文章 → 顯示「尚未發表文章」，個人資料仍顯示', async () => {
      getArticles.mockResolvedValue(createMockPageResult([], { total: 0, pages: 0 }))
      getProfile.mockResolvedValue(profile({ stats: { publishedArticleCount: 0, totalViewCount: 0, totalLikeCount: 0 } }))
      await renderAuthor()
      expect(screen.getByText('尚未發表文章')).toBeInTheDocument()
      expect(screen.getByTestId('author-name')).toHaveTextContent('Yuan Luca')
    })

    it('pages <= 1 時不顯示分頁', async () => {
      await renderAuthor()
      expect(screen.queryByRole('button', { name: '下一頁' })).toBeNull()
    })

    it('多頁：第一頁「上一頁」停用；點下一頁以 page=2 取文章，並可回上一頁', async () => {
      getArticles.mockResolvedValue(createMockPageResult([createMockArticle({ uuid: 'p1', title: 'P1' })], { total: 30, pages: 3 }))
      await renderAuthor()
      expect(screen.getByText('第 1 / 3 頁')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '上一頁' })).toBeDisabled()

      getArticles.mockResolvedValue(createMockPageResult([createMockArticle({ uuid: 'p2', title: 'P2' })], { total: 30, pages: 3, current: 2 }))
      await fireEvent.click(screen.getByRole('button', { name: '下一頁' }))
      await flushPromises()
      expect(getArticles).toHaveBeenLastCalledWith(2, 12, '全部', '', { authorUuids: [UUID] })
      expect(screen.getByText('第 2 / 3 頁')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'P2' })).toBeInTheDocument()

      await fireEvent.click(screen.getByRole('button', { name: '上一頁' }))
      await flushPromises()
      expect(getArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { authorUuids: [UUID] })
    })

    it('翻頁失敗後按重試 → 重載失敗的那一頁（不是舊頁）', async () => {
      getArticles.mockResolvedValue(createMockPageResult([createMockArticle({ uuid: 'p1', title: 'P1' })], { total: 30, pages: 3 }))
      await renderAuthor()
      getArticles.mockRejectedValueOnce(new Error('boom'))
      await fireEvent.click(screen.getByRole('button', { name: '下一頁' }))
      await flushPromises()
      expect(screen.getByText('文章載入失敗')).toBeInTheDocument()

      getArticles.mockResolvedValue(createMockPageResult([createMockArticle({ uuid: 'p2', title: 'P2' })], { total: 30, pages: 3, current: 2 }))
      await fireEvent.click(screen.getByRole('button', { name: '重試' }))
      await flushPromises()
      expect(getArticles).toHaveBeenLastCalledWith(2, 12, '全部', '', { authorUuids: [UUID] })
      expect(screen.getByText('第 2 / 3 頁')).toBeInTheDocument()
    })

    it('最後一頁「下一頁」停用', async () => {
      getArticles.mockResolvedValue(createMockPageResult([createMockArticle()], { total: 24, pages: 2 }))
      await renderAuthor()
      await fireEvent.click(screen.getByRole('button', { name: '下一頁' }))
      await flushPromises()
      expect(screen.getByRole('button', { name: '下一頁' })).toBeDisabled()
    })

    it('文章請求失敗 → 顯示文章載入失敗，不會顯示「尚未發表文章」', async () => {
      getArticles.mockRejectedValue(new Error('boom'))
      await renderAuthor()
      expect(screen.queryByText('尚未發表文章')).toBeNull()
      expect(screen.getByText('文章載入失敗')).toBeInTheDocument()
    })
  })

  describe('website 與社群連結（XSS／網址注入）', () => {
    it('javascript: website 不渲染成連結', async () => {
      getProfile.mockResolvedValue(profile({ website: 'javascript:alert(1)' }))
      const { container } = await renderAuthor()
      expect(container.querySelector('a[href^="javascript"]')).toBeNull()
      expect(container.querySelector('[data-testid="author-website"]')).toBeNull()
    })

    it.each(['data:text/html,x', 'ftp://example.com', '//evil.com', 'https://u:p@evil.com'])('website %s 不渲染', async (website) => {
      getProfile.mockResolvedValue(profile({ website }))
      const { container } = await renderAuthor()
      expect(container.querySelector('[data-testid="author-website"]')).toBeNull()
    })

    it.each(['https:evil.com', 'http:/\\evil', 'https:/evil.com'])('website %j 不渲染成連結（會被解析成本站相對路徑）', async (w) => {
      getProfile.mockResolvedValue(profile({ website: w }))
      await renderAuthor()
      expect(screen.queryByTestId('author-website')).toBeNull()
    })

    it('https website 的 href 使用 URL 正規化後的值', async () => {
      getProfile.mockResolvedValue(profile({ website: 'HTTPS://Profile.Example.com' }))
      await renderAuthor()
      expect(screen.getByTestId('author-website').getAttribute('href')).toBe('https://profile.example.com/')
    })

    it('https website 渲染成外部連結，帶 noopener noreferrer', async () => {
      const { container } = await renderAuthor()
      const a = container.querySelector('[data-testid="author-website"]') as HTMLAnchorElement
      expect(a.getAttribute('href')).toBe('https://profile.example.com/') // safeWebsite 回傳 new URL().href（正規化，補根路徑斜線）
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toContain('noopener')
      expect(a.getAttribute('rel')).toContain('noreferrer')
    })

    it('社群連結以固定前綴＋encodeURIComponent 組網址（中文、特殊字元已編碼）', async () => {
      getProfile.mockResolvedValue(profile({
        socialLinks: { github: '王小明', twitter: '@user', linkedin: 'a?b#c' },
      }))
      const { container } = await renderAuthor()
      const hrefs = Array.from(container.querySelectorAll('.ap-social-link')).map(a => a.getAttribute('href'))
      expect(hrefs).toEqual([
        `https://github.com/${encodeURIComponent('王小明')}`,
        'https://x.com/user',
        'https://www.linkedin.com/in/a%3Fb%23c',
      ])
    })

    it('未填（null）或不合格的 handle 不渲染；後端若回網址形式也不信任', async () => {
      getProfile.mockResolvedValue(profile({
        socialLinks: { github: 'https://evil.com/x', twitter: null, linkedin: 'javascript:alert(1)' },
      }))
      const { container } = await renderAuthor()
      expect(container.querySelectorAll('.ap-social-link')).toHaveLength(0)
      expect(container.querySelector('a[href^="javascript"]')).toBeNull()
    })

    it('未知平台 key 不產生連結（也不顯示）', async () => {
      getProfile.mockResolvedValue(profile({
        socialLinks: { github: null, twitter: null, linkedin: null, mastodon: 'yuan' },
      }))
      const { container } = await renderAuthor()
      expect(container.querySelectorAll('.ap-social-link')).toHaveLength(0)
      expect(container.textContent).not.toContain('mastodon')
    })

    it('外部連結一律 target=_blank 且 rel 含 noopener', async () => {
      const { container } = await renderAuthor()
      for (const a of Array.from(container.querySelectorAll('a[target="_blank"]'))) {
        expect(a.getAttribute('rel')).toContain('noopener')
      }
    })
  })

  describe('路由切換', () => {
    it('/author/:uuid 變更時重新載入該作者，並回到第 1 頁', async () => {
      const { router } = await renderAuthor()
      getProfile.mockResolvedValue(profile({ uuid: 'other', nickname: 'Other' }))
      await router.push('/author/other')
      await flushPromises()
      expect(getProfile).toHaveBeenLastCalledWith('other')
      expect(getArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { authorUuids: ['other'] })
      expect(screen.getByTestId('author-name')).toHaveTextContent('Other')
    })

    it('快速切換作者時，較晚抵達的舊回應被丟棄', async () => {
      let resolveOld!: (p: PublicProfile | null) => void
      getProfile.mockReturnValueOnce(new Promise(r => { resolveOld = r }))
      const { router } = await renderWithRouterAsync(AuthorView, {}, '/author/old')
      getProfile.mockResolvedValue(profile({ uuid: 'new', nickname: 'New' }))
      await router.push('/author/new')
      await flushPromises()
      resolveOld(profile({ uuid: 'old', nickname: 'Old' }))
      await flushPromises()
      expect(screen.getByTestId('author-name')).toHaveTextContent('New')
    })
  })
})
