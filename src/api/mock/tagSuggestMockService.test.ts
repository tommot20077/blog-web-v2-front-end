import { describe, it, expect } from 'vitest'
import { suggestTagsMock } from './tagSuggestMockService'

describe('tagSuggestMockService', () => {
  it('空 query 時回傳空陣列', async () => {
    const result = await suggestTagsMock('')
    expect(result).toHaveLength(0)
  })

  it('prefix 匹配回傳符合的標籤', async () => {
    const result = await suggestTagsMock('Vu')
    expect(result.some(t => t.name === 'Vue')).toBe(true)
    expect(result.some(t => t.name === 'Vue Router')).toBe(true)
  })

  it('大小寫不敏感', async () => {
    const result = await suggestTagsMock('type')
    expect(result.some(t => t.name === 'TypeScript')).toBe(true)
  })

  it('無匹配時回傳空陣列', async () => {
    const result = await suggestTagsMock('zzznomatch')
    expect(result).toHaveLength(0)
  })

  it('最多回傳 8 筆結果', async () => {
    const result = await suggestTagsMock('V')
    expect(result.length).toBeLessThanOrEqual(8)
  })
})
