import type { SearchParams, SearchResult } from '../../types/search'
import type { PageResult } from '../../types/editor'

const mockResults: SearchResult[] = [
  {
    articleUuid: 'uuid-1',
    title: 'Vue 3 入門',
    summary: 'Vue 3 的基礎入門教學，涵蓋 Composition API 與響應式系統。',
    slug: 'vue-3-intro',
    authorNickname: 'Author1',
    tagNames: ['Vue', 'Frontend'],
    publishedAt: '2024-01-01T00:00:00Z',
    viewCount: 100,
    likeCount: 10,
  },
  {
    articleUuid: 'uuid-2',
    title: 'TypeScript 進階技巧',
    summary: '深入探討 TypeScript 的型別系統與泛型應用。',
    slug: 'typescript-advanced',
    authorNickname: 'Author2',
    tagNames: ['TypeScript', 'Frontend'],
    publishedAt: '2024-02-01T00:00:00Z',
    viewCount: 200,
    likeCount: 25,
  },
  {
    articleUuid: 'uuid-3',
    title: 'React vs Vue 比較',
    summary: '全面比較 React 與 Vue 的差異與適用場景。',
    slug: 'react-vs-vue',
    authorNickname: 'Author1',
    tagNames: ['React', 'Vue', 'Frontend'],
    publishedAt: '2024-03-01T00:00:00Z',
    viewCount: 350,
    likeCount: 40,
  },
  {
    articleUuid: 'uuid-4',
    title: 'Pinia 狀態管理',
    summary: '使用 Pinia 進行 Vue 3 應用程式的狀態管理。',
    slug: 'pinia-state-management',
    authorNickname: 'Author3',
    tagNames: ['Vue', 'Pinia'],
    publishedAt: '2024-04-01T00:00:00Z',
    viewCount: 150,
    likeCount: 18,
  },
]

const mockHistory = ['Vue 3', 'TypeScript', 'React']

export function searchSearchMock(params: SearchParams): Promise<PageResult<SearchResult>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = params.q?.toLowerCase() ?? ''
      const filtered = q
        ? mockResults.filter(
            r =>
              r.title.toLowerCase().includes(q) ||
              r.summary.toLowerCase().includes(q) ||
              r.tagNames.some(t => t.toLowerCase().includes(q)),
          )
        : [...mockResults]

      const page = params.page ?? 1
      const size = params.size ?? 10
      const total = filtered.length
      const pages = Math.max(1, Math.ceil(total / size))
      const start = (page - 1) * size
      const records = filtered.slice(start, start + size)

      resolve({ records, total, size, current: page, pages })
    }, 200)
  })
}

export function searchSuggestMock(q: string): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lower = q.toLowerCase()
      const suggestions = mockHistory.filter(h => h.toLowerCase().startsWith(lower))
      resolve(suggestions)
    }, 100)
  })
}

export function getSearchHistoryMock(): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockHistory]), 100)
  })
}

export function clearSearchHistoryMock(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 100)
  })
}
