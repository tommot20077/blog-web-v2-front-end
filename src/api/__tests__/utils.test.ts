import { describe, it, expect } from 'vitest'
import { mapPageResult } from '../utils'
import type { BackendPageResult } from '../utils'

interface BackendItem {
  id: number
  label: string
}

interface FrontendItem {
  id: number
  name: string
}

describe('mapPageResult', () => {
  it('maps list items using the provided mapper', () => {
    const raw: BackendPageResult<BackendItem> = {
      records: [
        { id: 1, label: 'Alpha' },
        { id: 2, label: 'Beta' },
      ],
      current: 1,
      size: 10,
      pages: 3,
      total: 25,
    }

    const result = mapPageResult<BackendItem, FrontendItem>(raw, (item) => ({
      id: item.id,
      name: item.label,
    }))

    expect(result.records).toEqual([
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
    ])
  })

  it('maps pagination fields correctly', () => {
    const raw: BackendPageResult<BackendItem> = {
      records: [],
      current: 3,
      size: 20,
      pages: 7,
      total: 140,
    }

    const result = mapPageResult<BackendItem, FrontendItem>(raw, (item) => ({
      id: item.id,
      name: item.label,
    }))

    expect(result.current).toBe(3)
    expect(result.size).toBe(20)
    expect(result.pages).toBe(7)
    expect(result.total).toBe(140)
    expect(result.records).toEqual([])
  })

  it('handles empty list gracefully', () => {
    const raw: BackendPageResult<BackendItem> = {
      records: [],
      current: 1,
      size: 10,
      pages: 0,
      total: 0,
    }

    const result = mapPageResult<BackendItem, FrontendItem>(raw, (item) => ({
      id: item.id,
      name: item.label,
    }))

    expect(result.records).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.pages).toBe(0)
  })
})
