import type { BackendPageResult } from '../utils'
import type { ListSeriesRequest, SeriesSummary } from '../real/seriesService'
import { MOCK_AUTHOR_PROFILES } from './profiles'

// 模擬連載 series 清單。對齊後端 GET /api/v1/series 的分頁封包（BackendPageResult）。
// 不含「進度 / 已完結 / ONGOING」概念——後端 SeriesSummary 沒有 status 欄位，
// 這裡只給標題、描述、文章數等可顯示資訊。
const yuan = MOCK_AUTHOR_PROFILES.yuan.nickname
const han = MOCK_AUTHOR_PROFILES.han.nickname
const mira = MOCK_AUTHOR_PROFILES.mira.nickname

const allMockSeries: SeriesSummary[] = [
  {
    uuid: 'series-1',
    title: 'Vue 3 響應式系統內部',
    slug: 'vue-reactivity-internals',
    description: '從 reactive、ref 到 computed 的完整解剖，一篇一篇拆給你看。',
    coverImageUrl: null,
    author: { uuid: 'author-yuan', nickname: yuan, avatarUrl: null },
    articleCount: 6,
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2026-02-18T00:00:00Z',
  },
  {
    uuid: 'series-2',
    title: '從 Java 跳 Go 的工程筆記',
    slug: 'java-to-go-notes',
    description: '型別系統、併發模型、工具鏈——遷移一年的真實取捨紀錄。',
    coverImageUrl: null,
    author: { uuid: 'author-han', nickname: han, avatarUrl: null },
    articleCount: 4,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    uuid: 'series-3',
    title: 'Design System 落地實錄',
    slug: 'design-system-in-practice',
    description: 'Token、字型、動效——把一套設計系統真的接進產線的過程。',
    coverImageUrl: null,
    author: { uuid: 'author-mira', nickname: mira, avatarUrl: null },
    articleCount: 3,
    createdAt: '2025-10-12T00:00:00Z',
    updatedAt: '2026-03-02T00:00:00Z',
  },
]

export function listSeriesMock(params: ListSeriesRequest = {}): Promise<BackendPageResult<SeriesSummary>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const size = params.size ?? 20
      resolve({
        records: allMockSeries.slice(0, size),
        current: params.page ?? 1,
        size,
        pages: 1,
        total: allMockSeries.length,
      })
    }, 300)
  })
}
