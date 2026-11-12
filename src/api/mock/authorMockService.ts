import type { AuthorSearchItem, PublicProfile } from '../real/authorService'
import { allMockArticles } from './data'
import { MOCK_AUTHOR_PROFILES, mockAuthorUuid } from './profiles'

/** 對齊後端 PublicAuthorService.MAX_AUTHORS／MAX_KEYWORD_LENGTH */
const MAX_AUTHORS = 20
const MAX_KEYWORD_LENGTH = 50

/** mock 作者的公開頁補充欄位（profiles.ts 只有 nickname／tagline） */
const PROFILE_EXTRAS: Record<string, Pick<PublicProfile, 'location' | 'website' | 'socialLinks' | 'joinedAt'>> = {
  Yuan: {
    location: 'Frontend · Taipei',
    website: 'https://example.com',
    socialLinks: { github: 'tommot20077', twitter: '@yuanluca_dev', linkedin: null },
    joinedAt: '2023-08-15T10:00:00',
  },
  Han: {
    location: 'Backend · Taichung',
    website: null,
    socialLinks: { github: 'han-liu', twitter: null, linkedin: null },
    joinedAt: '2023-10-02T09:30:00',
  },
  Mira: {
    location: 'Design · Tainan',
    website: null,
    socialLinks: { github: null, twitter: 'mira_design', linkedin: 'mira-huang' },
    joinedAt: '2024-05-20T08:00:00',
  },
  Chen: {
    location: null,
    website: null,
    socialLinks: { github: null, twitter: null, linkedin: null },
    joinedAt: '2024-09-09T12:00:00',
  },
}

/** ACTIVE 但沒有已發布文章的作者：作者頁可開（統計為 0），但不會出現在作者搜尋 */
const NEWBIE: PublicProfile = {
  uuid: mockAuthorUuid('Newbie'),
  nickname: 'Newbie',
  avatarUrl: null,
  bio: '剛加入，還沒有發表文章。',
  location: null,
  website: null,
  socialLinks: { github: null, twitter: null, linkedin: null },
  joinedAt: '2026-10-01T00:00:00',
  stats: { publishedArticleCount: 0, totalViewCount: 0, totalLikeCount: 0 },
}

function statsOf(uuid: string): PublicProfile['stats'] {
  const mine = allMockArticles.filter(a => a.authorUuid === uuid)
  return {
    publishedArticleCount: mine.length,
    totalViewCount: mine.reduce((s, a) => s + a.viewCount, 0),
    totalLikeCount: mine.reduce((s, a) => s + a.likeCount, 0),
  }
}

/** 由文章 mock 推導的作者清單（uuid 規則與 data.ts 共用 mockAuthorUuid） */
function authorsWithArticles(): AuthorSearchItem[] {
  return Object.values(MOCK_AUTHOR_PROFILES)
    .map(p => {
      const uuid = mockAuthorUuid(p.nickname)
      return { uuid, nickname: p.nickname, avatarUrl: null, publishedArticleCount: statsOf(uuid).publishedArticleCount }
    })
    .filter(a => a.publishedArticleCount > 0)
}

const delay = 200

/**
 * 對齊 GET /api/v1/authors：trim、不分大小寫、任意位置比對（% _ 當字面）、最多 20 筆、
 * 排序為篇數 DESC → nickname 不分大小寫 ASC → uuid ASC；trim 後超過 50 字視為 400。
 */
export function searchAuthorsMock(keyword: string): Promise<AuthorSearchItem[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const kw = (keyword ?? '').trim()
      if ([...kw].length > MAX_KEYWORD_LENGTH) {
        reject(new Error('keyword 過長'))
        return
      }
      const needle = kw.toLowerCase()
      const list = authorsWithArticles()
        .filter(a => needle === '' || a.nickname.toLowerCase().includes(needle))
        .sort((a, b) =>
          b.publishedArticleCount - a.publishedArticleCount ||
          a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase()) ||
          (a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0))
        .slice(0, MAX_AUTHORS)
      resolve(list)
    }, delay)
  })
}

/** 對齊 GET /api/v1/users/{uuid}/profile：不存在 → null（real 版對應 404 A0101） */
export function getProfileMock(uuid: string): Promise<PublicProfile | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (uuid === NEWBIE.uuid) {
        resolve({ ...NEWBIE })
        return
      }
      const entry = Object.values(MOCK_AUTHOR_PROFILES).find(p => mockAuthorUuid(p.nickname) === uuid)
      if (!entry) {
        resolve(null)
        return
      }
      const extras = PROFILE_EXTRAS[entry.nickname] ?? {
        location: null, website: null, socialLinks: { github: null, twitter: null, linkedin: null }, joinedAt: '2024-01-01T00:00:00',
      }
      resolve({
        uuid,
        nickname: entry.nickname,
        avatarUrl: null,
        bio: entry.tagline,
        ...extras,
        stats: statsOf(uuid),
      })
    }, delay)
  })
}
