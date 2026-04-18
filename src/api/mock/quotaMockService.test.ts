import { describe, it, expect } from 'vitest'
import { getQuotaMock } from './quotaMockService'

describe('quotaMockService', () => {
  it('回傳 usedBytes 與 limitBytes', async () => {
    const result = await getQuotaMock()
    expect(typeof result.usedBytes).toBe('number')
    expect(typeof result.limitBytes).toBe('number')
  })

  it('limitBytes 大於 usedBytes', async () => {
    const result = await getQuotaMock()
    expect(result.limitBytes).toBeGreaterThan(result.usedBytes)
  })

  it('limitBytes 為 100MB（104857600）', async () => {
    const result = await getQuotaMock()
    expect(result.limitBytes).toBe(104_857_600)
  })

  it('remainingBytes が limitBytes - usedBytes に等しい', async () => {
    const result = await getQuotaMock()
    expect(result.remainingBytes).toBe(result.limitBytes - result.usedBytes)
  })
})
