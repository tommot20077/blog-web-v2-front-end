import { describe, it, expect } from 'vitest'
import { getQuotaMock } from './quotaMockService'

describe('quotaMockService', () => {
  it('回傳 usedBytes 與 totalBytes', async () => {
    const result = await getQuotaMock()
    expect(typeof result.usedBytes).toBe('number')
    expect(typeof result.totalBytes).toBe('number')
  })

  it('totalBytes 大於 usedBytes', async () => {
    const result = await getQuotaMock()
    expect(result.totalBytes).toBeGreaterThan(result.usedBytes)
  })

  it('totalBytes 為 100MB（104857600）', async () => {
    const result = await getQuotaMock()
    expect(result.totalBytes).toBe(104_857_600)
  })
})
