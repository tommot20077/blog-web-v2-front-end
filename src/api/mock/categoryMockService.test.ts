import { describe, it, expect } from 'vitest'
import { getCategoriesMock } from './categoryMockService'

describe('categoryMockService', () => {
  it('回傳非空的分類列表', async () => {
    const result = await getCategoriesMock()
    expect(result.length).toBeGreaterThan(0)
  })

  it('每個分類都有 id、name、slug', async () => {
    const result = await getCategoriesMock()
    result.forEach(cat => {
      expect(cat.id).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(cat.slug).toBeTruthy()
    })
  })

  it('包含預期的分類', async () => {
    const result = await getCategoriesMock()
    const names = result.map(c => c.name)
    expect(names).toContain('Vue')
    expect(names).toContain('TypeScript')
  })
})
