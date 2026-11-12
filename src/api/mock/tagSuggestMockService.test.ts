import { describe, it, expect } from 'vitest'
import { suggestTagsMock } from './tagSuggestMockService'

describe('tagSuggestMockService', () => {
  it('空 query 時回傳空陣列', async () => {
    const result = await suggestTagsMock('')
    expect(result).toHaveLength(0)
  })

  it('prefix 匹配回傳符合的標籤', async () => {
    const result = await suggestTagsMock('Vu')
    expect(result.some(t => t.name === 'Vue 3')).toBe(true)
  })

  it('大小寫不敏感', async () => {
    const result = await suggestTagsMock('type')
    expect(result.some(t => t.name === 'TypeScript')).toBe(true)
  })

  it('無匹配時回傳空陣列', async () => {
    const result = await suggestTagsMock('zzznomatch')
    expect(result).toHaveLength(0)
  })

  it('預設最多回傳 10 筆結果', async () => {
    const result = await suggestTagsMock('V')
    expect(result.length).toBeLessThanOrEqual(10)
  })

  it('可用 limit 控制回傳筆數', async () => {
    const result = await suggestTagsMock('V', 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })
})
